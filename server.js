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

// Catch uncaughtException
process.on("uncaughtException", function(err) {
  //console.log(err);
  let cacheStore = [];
  cache.forEach((value, key) => {
    obj = { [key]: JSON.stringify(value) };
    cacheStore.push(obj);
  });
  fs.writeFileSync(filename, JSON.stringify(cacheStore));
  //console.log(cacheStore);
  process.exit(1);
});
