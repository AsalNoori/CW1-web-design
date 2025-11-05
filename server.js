const express = require("express");
const app = express();
const path = require("path");
const port = 8082;

const requestLogger = (req, res, next) => {
    console.log(` ${req.method} ${req.url}`);
    next();
  };

app.use(requestLogger);
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static(__dirname));

app.get("/", function(req, res) {
    res.sendFile(path.join(__dirname, "home.html"));
  });

app.get("/SignIn", (req, res) => {
    res.sendFile(path.join(__dirname, "signIn.html"));
});

app.get("/SignUp", (req, res) => {
    res.sendFile(path.join(__dirname, "signUp.html"));
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
    console.log("http://localhost:8082");
});