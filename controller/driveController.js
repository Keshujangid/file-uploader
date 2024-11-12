const prisma = require('../db/prismaClient')
const query = require('../db/query');
const {cloudinary, cloudUpload} = require('../utils/Cloudinary');
const streamifier = require('streamifier');

async function getDrive(req, res) {
    if (req.isAuthenticated()) {
        const rootDir = await query.getRoot(req.user.id);
        if (rootDir) {
            res.redirect(`/drive/${rootDir.id}`);
        } else {
            res.status(404).json({ message: "Root directory not found" });
        }
    } else {
        res.redirect('/login');
    }
}

// Function to handle file upload, either inside a directory or not
async function uploadFile(req, res, next) {
    try {
        if (!req.isAuthenticated()) {
            return res.redirect('/login')
        }
        const { dirId } = req.params; 
        const userId = req.user.id; 
        const file = req.file; 

        if (!file) {
            res.status(400).send("No file uploaded.");
            return;
        }

        let directoryId = dirId ? dirId : null;

        // If no directoryId is provided (user is in the root directory), fetch the root directory
        if (!directoryId) {
            res.redirect('/drive')
        }
        const isOwner = await query.verifyUserFolder(userId, directoryId);
        if (!isOwner) {
            return res.redirect('/drive');
        }
        const result = await cloudUpload(req.file.buffer);


        const fileData = {filename: file.originalname, filepath: result.secure_url, userId: userId, directoryId: directoryId, cloudinaryPulicId: result.public_id,size:file.size,fileType:file.mimetype ,resourceType: result.resource_type,downloadUrl:result.secure_url}
        await query.storeFileInDB(directoryId, fileData)
        // console.log('fileData', fileData)
        req.flash('success', 'File uploaded successfully');
        res.redirect(`/drive/${directoryId}`);
    } catch (error) {
        console.error("File upload error:", error);
        req.flash('error', error);
        res.redirect('/drive');
        // next(error); // Pass the error to the next middleware for handling
    }
}



async function createFolder(req, res, next) {
    try {

        const { folderName } = req.body; // parentId will hold the current directory's ID, can be null for root
        const parentDirectoryId = req.params.parentDir;
        // Determine the parent directory for the new folder
        const userId = req.user.id;

        // Fetch the user's root directory if no parentId is provided
        if (!parentDirectoryId) {
            return res.redirect('/drive')
        }
        if (!query.verifyUserFolder(userId, parentDirectoryId)) {
            console.log('user has no dir')
            res.redirect('/drive')
        }

        await query.createFolder(folderName, userId, parentDirectoryId);

        // Redirect the user to the parent directory after creating the folder
        res.redirect(`/drive/${parentDirectoryId}`);
    } catch (error) {
        // console.error(error);
        next(error);
    }
}


async function getFolder(req, res, next) {

    if (!req.isAuthenticated()) {
        return res.redirect('/login');
    }
    const folderId = req.params.dirId;
    try {
        // Check if the folderId belongs to the user
        const isOwner = await query.verifyUserFolder(req.user.id, folderId);
        if (!isOwner) {
            return res.redirect('/drive');
        }

        const folderInfo = await query.getFolderContent(folderId);
        res.locals.breadcrumbPath = await query.getBreadcrumbPath(folderId);

        res.render('folder', { folderInfo: folderInfo, messages: req.flash() });
    } catch (error) {
        next(error); // Pass the error to the error-handling middleware
    }
}

async function deleteItem(req, res, next) {
    const itemId = req.params.itemId;
    const itemType = req.params.itemType;

    try {
        let isOwner;

        if (itemType === 'folder') {
            isOwner = await query.verifyUserFolder(req.user.id, itemId);
            if (!isOwner) {
                return res.redirect('/drive');
            }

            // Delete folder and its contents (if any)
            await query.deleteFolderAndContents(itemId);

        } else if (itemType === 'file') {
            isOwner = await query.verifyUserFile(req.user.id, itemId);
            if (!isOwner) {
                return res.redirect('/drive');
            }
            const file = await query.getFileById(itemId); // Fetch file information
            if (file && file.filepath) {
               const result = await cloudinary.uploader.destroy(file.cloudinaryPulicId, { resource_type: file.resourceType });
               console.log(result)
            }

            // Delete file record from the database
            await query.deleteFile(itemId);
        } else {
            return res.status(400).send("Invalid item type.");
        }

        res.redirect('/drive'); 
    } catch (error) {
        console.error(error);
        next(error);
    }
}


async function openFile(req, res, next) {
    try {
        // console.log(req.isAuthenticated())
        if (!req.isAuthenticated()) {
            return res.redirect('/login')
        }
        const fileId = req.params.fileId;
        // console.log('fileId',fileId)


        // Retrieve file information from the database
        const file = await query.getFileById(fileId);

        if (file.directory.userId !== req.user.id) {
            return res.status(404).send("File not found.");
        }

        if (!file) {
            return res.status(404).send("File not found.");
        }
        // res.locals.breadcrumbPath = await query.getBreadcrumbPath(folderId);
        res.render('file', { fileInfo: file })
    } catch (error) {
        console.error("Error in file download:", error);
        next(error);
    }
}

// Render the edit form
async function getEditItem(req, res) {
    const itemId = req.params.itemId; // Using a general `itemId` for both folders and files
    const itemType = req.params.itemType;

    try {
        if (!req.isAuthenticated()) {
            return res.redirect('/login');
        }

        let item, isOwner;

        if (itemType === 'folder') {
            isOwner = await query.verifyUserFolder(req.user.id, itemId);
            if (!isOwner) {
                return res.redirect('/drive');
            }
            item = await prisma.directory.findUnique({
                where: { id: itemId },
                select: { id: true, name: true, parentId: true }
            });
            if (!item) {
                return res.status(404).send("Folder not found.");
            }
            if (item.parentId === null) {
                req.flash('error', 'Root folder cannot be renamed');
                return res.redirect('/drive')
            }
            res.render('editItem', { item, itemType: 'folder' });

        } else if (itemType === 'file') {
            isOwner = await query.verifyUserFile(req.user.id, itemId);
            if (!isOwner) {
                return res.redirect('/drive');
            }
            item = await prisma.file.findUnique({
                where: { id: itemId },
                select: { id: true, filename: true }
            });
            if (!item) {
                return res.status(404).send("File not found.");
            }
            res.render('editItem', { item, itemType: 'file' });
        } else {
            return res.status(400).send("Invalid item type.");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("An error occurred.");
    }
}



async function postEditItem(req, res, next) {
    // console.log('postEditItem')
    const itemId = req.params.itemId;
    const itemType = req.params.itemType;
    const { itemName } = req.body; // Using a general itemName for both folderName and filename

    try {
        let isOwner;

        if (itemType === 'folder') {
            isOwner = await query.verifyUserFolder(req.user.id, itemId);
            if (!isOwner) {
                return res.redirect('/drive');
            }

            // Update the folder name
            await query.updateFolderName(itemId, itemName);
            console.log('folder updated')

        } else if (itemType === 'file') {
            isOwner = await query.verifyUserFile(req.user.id, itemId);
            if (!isOwner) {
                return res.redirect('/drive');
            }

            // Update the filename
            await query.updateFileName(itemId, itemName);
        } else {
            return res.status(400).send("Invalid item type.");
        }

        res.redirect('/drive');
    } catch (error) {
        console.error(error);
        next(error);
    }
}



module.exports = {
    getDrive,
    uploadFile,
    createFolder,
    getFolder,
    deleteItem,
    openFile,
    getEditItem,
    postEditItem,
    
}