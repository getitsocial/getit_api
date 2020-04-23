import handler, { mediaSettings } from '~/services/mediaupload'
import { BadRequestError } from 'restify-errors'

export const upload = async(req, res) => {
    if (!req.files) {
        return new BadRequestError()
    }
    // Parse data
    const { folder } = req.params
    const { file } = req.files

    if (!req.files) {
        return new BadRequestError()
    }

    try {
        const {
            public_id,
            etag,
            format,
            secure_url,
        } = await handler.v2.uploader.upload(file.path, mediaSettings(folder))
        res.json({ id: public_id, etag, format, url: secure_url })

    } catch (error) {
        return new BadRequestError(error)
    }
    
}

export const deleteOne = async ({ body: { imageId } }, res) => {
    try {
        await handler.v2.uploader.destroy(imageId)
        res.send()
    } catch (error) {
        return new BadRequestError(error)
    }
}
