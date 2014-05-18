var util = require('util');
var repl = require("repl");
var _ = require('lodash');
var io = require('socket.io-client');
var jsonic = require('jsonic')

/**
 * Admin console for interacting with running disciple-server instances
 *
 * @author      Surge Forward       <ncurtis@surgeforward.com>
 */
module.exports = function () {

    var admin = {
        server: null,
        callbackInit: false,
        config: { server: '127.0.0.1', port: '8181' }
    };

    /**
     * processes cmd line args and starts server connection
     */
    admin.init = function (server, port) {
        // defaults for server configuration
        admin.config.server = server || admin.config.server;
        admin.config.port = server || admin.config.port;

        admin.connect();
        admin.getInput();
    };

    /**
     * connents to disciple-server admin port
     */
    admin.connect = function () {
        admin.server = io.connect(admin.config.server+':'+admin.config.port);
    };

    /**
     * starts REPL event loop, each cmd is processed by admin.eval
     */
    admin.getInput = function () {
        var r = repl.start({
            prompt: "disciple-admin> ",
            input: process.stdin,
            output: process.stdout,
            eval: admin.eval,
            terminal: true,
            useColors: true,
            ignoreUndefined: true
        });
    };

    /**
     * processes single command from REPL event loop
     */
    admin.eval = function (rawCmd, context, filename, callback) {
        // make sure we have a server connection
        // before we try to process any commands
        if (!admin.server.socket.connected) {
            return callback(null, 'no connection');
        }

        // cmd comes in as (COMMAND)/n
        // removing the container ()\n characters
        rawCmd = rawCmd.substr(1);
        cmd = rawCmd.substr(0, rawCmd.length-2);

        if (rawCmd) {
            try {
                // using jsonic library, allows malformed json
                cmdJSON = jsonic(rawCmd);
                // passing command to server, on response will fire console callback
                admin.server.emit('command', cmdJSON);
            }
            catch (e) {
                // error parsing json, pass it to console callback
                return callback(null, e);
            }
            
            // only need to bind these once, since callback is always same function
            if (!admin.callbackInit) {
                admin.callbackInit = true;
                admin.server.on('response', function (response) {
                    callback(null, response.value);
                });
                admin.server.on('disconnect', function (response) {
                    callback(null, 'server disconnected');
                });
                admin.server.on('connect', function (response) {
                    callback(null, 'server reconnected');
                });
            }
        }
        else {
            // no command, blank line
            callback(undefined, undefined);
        }
    };

    return admin;
}