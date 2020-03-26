const fs = require("fs");
const express = require("express");
const path = require("path");
const { server, app, cache } = require("./utils/socket");
let filename = path.join(__dirname, "backup", "backup.txt");
let obj;

// Set static folder
app.use(express.static(path.join(__dirname, "public")));

fs.readFile(filename, { encoding: "utf-8" }, (err, data) => {
  if (err) console.log(err);
  if (data) {
    obj = JSON.parse(data);
    obj.forEach(element => {
      let key = Object.keys(element);
      cache.set(key[0], JSON.parse(element[key[0]]));
      console.log(key[0]);
      console.log(element[key[0]]);
    });
  }
});

const PORT = 3000 || process.env.PORT;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

process.stdin.resume(); //so the program will not close instantly

function exitHandler(options, exitCode) {
  let cacheStore = [];
  cache.forEach((value, key) => {
    obj = { [key]: JSON.stringify(value) };
    cacheStore.push(obj);
  });
  fs.writeFileSync(filename, JSON.stringify(cacheStore));
  console.log(cacheStore);

  if (options.cleanup) console.log("clean");
  if (exitCode || exitCode === 0) console.log(exitCode);
  if (options.exit) process.exit();
}

//do something when app is closing
//process.on("exit", exitHandler.bind(null, { cleanup: true }));

//catches ctrl+c event
process.on("SIGINT", exitHandler.bind(null, { exit: true }));

// catches "kill pid" (for example: nodemon restart)
process.on("SIGUSR1", exitHandler.bind(null, { exit: true }));
process.on("SIGUSR2", exitHandler.bind(null, { exit: true }));

//catches uncaught exceptions
process.on("uncaughtException", exitHandler.bind(null, { exit: true }));
