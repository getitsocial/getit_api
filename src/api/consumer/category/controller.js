import {
    BadRequestError,
    ResourceNotFoundError,
} from 'restify-errors'
import Category from '!/category'
import Shop from '!/shop'

export const getCategories = async ({ query }, res, next) => {

    try {

        const { page, limit, shopId, search } = query

        if (!shopId) {
            return next(new BadRequestError('shopId query is missing'))
        }

        const options = {
            page: page ?? 1,
            limit: limit ?? 20,
            populate: [
                { path: 'author', select: 'name picture' },
                { path: 'article_count' },
            ],
        }

        // Search
        const searchParams = search
            ? { name: { $regex: search, $options: 'i' } }
            : {}

        const shop = (await Shop.findOne({ shopId }))?._id

        if (!shop) {
            return next(new ResourceNotFoundError('shop not found'))
        }

        // Query
        const { totalDocs, docs, nextPage, prevPage } = await Category.paginate(
            { shop, ...searchParams },
            options
        )
        const rows = []
        docs.forEach((category) => {
            rows.push(category.modelProjection())
        })

        // Send response
        res.send(200, { count: totalDocs, rows, nextPage, prevPage })
    } catch (error) {
        /* istanbul ignore next */
        return next(new BadRequestError(error))
    }

}
