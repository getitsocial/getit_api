import cloudinary from 'cloudinary'
import { cloudinaryConfig } from '~/config'

// Cloudinary configuration
cloudinary.config(cloudinaryConfig)

export const mediaSettings = (folder) => ({
    tags: ['bucket', 'temporary'],
    folder,
    use_filename: false,
    crop: 'imagga_crop',
    secure: true,
    width: 1000,
    sign_url: true,
    height: 1000
})

export const uploadToCloudinary = (image, options) => {
    return new Promise((resolve, reject) => {
        cloudinary.v2.uploader.upload(image, options, (err, url) => {
            if (err) return reject(err)
            return resolve(url)
        })
    })
}
export default cloudinary
