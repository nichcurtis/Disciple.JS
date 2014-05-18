var _ = require('lodash');
var io = require('socket.io');
var mlearn = require('mlearn.js')();

/**
 * Admin console for interacting with running disciple-server instances
 *
 * @author      Surge Forward       <ncurtis@surgeforward.com>
 */
module.exports = {
    /**
     *
     *
     */
    init: function (port) {
        var io = require('socket.io');
        var clientio = io.listen(port, {log: false});
        var disciples = [], dataset = mlearn.dataset();
        
        clientio.sockets.on('connect', function (disciple) {

            disciple.on('disciple-connected', function (data) {
                disciples[disciple.id] = data;
            });

            disciple.on('disciple-initialized', function (data) {
                disciples[disciple.id] = data;
            });

            disciple.on('disciple-trained', function (data) {
                disciples[disciple.id] = data;
            });

            disciple.on('disciple-predicted', function (data) {
                disciples[disciple.id] = data;
            });

            disciple.on('disconnect', function () {
                if (disciple.id in disciples) {
                    delete disciples[disciple.id];
                }
            });
        });
    },
    /**
     *
     *
     */
    admin: function (port) {
        var adminio = io.listen(port, { log: true });
        adminio.on('connect', function (admin) {
            
            admin.on('command', function (data) {
                admin.emit('command executed!');
            });

        });
    }
}