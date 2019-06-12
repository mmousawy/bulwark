const fs = require('fs');
const https = require('https');

const certFile = fs.readFileSync('/etc/hiawatha/tls/murtada.nl.pem', 'utf8').split('\n\n');
const ssl_key = certFile[0];
const ssl_cert = certFile[1];

const server = new https.createServer({
  cert: ssl_cert,
  key: ssl_key
});

const io = require('socket.io')(server, {
  serveClient: false
});

server.listen(64782);

module.exports = {
  io
};
