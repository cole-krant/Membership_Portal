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



/* UPDATE PROFILE --------------------------------------------------------------------  */
// app.post("/update_profile/preferences", (req, res) => {
//     console.log("USER_ID = " + req.session.user.user_id);
//     const query = `
//     UPDATE
//         users
//     SET
//         likes = $1,
//         dislikes = $2,
//         quote = $3,
//         aspirations = $4
//     WHERE
//         user_id = $5;`;

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

/* UPDATE PROFILE -------------------------------------------------------------------- */
app.post("/update_profile/contact", (req, res) => {

    const values = [req.body.email, req.body.linkedin, req.body.phone, req.body.professional_email, req.body.personal_email, req.session.user.user_id];

    console.log("USER_ID = " + req.session.user.user_id);
    const query = `
    UPDATE
        users
    SET
        school_email = $1,
        linkedin = $2,
        phone = $3,
        professional_email = $4,
        personal_email = $5
    WHERE
        user_id = $6;`;

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