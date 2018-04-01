var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var mysql = require("mysql");

// App config

app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

// Connection to database

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "xxxx",
    database: "dbms_project",
    multipleStatements: true
});

// Connection database verification

con.connect(function (err) {
    if (err) {
        console.log("Error connecting to database");
    } else {
        console.log("Successfully connected to database");
    }
})

// setting up body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Get requests

app.get("/", function (req, res) {
    res.render("landing");
});

// login page
app.get("/login", function (req, res) {
    res.render("login");
});

// sign up
app.get("/signup", function (req, res) {
    res.render("signup");
});

app.get("/query", function (req, res) {
    var dest_name = req.query.dest_name;
    var sqlStatement = "select * from destination where dest_name = ?; select * from package, destination where destination.dest_name = ? and package.dest_id = destination.dest_id;";

    con.query(sqlStatement, [dest_name, dest_name], function (err, result) {
        try {
            res.render("query", { result: result });
        } catch (err) {
            res.send("No such destination ID available / error");
        }
    });
});

// profile page of user/admin
app.get("/profile/:username", function (req, res) {
    var username = req.params.username;
    var sqlStatement = "select * from user where username = ?";

    con.query(sqlStatement, [username], function (err, result) {
        try {
            // console.log(result[0].user_type);
            res.render("profile", { result: result });
        }
        catch (err) {
            res.send("No such user available / Errror!");
        }
    });
});

// get the details of package
app.get("/package/:package_id", function(req, res){
    var package_id = req.params.package_id;

    var sqlStatement = "select * from ((package inner join destination on package.dest_id = destination.dest_id) inner join hotel on package.hotel_id = hotel.hotel_id) where package.package_id = ?;"
    // console.log(sqlStatement);
    con.query(sqlStatement, [package_id], function(err, result) {
        try {
            res.render("package", {result: result});
        } catch(err) {
            res.send("No such package available / Error!");
        }
    });
});

// history of payments for user
app.get("/payments", function (req, res) {
    res.render("payments");
});

// about page
app.get("/about", function (req, res) {
    res.render("about");
});

// cart page 
app.get("/cart", function (req, res) {
    res.render("cart");
});

// ======================
//          POST REQUESTS
// ======================

// updation of profile
app.post("/profile/:username", function (req, res) {
    console.log(req.body);
    var username = req.params.username;
    var password = '"' + req.body.password + '"';
    var fullname = '"' + req.body.fullname + '"';
    var email = '"' + req.body.email + '"';
    var contact = '"' + req.body.contact + '"';

    var sqlStatement = "update user set password = " + password + ", full_name = " + fullname + ", email = " + email + ", contact = " + contact + " where username = " + '"' + username + '"' + ";";
    console.log(sqlStatement);
    con.query(sqlStatement, function (err, result) {
        try {
            console.log("Successful insertion");
            res.redirect("/profile/" + username);
        } catch (err) {
            console.log("Error inserting into table");
            console.log(err);
        }
    });
});

// creation of a new profile
app.post("/profile", function (req, res) {
    // console.log("Hello");

    var username = '"' + req.body.username + '"';
    var password = '"' + req.body.password + '"';
    var fullname = '"' + req.body.fullname + '"';
    var email = '"' + req.body.email + '"';
    var contact = '"' + req.body.contact + '"';

    var sqlStatement = "insert into user values ('user', " + username + ", " + password + ", " + fullname + ", " + contact + ", " + email + ");";
    // console.log(sqlStatement);
    con.query(sqlStatement, function (err, result) {
        if (err) {
            console.log("Error inserting into table / non unique username");
            console.log(err);
        } else {
            console.log("Successful insertion");
            res.redirect("/signup");
        }
    });
});

// Server listen request
app.listen(3000, function () {
    console.log("Server initiated!");
});