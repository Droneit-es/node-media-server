#!/usr/bin/env node 

// docker secrets loader

// dependencies
const fs = require('fs');
const log = require('../log');

const dockerSecret = {};

dockerSecret.read = function read(secretName) {
  try {
    return fs.readFileSync(`/run/secrets/${secretName}`, 'utf8');
  } catch(err) {
    if (err.code !== 'ENOENT') {
      log.error(`An error occurred while trying to read the secret: ${secretName}. Err: ${err}`);
    } else {
      log.debug(`Could not find the secret, probably not running in swarm mode: ${secretName}. Err: ${err}`);
    }    
    return false;
  }
};

module.exports = dockerSecret;

// nms
const NodeMediaServer = require('..');
let argv = require('minimist')(process.argv.slice(2),
  {
    string:['rtmp_port','http_port','https_port'],
    alias: {
      'rtmp_port': 'r',
      'http_port': 'h',
      'https_port': 's',
    },
    default:{
      'rtmp_port': 1935,
      'http_port': 8000,
      'https_port': 8443,
    }
  });
  
if (argv.help) {
  console.log('Usage:');
  console.log('  node-media-server --help // print help information');
  console.log('  node-media-server --rtmp_port 1935 or -r 1935');
  console.log('  node-media-server --http_port 8000 or -h 8000');
  console.log('  node-media-server --https_port 8443 or -s 8443');
  process.exit(0);
}

const config = {
  rtmp: {
    port: argv.rtmp_port,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60,
    // ssl: {
    //   port: 443,
    //   key: __dirname+'/privatekey.pem',
    //   cert: __dirname+'/certificate.pem',
    // }
  },
  http: {
    port: argv.http_port,
    mediaroot: __dirname+'/media',
    webroot: __dirname+'/www',
    allow_origin: '*',
    api: true
  },
  https: {
    port: argv.https_port,
    key: __dirname+'/privatekey.pem',
    cert: __dirname+'/certificate.pem',
  },
  auth: {
    api: true,
    api_user: 'admin',
    //api_pass: 'admin',
    api_pass: secrets.read('.apikey'),
    play: false,
    publish: false,
    //secret: 'nodemedia2017privatekey'
    secret: secrets.read('.playerkey')
  },
  trans: {
    ffmpeg: '/usr/bin/ffmpeg',
    tasks: [
      {
        app: 'live',
        hls: true,
        hlsFlags: '[hls_time=2:hls_list_size=3:hls_flags=delete_segments]',
        dash: true,
        dashFlags: '[f=dash:window_size=3:extra_window_size=5]'
      }
    ]
  },
  fission: {
    ffmpeg: '/usr/bin/ffmpeg',
    tasks: [
      {
        rule: "show/*",
        model: [
          {
            ab: "64k",
            vb: "600k",
            vs: "360x640",
            vf: "20",
            g: "50",
          }
        ]
      }
    ]
  }
};


let nms = new NodeMediaServer(config);
nms.run();

nms.on('preConnect', (id, args) => {
  console.log('[NodeEvent on preConnect]', `id=${id} args=${JSON.stringify(args)}`);
  // let session = nms.getSession(id);
  // session.reject();
});

nms.on('postConnect', (id, args) => {
  console.log('[NodeEvent on postConnect]', `id=${id} args=${JSON.stringify(args)}`);
});

nms.on('doneConnect', (id, args) => {
  console.log('[NodeEvent on doneConnect]', `id=${id} args=${JSON.stringify(args)}`);
});

nms.on('prePublish', (id, StreamPath, args) => {
  console.log('[NodeEvent on prePublish]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
  // let session = nms.getSession(id);
  // session.reject();
});

nms.on('postPublish', (id, StreamPath, args) => {
  console.log('[NodeEvent on postPublish]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
});

nms.on('donePublish', (id, StreamPath, args) => {
  console.log('[NodeEvent on donePublish]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
});

nms.on('prePlay', (id, StreamPath, args) => {
  console.log('[NodeEvent on prePlay]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
  // let session = nms.getSession(id);
  // session.reject();
});

nms.on('postPlay', (id, StreamPath, args) => {
  console.log('[NodeEvent on postPlay]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
});

nms.on('donePlay', (id, StreamPath, args) => {
  console.log('[NodeEvent on donePlay]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
});

