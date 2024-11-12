const prisma = require('./prismaClient');
const createError = require('http-errors');
const {cloudUpload} = require('../utils/Cloudinary')
const fs = require('fs')
require('dotenv').config();
const {cloudinary} = require('../utils/Cloudinary');

async function storeUser(userObj, hashedPassword) {
    await prisma.user.create({
        data: {
            name: userObj.name,
            credentials: {
                create: {
                    username: userObj.username,
                    password: hashedPassword

                },
            },
            directories: {
                create: {
                    name: 'root', // The root directory for this user
                    type: 'DIRECTORY',
                    // parentId is null for the root directory
                }
            }

        }
    }
    )
}

async function findUsername(username) {
    const result = await prisma.userCredentials.findUnique({
        where: {
            username: username
        }
    })
    // console.log(result)
    return result;
}

async function findUserById(userId) {
    // console.log('findUserById')

    return await prisma.user.findUnique({
        where: {
            id: userId
        },
        select: {
            id: true,
            name: true,
            createdAt: true
            // updatedAt: true,
        }
    });
}

async function checkUniqueUser(username) {
    const user = await prisma.userCredentials.findUnique({
        where: {
            username: username
        }
    });
    return user !== null;
}

async function getRoot(userId) {
    const user = await prisma.directory.findFirst({
        where: {
            userId: userId,
            parentId: null, // Root directory has no parent
        }
    })
    // console.log('here', user);

    return user;  // Return the user data
}

const createFolder = async (folderName, userId, parentDirectoryId) => {
    // console.log(name,userId,parentId)
    try {
        await prisma.directory.create({
            data: {
                name: folderName, // Folder name
                type: 'DIRECTORY',
                userId: userId, // Associate with the user
                parentId: parentDirectoryId, // Parent directory (could be root or another folder)
            },
        });
    } catch (err) {
        console.error(err);
    }
}

async function checkUniqueFolder(folderName, userId, parentDirectoryId = null) {
    const response = await prisma.directory.findFirst({
        where: {
            name: folderName,
            userId: userId,
            parentId: parentDirectoryId
        }
    });
    return response !== null;
}

async function verifyUserFolder(userId, folderId) {
    try {
        // console.log('verifyUserFolder - userId:', userId, 'folderId:', folderId);
        const folder = await prisma.directory.findUnique({
            where: {
                id: folderId
            },
            select: {
                userId: true
            }
        });

        if (!folder || folder.userId !== userId) {
            console.log(`Folder with ID ${folderId} not found.`);
            throw createError(404, `Folder with ID ${folderId} not found.`);
        }

        // console.log(userId, folderId);
        return true;
    } catch (error) {
        console.error(`Error verifying user folder:`, error);
        throw error;
    }
}

async function verifyUserFile(userId, fileId) {
    try {
        // console.log('verifyUserFile - userId:', userId, 'fileId:', fileId);
        const file = await prisma.file.findUnique({
            where: {
                id: fileId
            },
            select: {
                directory: {
                    select: {
                        userId: true
                    }
                }
            }
        });

        if (!file || file.directory.userId !== userId) {
            console.log(`File with ID ${fileId} not found.`);
            throw createError(404, `File with ID ${fileId} not found.`);
        }

        console.log(userId, fileId);
        return true;
    } catch (error) {
        console.error(`Error verifying user file:`, error);
        throw error;
    }
}

async function getFolderContent(folderId) {
    return await prisma.directory.findUnique({
        where: {
            id: folderId
        },
        include: {
            files: true,
            children: true
        }
    });
}

// Query to store file in the database

const storeFileInDB = async (directoryId, file) => {
    const { filename, filepath, fileType,mimetype, size,resourceType,downloadUrl ,cloudinaryPulicId} = file;
    console.log('storeFileInDB', directoryId, file);

    try {
        if (!directoryId) {
            throw new Error("Directory ID is required.");
        }


        const uploadedFile = await prisma.file.create({
            data: {
                filename: filename,
                filepath: filepath, // Cloudinary URL
                fileType: fileType,
                resourceType: resourceType,
                cloudinaryPulicId: cloudinaryPulicId,
                size: size,
                downloadUrl: downloadUrl,
                directoryId: directoryId, // Ensure directoryId is an integer
                createdAt: new Date(),
            }
        });

        return uploadedFile;
    } catch (err) {

        console.error('Error storing file in DB:', err);
        throw err;
    }
};



async function getFileById(fileId) {
    try {
        console.log(fileId)
        const file = await prisma.file.findUnique({
            where: { id: fileId },
            select: {
                id: true,
                filename: true,
                filepath: true,
                fileType: true,
                createdAt: true,
                resourceType: true,
                cloudinaryPulicId: true,
                downloadUrl: true,
                directoryId: true,
                directory: {   // Select the related directory and only the userId from it
                    select: {
                        userId: true
                    }
                }
            },
            
        });
        return file;
        
    } catch (error) {
        console.error("Error retrieving file:", error);
        throw new Error("File retrieval failed");
    }
}


async function getBreadcrumbPath(directoryId, startDirectoryId = null) {
    const path = [];
    let currentDirId = directoryId;

    while (currentDirId) {
        const directory = await prisma.directory.findUnique({
            where: { id: currentDirId },
            select: { id: true, name: true, parentId: true },
        });

        if (!directory || (startDirectoryId && currentDirId === startDirectoryId)) break;

        // Add directory to the path array
        path.unshift(directory); // Build root-first order
        currentDirId = directory.parentId; // Move up the hierarchy
    }

    return path;
}
// query.js




async function getItemType(itemId) {
    
    const directory = await prisma.directory.findUnique({ where: { id: itemId } });
    if (directory) return 'DIRECTORY';

    const file = await prisma.file.findUnique({ where: { id: itemId } });
    if (file) return 'FILE';

    throw new Error('Item not found');
}

async function validateFileAccess(rootDirectoryId, fileId) {
    const rootDirectory = await prisma.directory.findUnique({
        where: { id: rootDirectoryId },
        include: { files: true, children: true }
    });

    if (!rootDirectory) {
        return false;
    }

    // Check if the file is directly in this directory
    if (rootDirectory.files.some(file => file.id === fileId)) {
        return true;
    }

    // Recursively check in subdirectories
    for (const child of rootDirectory.children) {
        const isValid = await validateFileAccess(child.id, fileId);
        if (isValid) {
            return true;
        }
    }

    return false;
}

async function validateDirectoryAccess(rootDirectoryId, targetDirectoryId) {
    if (rootDirectoryId === targetDirectoryId) {
        return true;
    }

    const rootDirectory = await prisma.directory.findUnique({
        where: { id: rootDirectoryId },
        include: { children: true }
    });

    if (!rootDirectory) {
        return false;
    }

    // Recursively check if the targetDirectoryId is one of the children or their descendants
    for (const child of rootDirectory.children) {
        const isValid = await validateDirectoryAccess(child.id, targetDirectoryId);
        if (isValid) {
            return true;
        }
    }

    return false;
}

async function updateFolderName(folderId, folderName) {
    try {
        folderId = folderId;

        const folder = await prisma.directory.findUnique({
            where: { id: folderId }
        });
        if (folder.parentId===null) {
            throw new Error('Root folder cannot be renamed');
        }
        await prisma.directory.update({
            where: { id: folderId },
            data: { name: folderName }
        });
    }
    catch (error) {
        console.error(`Error updating folder name:`, error);
        throw error;
    }
}

async function updateFileName(fileId , fileName) {
    try {
        fileId = fileId;
        await prisma.file.update({
            where: { id: fileId },
            data: { filename: fileName }
        });
    }
    catch (error) {
        console.error(`Error updating file name:`, error);
        throw error;
    }
    
}


async function deleteFile(fileId) {
    return prisma.file.delete({
        where: { id: fileId },
    });
}
async function deleteFolderAndContents(folderId) {
    // Helper function to recursively delete all nested files and folders
    async function deleteRecursively(currentFolderId) {
        // Delete files in the current folder
        const files = await prisma.file.findMany({
            where: { directoryId: currentFolderId },
        });

        // Delete each file from Cloudinary and the database
        for (const file of files) {
            if (file && file.cloudinaryPulicId) {
                await cloudinary.uploader.destroy(file.cloudinaryPulicId, { resource_type: file.resourceType });
            }
            await prisma.file.delete({
                where: { id: file.id },
            });
        }

        // Find and delete all subfolders within the current folder
        const subfolders = await prisma.directory.findMany({
            where: { parentId: currentFolderId },
            select: { id: true },
        });

        // Recursively delete each subfolder and its contents
        for (const subfolder of subfolders) {
            await deleteRecursively(subfolder.id);
        }

        // Finally, delete the current folder itself
        await prisma.directory.delete({
            where: { id: currentFolderId },
        });
    }

    // Start recursive deletion from the specified folder
    await deleteRecursively(folderId);
}

module.exports = {
    storeUser,
    findUsername,
    findUserById,
    checkUniqueUser,
    getRoot,
    createFolder,
    checkUniqueFolder,
    verifyUserFolder,
    verifyUserFile,
    getFolderContent,
    storeFileInDB,
    getFileById,
    getBreadcrumbPath,
    getItemType,
    validateFileAccess,
    validateDirectoryAccess,
    updateFolderName,
    updateFileName,
    deleteFolderAndContents,
    deleteFile
}