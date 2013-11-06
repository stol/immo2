var moment = require('moment');

function clean(str){
    return str.replace(/\r\n/g, ' ').replace(/\s{2,}/g, ' ');
}


exports.list = [
{
    id: 1,
    name: "seloger",
    url: 'http://ws.seloger.com/search.xml?cp={{ZIP}}&idqfix=1&idtt={{TYPE}}&idtypebien=1,2&SEARCHpg={{PAGE}}&surfacemin={{SURFACE}}&surfacemax={{SURFACE}}&getDtCreationMax=1&tri=d_dt_crea',
    selector: "annonce",
    title : function($, $div){
        return $div.find("> titre").text() + ' ' + $div.find("> surface").text() + ' ' + $div.find("> surfaceUnite").text();
    },
    price : function($, $div){
        return $div.find("prix").text();
    },
    zip : function($, $div){
        return $div.find("cp").text();
    },
    href: function($, $div){
        return $div.find("permaLien").text();
    },
    place_id: function($, $div) {
        return $div.find("idAnnonce").text();
    },
    surface: function($, $div) {
        return $div.find("surface").text();
    },
    proximity: function($, $div) {
        return $div.find("proximite").text();
    },
    ts: function($, $div){
        var dt = $div.find("dtCreation").text();
        return moment(dt, "YYYY-MM-DD").unix();
    },
    cc: function($, $div){
        return false;
    },
    fai: function($, $div){
        return true;
    },
    page_max: function($){
        return parseInt($("pageMax").text(),10);
    }
}
/*
{
    id: 2,
    name: "pap",
    url: 'http://www.pap.fr/annonce/vente-appartement-loft-atelier-maison-paris-75-g439-entre-{{SURFACE}}-et-{{SURFACE}}-m2-{{PAGE}}',
    selector: "div.annonce-resume",
    title : function($, $div){
        return $.trim($div.find(".lien-annonce a").text());
    },
    price : function($, $div){
        var price = $.trim($div.find(".prix").text());
        return parseInt(price, 10);
    },
    zip : function($, $div){
        //http://www.pap.fr/annonces/appartement-paris-12e-r192511123
        var href = $.trim($div.find(".lien-annonce a").attr("href"));
        var regexp = /.*([0-9]+)[a-z]+-r[0-9]+$/g.exec(href) || [];
        return (750)+''+(zip[0] || "00");
    },
    href: function($, $div){
        return $.trim($div.find(".lien-annonce a").attr("href"));
    },
    place_id: function($, $div) {
        var href = $.trim($div.find(".lien-annonce a").attr("href"));
        return /.*([0-9]+)$/g.exec(href)[1];
    },
    ts: function($, $div){
        return 1349570052;
    },
    cc: function($, $div){
        return false;
    },
    fai: function($, $div){
        return true;
    },
    page_max: function($, div){
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

        page_max = parseInt(pagination_parts[3],10);

    }

}
*/
/*
{
    id: 1,
    name: "paruvendu",
    url: 'http://www.paruvendu.fr/immobilier/annonceimmofo/liste/listeAnnonces?tt=1&codeINSEE=&lo=75&pa=FR&libelle_lo=Paris%20(75)&px0=Mini&px1=Max&tbApp=1&tbDup=1&tbChb=1&tbLof=1&tbAtl=1&tbPla=1&sur0={{SURFACE}}}&sur1={{SURFACE}}&nbp0=&nbp1=&at=1&p={{PAGE}}',
    selector: ".annonce",
    title : function($, $div){
        return $div.find("h3");
    },
    price : function($, $div){
        var price = $.trim($div.find(".price"));
        return parseInt(price.replace(/\s+/g, ''),10);
    },
    zip : function($, $div){
        // TODO
        var zip = $.trim(clean($div.find(".rech_descriptif .rech_desc_right_photo .rech_ville strong").text()));
        return parseInt(zip, 10);
    },
    href: function($, $div){
        return $div.find("a").eq(0).attr("href");
    },
    place_id: function($, $div) {
        var href = $div.find(".rech_libinfo .mea1 a").attr("href");
        return /.*\/([^\.]+)\.htm/g.exec(href)[1];
    },
    ts: function($, $div){
        var dt = $div.find(".rech_majref").contents().eq(2).text();
        dt = $.trim(dt).substr(0,10);
        return moment(dt, "DD/MM/YYYY").unix();
    },
    cc: function($, $div){
        var price = $.trim($div.find(".rech_box_prix .mea2").contents().eq(0).text());
        return price.indexOf('cc')>=0 ? true : false;
    },
    fai: function($, $div){
        var price = $.trim($div.find(".rech_box_prix .mea2").contents().eq(0).text());
        return price.indexOf('FAI')>=0 ? true : false;
    },
    page_max: function($, $div){
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

        return parseInt(pagination_parts[3],10);
    }
},
*/

]














/*
{
    id: 1,
    name: "seloger",
    url: 'http://www.seloger.com/recherche.htm?idtt={{TYPE}}&idtypebien=1&org=advanced_search&surfacemin={{SURFACE}}&surfacemax={{SURFACE}}&cp=75&BCLANNpg={{PAGE}}',
    selector: "div.ann_ann",
    title : function($, $div){
        return $.trim($div.find(".mea1 a").text());
    },
    price : function($, $div){
        var price = $.trim($div.find(".rech_box_prix .mea2").contents().eq(0).text());
        return parseInt(price.replace(/\s+/g, ''),10);
    },
    zip : function($, $div){
        var zip = $.trim(clean($div.find(".rech_descriptif .rech_desc_right_photo .rech_ville strong").text()));
        return parseInt(zip, 10);
    },
    href: function($, $div){
        return $div.find(".rech_libinfo .mea1 a").attr("href");
    },
    place_id: function($, $div) {
        var href = $div.find(".rech_libinfo .mea1 a").attr("href");
        return /.*\/([^\.]+)\.htm/g.exec(href)[1];
    },
    ts: function($, $div){
        var dt = $div.find(".rech_majref").contents().eq(2).text();
        dt = $.trim(dt).substr(0,10);
        return moment(dt, "DD/MM/YYYY").unix();
    },
    cc: function($, $div){
        var price = $.trim($div.find(".rech_box_prix .mea2").contents().eq(0).text());
        return price.indexOf('cc')>=0 ? true : false;
    },
    fai: function($, $div){
        var price = $.trim($div.find(".rech_box_prix .mea2").contents().eq(0).text());
        return price.indexOf('FAI')>=0 ? true : false;
    },
    page_max: function($){
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

        return parseInt(pagination_parts[3],10);
    }
},
*/