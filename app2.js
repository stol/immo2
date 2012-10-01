var http    = require('http'),
    jsdom   = require('jsdom'),
    fs      = require('fs'),
    _       = require('underscore'),
  Sequelize = require("sequelize"),
    jquery  = fs.readFileSync("./jquery.js").toString()

var sequelize = new Sequelize('immo', 'root', null,{
    dialect: 'mysql',
    logging: false,
    pool: { maxConnections: 20, maxIdleTime: 30}
});

var Lieu = sequelize.define('Lieu', {
    provider_lieu_id: Sequelize.INTEGER,
    provider_id: Sequelize.INTEGER,
    titre: Sequelize.STRING,
    lien : Sequelize.STRING,
    prix: Sequelize.INTEGER,
    lieu: Sequelize.INTEGER,
    type: Sequelize.INTEGER,
    cc: Sequelize.BOOLEAN,
    fai: Sequelize.BOOLEAN,
    surface: Sequelize.INTEGER
});

sequelize.sync({force: true});


function clean(str){
    return str.replace(/\r\n/g, ' ').replace(/\s{2,}/g, ' ');
}

var surface_min = 50,
    surface_max = 55,
    workers_nb = 1,
    TYPE = 2; // 2 = VENTE, 1 = LOCATION

var workshop = (function(){


    var workers = [];
    var tasks = [];

    function hire(nb){
        for( var i=0; i< nb; i++){
            workers.push(new Worker()); 
        }
    }

    function doTask(action, params){
        var worker = getWorker();
        if (!worker) {
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
            console.log("workers busy : "+getBusyNb()+"/"+workers.length)
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
    this.fetchPage = function(surface, page, page_max){
        console.log('fetching surface '+surface+" page "+page+'/'+(page_max || '??'));

        this.busy = 1;
        var temp_url = 'http://www.seloger.com/recherche.htm?idtt='+TYPE+'&idtypebien=1&org=advanced_search&surfacemin='+surface+'&surfacemax='+surface+'&cp=75&BCLANNpg='+page;
        jsdom.env({html: temp_url, src: [jquery], done: function(errors, window) {

            if (errors){
                console.log("ERREUR sur "+temp_url);
                console.log(errors);
            }

            var $ = window.$;



            $("div.ann_ann").each(function(i, div){
                var titre = $.trim($(div).find(".mea1 a").text());
                var prix = $.trim($(div).find(".rech_box_prix .mea2").contents().eq(0).text());
                var lieu = $.trim(clean($(div).find(".rech_descriptif .rech_desc_right_photo .rech_ville strong").text()));
                var lien = $(div).find(".rech_libinfo .mea1 a").attr("href");
                var id = /.*\/([^\.]+)\.htm/g.exec(lien)[1];

                workshop.doTask("save",[{
                    titre: titre,
                    provider_lieu_id: id,
                    provider_id: 1,
                    lien : lien,
                    prix: parseInt(prix.replace(/\s+/g, ''),10),
                    lieu: parseInt(lieu, 10),
                    type: TYPE,
                    cc: prix.indexOf('cc')>=0 ? true : false,
                    fai: prix.indexOf('FAI')>=0 ? true : false,
                    surface: surface
                }])
            });

            if (!page_max){

                // Pas de pagination ? FUCK IT !!
                var pagination = $.trim($(".rech_nbpage").text());
                if (pagination.length == 0){
                    worker.busy = 0;
                    return;
                }

                // Exemple : Page 1 sur 17
                // Pagination invalide ? FUCK IT !!       
                pagination_parts = pagination.split(" ");
                if (pagination_parts.length != 4){
                    console.log("ERREUR : '+pagination+' is invalid");
                    worker.busy = 0;
                    return;
                }

                page_max = parseInt(pagination_parts[3],0);
            }

            if (page<page_max){
                workshop.doTask("fetchPage",[surface, page+1, page_max])   
            }


            window.close(); // Release memory
            worker.busy = 0;
            workshop.dispatchTask();
        }});
    }


    this.save = function(data){
        this.busy = 1;
        Lieu.build(data).save().success(function(){
            worker.busy = 0;
            workshop.dispatchTask();
        })
    }

}
// Récupération du nombre de pages pour une surface

workshop.hire(workers_nb);
workshop.informate(workers_nb);

for(var i= surface_min; i<=surface_max; i++){
    workshop.doTask('fetchPage', [i, 1]);
}




