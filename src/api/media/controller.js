import handler, { mediaSettings } from '~/services/mediaupload'
import { BadRequestError, UnauthorizedError } from 'restify-errors'

const allowedFolders = ['article', 'logo', 'user', 'shop']

export const upload = async (req, res, next) => {
    if (!req.files) {
        return next(new BadRequestError('no images attached'))
    }

    if (!req.user) {
        return next(new UnauthorizedError('no user specified'))
    }

    // Parse data
    const { folder } = req.params
    const { file } = req.files
    const { user } = req

    if (!allowedFolders.includes(folder))
        return next(new BadRequestError('invalid folder'))

    const settings = mediaSettings(folder)

    // Remove crop settings in dev and save money
    if (process.env.NODE_ENV !== 'production') {
        delete settings.crop
    }

    // Assign user id to media
    settings.tags = [user._id]

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

export const deleteMedia = async (req, res, next) => {
    if (!req.user) {
        return next(new UnauthorizedError('no user specified'))
    }

    // Parse data
    const { folder, id } = req.params
    const { user } = req

    const publicId = `${folder}/${id}`

    try {
        const { tags } = await handler.v2.api.resource(publicId)

        if (tags.includes(user._id)) {
            await handler.v2.uploader.destroy(id)
        } else {
            return next(new UnauthorizedError())
        }
    } catch (error) {
        return next(new BadRequestError(error))
    }

    res.send(204)
}
