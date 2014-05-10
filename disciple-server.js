var _ = require('lodash');
var getDataSet = require('../../../GitHub/Mlearn.js/datasets/digits.js');
var metrics = { predictions: [], misses: [] };

var config = { trainSize: null, algorithm: null, properties: {} };
_.each(process.argv, function (val, index, array) {
    if (index > 1) {
        var arg = val.split('=');
        var configIndex = arg[0].replace('--', '');
        
        if (configIndex.indexOf('prop.') !== -1) {
            var propConfigIndex = configIndex.split('.');
            config.properties[propConfigIndex[1]] = arg[1];
        } else {
            config[configIndex] = arg[1];
        }
    }
});
config.errors = [];

config.trainSize = parseInt(config.trainSize);
if (config.trainSize<=0) {
    config.errors.push('--trainSize flag is required');
}

if ( ! config.algorithm) {
    config.errors.push('--algorithm flag is required');
}
else {
    if ( ['knn', 'logistic'].indexOf(config.algorithm) === -1) {
        config.errors.push('unknown algorithm: ' + config.algorithm);
    }
}

if (config.errors.length <= 0) {
    config.validationSize = Math.floor(config.trainSize/10);

    getDataSet(config.trainSize, config.validationSize)
        .then(function (dataSet, getTestData) {

            console.log('Waiting for Disciples...');
            
            var io = require('socket.io').listen(8080, { log: false });
            io.sockets.on('connection', function (disciple) {

            disciple.on('disciple-connected', function (data) {
                if ( ! data.id) {
                    disciple.emit('disciple-init', {
                        model: {
                            type: config.algorithm,
                            properties: config.properties
                        }
                    });
                }
            });

            disciple.on('disciple-ready', function (data) {
                console.log('Disciple '+data.id, '- Ready');

                disciple.emit('disciple-train', {dataSet: dataSet.train});
            });

            disciple.on('disciple-trained', function (data) {
                console.log('Disciple '+data.id, '- Trained');
                
                var batch = dataSet.validation.pop();
                if ( ! batch) return finished(metrics.predictions.length);

                disciple.emit('disciple-predict', {dataSet: batch});
            });

            disciple.on('disciple-predicted', function (data) {
                console.log('Disciple '+data.id, '- Prediction: ', data.prediction, '- Target: ', data.target);

                metrics.predictions.push(data);
                if (data.prediction == data.target) {
                    metrics.misses.push(data);
                }
                
                var batch = dataSet.validation.pop();
                if ( ! batch) return finished(metrics.predictions.length);

                disciple.emit('disciple-predict', {dataSet: batch});
            });

        });
    });
}
else {
    _.each(config.errors, function (error) {
        console.log(error);
    });
}

function finished (totalPredictions) {
    if (totalPredictions >= config.validationSize) {
        console.log('Finished w/ accuracy of: %' + (metrics.misses.length / metrics.predictions.length)*100 );
    }
}