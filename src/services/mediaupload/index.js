import cloudinary from 'cloudinary'

// Cloudinary configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

export const mediaSettings = (folder) => ({
    tags: ['bucket', 'temporary'],
    folder,
    use_filename: false,
    crop: 'imagga_scale',
    secure: true,
    width: 1000,
    height: 1000,
})

export default cloudinary
