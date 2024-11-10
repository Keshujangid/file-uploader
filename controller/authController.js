const bcrypt = require('bcryptjs')
const query = require('../db/query')
const passport = require('../middleware/passport')
const prisma = require('../db/prismaClient')

function getHome(req, res) {
    if (req.isAuthenticated()) {
        res.redirect('/drive')
    } else {
        res.redirect('/login')
    }
}

function getLogin(req, res) {
    if (req.isAuthenticated()) {
        req.flash('error', 'you are already logIn please logOut first');
        res.redirect('/')
    } else {
        res.render('login', {
            message: null
        });
    }
}
function postLogin(req, res, next) {

    passport.authenticate('local', (err, user, info) => {
        if (err) { return next(err); }
        if (!user) {
            return res.render('login', {
                message: info.message
            });
        }
        req.logIn(user, (err) => {
            if (err) { return next(err); }
            return res.redirect('/drive');
        });
    })(req, res, next);

}

function getSignup(req, res) {
    res.render('signup',{formData: null});
}

async function postSignup(req, res, next) {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        // console.log(hashedPassword)

        await query.storeUser(req.body, hashedPassword)

        res.redirect('/');

    } catch (error) {
        // console.log(error)
        next(error)
    }
}


module.exports = {
    getHome,
    getLogin,
    postLogin,
    getSignup,
    postSignup
}