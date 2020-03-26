const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const formatMessage = require("./messages");
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers
} = require("./users");
const LRU = require("lru-cache");
const cache = new LRU(100);

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const botName = "Chat Bot";

// Run when client connects
io.on("connection", socket => {
  socket.on("joinRoom", ({ username, room }, callback) => {
    const { error, user } = userJoin({ id: socket.id, username, room });
    if (error) return callback(error);
    socket.join(user.room);
    cache.set("settemp", socket.client.id);
    keys = cache.get("key");
    let keyname = user.username + user.room;
    if (keys !== undefined && keys.includes(keyname)) {
      messages = cache.get(keyname);
      if (messages) {
        messages.forEach(element => {
          io.to(socket.client.id).emit(
            "message",
            element
            // {
            //   username: element.username,
            //   text: element.text,
            //   time: element.time
            // }
          );
        });
        cache.del(keyname);
        keys = keys.filter(item => item !== keyname);
        cache.set("key", [...keys]);
        // throw 'New error';
      }
      // Welcome old user
      socket.emit(
        "message",
        formatMessage(botName, "Welcome back to Channel..!")
      );
      socket.broadcast
        .to(user.room)
        .emit(
          "message",
          formatMessage(botName, `${user.username} has backed again`)
        );
    } else {
      // Welcome current user
      socket.emit("message", formatMessage(botName, "Welcome to Channel..!"));

      // Broadcast when a user connects
      socket.broadcast
        .to(user.room)
        .emit(
          "message",
          formatMessage(botName, `${user.username} has joined the chat`)
        );
    }
    // Send users and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room)
    });
  });

  // Listen for chatMessage
  socket.on("chatMessage", msg => {
    const user = getCurrentUser(socket.id);
    io.to(user.room).emit("message", formatMessage(user.username, msg));
    keys = cache.get("key");
    //console.log(keys);
    if (keys !== undefined) {
      let roomName = user.room;
      keys = keys.filter(
        key => roomName === key.substr(key.length - roomName.length)
      );
      //console.log(keys);
      keys.forEach(element => {
        messages = cache.get(element);
        if (messages === undefined) {
          cache.set(element, [formatMessage(user.username, msg)]);
        } else {
          cache.set(element, [...messages, formatMessage(user.username, msg)]);
        }
        //console.log(cache.get(element));
      });
    }
  });

  // Runs when client disconnects
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} has left the chat`)
      );

      // Send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room)
      });
      keys = cache.get("key");
      if (keys == undefined) {
        cache.set("key", [user.username + user.room]);
      } else {
        cache.set("key", [...keys, user.username + user.room]);
      }
      // console.log(cache.get("key"));
    }
  });
});

module.exports = { server, app, cache };
