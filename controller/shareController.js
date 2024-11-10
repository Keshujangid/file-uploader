const query = require('../db/query')
const prisma = require('../db/prismaClient')
const { addHours, isAfter } = require('date-fns');


async function createShareLink(req, res, next) {
    const itemId  = req.params.itemId;
    const { duration } = req.body;
    const userId = req.user.id;

    try {
        // Calculate the expiration date and time
        const expiresAt = addHours(new Date(), parseInt(duration, 10));

        // Check if it's a file or folder based on item type
        console.log('itemId:' , itemId)
        const itemType = await query.getItemType(itemId);

        // Create share link in the database
        const shareLink = await prisma.shareLink.create({
            data: {
                expiresAt,
                itemType,
                ownerId: userId,
                directoryId: itemType === 'DIRECTORY' ? itemId : null,
                fileId: itemType === 'FILE' ? itemId : null,
            },
        });

        const linkUrl = `${req.protocol}://${req.get('host')}/share/${shareLink.id}`;

        // Optionally, store or render the generated link for the user
        res.render('share', { linkUrl });
    } catch (error) {
        console.error(error);
        next(error);
    }
}


async function accessSharedItem(req, res, next) {
    const { shareId, dirId, fileId } = req.params;

    try {
        // Find the share link and ensure it hasn't expired
        const shareLink = await prisma.shareLink.findUnique({
            where: { id: shareId },
            include: {
                directory: {
                    include: {
                        children: true,
                        files: true,
                    },
                },
                file: true,
            },
        });

        if (!shareLink || isAfter(new Date(), shareLink.expiresAt)) {
            return res.status(404).send('Link has expired or is invalid.');
        }

        // Determine the current directory (if a directory ID is passed, navigate inside it)
        let currentDirectory;
        if (dirId) {
            // Find the child directory by dirId
            currentDirectory = await prisma.directory.findUnique({
                where: { id: dirId},
                include: {
                    children: true,
                    files: true,
                },
            });

            if (!currentDirectory) {
                return res.status(404).send('Directory not found.');
            }

            // Check if the directory is within the shared directory tree
            const isValidDirectory = await query.validateDirectoryAccess(shareLink.directoryId, currentDirectory.id);
            if (!isValidDirectory) {
                return res.status(403).send('Access denied. This directory is not part of the shared content.');
            }

            // Set breadcrumb path to start from shared directory
            res.locals.breadcrumbPath = await query.getBreadcrumbPath(currentDirectory.id, shareLink.directoryId);
            res.render('openshare', { folderInfo: currentDirectory, shareId });
        } else if (fileId) {
            // If a fileId is passed, render the file
            const file = await query.getFileById(fileId);
            console.log('file:', file)

            const isValidFile = await query.validateFileAccess(shareLink.directoryId, file.id);
            if (!isValidFile) {
                return res.status(403).send('Access denied. This file is not part of the shared content.');
            }

            if (!file) {
                return res.status(404).send('File not found.');
            }

            res.locals.sharedFile = true;
            res.render('file', { fileInfo: file });
        } else {
            // If no specific directory or file is passed, show the root shared directory
            if (shareLink.itemType === 'DIRECTORY') {
                res.locals.breadcrumbPath = await query.getBreadcrumbPath(shareLink.directoryId, shareLink.directoryId);
                res.render('openshare', { folderInfo: shareLink.directory, shareId });
            } else if (shareLink.itemType === 'FILE') {
                res.render('file', { fileInfo: shareLink.file, shareId });
            }
        }
    } catch (error) {
        console.error(error);
        next(error);
    }
}



module.exports = {
    createShareLink,
    accessSharedItem,
}
