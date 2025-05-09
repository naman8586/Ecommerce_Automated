require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();

app.use(cors());
app.use(bodyParser.json());

// Now you can access environment variables
const PORT = process.env.PORT || 5000;
const ALLOWED_SITES = process.env.ALLOWED_SITES ? process.env.ALLOWED_SITES.split(",") : [];

app.get("/", (req, res) => {
  res.send("Backend is running!");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
