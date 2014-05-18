var _ = require('lodash');

/**
 * Disciple.js
 *
 *
 */

module.exports = {

    /**
     *
     */
    server: function (port, adminport) {
        var server = require(__dirname+'/server.js');
        if (adminport>0) server.admin(parseInt(adminport));
        return server.init(parseInt(port));
    },

    /**
     *
     */
    client: function (host, port, disciples) {
        var client = require(__dirname+'/client.js');
        return client.init(host, parseInt(port), parseInt(disciples));
    },

    /**
     *
     */
    admin: function (host, port) {
        var admin = require(__dirname+'/admin.js');
        return admin().init(host, parseInt(port));
    }

};