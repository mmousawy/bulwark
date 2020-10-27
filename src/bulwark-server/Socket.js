const fs = require('fs');

const port = 64782;
const certFolder = '/etc/ssl/caddy/acme/acme-v02.api.letsencrypt.org/sites/murtada.nl/';

const options = {
  key: fs.readFileSync(`${ certFolder }murtada.nl.key`, 'utf8'),
  cert: fs.readFileSync(`${ certFolder }murtada.nl.crt`, 'utf8')
};

const server = require('https').createServer(options);

const io = require('socket.io')(server, {
  path: '/socket.io',
  serveClient: false
});

server.listen(port, () => {
  console.log(`[note]: Server listening on port: ${port}`);
});

module.exports = {
  io
};
