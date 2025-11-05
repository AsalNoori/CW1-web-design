const mysql = require('mysql2');
const con = mysql.createConnection({
    host: "localhost",
    user: "NodeClient",
    password: "NodeClient123",
    database: "ShipMe"
});

con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
    var sql = "CREATE TABLE Users (UserID INT AUTO_INCREMENT PRIMARY KEY, FirstName VARCHAR(50), LastName VARCHAR(50), Email VARCHAR(50), PhoneNumber VARCHAR(10), Password VARCHAR(255))";
    con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("Table created");
    });
});
