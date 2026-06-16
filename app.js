const bcrypt = require("bcryptjs");
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

//Passport (logging)

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const { rows } = await pool.query(
        "SELECT * FROM users WHERE username = $1",
        [username],
      );
      const user = rows[0];

      if (!user) {
        return done(null, false, { message: "Incorrect username" });
      }
      //check for password (plain text vs hashed from db)
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return done(null, false, { message: "Incorrect password" });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }),
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [
      id,
    ]);
    const user = rows[0];

    done(null, user);
  } catch (err) {
    done(err);
  }
});
//Local variables middleware
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});

//Routes

app.get("/", (req, res) => res.render("index", { user: req.user }));
///sign up
app.get("/sign-up", (req, res) => res.render("sign-up-form"));
app.post("/sign-up", async (req, res, next) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    await pool.query("INSERT INTO users (username, password) VALUES ($1,$2)", [
      req.body.username,
      hashedPassword,
    ]);
    res.redirect("/");
  } catch (err) {
    return next(err);
  }
});
///log-in
app.post(
  "/log-in",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/",
    failureMessage: true,
  }),
);

app.get("/log-out", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});
//APP LISTEN

app.listen(3000, (error) => {
  if (error) {
    throw error;
  }
  console.log("app listening on port http://localhost:3000 !");
});
