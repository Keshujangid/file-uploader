// routes/drive.js
const express = require('express');
const route = express.Router();
const controller = require('../controller/driveController');
const {createShareLink} = require('../controller/shareController');
const validator = require('../middleware/formsValidator')
const upload = require('../middleware/multer');

const setCurrentDirectory = (req, res, next) => {
    const currentDirId = req.params.dirId; // Assuming dirId is passed as a parameter in the route

    // Check if the user is authenticated
    if (req.isAuthenticated()) {
        // Store current directory in session
        req.session.currentDir = currentDirId || req.session.currentDir; // Update only if dirId is provided
    }
    
    next();
};



route.get('/', controller.getDrive);
route.get('/:dirId', setCurrentDirectory, controller.getFolder);
route.post('/:dirId/upload', upload.fileSizeLimit, upload.upload.single('file'), controller.uploadFile);
route.post('/:parentDir/create-folder',validator.validateFolderInputs,controller.createFolder);
route.get('/file/:fileId', controller.openFile);
route.post('/delete/:itemType/:itemId', controller.deleteItem);
route.post('/:itemId/share', createShareLink);

route.get('/edit/:itemId/:itemType', controller.getEditItem);

route.post('/edit/:itemId/:itemType',validator.validateFolderInputs, controller.postEditItem);




module.exports = route;
