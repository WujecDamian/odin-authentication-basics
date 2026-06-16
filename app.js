const { Pool } = require("pg");
const express = require("express");
const session = require("express-session");
const path = require("node:path");
const passport = require("passport");
const { error } = require("node:console");
const LocalStrategy = require("passport-local").Strategy;
require("dotenv").config();

const connectionString = process.env.CONNECTION_STRING;
const pool = new Pool({
  connectionString,
});

//CONFIG

const app = express();
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(session({ secret: "cats", resave: false, saveUninitialized: false }));
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));

//Routes

app.get("/", (req, res) => res.render("index"));
///sign up
app.get("/sign-up", (req, res) => res.render("sign-up-form"));
app.post("/sign-up", async (req, res, next) => {
  try {
    await pool.query("INSERT INTO users (username, password) VALUES ($1,$2)", [
      req.body.username,
      req.body.password,
    ]);
    res.redirect("/");
  } catch (err) {
    return next(err);
  }
});
//APP LISTEN

app.listen(3000, (error) => {
  if (error) {
    throw error;
  }
  console.log("app listening on port http://localhost:3000 !");
});
