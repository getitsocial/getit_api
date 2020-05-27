import { BadRequestError, ResourceNotFoundError } from 'restify-errors'

import Shop from '!/shop'
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
                    $geometry: circleToPolygon([longitude, latitude], 100000, 32),
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
