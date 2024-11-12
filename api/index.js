const express = require("express");
const expressSession = require("express-session");
const { PrismaSessionStore } = require('@quixo3/prisma-session-store');
const { PrismaClient } = require('@prisma/client');
const passport = require('../middleware/passport');
const path = require('path');
// const route = require('./routes/route');
const authRoutes = require('../routes/auth');
const driveRoutes = require('../routes/drive');
const shareRoutes = require('../routes/share');
const flash = require('connect-flash');

const app = express();




// Set view engine
app.set("views", path.join(__dirname, "../views")); // Update path
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, '../public')));


app.use(
    expressSession({
        cookie: {
            maxAge: 7 * 24 * 60 * 60 * 1000 // ms
        },
        secret: 'a santa at nasa',
        resave: true,
        saveUninitialized: true,
        store: new PrismaSessionStore(
            new PrismaClient(),
            {
                checkPeriod: 2 * 60 * 1000,  //ms
                dbRecordIdIsSessionId: true,
                dbRecordIdFunction: undefined,
            }
        )
    })
);

app.use(flash());

// Parsing middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());


// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Make the current user available globally in views
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    // console.log('here',req.user);
    next();
});



app.use('/', authRoutes);         // Authentication routes
app.use('/drive', driveRoutes);   // Drive routes
app.use('/share', shareRoutes);   // Share routes




app.use((err, req, res, next) => {
    // console.error(err.stack);
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on PORT ${PORT}`));