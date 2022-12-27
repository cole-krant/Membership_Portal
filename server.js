/* DATABASE INITIALIZATION ------------------------------------------------------ */
/* INCLUDES */
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const pgp = require('pg-promise')();
const session = require("express-session");
app.use(bodyParser.json());
const bcrypt = require('bcryptjs');
app.use(bodyParser.urlencoded({ extended: true }));

const PORT = 80;

/* DATABSE CONFIGURATION */
const dbConfig = {
    host: 'db',
    port: 5432,
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
};

const db = pgp(dbConfig);

/* TEST DATABASE CONNECTION */
db.connect()
    .then(obj => {
        console.log('Database connection successful');
        obj.done(); // success, release the connection;
    })
    .catch(error => {
        console.log('ERROR:', error.message || error);
    });

/* SET THE VIEW ENGINE TO EJS */
app.set("view engine", "ejs");
app.use(express.static(__dirname + '/'));

/* INITIALIZE SESSION VARIABLES */
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        saveUninitialized: false,
        resave: false,
    })
);

/* ENCODE URL */
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);

/* USERS TABLE EJS REFERENCE */
const users = {
    username:undefined,
    password:undefined
}

/* NAVIGATION ROUTES -------------------------------------------------------------- */
app.get('/', (req, res) => {                    // upon entry user goes to login
    res.render("pages/login");
});
app.get('/register', (req, res) => {            // navigate to register page
    res.render("pages/register");
});
app.get('/login', (req, res) => {               // navigate to the login page
    res.render("pages/login");
});
app.get("/logout", (req, res) => {              // terminate the session
    req.session.destroy();
    res.render("pages/logout");
});
app.get("/home", (req, res) => {
    res.render("pages/home", {

    });
});
app.get("/calendar", (req, res) => {
    res.render("pages/calendar", {
        
    });
});

/* POST REGISTER : rediredct to login ---------------------------------------------- */
app.post('/register', async (req, res) => {

    const hash = await bcrypt.hash(req.body.password, 8);

    let query = `INSERT INTO users (username, password) VALUES ($1, $2);`;

    db.none(query, [
        req.body.username,
        hash
      ])
        .then(function (data) {

            /* start session */
            users.username = req.body.username;
            users.password = req.body.password;
            req.session.user = users;
            req.session.save();

            /* Bring to Post-Registration Survey */
            res.redirect('/home')
        })
        .catch(function (err) {
          res.redirect('/register');
          return console.log(err);
        }); 
});
/* POST LOGIN : redirect to register ? survey? ------------------------------------- */
app.post('/login', async (req, res) => {

    let query = `SELECT * FROM users WHERE username = $1;`;

    db.one(query, [
        req.body.username,
        req.body.password
    ])
    .then(async (user) => {

        const match = await bcrypt.compare(req.body.password, user.password);

        if (match)
        {
            users.username = req.body.username;
            users.password = req.body.password;
            req.session.user = users;
            req.session.save();
            res.redirect('/home');
        }

        else 
        {
            res.redirect('pages/login', {message: "Incorrect Password", error: true});
        }
    })

    .catch (function (err) {

        res.redirect('/register');

        return console.log(err);
    });
});
/* AUTHENTICATION ---------------------------------------------------------------------  */
const auth = (req, res, next) => {
    if (!req.session.user) {
        // Default to register page.
        return res.redirect('/register');
    }
    next();
};

// Authentication Required
app.use(auth);


/* ------------------------------------------------------------------------------------ */
app.listen(3000);
console.log("Server is listening on port 3000\n\n");