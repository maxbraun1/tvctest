var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

users = [];
connections = [];

server.listen(3000);
console.log("Server running...");

app.use(express.static(__dirname + '/public'));

/* io starts */

io.sockets.on('connection', function(socket){
  connections.push(socket);
  console.log('Connected: %s sockets connected', connections.length);

  //Creating and joining rooms
  socket.on('new-room', function(room, player, username){
    socket.join(room);
    socket.room = room;
    socket.player = player;
    socket.username = username;
    socket.health = 500;
    console.log("User created room "+room+" as player "+player);
  });
  socket.on('join-room', function(room,username){
    io.to(room).emit('player-joined');
    socket.join(room);
    socket.room = room;
    socket.username = username;
    socket.health = 500;
  });
  socket.on('current-player',function(player){
    io.to(socket.room).emit('existing-player',player);
  });
  socket.on('new-player-info',function(player,username,room){
    io.to(socket.room).emit('new-info', player,username,room);
  });

  // Movements
  socket.on('up', function(data){
    io.to(socket.room).emit('move-up', data);
  });
  socket.on('down', function(data){
    io.to(socket.room).emit('move-down', data);
  });

  // Shooting
  socket.on('player-shoots', function(player){
    if(player=="trump"){
      io.to(socket.room).emit('trump-shoot');
    }
    else if(player=="clinton"){
      io.to(socket.room).emit('clinton-shoot');
    }
  });
  socket.on('shot', function(bullet_pos,sprite_pos,shooter){
    console.log("Someone shot");
    if(bullet_pos > sprite_pos && bullet_pos < (sprite_pos+100)){
      if(shooter=="trump"){
        console.log("trump shot");
        io.to(socket.room).emit('clinton-hit');
      }else if(shooter=="clinton"){
        io.to(socket.room).emit('trump-hit');
      }
    }
  });
  socket.on('health',function(player){
    socket.health -= 100;
    io.to(socket.room).emit('update-health',player,socket.health);
  });

  //Disconect
  socket.on('disconnect', function(data){
    socket.leave(socket.room);
    connections.splice(connections.indexOf(socket), 1);
    console.log('Disconnected: %s sockets connected', connections.length);
  });
});
