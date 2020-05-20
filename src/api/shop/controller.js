import {
    BadRequestError,
    ConflictError,
    UnauthorizedError,
    NotFoundError,
    ResourceNotFoundError,
} from 'restify-errors'
import slugify from 'slugify'
import { mergeWith, isArray } from 'lodash'
import User from '~/api/user/model'
import Shop from './model'
import { parseOpeningHours } from '~/utils'
import { decode } from 'ngeohash'
import circleToPolygon from 'circle-to-polygon'

export const getNearShops = async ({ params }, res, next) => {
    try {
        const { geohash } = params
        const { latitude, longitude } = decode(geohash)

        if (!latitude || !longitude) {
            return next(new BadRequestError('not a valid geohash'))
        }

        const shops = await Shop.find({
            position: {
                $geoIntersects: {
                    $geometry: circleToPolygon(
                        [longitude, latitude],
                        100000,
                        32
                    ),
                },
            },
            published: true,
        })

        const data = []
        shops.forEach((shop) => {
            data.push(shop.modelProjection(true))
        })

        res.send(data)

    } catch (error) {
        return next(new BadRequestError(error))
    }
}

export const getShop = async ({ params }, res, next) => {

    const { shopId } = params

    try {

        const shop = await Shop.findOne({ shopId, published: true })

        if (shop === null) {
            return next(new ResourceNotFoundError('shop not found'))
        }

        res.send(shop.modelProjection(true))

    } catch (error) {
        return next(new BadRequestError(error))
    }
}

export const getAllShops = async ({ query }, res, next) => {

    const { page, limit, search } = query

    try {
        // Pagination
        const options = {
            page: page ?? 1,
            limit: limit ?? 20,
            populate: [{ path: 'author', select: 'name picture email' }],
        }

        // Search
        const searchParams = search ? { shopId: { $regex: search, $options: 'i' } } : {}

        // Query
        const { totalDocs, docs, nextPage, prevPage } = await Shop.paginate({ ...searchParams }, options)

        const data = []
        docs.forEach((shop) => {
            data.push(shop.modelProjection())
        })

        // Send response
        res.send(200, { count: totalDocs, rows: data, nextPage, prevPage })

    } catch (error) {
        /* istanbul ignore next */
        return next(new BadRequestError(error))
    }
}

export const checkName = async (req, res, next) => {

    const { name } = req?.body

    try {
        // Parse values
        const user = await User.findById(req.user)

        // Body name is required
        if (!name) {
            return next(new BadRequestError('name is required'))
        }

        // Modify name
        const slugName = slugify(name, {
            lower: true,
        })

        // Try to find existing shop
        const shop = await Shop.findOne({ shopId: slugName })

        // Check if shop equals the users shop (shop edit mode)
        if (shop && !shop.equals(user?.activeShop)) {
            return next(new ConflictError('shopname exists already'))
        }

        res.send()
    } catch (error) {
        return next(new BadRequestError(error))
    }
}

export const deleteShop = async ({ user, params }, res, next) => {

    const { id } = params

    try {

        const { author } = await Shop.findById(id)

        const isAdmin = user.role === 'admin'

        // check if the user is the author of the shop
        const isSelfUpdate = author.equals(user._id)

        // Check permissions
        if (!isSelfUpdate && !isAdmin) {
            return next(new UnauthorizedError('You can\'t delete other users'))
        }
        const shop = await Shop.findByIdAndDelete(id)

        await shop.removeUsers()
        await shop.removeArticles()
        await shop.removeCategories()

        // Send response
        res.send(204)
    } catch (error) {
        /* istanbul ignore next */
        return next(new BadRequestError(error))
    }
}

export const createShop = async ({ body }, res, next) => {
    // Pass values
    const {
        name,
        contact,
        shopId,
        address,
        companyType,
        logo,
        picture,
        size,
        author,
        description,
        published,
        deliveryOptions,
        openingHours,
    } = body

    try {

        const parsedOpeningHours = parseOpeningHours(openingHours)
        // Validate request body
        await Shop.validate({
            name,
            contact,
            shopId,
            address,
            companyType,
            logo,
            picture,
            size,
            author,
            description,
            published,
            deliveryOptions,
            parsedOpeningHours,
        })

        // Create object
        const shop = await Shop.create({
            name,
            contact,
            shopId,
            address,
            companyType,
            logo,
            picture,
            size,
            author,
            description,
            published,
            deliveryOptions,
            users: [author],
            parsedOpeningHours,
        })

        await User.updateOne(
            { _id: author._id },
            { activeShop: shop._id, $push: { shops: shop._id } }
        )

        // Send response
        res.send(201, shop.modelProjection(false))

    } catch (error) {
        /* istanbul ignore next */
        return next(new BadRequestError(error))
    }
}

export const updateShop = async ({ body, params, user }, res, next) => {
    // Pass values
    const { id } = params
    const {
        name,
        contact,
        shopId,
        address,
        companyType,
        logo,
        picture,
        size,
        author,
        description,
        published,
        deliveryOptions,
        openingHours,
        components,
    } = body

    try {
        // find object
        const shop = await Shop.findById(id)

        if (!shop) {
            return next(new NotFoundError('shop not found'))
        }

        if (user.role !== 'admin' && !shop.author.equals(user._id)) {
            return next(new UnauthorizedError('you are not the author of this shop'))
        }

        // Check if picture not defined and set default picture
        if (picture && !Object.keys(picture).length) {
            picture.url = '/api/static/placeholder-bg.png'
            picture.id = 'placeholder'
        }

        if (logo && !Object.keys(logo).length) {
            logo.url = '/api/static/placeholder.png'
            logo.id = 'placeholder'
        }

        // 15:00 to 900 etc.
        const parsedOpeningHours = parseOpeningHours(openingHours)
        // merge and save
        const data = mergeWith(
            shop,
            {
                name,
                contact,
                shopId,
                address,
                companyType,
                logo,
                picture,
                size,
                author,
                description,
                published,
                deliveryOptions,
                parsedOpeningHours,
                components,
            },
            (obj, src) => isArray(obj) ? src : undefined
        )

        // Save mixed types of body
        data.markModified('parsedOpeningHours')

        await data.save()

        // Send response
        res.send(200, data.modelProjection(false))

    } catch (error) {
        /* istanbul ignore next */
        return next(new BadRequestError(error))
    }
}
