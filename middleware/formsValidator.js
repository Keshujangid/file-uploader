const { check, validationResult } = require("express-validator");
const query = require('../db/query')


const loginValidator = [
    // Check if the username is provided and is not empty
    check('username')
        .notEmpty().withMessage('Username is required.').toLowerCase()
        .isLength({ min: 3 }).withMessage('Username must be at least 3 characters long.'),

    // Check if the password is provided and is not empty
    check('password')
        .notEmpty().withMessage('Password is required.')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.'),

    (req, res, next) => {
        // Get validation result
        const errors = validationResult(req);

        // If there are errors, store them in res.locals and re-render the login page
        if (!errors.isEmpty()) {
            res.locals.errors = errors.array(); // Pass errors to the view
            return res.render('login', {
                errors: res.locals.errors,
                formData: req.body, // Send back the input data the user entered
            });
        }

        // If no errors, proceed to the next middleware
        next();
    }
];

const validateSignUp = [
    // // Define validation rules
    check('name').trim().isLength({ min: 3 }).withMessage('Name must be at least 3 characters long').isAlpha().withMessage('Name should only contain letters').escape(),
    check('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters long').toLowerCase().notEmpty().withMessage('Username is required').escape(),
    check('password').trim().isLength({ min: 6 }).withMessage('Password must be at least 6 characters long').escape(),
    check('confirmpassword')
        .trim()
        .isLength({ min: 6 })
        .withMessage('Password confirmation must be at least 6 characters long')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Password confirmation does not match password');
            }
            return true;
        }),

    // Middleware function to check validation result
    async (req, res, next) => {
        const errors = validationResult(req);

        const response = await query.checkUniqueUser(req.body.username)
        if (response) {
            errors.errors.push({ msg: 'Username already exists' })
        }

        if (!errors.isEmpty()) {
            res.locals.errors = errors.array(); // Pass errors to the view

            // Render the sign-up page with errors and the form data
            return res.render('signup', {
                errors: res.locals.errors,
                formData: req.body, // Send back the input data the user entered
            });
        }

        // If no errors, proceed to next middleware

        next();
    }
];

const validateFolderInputs = [
    // Conditional Validation for folderName (only if present in the request)
    (req, res, next) => {
        if (req.body.folderName !== undefined) {
            check('folderName')
                .trim()
                .notEmpty()
                .withMessage('Folder Name is required')
                .escape()
                .custom(value => {
                    if (value.trim() === '') {
                        throw new Error('Folder Name cannot be empty or just spaces');
                    }
                    return true;
                })(req, res, next);
        } else {
            next();
        }
    },

    // Conditional Validation for itemName (only if present in the request)
    (req, res, next) => {
        if (req.body.itemName !== undefined) {
            check('itemName')
                .trim()
                .notEmpty()
                .withMessage('Updated Folder Name is required')
                .escape()
                .custom(value => {
                    if (value.trim() === '') {
                        throw new Error('Updated Folder Name cannot be empty or just spaces');
                    }
                    return true;
                })(req, res, next);
        } else {
            next();
        }
    },

    // Middleware to handle validation and check uniqueness
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(error => error.msg);
            req.flash('error', errorMessages);
            return res.redirect('back');
        }

        const currentDir = req.session.currentDir;

        // Check if the new folder name is unique (for folder creation)
        if (req.body.folderName) {
            const folderExists = await query.checkUniqueFolder(req.body.folderName, req.user.id, currentDir);
            if (folderExists) {
                req.flash('error', 'Folder already exists');
                return res.redirect('back');
            }
        }

        // Check if the updated folder name is unique (for folder renaming)
        if (req.body.itemName) {
            const updateFolderExists = await query.checkUniqueFolder(req.body.itemName, req.user.id, currentDir);
            if (updateFolderExists) {
                req.flash('error', 'Updated folder name already exists');
                return res.redirect('back');
            }
        }

        next();
    }
];


module.exports = {
    loginValidator,
    validateSignUp,
    validateFolderInputs
}