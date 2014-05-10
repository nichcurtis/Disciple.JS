var cluster = require('cluster');
var numCPUs = require('os').cpus().length;

var Q = require('q');
var _ = require('lodash');

if (cluster.isMaster) {

    var config = { disciples: 1 };
    _.each(process.argv, function (val, index, array) {
        if (index > 1) {
            var arg = val.split('=');
            var configIndex = arg[0].replace('--', '');
            config[configIndex] = arg[1];
        }
    });
    config.errors = [];

    Q.all(_.each(_.range(config.disciples), function () {
        cluster.fork();
    })).then(function () {
        cluster.on('exit', function(worker, code, signal) {
            cluster.fork();
        });
    });

}
else
{
    var io = require('socket.io-client');
    var mlearn = require('../../../GitHub/Mlearn.js/mlearn.js');

    var discipleServer = io.connect('127.0.0.1:8080');

    var disciple = { id: false, model: false, trained: false };

    discipleServer.on('connect', function (client) {

        discipleServer.on('disciple-init', function (data) {
            disciple.id = this.socket.sessionid;
            disciple.model = mlearn().classifier(data.model.type, data.model.properties);
            discipleServer.emit('disciple-ready', {id: disciple.id});
        });

        discipleServer.on('disciple-train', function (event) {
            disciple.model.training(event.dataSet)
                .then(function () {
                    discipleServer.emit('disciple-trained', {id: disciple.id});
                    disciple.trained = true;
                    console.log('Disciple '+disciple.id, 'Trained');
                });
        });

        discipleServer.on('disciple-predict', function (event) {
            disciple.model.predicting({x: event.dataSet.x}).then(function (prediction) {
                discipleServer.emit('disciple-predicted', {
                    id: disciple.id, prediction: prediction[0], target: event.dataSet.y
                });
            });
        });

        if ( ! disciple.model || ! disciple.trained ) {
            discipleServer.emit('disciple-connected', {id: disciple.id});
        }
        else {
            discipleServer.emit('disciple-trained', {id: disciple.id});
        }

    });
}