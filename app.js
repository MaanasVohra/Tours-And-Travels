var express = require("express");
var app = express();

// App config

app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

// Get requests

app.get("/", function (req, res) {
    res.send("Hello World");
});

app.get("/query", function (req, res) {
    res.render("query");
});

// Server listen request
app.listen(3000, function () {
    console.log("Server initiated!");
});