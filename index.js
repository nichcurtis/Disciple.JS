var program = require('commander');
var forever = require('forever');
var disciple = require('./lib/disciple.js');

program
    .version('0.0.1')
    .usage('[options] <file ...>')
    .option('-a, --admin', 'Launch disciple admin console.')
    .option('-s, --server', 'Launch disciple server')
    .option('-c, --client', 'Launch disciple client', 'client')
    .option('-d, --disciples [total]', '# of discple client instances to fork.')
    .option('-h, --host [server]', 'Set hostname for client or admin')
    .option('-p, --port [port]', 'Set port to connect on for client or admin. Listening port for server.')
    .option('-m, --adminport [port]', 'Set port to connect on for client or admin. Listening port for server.')
    .parse(process.argv);

if (program.admin) {
    return disciple.admin(program.server, program.port);
}
else if (program.client) {
    return disciple.client(program.host, program.port, program.disciples);
}
else if (program.server) {
    return disciple.server(program.port, program.adminport);
}

program.help();