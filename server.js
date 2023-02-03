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

/* FILE UPLOAD NPM EXTENSION */
const multer = require('multer');
const upload = multer({storage:multer.memoryStorage()});

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
    brother_interviews:undefined,
    points:undefined,
    pfp_img:undefined
}

/* ADMIN */
const admin = {
    edit_id:undefined
}

/* NAVIGATION ROUTES -------------------------------------------------------------- */
app.get('/welcome', (req, res) => {                    // upon entry user goes to login
    res.render("pages/welcome");
});
app.get('/register', (req, res) => {            // navigate to register page
    res.render("pages/register");
});
app.get('/login', (req, res) => {               // navigate to the login page
    res.render("pages/login");
});
app.get("/logout", (req, res) => {              // terminate the session
    req.session.destroy();
    res.render("pages/login");
});
/* POST REGISTER : rediredct to login ---------------------------------------------- */
/* NEED TO IMPLIMENT CONSTRAINT WHERE USERNAMES ARE THE SAME */
app.post('/register', async (req, res) => {

    const hash = await bcrypt.hash(req.body.password, 8);
    const query = `
    INSERT INTO
        users(username, password, name, admin, class, major, committee, net_group, preliminary_forms, big_brother_mentor, getting_to_know_you, informational_interviews, resume, domingos, brother_interviews, points, pfp_img, background)
    VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18);`;

    db.none(query, [req.body.username, hash, req.body.username, 'false', '', '', '', '', 'false', 'false', 'false', 'false', '', 0, 0, 0, '', '../../resources/img/River_Bridge.jpg'])
        .then((data) => {
            req.session.user = {
                username:req.body.username,
                brother_interviews: 0,
                points: 0,
                pfp_img:undefined
            }

            req.session.admin = {
                edit_id:undefined
            }

            req.session.save();
            res.redirect("/login");
        })
        .catch((error) => {
            console.log("\n\nERROR: ", error.message || error);
            res.redirect("/register");
        });
});
/* POST LOGIN : redirect to register ? survey? ------------------------------------- */
app.post('/login', async (req, res) => {

    const query = `SELECT * FROM users WHERE username = $1;`;

    db.one(query, [req.body.username, req.body.password])
        .then(async (client) => {

            const match = await bcrypt.compare(req.body.password, client.password);
            const hash = await bcrypt.hash(req.body.password, 8);

            console.log("Logged in with USER_ID: " + client.user_id);

            if (match) {
                req.session.user = {
                    user_id: client.user_id,
                    username: req.body.username,
                    brother_interviews: client.brother_interviews,
                    points: client.points,
                    pfp_img: client.pfp_img
                }

                req.session.admin = {
                    edit_id:undefined
                }
                
                req.session.save();

                console.log("Stored USER_ID: " + req.session.user.user_id);

                res.redirect('/home');
            }
            else {
                res.redirect('pages/login', {message: "Incorrect Password", error: true});
            }
        })
        .catch((error) => {
            console.log("\n\nERROR: ", error.message || error);
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

    const user_id = req.session.user.user_id;
    console.log("HOME USER_ID: " + user_id);
    const query = `SELECT * FROM announcements ORDER BY announcement_id DESC LIMIT 10;`;

    db.any(query)
        .then((home) => {
            //console.log(home);
            res.render("pages/home", {
                home
            });
        })
        .catch((error) => {
            console.log("\n\nERROR: ", error.message || error);
        })
});
/* ------------------------------------------------------------------------------------ */
app.get("/profile", (req, res) => {

    const user_id = res.user_id ? res.user_id : req.session.user.user_id;
    console.log("HOME USER_ID: " + user_id);
    const query = `SELECT * FROM users WHERE user_id = ${user_id}`;

    db.any(query)
        .then((profile) => {
            console.log(profile);
            res.render("pages/profile", {profile});
        })
        .catch((error) => {
            console.log("\n\nERROR: ", error.message || error);
        })
});
/* ------------------------------------------------------------------------------------ */
app.get("/update_profile", (req, res) => {

    const query = `SELECT * FROM users WHERE user_id = '${req.session.user.user_id}'`;

    db.any(query)
        .then((profile) => {
            //console.log(home);
            res.render("pages/update_profile", {profile});
        })
        .catch((error) => {
            console.log("\n\nERROR: ", error.message || error);
        })
});
/* VIEW PROFILE --------------------------------------------*/
app.post("/community/view_id", (req, res) => {

    const view_id = req.body.view_id;
    const query = `UPDATE users SET view_id = ${view_id} WHERE user_id = ${req.session.user.user_id};`;
    db.none(query)
        .then((update) => { req.session.save();
            console.log("\n\nSuccessful Update (CLASS): \n", req.session.user.username, " TO ", req.body.class);
            res.redirect("/profile", {user_id: view_id});
        })
        .catch((error) => { console.log("\n\nERROR: ", error.message || error); })
});
/* UPDATE PROFILE -------------------------------------------------------------------- */
// app.post("/update_profile/basic", (req, res) => {

//     const values = [req.body.class, req.body.major, req.body.committee, req.session.user.user_id];

//     console.log("USER_ID = " + req.session.user.user_id);
//     const query = `
//     UPDATE
//         users
//     SET
//         class = $1,
//         major = $2,
//         committee = $3
//     WHERE
//         user_id = $4;`;

//     db.none(query, values)
//         .then((update) => {

//             req.session.save();

//             console.log("\n\nSuccessful Update: \n", req.session.user);
//             res.redirect("/update_profile");
//         })
//         .catch((error) => {
//             console.log("\n\nERROR: ", error.message || error);
//         })

// });
/* ----------------------------------------------------------------------------------- */
/**
 *                              UPDATE PROFILE SECTION
 *
 *                Basic Info:           Name, Class, Major, Committee
 *                Profile:              pfp_img
 *                Contact:              School Email, Personal Email, Professional Email, Linkedin, Phone Number
 *                Bio:                  bio
 *                Preferences:          Likes, Dislikes, Quote, Aspirations
 *                Hobbies:              Hobby 1, Hobby 2, Hobby 3
 *                Background:           img select
 *                Favorite Interview:   Brother, Caption, Picture
 * 
 * 
 */
/* -----------------------------------------------------------------------------------  */
/*                                  BASIC INFO                                          */
/* -----------------------------------------------------------------------------------  */
/* DISPLAY NAME --------------------------------------------*/
app.post("/update_profile/name", (req, res) => {

    const query = `UPDATE users SET name = '${req.body.name}' WHERE user_id = ${req.session.user.user_id};`;
    db.none(query)
        .then((update) => { req.session.save();
            console.log("\n\nSuccessful Update (NAME): \n", req.session.user.username, " TO ", req.body.name);
            // res.redirect("/update_profile");
        })
        .catch((error) => { console.log("\n\nERROR: ", error.message || error); })
});


/* CLASS --------------------------------------------*/
app.post("/update_profile/class", (req, res) => {

    const query = `UPDATE users SET class = '${req.body.class}' WHERE user_id = ${req.session.user.user_id};`;
    db.none(query)
        .then((update) => { req.session.save();
            console.log("\n\nSuccessful Update (CLASS): \n", req.session.user.username, " TO ", req.body.class);
            res.redirect("/update_profile");
        })
        .catch((error) => { console.log("\n\nERROR: ", error.message || error); })
});


/* MAJOR --------------------------------------------*/
app.post("/update_profile/major", (req, res) => {

    const query = `UPDATE users SET major = '${req.body.major}' WHERE user_id = ${req.session.user.user_id};`;
    db.none(query)
        .then((update) => { req.session.save();
            console.log("\n\nSuccessful Update (MAJOR): \n", req.session.user.username, " TO ", req.body.major);
            res.redirect("/update_profile");
        })
        .catch((error) => { console.log("\n\nERROR: ", error.message || error); })
});

/* Committee --------------------------------------------*/
app.post("/update_profile/committee", (req, res) => {

    const query = `UPDATE users SET committee = '${req.body.committee}' WHERE user_id = ${req.session.user.user_id};`;
    db.none(query)
        .then((update) => { req.session.save();
            console.log("\n\nSuccessful Update (COMMITTEE): \n", req.session.user.username, " TO ", req.body.committee);
            res.redirect("/update_profile");
        })
        .catch((error) => { console.log("\n\nERROR: ", error.message || error); })
});
/* -----------------------------------------------------------------------------------  */
/*                                  PICTURE                                             */
/* -----------------------------------------------------------------------------------  */
/* PROFILE PICTURE ----------------------- */
app.post("/update_profile/picture", upload.single('profile_img') ,(req, res) => {   /* UPLOAD PARAMETER ALLOWS FOR DATABASE UPLOAD */

    const values = [req.file.buffer.toString('base64'), req.session.user.user_id];
    const query = `UPDATE users SET pfp_img = $1 WHERE user_id = $2;`;
    db.none(query, values)
        .then((update) => { req.session.user.pfp_img = values[0]; req.session.save();
            console.log("\n\nSuccessful Update: (PFP)\n", req.session.user);
            res.redirect("/update_profile");
        })
        .catch((error) => { console.log("\n\nERROR: ", error.message || error); })
});
/* -----------------------------------------------------------------------------------  */
/*                                  CONTACT                                             */
/* -----------------------------------------------------------------------------------  */
/* UPDATE PROFILE -------------------------------------------------------------------- */
// app.post("/update_profile/contact", (req, res) => {

//     const values = [req.body.email, req.body.linkedin, req.body.phone, req.body.professional_email, req.body.personal_email, req.session.user.user_id];

//     console.log("USER_ID = " + req.session.user.user_id);
//     const query = `
//     UPDATE
//         users
//     SET
//         school_email = $1,
//         linkedin = $2,
//         phone = $3,
//         professional_email = $4,
//         personal_email = $5
//     WHERE
//         user_id = $6;`;

//     db.none(query, values)
//         .then((update) => {

//             req.session.save();

//             console.log("\n\nSuccessful Update: \n", req.session.user);
//             res.redirect("/update_profile");
//         })
//         .catch((error) => {
//             console.log("\n\nERROR: ", error.message || error);
//         })

// });
/* School Email ----------------- */
app.post("/update_profile/school_email", (req, res) => {

    const query = `UPDATE users SET school_email = '${req.body.school_email}' WHERE user_id = ${req.session.user.user_id};`;
    db.none(query)
        .then((update) => { req.session.save();
            console.log("\n\nSuccessful Update (SCHOOL EMAIL): \n", req.session.user.username, " TO ", req.body.school_email);
            res.redirect("/update_profile");
        })
        .catch((error) => { console.log("\n\nERROR: ", error.message || error); })
});
/* Personal Email ----------------- */
app.post("/update_profile/personal_email", (req, res) => {

    const query = `UPDATE users SET personal_email = '${req.body.personal_email}' WHERE user_id = ${req.session.user.user_id};`;
    db.none(query)
        .then((update) => { req.session.save();
            console.log("\n\nSuccessful Update (PERSONAL EMAIL): \n", req.session.user.username, " TO ", req.body.personal_email);
            res.redirect("/update_profile");
        })
        .catch((error) => { console.log("\n\nERROR: ", error.message || error); })
});
/* Professional Email ----------------- */
app.post("/update_profile/professional_email", (req, res) => {

    const query = `UPDATE users SET professional_email = '${req.body.professional_email}' WHERE user_id = ${req.session.user.user_id};`;
    db.none(query)
        .then((update) => { req.session.save();
            console.log("\n\nSuccessful Update (PROFESSIONAL EMAIL): \n", req.session.user.username, " TO ", req.body.professional_email);
            res.redirect("/update_profile");
        })
        .catch((error) => { console.log("\n\nERROR: ", error.message || error); })
});
/* LinkedIn ----------------- */
app.post("/update_profile/linkedin", (req, res) => {

    const query = `UPDATE users SET linkedin = '${req.body.linkedin}' WHERE user_id = ${req.session.user.user_id};`;
    db.none(query)
        .then((update) => { req.session.save();
            console.log("\n\nSuccessful Update (LINKEDIN): \n", req.session.user.username, " TO ", req.body.linkedin);
            res.redirect("/update_profile");
        })
        .catch((error) => { console.log("\n\nERROR: ", error.message || error); })
});
/* Phone Number ----------------- */
app.post("/update_profile/phone", (req, res) => {

    const query = `UPDATE users SET phone = '${req.body.phone}' WHERE user_id = ${req.session.user.user_id};`;
    db.none(query)
        .then((update) => { req.session.save();
            console.log("\n\nSuccessful Update (PHONE): \n", req.session.user.username, " TO ", req.body.phone);
            res.redirect("/update_profile");
        })
        .catch((error) => { console.log("\n\nERROR: ", error.message || error); })
});
/* -----------------------------------------------------------------------------------  */
/*                                  BIO                                             */
/* -----------------------------------------------------------------------------------  */
app.post("/update_profile/bio", (req, res) => {

    const values = [req.body.bio, req.session.user.user_id];

    console.log("USER_ID = " + req.session.user.user_id);
    const query = `
    UPDATE
        users
    SET
        bio = $1
    WHERE
        user_id = $2;`;

    db.none(query, values)
        .then((update) => {

            req.session.save();

            console.log("\n\nSuccessful Update: \n", req.session.user);
            res.redirect("/update_profile");
        })
        .catch((error) => {
            console.log("\n\nERROR: ", error.message || error);
        })

});
/* -----------------------------------------------------------------------------------  */
/*                                  CONTACT                                             */
/* -----------------------------------------------------------------------------------  */
/* UPDATE HOBBY 1 -------------------------------------------------------------------- */
app.post("/update_profile/hobby1", upload.single('h1_img') ,(req, res) => {   /* UPLOAD PARAMETER ALLOWS FOR DATABASE UPLOAD */

    const values = [req.body.hobby1, req.body.h1_caption, req.file.buffer.toString('base64'), req.session.user.user_id];

    console.log("USER_ID = " + req.session.user.user_id);
    const query = `
    UPDATE
        users
    SET
        hobby1 = $1,
        h1_caption = $2,
        h1_img = $3
    WHERE
        user_id = $4;`;

    db.none(query, values)
        .then((update) => {

            req.session.save();

            console.log("\n\nSuccessful Profile Picture Update: \n", req.session.user);
            res.redirect("/update_profile");
        })
        .catch((error) => {
            console.log("\n\nERROR: ", error.message || error);
        })

});
/* UPDATE HOBBY 2 -------------------------------------------------------------------- */
app.post("/update_profile/hobby2", upload.single('h2_img') ,(req, res) => {   /* UPLOAD PARAMETER ALLOWS FOR DATABASE UPLOAD */

    const values = [req.body.hobby2, req.body.h2_caption, req.file.buffer.toString('base64'), req.session.user.user_id];

    console.log("USER_ID = " + req.session.user.user_id);
    const query = `
    UPDATE
        users
    SET
        hobby2 = $1,
        h2_caption = $2,
        h2_img = $3
    WHERE
        user_id = $4;`;

    db.none(query, values)
        .then((update) => {

            req.session.save();

            console.log("\n\nSuccessful Profile Picture Update: \n", req.session.user);
            res.redirect("/update_profile");
        })
        .catch((error) => {
            console.log("\n\nERROR: ", error.message || error);
        })

});
/* UPDATE HOBBY 1 -------------------------------------------------------------------- */
app.post("/update_profile/hobby3", upload.single('h3_img') ,(req, res) => {   /* UPLOAD PARAMETER ALLOWS FOR DATABASE UPLOAD */

    const values = [req.body.hobby3, req.body.h3_caption, req.file.buffer.toString('base64'), req.session.user.user_id];

    console.log("USER_ID = " + req.session.user.user_id);
    const query = `
    UPDATE
        users
    SET
        hobby3 = $1,
        h3_caption = $2,
        h3_img = $3
    WHERE
        user_id = $4;`;

    db.none(query, values)
        .then((update) => {

            req.session.save();

            console.log("\n\nSuccessful Profile Picture Update: \n", req.session.user);
            res.redirect("/update_profile");
        })
        .catch((error) => {
            console.log("\n\nERROR: ", error.message || error);
        })

});
/* UPDATE BACKGROUND -------------------------------------------------------------------- */
app.post("/update_profile/background", (req, res) => {   /* UPLOAD PARAMETER ALLOWS FOR DATABASE UPLOAD */

    const values = [req.body.background, req.session.user.user_id];

    console.log("USER_ID = " + req.session.user.user_id);
    const query = `
    UPDATE
        users
    SET
        background = $1
    WHERE
        user_id = $2;`;

    db.none(query, values)
        .then((update) => {

            req.session.save();

            console.log("\n\nSuccessful Profile Picture Update: \n", req.session.user);
            res.redirect("/update_profile");
        })
        .catch((error) => {
            console.log("\n\nERROR: ", error.message || error);
        })

});
/* UPDATE PROFILE -------------------------------------------------------------------- */
app.post("/update_profile/preferences", (req, res) => {

    const values = [req.body.likes, req.body.dislikes, req.body.quote, req.body.aspirations, req.session.user.user_id];

    console.log("USER_ID = " + req.session.user.user_id);
    const query = `
    UPDATE
        users
    SET
        likes = $1,
        dislikes = $2,
        quote = $3,
        aspirations = $4
    WHERE
        user_id = $5;`;

    db.none(query, values)
        .then((update) => {

            req.session.save();

            console.log("\n\nSuccessful Update: \n", req.session.user);
            res.redirect("/update_profile");
        })
        .catch((error) => {
            console.log("\n\nERROR: ", error.message || error);
        })

});
/* UPDATE PROFILE -------------------------------------------------------------------- */
app.post("/update_profile/fav_interview", upload.single('fav_interview_img'), (req, res) => {

    const values = [req.body.fav_interview_brother, req.body.fav_interview_caption, req.file.buffer.toString('base64'), req.session.user.user_id];

    console.log("USER_ID = " + req.session.user.user_id);
    const query = `
    UPDATE
        users
    SET
        fav_interview_brother = $1,
        fav_interview_caption = $2,
        fav_interview_img = $3
    WHERE
        user_id = $4;`;

    db.none(query, values)
        .then((update) => {

            req.session.save();

            console.log("\n\nSuccessful Update: \n", req.session.user);
            res.redirect("/update_profile");
        })
        .catch((error) => {
            console.log("\n\nERROR: ", error.message || error);
        })

});
/* UPDATE PROFILE -------------------------------------------------------------------- */
app.post("/update_profile/basic-admin", (req, res) => {

    const edit_id = parseInt(req.body.edit_id);
    const values = [req.body.class, req.body.major, req.body.committee, edit_id];

    console.log("USER_ID = " + req.body.edit_id);
    const query = `
    UPDATE
        users
    SET
        class = $1,
        major = $2,
        committee = $3
    WHERE
        user_id = $4;`;

    db.none(query, values)
        .then((update) => {

            req.session.save();

            console.log("\n\nSuccessful Update: \n", req.session.user);
            res.redirect("/admin/edit_user");
        })
        .catch((error) => {
            console.log("\n\nERROR: ", error.message || error);
        })

});
/* UPDATE PROFILE PICTURE -------------------------------------------------------------------- */
app.post("/update_profile/picture-admin", upload.single('profile_img') ,(req, res) => {   /* UPLOAD PARAMETER ALLOWS FOR DATABASE UPLOAD */

    const edit_id = parseInt(req.body.edit_id);
    const values = [req.file.buffer.toString('base64'), edit_id];

    console.log("USER_ID = " + req.body.edit_id);
    const query = `
    UPDATE
        users
    SET
        pfp_img = $1
    WHERE
        user_id = $2;`;

    db.none(query, values)
        .then((update) => {

            req.session.save();

            console.log("\n\nSuccessful Profile Picture Update: \n", req.session.user);
            res.redirect("/admin/edit_user");
        })
        .catch((error) => {
            console.log("\n\nERROR: ", error.message || error);
        })

});
/* UPDATE PROFILE -------------------------------------------------------------------- */
app.post("/update_profile/contact-admin", (req, res) => {

    const edit_id = parseInt(req.body.edit_id);
    const values = [req.body.email, req.body.linkedin, req.body.phone, edit_id];

    console.log("USER_ID = " + edit_id);
    const query = `
    UPDATE
        users
    SET
        email = $1,
        linkedin = $2,
        phone = $3
    WHERE
        user_id = $4;`;

    db.none(query, values)
        .then((update) => {

            req.session.save();

            console.log("\n\nSuccessful Update: \n", req.session.user);
            res.redirect("/admin/edit_user");
        })
        .catch((error) => {
            console.log("\n\nERROR: ", error.message || error);
        })

});
/* UPDATE USER DATABASE POST INTERVIEW SUBMISSION --------------------------------------------------------- */
app.post("/update_users", (req, res) => {

    const values = [req.session.user.brother_interviews, req.session.user.pfp_img, req.session.user.points];
    const query = `
    UPDATE
        users
    SET
        brother_interviews = $1,
        pfp_img = $2,
        points = $3
    WHERE
        user_id = ${req.session.user.user_id};`;

    db.none(query, values)
        .then((update) => {
            console.log("\n\nRoute Success: '/update_users' \n");
            res.redirect("/profile");
        })
        .catch((error) => {
            console.log("\n\nERROR: ", error.message || error);
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
            console.log(community);
            res.render("pages/community", {community});
        })
        .catch((error) => {
            console.log("\n\nERROR: ", error.message || error);
        })
    
});
/* GET BRIDGE -------------------------------------------------------------------- */
app.get("/bridge", (req, res) => {

    const query = `SELECT * FROM users WHERE user_id = ${req.session.user.user_id};`;

    db.any(query)
        .then((bridge) => {
            res.render("pages/bridge", {bridge});
        })
        .catch((error) => {
            console.log("\n\nERROR: ", error.message || error);
        })
    
});
/* SUBMIT_INTERVIEW PAGE --------------------------------------------------------- */
app.get("/submit_interview", (req, res) => {

    const query = `SELECT * FROM users WHERE username = $1;`;

    db.any(query, [req.session.user.username])
        .then((bridge) => {
            res.render("pages/submit_interview", {bridge});
        })
        .catch((error) => {
            console.log("\n\nERROR: ", error.message || error);
        })
});
/* SUBMIT_INTERVIEW PAGE -------------------------------------------------------- */
app.get("/submit_networking", (req, res) => {

    const query = `SELECT * FROM users WHERE username = $1;`;

    db.any(query, [req.session.user.username])
        .then((bridge) => {
            res.render("pages/submit_networking", {bridge});
        })
        .catch((error) => {
            console.log("\n\nERROR: ", error.message || error);
        })
});
/* GET INTERVIEWS -------------------------------------------------------------------- */
app.get("/interviews", (req, res) => {

    const query = `SELECT * FROM brother_interviews WHERE username = '${req.session.user.username}';`;

    db.any(query, [req.session.user.username])
        .then((brothers) => {
            res.render("pages/interviews", {brothers});
        })
        .catch((error) => {
            console.log("\n\nERROR: ", error.message || error);
        })
});
/* SUBMIT BROTHER INTERVIEW ---------------- */
app.post("/submit_interview/post", upload.single('proof'), (req, res) => {

    const query = `
    INSERT INTO
        brother_interviews(username, brother, family, proof)
    VALUES
        ('${req.session.user.username}', $1, $2, $3);`;

    db.none(query, [req.body.brother, req.body.family, req.file.buffer.toString('base64')])
        .then((update) => {

            /* INDICATE SESSION INCRIMENT -- Updated later -> /update_users */
            req.session.user.brother_interviews = req.session.user.brother_interviews + 1;
            req.session.user.points = req.session.user.points + 2;
            req.session.save();

            console.log("\n\nSuccessful Interview Submission: \n");

            res.redirect("/interviews");
        })
        .catch((error) => {
            console.log("\n\nERROR: ", error.message || error);
        })

});
/* GET BRIDGE -------------------------------------------------------------------- */
app.get("/networking", (req, res) => {

    const query = `SELECT * FROM networking_groups WHERE username = '${req.session.user.username}';`;

    db.any(query, [req.session.user.username])
        .then((net_groups) => {
            res.render("pages/networking", {net_groups});
        })
        .catch((error) => {
            console.log("\n\nERROR: ", error.message || error);
        })
});
/* SUBMIT NETWORKING GROUP ---------------- */
app.post("/submit_networking/post", upload.single('proof'), (req, res) => {

    const query = `
    INSERT INTO
        networking_groups(username, group_week, proof)
    VALUES
        ('${req.session.user.username}', $1, $2);`;

    db.none(query, [req.body.group_week, req.file.buffer.toString('base64')])
        .then((update) => {

            req.session.user.points = req.session.user.points + 2;
            req.session.save();

            console.log("\n\nSuccessful Networking Group Submission: \n");
            res.redirect("/networking");
        })
        .catch((error) => {
            console.log("\n\nERROR: ", error.message || error);
        })

});
/* GET RANKING -------------------------------------------------------------------- */
app.get("/ranking", (req, res) => {

    const query = `SELECT * FROM users ORDER BY points DESC;`;

    db.any(query)
        .then((ranking) => {
            res.render("pages/ranking", {ranking});
        })
        .catch((error) => {
            console.log("\n\nERROR: ", error.message || error);
        })
    
});
/* ------------------------------------------------------------------------------------ */
app.get("/admin", (req, res) => {

    if(req.session.user.admin === 'false') {
        res.redirect("pages/home");
    }
    
    const query = `SELECT * FROM users ORDER BY users.user_id ASC;`;

    db.any(query)
        .then((admin) => {
            
            res.render("pages/admin/admin", {
                admin: admin,
                action: "delete",
            });
        })
        .catch((error) => {
            console.log("\n\nERROR: ", error.message || error);
        })
});
/* ------------------------------------------------------------------------------------ */
app.get("/admin/post_announcement", (req, res) => {

    if(req.session.user.admin === 'false') {
        res.redirect("pages/home");
    }
    
    const query = `SELECT * FROM users ORDER BY users.user_id ASC;`;

    db.any(query)
        .then((admin) => {
            
            res.render("pages/admin/post_announcement", {
                admin: admin,
                action: "delete",
            });
        })
        .catch((error) => {
            console.log("\n\nERROR: ", error.message || error);
        })
});
/* ------------------------------------------------------------------------------------ */
app.get("/admin/announcements", (req, res) => {

    if(req.session.user.admin === 'false') {
        res.redirect("pages/home");
    }
    
    const query = `SELECT * FROM announcements ORDER BY announcement_id ASC;`;

    db.any(query)
        .then((admin) => {
            
            res.render("pages/admin/announcements", {
                admin: admin,
                action: "delete",
            });
        })
        .catch((error) => {
            console.log("\n\nERROR: ", error.message || error);
        })
});
/* ------------------------------------------------------------------------------------ */
app.post("/admin/delete-announcement", (req, res) => {

    const query = `SELECT * FROM announcements ORDER BY announcement_id ASC;`

    /* Execute Task */
    db.task("delete-user", (task) => {

        return task.batch([
            db.none(
                `DELETE FROM announcements WHERE announcement_id = $1;`,
                [parseInt(req.body.announcement_id)]
            ), // END OF db.none
            task.any(query, [req.session.user.username])
        ]) //END OF task.batch
    })  // END OF db.task
    .then(([, users]) => {
        console.log("ADMIN:  BATCH SUCCESS\n\n");
        //console.info(users);
        res.redirect("/admin/announcements");
    })
    .catch((err) => {
        console.log(err);
        res.redirect("/admin");
    })
});
/* ------------------------------------------------------------------------------------ */
app.get("/admin/management", (req, res) => {

    if(req.session.user.admin === 'false') {
        res.redirect("pages/home");
    }
    
    const query = `SELECT * FROM users ORDER BY users.user_id ASC;`;

    db.any(query)
        .then((admin) => {
            
            res.render("pages/admin/management", {
                admin: admin,
                action: "delete",
            });
        })
        .catch((error) => {
            console.log("\n\nERROR: ", error.message || error);
        })
});
/* ------------------------------------------------------------------------------------ */
app.post("/admin/delete-user", (req, res) => {

    const query = `SELECT * FROM users ORDER BY users.user_id ASC;`

    /* Execute Task */
    db.task("delete-user", (task) => {

        return task.batch([
            db.none(
                `DELETE FROM users WHERE user_id = $1;`,
                [parseInt(req.body.user_id)]
            ), // END OF db.none
            task.any(query, [req.session.user.username])
        ]) //END OF task.batch
    })  // END OF db.task
    .then(([, users]) => {
        console.log("ADMIN:  BATCH SUCCESS\n\n");
        //console.info(users);
        res.redirect("/admin/management");
    })
    .catch((err) => {
        console.log(err);
        res.redirect("/admin");
    })
});
/* ------------------------------------------------------------------------------------ */
app.get("/admin/interview", (req, res) => {

    if(req.session.user.admin === 'false') {
        res.redirect("pages/home");
    }
    
    const query = `SELECT * FROM brother_interviews ORDER BY interview_id ASC;`;

    db.any(query)
        .then((admin) => {
            
            res.render("pages/admin/interview", {
                admin: admin,
                action: "delete",
            });
        })
        .catch((error) => {
            console.log("\n\nERROR: ", error.message || error);
        })
});
/* ------------------------------------------------------------------------------------ */
app.post("/admin/delete-interview", (req, res) => {

    const query = `SELECT * FROM users ORDER BY users.user_id ASC;`

    /* Execute Task */
    db.task("delete-user", (task) => {

        return task.batch([
            db.none(
                `DELETE FROM brother_interviews WHERE interview_id = $1;`,
                [parseInt(req.body.interview_id)]
            ), // END OF db.none
            task.any(query, [req.session.user.username])
        ]) //END OF task.batch
    })  // END OF db.task
    .then(([, users]) => {
        console.log("ADMIN:  BATCH SUCCESS\n\n");
        //console.info(users);
        res.redirect("/admin/interview");
    })
    .catch((err) => {
        console.log(err);
        res.redirect("/admin");
    })
});
/* SUBMIT ANNOUNCEMENT ---------------- */
app.post("/admin/post_announcement", (req, res) => {

    const query = `
    INSERT INTO
        announcements(time, username, subject, announcement, pfp_img)
    VALUES
        ($1, '${req.session.user.username}', $2, $3, '${req.session.user.pfp_img}');`;

    db.none(query, [req.body.time, req.body.subject, req.body.announcement])
        .then((announcement) => {

            console.log("\n\nSuccessful Announcement \n");
            res.redirect("/home");
        })
        .catch((error) => {
            console.log("\n\nERROR: ", error.message || error);
        })

});
/* ------------------------------------------------------------------------------------ */
app.get("/admin/networking", (req, res) => {

    if(req.session.user.admin === 'false') {
        res.redirect("pages/home");
    }
    
    const query = `SELECT * FROM networking_groups ORDER BY net_id ASC;`;

    db.any(query)
        .then((admin) => {
            
            res.render("pages/admin/networking", {
                admin: admin,
                action: "delete",
            });
        })
        .catch((error) => {
            console.log("\n\nERROR: ", error.message || error);
        })
});
/* ------------------------------------------------------------------------------------ */
app.post("/admin/delete-networking", (req, res) => {

    const query = `SELECT * FROM networking_groups ORDER BY net_id ASC;`

    /* Execute Task */
    db.task("delete-user", (task) => {

        return task.batch([
            db.none(
                `DELETE FROM networking_groups WHERE net_id = $1;`,
                [parseInt(req.body.net_id)]
            ), // END OF db.none
            task.any(query, [req.session.user.username])
        ]) //END OF task.batch
    })  // END OF db.task
    .then(([, users]) => {
        console.log("ADMIN:  BATCH SUCCESS\n\n");
        //console.info(users);
        res.redirect("/admin/networking");
    })
    .catch((err) => {
        console.log(err);
        res.redirect("/admin");
    })
});
/* ------------------------------------------------------------------------------------ */
app.get("/admin/edit_user", (req, res) => {

    if(req.session.user.admin === 'false') {
        res.redirect("pages/home");
    }

    const query = `SELECT * FROM users WHERE user_id = '${req.session.admin.edit_id}';`;

    db.any(query)
        .then((admin) => {
            console.log(admin);
            res.render("pages/admin/edit_user", {
                admin: admin,
            });
        })
        .catch((error) => {
            console.log("\n\nERROR: ", error.message || error);
        })
});
/* ------------------------------------------------------------------------------------ */
app.post("/admin/edit_user/post", (req, res) => {

    if(req.session.user.admin === 'false') {
        res.redirect("pages/home");
    }

    const query = `INSERT INTO admin(edit_id) VALUES ('${req.body.user_id}');`;

    db.any(query)
        .then((rows) => {
            
            req.session.admin.edit_id = req.body.user_id;
            req.session.save();

            res.redirect("/admin/edit_user");
        })
        .catch((error) => {
            console.log("\n\nERROR: ", error.message || error);
        })
});
/* ------------------------------------------------------------------------------------ */
app.listen(3000);
console.log("Server is listening on port 3000\n\n");