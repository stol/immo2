var http    = require('http'),
	url     = require('url'),
	request = require('request'),
	jsdom   = require('jsdom'),
    fs      = require('fs'),
//	express = require('express'),
//    moment  = require('moment'),
    _       = require('underscore'),
//    jenkins = require('jenkins'),
//    iconv   = require('iconv-lite'),
    jquery = fs.readFileSync("./jquery.js").toString(),
    stream = fs.createWriteStream("data.json")

function clean(str){
    return str.replace(/\r\n/g, ' ').replace(/\s{2,}/g, ' ');

}

var m2_min = 14;
var m2_max = 60;

var tm = 0;

var offres = []

var pages = {};

getPages(m2_min);

function getPages(surface) {
    var temp_url = 'http://www.seloger.com/recherche.htm?idtt=1&idtypebien=1&org=advanced_search&surfacemin='+surface+'&surfacemax='+surface+'&cp=75&BCLANNpg=1';
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
    }});
}


function fetchPage(surface, page) {
    var temp_url = 'http://www.seloger.com/recherche.htm?idtt=1&idtypebien=1&org=advanced_search&surfacemin='+surface+'&surfacemax='+surface+'&cp=75&BCLANNpg='+page;
    
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
            offres.push({
                titre: titre,
                prix: parseInt(prix.replace(/\s+/g, ''),10),
                lieu: parseInt(lieu, 10),
                cc: prix.indexOf('cc')>=0 ? true : false,
                surface: surface
            });
            //console.log(titre + " ("+prix+") " + lieu);
            //console.log(lieu)
        });

        var ended = 0;

        $.each(pages, function(m2,page){
            if (page.done == page.max) {
                ended++;
            }
        })
        if (ended == m2_max-m2_min+1){
            writeResults();
        }

        if (pages[surface].done == pages[surface].max && surface < m2_max) {
            (function(surface){
                setTimeout(function(){
                    getPages(surface+1)
                },1)
            })(surface)
            
        }


    }});
}


function writeResults(){
    console.log("ECRITURE DES RESULTATS")
    console.log(offres)
    stream.write(JSON.stringify(offres));
}























