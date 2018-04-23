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
});

// setting up body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Get requests

app.get("/", function (req, res) {
    sess = req.session;
    if (sess.username) {
        res.render("landing", { username: sess.username, type: sess.user_type });
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
            // console.log(result);
            if (sess.username) {
                res.render("query", { result: result, username: sess.username });
            } else {
                res.render("query", { result: result });
            }
        } catch (err) {
            res.send("No such destination ID available / error");
        }
    });
});

// get all packages for a particular destination
app.get("/query/:destination", function (req, res) {
    sess = req.session;
    if (sess.username) {
        if (sess.user_type == "admin") {
            var dest_name = req.params.destination;
            var sqlStatement = "select * from package, destination where destination.dest_name = ? and package.dest_id = destination.dest_id;";

            con.query(sqlStatement, [dest_name], function (err, result) {
                try {
                    console.log(result);
                    res.send(result);
                } catch (err) {
                    res.send("Some error while querying for destination packages in admin package manage");
                }
            });
        } else {
            res.send("You sent the GET request to the wrong place, bud");
        }
    } else {
        res.redirect("/login");
    }
});

// profile page of user / admin
app.get("/profile/:username", function (req, res) {
    sess = req.session;
    if (sess.username) {
        if (req.params.username == sess.username || sess.user_type == "admin") {
            var username = req.params.username;
            var sqlStatement = "select * from user where username = ?";

            con.query(sqlStatement, [username], function (err, result) {
                try {
                    if (result[0].user_type == "admin") {
                        console.log("Going into admin");
                        res.render("admin", { result: result });
                    } else {
                        res.render("profile", { result: result });
                    }
                }
                catch (err) {
                    res.send("No such user available / Errror!");
                }
            });
        } else {
            res.send("You're not allowed to see this page");
        }
    } else {
        res.redirect("/login");
    }

});

// manage destination -> admin only ;
app.get("/destinationManage", function (req, res) {
    sess = req.session;
    if (sess.username) {
        if (sess.user_type == "admin") {
            res.render("destinationManage", { username: sess.username });
        } else {
            res.send("You're not allowed to view this page");
        }
    } else {
        res.redirect("/login");
    }
});

// manage packages -> admin only ;
app.get("/packageManage", function (req, res) {
    sess = req.session;
    if (sess.username) {
        if (sess.user_type == "admin") {
            res.render("packageManage", { username: sess.username });
        } else {
            res.send("You're not allowed to view this page ");
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
                res.render("package", { result: result, username: sess.username, type: sess.user_type });
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
        if (req.params.username == sess.username || sess.user_type == "admin") {
            var username = req.params.username;
            var sqlStatement = "select * from payments inner join package on payments.package_id = package.package_id where username = ?;";
            con.query(sqlStatement, [username], function (err, result) {
                try {
                    console.log(result);
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

// deletion of package;
app.post("/package/:package_id/delete", function (req, res) {
    sess = req.session;
    if (sess.username) {
        if (sess.user_type == "admin") {
            var packageId = req.params.package_id;
            var sqlStatement = "delete from package where package_id = " + "'" + packageId + "';";
            console.log(sqlStatement);
            con.query(sqlStatement, function (err, result) {
                try {
                    console.log("Successfully deleted package");
                    res.redirect("/profile/" + sess.username);
                } catch (err) {
                    res.send("Some error while carrying out deletion query of package in admin");
                }
            });
        } else {
            res.send("You sent the post request at the wrong place buddy");
        }
    } else {
        res.send("Some error while doing the deletion package post request");
    }
});

// create a new package
app.post("/package", function (req, res) {
    sess = req.session;
    if (sess.username) {
        if (sess.user_type == "admin") {
            var packageImage = req.body.package_image;
            var hotelID = req.body.hotel_id;
            var destName = req.body.dest_name;
            var packageName = req.body.package_name;
            var packageDesc = req.body.package_desc;
            var rate = req.body.rate;

            checkDestinationExist(destName)
                .then(function (rows) {
                    if (rows.length == 0) {
                        res.send("Please change the destination, or create a destination to insert a package");
                    } else {
                        console.log(rows);
                        var sqlStatement = "insert into package (dest_id, hotel_id, package_name, package_desc, rate, package_image) values (" + "'" + rows[0].dest_id + "', '" + hotelID + "', '" + packageName + "', '" + packageDesc + "', '" + rate + "', '" + packageImage + "');";
                        console.log(sqlStatement);
                        con.query(sqlStatement, function (err, result) {
                            try {
                                res.redirect("/profile/" + sess.username);
                            } catch (err) {
                                res.send("Some error while creating a totally new package");
                            }
                        });
                    }
                })
                .catch((err) => setImmediate(() => { throw err; }));
        } else {
            res.send("You sent the post request at the wrong place buddy");
        }
    } else {
        res.send("Some error while creating a new package in admin");
    }
});

// check if there is a destination name as specified by the admin
function checkDestinationExist(destName) {
    return new Promise(function (resolve, reject) {
        var sqlStatement = "select * from destination where dest_name = " + "'" + destName + "';";
        console.log(sqlStatement);
        con.query(sqlStatement, function (err, rows, fields) {
            if (err) {
                return reject(err);
            }
            resolve(rows);
        });
    });
}

// update the package -> admin only 
app.post("/package/:package_id", function (req, res) {
    sess = req.session;
    if (sess.username) {
        if (sess.user_type == "admin") {
            var packageImage = req.body.package_image;
            var hotelID = req.body.hotel_id;
            var destID = req.body.dest_id;
            var packageName = req.body.package_name;
            var packageDesc = req.body.package_desc;
            var rate = req.body.rate;

            var sqlStatement = "update package set package_image = " + "'" + packageImage + "'" + ", hotel_id = " + "'" + hotelID + "'" + ", dest_id = " + "'" + destID + "'" + ", package_name = " + "'" + packageName + "'" + ", package_desc = " + "'" + packageDesc + "'" + ", rate = " + "'" + rate + "' where package_id = " + "'" + req.params.package_id + "';";
            console.log(sqlStatement);
            con.query(sqlStatement, function (err, result) {
                try {
                    console.log("successful updation of profile");
                    res.redirect("/profile/" + sess.username);
                } catch (err) {
                    res.send("Some error while doing query while updating package by admin");
                }
            });
        } else {
            res.send("You tried to do a post request at the wrong place buddy ");
        }
    } else {
        res.send("Some error while updating package by admin");
    }
});

// delete destination if there exists one
app.post("/query/delete", function (req, res) {
    sess = req.session;
    if (sess.username) {
        if (sess.user_type == "admin") {
            var destination = req.body.destination;
            var sqlStatement = "delete from destination where dest_name = " + "'" + destination + "'" + ";";

            con.query(sqlStatement, function (err, result) {
                try {
                    if (result.affectedRows == 0) {
                        res.send("No such destination exists");
                    } else {
                        res.send("Successfully destination deleted");
                    }
                } catch (err) {
                    res.send("Some error while doing delete query in destination");
                }
            });
        } else {
            res.send("Whoops, you don't have the rights to do that dude");
        }
    } else {
        res.send("There is some error while doing the post request for destination delete");
    }
});

// update the query page for the destination 

app.post("/query", function (req, res) {
    sess = req.session;
    if (sess.username) {
        if (sess.user_type == "admin") {
            var destination = req.body.destination;
            var information = req.body.information;
            var destImageURL = req.body.dest_image_url;

            checkForDestination(destination, information, destImageURL)
                .then(function (rows) {
                    if (rows.affectedRows == 0) {

                        var sqlStatement = "insert into destination (dest_name, dest_desc, dest_image) values (" + "'" + destination + "'" + ", " + "'" + information + "'" + ", " + "'" + destImageURL + "'" + ");";
                        console.log(sqlStatement);

                        con.query(sqlStatement, function (err, result) {
                            try {
                                console.log("Successful insertion into destination");
                                res.redirect("/profile/" + sess.username);
                            } catch (err) {
                                res.send("Some error while insertion of destination");
                            }
                        });
                    } else {
                        console.log("Successful modification");
                        res.redirect("/profile/" + sess.username);
                    }
                })
                .catch((err) => setImmediate(() => { throw err; }));
        } else {
            res.send("You send a post to the wrong page buddy ");
        }
    } else {
        res.send("There is some error in the post request while updating destination");
    }
});

// check if the destination is already there, i.e. it gets updated
function checkForDestination(destination, information, destImageURL) {
    return new Promise(function (resolve, reject) {
        var sqlStatement = "update destination set dest_desc = " + "'" + information + "'" + ", dest_image = " + "'" + destImageURL + "'" + " where dest_name = " + "'" + destination + "'" + " ;";
        console.log(sqlStatement);
        con.query(sqlStatement, function (err, rows, fields) {
            if (err) {
                return reject(err);
            }
            resolve(rows);
        });
    });
}


// add money to user 
app.post("/profile/:username/addMoney", function (req, res) {
    sess = req.session;
    if (sess.username) {
        if (sess.username == req.params.username || sess.user_type == "admin") {
            var moneyAdded = req.body.money_added;
            var sqlStatement = "update user set wallet_money = wallet_money + " + moneyAdded + " where username = " + "'" + req.params.username + "'" + ";";
            con.query(sqlStatement, function (err, result) {
                try {
                    console.log(sqlStatement);
                    res.redirect("/profile/" + sess.username);
                } catch (err) {
                    res.send("Some error adding money in sql statement");
                }
            });
        } else {
            res.send("You're not allowed to view this page");
        }

    } else {
        res.redirect("/login");
    }
});

// new payment part
app.post("/profile/:username/payments", function (req, res) {
    sess = req.session;
    if (sess.username) {
        if (sess.username == req.params.username) {
            var packageId = req.body.package_id;
            var amount = req.body.amount;
            var personCount = req.body.person_count;

            checkForUser(sess.username, amount)
                .then(function (rows) {
                    if (rows.affectedRows == 0) {
                        res.send("Insufficient Funds");
                    } else {
                        console.log("Successful payment");
                        var sqlStatement = "insert into payments (package_id, booking_date, username, person_count, amount) values (?, NOW(), ?, ?, ?);";

                        con.query(sqlStatement, [packageId, sess.username, personCount, amount], function (err, result) {
                            try {
                                console.log("Successful insertion in payments");
                                res.redirect("/");
                            } catch (err) {
                                res.send("Some error while sql querying in payments post method");
                            }
                        });
                    }
                })
                .catch((err) => setImmediate(() => { throw err; }));
        } else {
            res.send("You're not allowed to post request here");
        }
    } else {
        res.send("Error in making payment");
    }
});

// check if the user exists and the wallet money condition is satisfied;
function checkForUser(username, amount) {
    return new Promise(function (resolve, reject) {
        var sqlStatement = "update user set wallet_money = wallet_money - " + amount + "   where username = " + "'" + username + "'" + " and wallet_money - " + amount + " >= 0;";

        con.query(sqlStatement, function (err, rows, fields) {
            console.log(sqlStatement);
            if (err) {
                return reject(err);
            }
            resolve(rows);
        });
    });
}

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
                    sess.user_type = result[0].user_type;
                    res.redirect("/");
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