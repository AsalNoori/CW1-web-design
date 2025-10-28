const mysql = require('mysql2');
const con = mysql.createConnection({
    host: "localhost",
    user: "NodeClient",
    password: "NodeClient123"
});

con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
});
