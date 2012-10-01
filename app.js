var http    = require('http'),
	jsdom   = require('jsdom'),
    fs      = require('fs'),
    _       = require('underscore'),
  Sequelize = require("sequelize"),
    jquery  = fs.readFileSync("./jquery.js").toString()

function clean(str){
    return str.replace(/\r\n/g, ' ').replace(/\s{2,}/g, ' ');
}


var sequelize = new Sequelize('immo', 'root', null,{
    dialect: 'mysql',
    logging: false,
    pool: { maxConnections: 20, maxIdleTime: 30}
});

var Lieu = sequelize.define('Lieu', {
    id: Sequelize.TEXT,
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

var surface_min = 49;
var surface_max = 65;
var TYPE = 2; // 2 = VENTE, 1 = LOCATION
var offres = []
var pages = {};



getPages(surface_min);

function getPages(surface) {
    var temp_url = 'http://www.seloger.com/recherche.htm?idtt='+TYPE+'&idtypebien=1&org=advanced_search&surfacemin='+surface+'&surfacemax='+surface+'&cp=75&BCLANNpg=1';
    jsdom.env({html: temp_url, src: [jquery], done: function(errors, window) {
        var $ = window.$;

        pages[surface] = {done: 0, max : 0};

        // Pas de pagination ? FUCK IT !!
        var pagination = $.trim($(".rech_nbpage").text());
        if (pagination.length == 0){
            return;
        }

        // Exemple : Page 1 sur 17
        // Pagination invalide ? FUCK IT !!       
        pagination_parts = pagination.split(" ");
        if (pagination_parts.length != 4){
            console.log("ERREUR : '+pagination+' is invalid");
            return;
        }

        pages[surface] = {
            done: 0,
            max : parseInt(pagination_parts[3],0)
        }
        console.log("Surface "+surface+" : "+pages[surface].max+" pages");
        
        for(var i=1; i<=pages[surface].max; i++){
            (function(surface, i){
                setTimeout(function(){
                    fetchPage(surface, i);
                },1)
            })(surface, i)


        }
        window.close(); // Release memory
    }});

}


function fetchPage(surface, page) {
    var temp_url = 'http://www.seloger.com/recherche.htm?idtt='+TYPE+'&idtypebien=1&org=advanced_search&surfacemin='+surface+'&surfacemax='+surface+'&cp=75&BCLANNpg='+page;
    
    jsdom.env({html: temp_url, src: [jquery], done: function(errors, window) {
        pages[surface].done++;
        console.log("Surface "+surface+" : page "+pages[surface].done+"/"+pages[surface].max);
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

            console.log("SAVING " + lien)
            Lieu
                .build({
                    titre: titre,
                    id: id,
                    lien : lien,
                    prix: parseInt(prix.replace(/\s+/g, ''),10),
                    lieu: parseInt(lieu, 10),
                    type: TYPE,
                    cc: prix.indexOf('cc')>=0 ? true : false,
                    fai: prix.indexOf('FAI')>=0 ? true : false,
                    surface: surface
                })
                .save()
                .success(function(anotherTask) {
                    console.log("SAVED " + anotherTask.lien)
                    // you can now access the currently saved task with the variable anotherTask... nice!
                })
                /*
            var offre = {
                titre: titre,
                id: id,
                lien : lien,
                prix: parseInt(prix.replace(/\s+/g, ''),10),
                lieu: parseInt(lieu, 10),
                type: TYPE,
                cc: prix.indexOf('cc')>=0 ? true : false,
                fai: prix.indexOf('FAI')>=0 ? true : false,
                surface: surface
            };
            */
        });

        var ended = 0;

        $.each(pages, function(surface,page){
            if (page.done == page.max) {
                ended++;
            }
        })
        if (ended == surface_max-surface_min+1){
            writeResults();
        }

        if (pages[surface].done == pages[surface].max && surface < surface_max) {
            (function(surface){
                setTimeout(function(){
                    getPages(surface+1)
                },1)
            })(surface)
            
        }

        window.close(); // Release memory
    }});

}


function writeResults(){
    console.log("FINI")
}























