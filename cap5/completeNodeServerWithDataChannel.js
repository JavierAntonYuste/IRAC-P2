var static = require('node-static');

var https = require('https');

// Change directory to path of current JavaScript program
// var process = require('process');
// process.chdir(__dirname);
//descomentar las dos líneas anteriores si no se quiere poner el subdirectorio al final, por ej. https://...:8080/cap5/

// Read key and certificates required for https
var fs = require('fs');
var path = require('path');

var options = {
  key: fs.readFileSync(path.join(__dirname,'key.pem')),
  //key: fs.readFileSync(path.join(__dirname,'key.pem')),
  cert: fs.readFileSync(path.join(__dirname,'cert.pem'))
};
// Create a node-static server instance
var file = new(static.Server)();

// We use the http moduleÕs createServer function and
// rely on our instance of node-static to serve the files
var app = https.createServer(options, function (req, res) {
  file.serve(req, res);
}).listen(8080);

// Use socket.io JavaScript library for real-time web applications
var io = require('socket.io').listen(app);

// Let's start managing connections...
io.sockets.on('connection', function (socket){


  socket.on('create or join', function (room) { // Handle 'create or join' messages
    var numClients = io.sockets.adapter.rooms[room]?io.sockets.adapter.rooms[room].length:0;

    console.log('S --> Room ' + room + ' has ' + numClients + ' client(s)');
    console.log('S --> Request to create or join room', room);

    if(numClients == 0){ // First client joining...
      socket.join(room);
      socket.emit('created', room);
    } else if (numClients == 1) { // Second client joining...
      io.sockets.in(room).emit('join', room);
      socket.join(room);
      socket.emit('joined', room);
    } else { // max two clients
      socket.emit('full', room);
    }
  });

  socket.on('message', function (message) { // Handle 'message' messages
    console.log('S --> got message: ', message);
    // channel-only broadcast...
    socket.broadcast.to(message.channel).emit('message', message);
  });

  function log(){
    var array = [">>> "];
    for (var i = 0; i < arguments.length; i++) {
      array.push(arguments[i]);
    }
    socket.emit('log', array);
  }

});
