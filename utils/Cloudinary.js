const cloudinary = require('cloudinary').v2
require('dotenv').config();
const streamifier = require('streamifier');


cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});

function cloudUpload(fileBuffer) {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { resource_type: 'auto' },
            (error, result) => {
                if (error) {
                    reject(new Error('Cloud upload failed: ' + error.message));
                } else {
                    resolve(result);
                }
            }
        );

        // Pipe the file buffer to Cloudinary
        streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });
}





module.exports = { cloudUpload,
    cloudinary
 };   
