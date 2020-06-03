var IJSServer = require('./ijs-server');
module.exports = IJSServer;

// var server = new IJSServer({
//     $_name: 'IJS',
//     configFile: './conf/config.yaml',
//     components: [
//         class x extends require('./component') {
//             async startup() {
//                 console.log('Hello Component X')
//             }
//         }
//     ]
// })

// server.startup()
//     .then(server => {
//         console.log('Hello')
//     })