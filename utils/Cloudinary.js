const cloudinary = require('cloudinary').v2
const fs = require('fs')
require('dotenv').config();


cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});

async function cloudUpload(filePath) {
    try {
        if (!filePath) return null;

        const uploadResult = await cloudinary.uploader.upload(
            filePath, {
                resource_type : "auto"
            }
        )
        return uploadResult
    } catch (error) {
        throw error.message;
        
        // return null;     
    }
}




module.exports = { cloudUpload,
    cloudinary
 };   
