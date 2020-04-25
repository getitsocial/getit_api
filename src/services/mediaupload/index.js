import cloudinary from 'cloudinary'
import { cloudinaryConfig } from '~/config'

// Cloudinary configuration
cloudinary.config(cloudinaryConfig)

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
