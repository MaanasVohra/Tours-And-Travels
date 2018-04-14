var express = require("express");
var app = express();
var session = require("express-session");
var bodyParser = require("body-parser");
var mysql = require("mysql");

// App config

app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

// session config
app.use(session({
    secret: "I'm a complan boy",
    resave: true,
    saveUninitialized: false
}));

var sess; // global variable for a session=

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
    sess = req.session;
    if (sess) {
        res.render("landing", { username: sess.username });
    } else {
        res.render("landing");
    }
});

// login page
app.get("/login", function (req, res) {
    sess = req.session;
    try {
        if (sess.username) {
            res.redirect("/profile/" + sess.username);
        } else {
            res.render("login");
        }
    } catch (err) {
        res.send("Some error finding login / session");
    }
});

// logout get
app.get("/logout", function (req, res) {
    console.log("Logging out");
    req.session.destroy(function (err) {
        try {
            if (err) {
                console.log(err);
            } else {
                res.redirect("/");
            }
        } catch (err) {
            res.send("Some error happened");
        }
    });
});

// sign up
app.get("/signup", function (req, res) {
    sess = req.session;
    if (sess.username) {
        res.redirect("/profile/" + sess.username);
    } else {
        res.render("signup");
    }
});

app.get("/query", function (req, res) {
    var dest_name = req.query.dest_name;
    var sqlStatement = "select * from destination where dest_name = ?; select * from package, destination where destination.dest_name = ? and package.dest_id = destination.dest_id;";
    sess = req.session;
    con.query(sqlStatement, [dest_name, dest_name], function (err, result) {
        try {
            if (sess) {
                res.render("query", { result: result, username: sess.username });
            } else {
                res.render("query", { result: result });
            }
        } catch (err) {
            res.send("No such destination ID available / error");
        }
    });
});

// profile page of user/admin
app.get("/profile/:username", function (req, res) {
    sess = req.session;
    if (sess) {
        if (req.params.username != sess.username) {
            res.send("You're not allowed to see this page");
        } else {
            var username = req.params.username;
            var sqlStatement = "select * from user where username = ?";

            con.query(sqlStatement, [username], function (err, result) {
                try {
                    res.render("profile", { result: result });
                }
                catch (err) {
                    res.send("No such user available / Errror!");
                }
            });
        }
    } else {
        res.redirect("/login");
    }

});

// get the details of package
app.get("/package/:package_id", function (req, res) {
    var package_id = req.params.package_id;

    var sqlStatement = "select * from ((package inner join destination on package.dest_id = destination.dest_id) inner join hotel on package.hotel_id = hotel.hotel_id) where package.package_id = ?;"
    sess = req.session;
    con.query(sqlStatement, [package_id], function (err, result) {
        try {
            console.log(result);
            if (sess.username) {
                res.render("package", { result: result, username: sess.username });
            } else {
                res.render("package", { result: result });
            }
        } catch (err) {
            res.send("No such package available / Error!");
        }
    });
});

// about page
app.get("/about", function (req, res) {
    sess = req.session;
    try {
        if (sess.username) {
            res.render("about", { username: sess.username });
        } else {
            res.render("about");
        }
    } catch (err) {
        res.send("Error for GET in about page");
    }
});

// get request to view cart
app.get("/profile/:username/payments", function (req, res) {
    sess = req.session;
    if (sess.username) {
        if (req.params.username == sess.username) {
            var username = req.params.username;
            var sqlStatement = "select * from payments inner join package on payments.package_id = package.package_id where username = ?;";
            con.query(sqlStatement, [username], function (err, result) {
                try {
                    res.render("payments", { result: result, username: username });
                } catch (err) {
                    res.send("There is some error / sql query couldn't be made");
                }
            });
        } else {
            res.send("You're not allowed to see this page");
        }
    } else {
        res.redirect("/login");
    }

});

// ======================
//          POST REQUESTS
// ======================

// payment part -> most critical part of the app, I'm tired now
app.post("/profile/:username/payments", function (req, res) {
    sess = req.session;
    // well the session would obviously exist, but if someone arbritarily throws a post request then it's deadly
    if (sess.username) {
        var username = req.params.username;
        var sqlStatement = "select * from user where username = ?;";
        
        con.query(sqlStatement, [username], function(err, result) {
            try {
                console.log(req);
                res.send("Fuck");
            } catch(err) {
                res.send("Some error in query for post request in payment");
            }
        }); 
    } else {
        res.send("Some error in making payment");
    }
});

// updation of profile
app.post("/profile/:username", function (req, res) {
    var username = req.params.username;
    var password = '"' + req.body.password + '"';
    var fullname = '"' + req.body.fullname + '"';
    var email = '"' + req.body.email + '"';
    var contact = '"' + req.body.contact + '"';

    var sqlStatement = "update user set password = " + password + ", full_name = " + fullname + ", email = " + email + ", contact = " + contact + " where username = " + '"' + username + '"' + ";";
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

    var sqlStatement = "insert into user values ('user', " + username + ", " + password + ", " + fullname + ", " + contact + ", " + email + ", 50000" + ");";
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

// post request for login 
app.post("/login", function (req, res) {
    var username = req.body.username;
    var password = req.body.password;
    var sqlStatement = "select * from user where username = ?;"

    con.query(sqlStatement, [username], function (err, result) {
        try {
            if (result.length == 0) {
                console.log("No such username found");
                res.redirect("/login");
            } else {
                var queryPassword = result[0].password;
                if (password == queryPassword) {
                    sess = req.session;
                    sess.username = username;
                    res.redirect("/profile/" + username);
                } else {
                    console.log("Wrong password");
                    res.redirect("/login");
                }
            }
        } catch (err) {
            console.log("Couldn't do the query / some error occured in post login");
            res.redirect("/login");
        }
    });
});

// Server listen request
app.listen(3000, function () {
    console.log("Server initiated!");
});