const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const query = require('../db/query');


passport.use(new LocalStrategy(
    {
        usernameField: 'username', 
        passwordField: 'password',
    },
    async (username, password, done) => {
        try {
            // Fetch user credentials from the database
            const userCredentials = await query.findUsername(username);

            if (!userCredentials) {
                return done(null, false, { message: 'Incorrect username' });
            }

            // Compare the password using bcrypt
            const isMatch = await bcrypt.compare(password, userCredentials.password);
            if (!isMatch) {
                return done(null, false, { message: 'Incorrect password' });
            }

            const user = await query.findUserById(userCredentials.userId); 
            // console.log(user);

            return done(null, user, { message: 'Welcome back!' });
        } catch (err) {
            return done(err);
        }
    }
));

// Serialize user to store user ID in session
passport.serializeUser((user, done) => {
    done(null, user.id); 
});

// Deserialize user to retrieve full user data from session ID
passport.deserializeUser(async (id, done) => {
    try {

        const user = await query.findUserById(id); 

        if (user) {
            delete user.password; // Ensure password is not part of the user object
        }

        done(null, user);
    } catch (err) {
        done(err);
    }
});

module.exports = passport;
