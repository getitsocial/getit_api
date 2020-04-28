import handler, { mediaSettings } from '~/services/mediaupload'
import { BadRequestError } from 'restify-errors'

const allowedFolders = ['article', 'logo', 'user', 'shop']

export const upload = async(req, res, next) => {

    if (!req.files) {
        return next(new BadRequestError('no images attached'))
    }

    // Parse data
    const { folder } = req.params
    
    if (!allowedFolders.includes(folder)) return next(new BadRequestError('invalid folder'))

    const { file } = req.files

    const settings = mediaSettings(folder)

    if (process.env.NODE_ENV !== 'prod') {
        delete settings.crop
    }
    

    try {
        const {
            public_id,
            etag,
            format,
            secure_url,
        } = await handler.v2.uploader.upload(file.path, settings)
        res.json({ id: public_id, etag, format, url: secure_url })

    } catch (error) {
        return next(new BadRequestError(error))
    }
    
}
