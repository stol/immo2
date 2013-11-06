var jsdom  = require('jsdom'),
    fs     = require('fs'),
    _      = require('underscore'),
    jquery = fs.readFileSync("./jquery.js").toString(),
    mysql  = require('mysql'),
    moment = require('moment'),
    providers = require('./providers').list


var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'immo'
})

connection.connect();
//connection.query('TRUNCATE lieux');

var surface_min = 52,
    surface_max = 75,
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

var workshop = (function(){


    var workers = [];
    var tasks = [];

    function hire(nb){
        for( var i=0; i< nb; i++){
            workers.push(new Worker()); 
        }
    }

    function doTask(action, params, prioritaire){
        prioritaire = prioritaire || 0;
        var worker = getWorker();
        if (!worker) {
            if (prioritaire)
                tasks.unshift({action: action, params: params});
            else
                tasks.push({action: action, params: params});
            return;
        }

        worker[action].apply(worker, params);
        
    }

    function getWorker(){ 
        for(var i=0; i<workers.length; i++){
            if (!workers[i].busy)
                return workers[i];
        }
        return false;
    }

    function dispatchTask(){
        var worker = getWorker();
        if (!worker)
            return;

        if (!tasks.length){
            return;
        }

        worker[tasks[0].action].apply(worker, tasks[0].params);
        tasks = tasks.slice(1);
    }

    function getBusyNb(){
        var nb = 0;
        for (var i=0; i<workers.length; i++) {
            workers[i].busy && nb++;
        }
        return nb;

    }

    function informate(){
        setInterval(function(){
            console.log("Queue: "+tasks.length+"; workers busy: "+getBusyNb()+"/"+workers.length)
        },2000);

    }

    return {
        doTask: doTask,
        getWorker: getWorker,
        hire: hire,
        dispatchTask: dispatchTask,
        informate: informate
    }
})()



var Worker = function(){
    this.busy = 0;
    var worker = this;
    
    // Récupération d'une page de résultats
    this.fetchPage = function(provider, zip, surface, page, page_max){
        console.log('fetching surface '+surface+" page "+page+'/'+(page_max || '??'));

        this.busy = 1;
        var temp_url = provider.url
            .replace(/\{\{TYPE\}\}/g, TYPE)
            .replace(/\{\{SURFACE\}\}/g, surface)
            .replace(/\{\{PAGE\}\}/g, page)
            .replace(/\{\{ZIP\}\}/g, zip)
        console.log("fetching ", temp_url);
        jsdom.env({html: temp_url, src: [jquery], done: function(errors, window) {

            if (errors){
                console.log("ERREUR sur "+temp_url);
                console.log(errors);
            }

            var $ = window.$;

            $(provider.selector).each(function(i, div){
                var $div = $(div);
                workshop.doTask("save",[{
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
                }], true);
            });

            page_max = page_max || provider.page_max($);

            if (page<page_max){
                workshop.doTask("fetchPage",[provider, zip, surface, page+1, page_max])   
            }


            window.close(); // Release memory
            worker.busy = 0;
            workshop.dispatchTask();
        }});
    }

    this.save = function(data){
        this.busy = 1;
        connection.query('INSERT IGNORE INTO places SET ?', data, function(err, result) {
            if (err) throw err;
            worker.busy = 0;
            workshop.dispatchTask();
        });
    }

}
// Récupération du nombre de pages pour une surface

workshop.hire(workers_nb);
workshop.informate(workers_nb);

for (var i=0; i<providers.length; i++) {
    for(var j= surface_min; j<=surface_max; j++) {
        for( var k = 0; k < ZIP.length; k++) {
            workshop.doTask('fetchPage', [providers[i], ZIP[k], j, 1]);
        }
    }
}

/*
CREATE TABLE `places` (
  `provider_id` int(11) DEFAULT NULL,
  `provider_place_id` int(11) DEFAULT NULL,
  `title` TEXT DEFAULT NULL,
  `href` TEXT DEFAULT NULL,
  `price` int(11) DEFAULT NULL,
  `zip` int(11) DEFAULT NULL,
  `proximity` TEXT DEFAULT NULL,
  `type` int(11) DEFAULT NULL,
  `cc` tinyint(1) DEFAULT NULL,
  `fai` tinyint(1) DEFAULT NULL,
  `surface` int(11) DEFAULT NULL,
  `provider_at` INT(11) DEFAULT 0,
  `created_at` INT(11) DEFAULT 0,
  `updated_at` INT(11) DEFAULT 0,
  PRIMARY KEY (`provider_id`, `provider_place_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1
*/