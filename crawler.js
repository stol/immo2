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
//connection.query('TRUNCATE lieux');

var c = new Crawler({
    maxConnections: 4,
    forceUTF8: true
});

var surface_min = 52,
    surface_max = 54,
    workers_nb = 2,
    TYPE = 2, // 2 = VENTE, 1 = LOCATION
    ZIP = [
        75,    // Paris
        // ,92340 // sceaux
        // ,92340 // bourg la reine
        // ,94300 // vincennes 
        // ,92250 // la garenne colombe
        // //,92700, // colombes
        // ,92120  // montrouge
    ];

function fetchPage(provider, zip, surface, page, page_max){
    console.log('fetching surface '+surface+" page "+page+'/'+(page_max || '??'));

    this.busy = 1;
    var url = provider.url
        .replace(/\{\{TYPE\}\}/g, TYPE)
        .replace(/\{\{SURFACE\}\}/g, surface)
        .replace(/\{\{PAGE\}\}/g, page)
        .replace(/\{\{ZIP\}\}/g, zip)
    console.log("fetching ", url);
    c.queue([{
        uri: url,
        callback: function(error,result, $){
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
