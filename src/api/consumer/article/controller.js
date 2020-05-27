import {
    BadRequestError,
    ResourceNotFoundError,
} from 'restify-errors'
import Article from '!/article'
import Shop from '!/shop'

export const getArticles = async ({ query }, res, next) => {

    try {

        const { page, limit, category, shopId, search } = query

        if (!shopId) {
            return next(new BadRequestError('shopId query is missing'))
        }

        const options = {
            page: page ?? 1,
            limit: limit ?? 20,
            populate: [
                { path: 'author', select: 'name picture' },
                { path: 'category', select: 'name' },
            ],
        }

        // Search
        const searchParams = search
            ? { name: { $regex: search, $options: 'i' } }
            : {}

        // Filter Articles by Shop
        const { _id, components, name } = await Shop.findOne({ shopId }) ?? {}

        if (!_id) {
            return next(new ResourceNotFoundError('shop not found'))
        }

        // Filter Articles by Category if exist
        const filterCategory = {}
        if (category) {
            filterCategory.category = category
        }

        // Use ... method for optional and {} for required
        const { totalDocs, docs, nextPage, prevPage } = await Article.paginate(
            { shop: _id, ...filterCategory, ...searchParams },
            options
        )

        const rows = []
        docs.forEach((article) => {
            rows.push(article.modelProjection())
        })

        // Send response with query information
        res.send(200, {
            count: totalDocs,
            rows,
            shop: { _id, components, name, shopId },
            ...filterCategory,
            nextPage,
            prevPage,
        })

    } catch (error) {
        /* istanbul ignore next */
        return next(new BadRequestError(error))
    }
}

export const getArticle = async ({ params }, res, next) => {
    try {
        const { id } = params
        const article = await Article.findById(id)?.populate([
            { path: 'author', select: 'name picture' },
            { path: 'category', select: 'name' },
        ])

        if (!article) {
            return next(new ResourceNotFoundError('article not found'))
        }

        res.send(200, article.modelProjection())
    } catch (error) {
        return next(new BadRequestError(error))
    }
}

