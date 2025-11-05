const mysql = require('mysql2');
const express = require("express");
const app = express();
const path = require("path");
const port = 8080;
const cookieParser = require('cookie-parser');

app.use(cookieParser());

const requestLogger = (req, res, next) => {
    console.log(` ${req.method} ${req.url}`);
    next();
  };

app.use(requestLogger);
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static(__dirname));

const con = mysql.createConnection({
    host: "localhost",
    user: "NodeClient",
    password: "NodeClient123",
    database: "ShipMe"
});

con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
});

app.get("/", function(req, res) {
    res.sendFile(path.join(__dirname, "home.html"));
  });

app.get("/SignIn", (req, res) => {
    res.sendFile(path.join(__dirname, "signIn.html"));
});

app.post("/SignIn", function(req, res) {
    const { email, password } = req.body;

    const sql = "SELECT FirstName FROM Users WHERE Email = ? AND Password = ?";
    con.query(sql, [email, password], (err, results) => {
        if (err) throw err;

        if (results.length > 0) {
            const firstName = results[0].FirstName;
            res.cookie("firstName", firstName, { maxAge: 24*60*60*1000 });
            res.send('Welcome, + ${firstName}');
        } else {
            res.send("Invalid email or password.");
        }
    });
});

app.get("/SignUp", (req, res) => {
    res.sendFile(path.join(__dirname, "signUp.html"));
});

app.post("/SignUp", (req, res) => {
    const { firstName, lastName, email, phone, password } = req.body;
  
    const sql = "INSERT INTO Users (FirstName, LastName, Email, PhoneNumber, Password) VALUES (?, ?, ?, ?, ?)";
    con.query(sql, [firstName, lastName, email, phone, password], (err, result) => {
      if (err) {
        console.error(err);
        return res.send("Error registering user");
      }
      res.send(`User ${firstName} registered successfully! <a href="/SignIn">Sign in</a>`);
    });
  });

app.get("/PrivacyPolicy", (req, res) => {
    res.sendFile(path.join(__dirname, "privacyPolicy.html"));
});

app.get("/Payment", (req, res) => {
    res.sendFile(path.join(__dirname, "payment.html"));
});

app.get("/IndividualForm", (req, res) => {
    res.sendFile(path.join(__dirname, "IndividualForm.html"));
});

app.get("/BusinessForm", (req, res) => {
    res.sendFile(path.join(__dirname, "BusinessForm.html"));
});

app.get("/ChooseType", (req, res) => {
    res.sendFile(path.join(__dirname, "ChooseType.html"));
});

app.get("/AdminDashboard", (req, res) => {
    res.sendFile(path.join(__dirname, "AdminDashboard.html"));
});

app.get("/AboutUs", (req, res) => {
    res.sendFile(path.join(__dirname, "AboutUs.html"));
});

app.listen(port, function() {
    console.log("http://localhost:8080");
});