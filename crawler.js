////////////////////// CONFIGURATION
var surface_min = 52,
    surface_max = 75,
    TYPE = 2, // 2 = VENTE, 1 = LOCATION
    ZIP = [
          75    // Paris
        //, 92230 // sceaux
        //, 92340 // bourg la reine
        //, 94300 // vincennes 
        //, 92250 // la garenne colombe
        //, 92700, // colombes
        //, 92120  // montrouge
    ];

////////////////////// DO NOT CHANGE :p

var _      = require('underscore'),
    mysql  = require('mysql'),
    moment = require('moment'),
    providers = require('./providers').list,
    Crawler = require("crawler").Crawler;


var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'immo'
});

connection.connect();

var c = new Crawler({
    maxConnections: 4,
    forceUTF8: true
});


var todo = 0;

function fetchPage(provider, zip, surface, page, page_max){
    todo++;

    var url = provider.url
        .replace(/\{\{TYPE\}\}/g, TYPE)
        .replace(/\{\{SURFACE\}\}/g, surface)
        .replace(/\{\{PAGE\}\}/g, page)
        .replace(/\{\{ZIP\}\}/g, zip)

    c.queue([{
        uri: url,
        callback: function(error,result, $){
            console.log(zip+' ('+surface+"m2), page "+page+'/'+(page_max || '??') + " => "+url);
            if (error){
                console.log("ERREUR sur "+url);
                console.log(error);
                return;
            }

            $(provider.selector).each(function(i, div){
                var $div = $(div);
                save({
                    provider_id: provider.id,
                    provider_place_id: provider.place_id($, $div),
                    title: provider.title($, $div),
                    href : provider.href($, $div),
                    price: provider.price($, $div),
                    zip: provider.zip($, $div),
                    proximity: provider.proximity($, $div),
                    type: TYPE,
                    cc: provider.cc($, $div),
                    fai: provider.fai($, $div),
                    surface: surface,
                    provider_at: provider.ts($, $div),
                    created_at: Date.now() / 1000
                });
            });

            page_max = page_max || provider.page_max($);

            if (page<page_max){
                fetchPage(provider, zip, surface, page+1, page_max);
            }

            todo--;
            if (todo == 0){
                console.log("FINI");
                process.exit(code=0);
            }
        },
    }]);
}

function save(data){
    connection.query('INSERT IGNORE INTO places SET ?', data, function(err, result) {
        if (err) throw err;
    });
}

for (var i=0; i<providers.length; i++) {
    for(var j= surface_min; j<=surface_max; j++) {
        for( var k = 0; k < ZIP.length; k++) {
            fetchPage(providers[i], ZIP[k], j, 1);
        }
    }
}
