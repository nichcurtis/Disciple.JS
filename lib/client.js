var _ = require('lodash');
var cluster = require('cluster');
var os = require("os");

/**
 * 
 *
 * @author      Surge Forward       <ncurtis@surgeforward.com>
 */
module.exports = {
    /**
     *
     *
     */
    init: function (host, port, disciples) {
        if (cluster.isMaster) {
            var numCPUs = require('os').cpus().length;

            disciples = parseInt(disciples) || 1;
            _.each(_.range(disciples), function () {
                cluster.fork();
            });
            
            cluster.on('exit', function(worker, code, signal) {
                cluster.fork();
            });
        }
        module.exports.client(host, port);
    },
    /**
     *
     *
     */
    client: function (host, port) {
        var io = require('socket.io-client');
        var server = io.connect(host+':'+port);

        var disciple = { id: false, hostname: os.hostname(), model: false, trained: false };

        var mlearn = require('mlearn.js');
        var dataset = mlearn().dataset();

        server.on('connect', function () {

            if (!disciple.id) disciple.id = server.socket.sessionid;

            var connent_cmd = (disciple.trained) ? 'trained' : 'connected' ;
            server.emit('disciple-'+connent_cmd, disciple);

            server.on('disciple-init', function (data) {
                disciple.model = mlearn().classifier(data.algorithm, data);
                server.emit('disciple-initialized', disciple);
            });

            server.on('disciple-load', function (data) {
                dataset.from.csv(data.input, data.target)
                    .then(function () {
                        server.emit('disciple-initialized', disciple);
                    })
                    .catch(function (error) {
                        server.emit('disciple-error', {id: disciple.id, hostname: hostname, message: error});
                    });
            });

            server.on('disciple-train', function (event) {
                disciple.model.training(dataset.normalize().features)
                    .then(function () {
                        server.emit('disciple-trained', disciple);
                        disciple.trained = true;
                    })
                    .catch(function (error) {
                        server.emit('disciple-error', {id: disciple.id, hostname: hostname, message: error});
                    });
            });

            server.on('disciple-predict', function (event) {
                disciple.model.predicting(event.features).then(function (predictions) {
                    disciple.predictions = predictions;
                    server.emit('disciple-predicted', disciple);
                    delete disciple.predictions;
                });
            });
        });
    }
}