const express = require("express");
const app = express();
const path = require("path");
app.use(express.static(__dirname));
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "home.html"));
  });

app.listen(3000, () => {
    console.log("Website running at http://localhost:3000");
});