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
const user = {
    user_id:undefined,
    username:undefined,
    password:undefined,
    admin:undefined,
    img:undefined,
    class:undefined,
    major:undefined,
    committee:undefined,
    net_group:undefined,
    brother_interviews:undefined
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
/* POST REGISTER : rediredct to login ---------------------------------------------- */
app.post('/register', async (req, res) => {

    const hash = await bcrypt.hash(req.body.password, 8);
    const query = `INSERT INTO users (username, password, img) VALUES ($1, $2, $3);`;

    db.none(query, [req.body.username, hash, '../../resources/pfp/Default_Avatar.jpg'])
        .then((data) => {
            user.username = req.body.username;
            user.password = req.body.password;
            user.img = '../../resources/pfp/Default_Avatar.jpg';
            
            req.session.user = user;
            req.session.save();
            res.redirect("/login");
        })
        .catch((error) => {
            console.log("ERROR: ", error.message || error);
            res.redirect("/register");
        });
});
/* POST LOGIN : redirect to register ? survey? ------------------------------------- */
app.post('/login', async (req, res) => {

    const query = `SELECT * FROM users WHERE username = $1;`;

    db.one(query, [req.body.username, req.body.password])
        .then(async (client) => {

            const match = await bcrypt.compare(req.body.password, client.password);

            if (match) {
                user.user_id = client.user_id;
                user.username = req.body.username;
                user.password = req.body.password;
                user.admin = client.admin;
                user.img = client.img;
                user.class = client.class;
                user.major = client.major;
                user.committee = client.committee;
                user.net_group = client.net_group;
                user.brother_interviews = client.brother_interviews;

                req.session.user = user;
                req.session.save();
                res.redirect('/home');
            }
            else {
                res.redirect('pages/login', {message: "Incorrect Password", error: true});
            }
        })
        .catch((error) => {
            console.log("ERROR: ", error.message || error);
            res.redirect("/register");
        });
});
/* AUTHENTICATION ---------------------------------------------------------------------  */
const auth = (req, res, next) => {
    if (!req.session.user) {
        // Default to register page.
        return res.redirect('/register');
    }
    next();
};  app.use(auth);  // Authentication Required
/* ------------------------------------------------------------------------------------ */
app.get("/home", (req, res) => {

    const query = `SELECT * FROM users WHERE username = $1`;

    db.any(query, [req.session.user.username])
        .then((home) => {
            console.log(home);
            res.render("pages/home", {
                home,
                user_id: req.session.user.user_id,
                username: req.session.user.username, 
                img: req.session.user.img, 
                major: req.session.user.major,
                committee: req.session.user.committee,
                net_group: req.session.user.net_group,
                brother_interviews: req.session.user.brother_interviews
            });
        })
        .catch((error) => {
            console.log("ERROR: ", error.message || error);
        })
});
/* ------------------------------------------------------------------------------------ */
app.get("/calendar", (req, res) => {
    res.render("pages/calendar", {

    });
});
/* GET COMMUNITY -------------------------------------------------------------------- */
app.get("/community", (req, res) => {

    const query = `SELECT * FROM users;`;

    db.any(query)
        .then((community) => {
            req.session.save();
            console.log(community);
            res.render("pages/community", {community});
        })
        .catch((error) => {
            console.log("ERROR: ", error.message || error);
        })
    
});
/* UPDATE PROFILE -------------------------------------------------------------------- */
app.post("/update_profile", (req, res) => {

    const user_id = parseInt(req.session.user.user_id);
    const values = [req.body.username, req.body.img, req.body.class, req.body.major, req.body.committee, user_id];

    console.log("USER_ID = " + user_id);
    const query = `
    UPDATE
        users
    SET
        username = $1,
        img = $2,
        class = $3,
        major = $4,
        committee = $5
    WHERE
        user_id = $6;`;

    
    db.none(query, values)
        .then((update) => {

            user.username = values[0];
            user.img = values[1];
            user.class = values[2];
            user.major = values[3];
            user.committee = values[4];

            req.session.user = user;
            req.session.save();

            console.log("Successful Update: \n", user);
            res.redirect("/home");
        })
        .catch((error) => {
            console.log("ERROR: ", error.message || error);
        })

});

/* ------------------------------------------------------------------------------------ */
app.listen(3000);
console.log("Server is listening on port 3000\n\n");