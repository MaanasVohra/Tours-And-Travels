var express = require("express");
var app = express();

// App config

app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

// Get requests

app.get("/", function (req, res) {
    res.send("Hello World");
});

// login page
app.get("/login", function(req, res){
    res.send("Login");
});

// sign up
app.get("/signup", function(req, res) {
    res.render("signup");
});

app.get("/query", function (req, res) {
    res.render("query");
});

// profile page of user/admin
app.get("/profile", function (req, res) {
    res.render("profile");
});

// history of payments for user
app.get("/payments", function(req, res){
    res.render("payments");
});

// about page
app.get("/about", function(req, res) {
    res.render("about");
});

// Server listen request
app.listen(3000, function () {
    console.log("Server initiated!");
});