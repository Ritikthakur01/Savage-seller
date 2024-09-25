import cloudinary from "../../config/cloudinary";

async function uploadToCloudinary(path) {
    try {
        const resultData = await cloudinary.uploader.upload(path, { folder: 'uploads' });
        return resultData;
    } catch (error) {
        console.error("Error uploading to Cloudinary:", error);
        throw error;
    }
}

export default uploadToCloudinary