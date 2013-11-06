
/*
 * GET users listing.
 */

exports.list = function(req, res){
    //res.send("respond with a resource");
    var p = [
        req.query.surface_min || 0
        , req.query.surface_max || 9999
        , req.query.price_min || 0
        , req.query.price_max || 999999999
    ];
    console.log(p);

    global.connection.query(
            'SELECT * FROM places '
            + 'WHERE surface >= ?'
            + ' AND surface <= ?'
            + ' AND price >= ?'
            + ' AND price <= ?'
            + ' AND zip LIKE "'+req.query.zip+'%" '
            + ' ORDER BY provider_at DESC', p, function(err, data){
        if (err){
            console.log("ERROR");
            throw err;
        }
        //console.log(data);
        //res.send("DONE");
        res.set('Content-Type', 'application/json');
        res.send(data);
    });
};