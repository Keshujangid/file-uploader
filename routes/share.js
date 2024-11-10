
const express = require('express');
const route = express.Router();
const controller = require('../controller/shareController');

route.get('/:shareId', controller.accessSharedItem);
route.get('/:shareId/dir/:dirId', controller.accessSharedItem); // To access shared subdirectories
route.get('/:shareId/file/:fileId', controller.accessSharedItem); // To access shared files


module.exports = route;
