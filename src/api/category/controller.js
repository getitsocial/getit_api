import {
    BadRequestError,
    ResourceNotFoundError,
    UnauthorizedError,
} from 'restify-errors'
import Category from './model'
import Shop from '~/api/shop/model'
import { merge } from 'lodash'

export const getCategories = async ({ shop, query }, res, next) => {

    try {

        // Pagination
        const { page, limit, search } = query
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

        // Query
        const { totalDocs, docs, nextPage, prevPage } = await Category.paginate(
            { shop: shop._id, ...searchParams },
            options
        )

        const data = []
        docs.forEach((category) =>  {
            data.push(category.modelProjection())
        })

        // Send response
        res.send(200, { count: totalDocs, rows: data, nextPage, prevPage })
    } catch (error) {
        /* istanbul ignore next */
        return next(new BadRequestError(error))
    }

}

export const getPublicCategories = async ({ query }, res, next) => {

    try {

        const { page, limit, shopId } = query

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

        const shop = (await Shop.findOne({ shopId }))?._id

        if (!shop) {
            return next(new ResourceNotFoundError('shop not found'))
        }

        // Query
        const { totalDocs, docs, nextPage, prevPage } = await Category.paginate(
            { shop },
            options
        )
        const data = []
        docs.forEach((category) => {
            data.push(category.modelProjection())
        })

        // Send response
        res.send(200, { count: totalDocs, rows: data, nextPage, prevPage })
    } catch (error) {
        /* istanbul ignore next */
        return next(new BadRequestError(error))
    }

}

export const createCategory = async (req, res, next) => {
    // Pass values
    const { name } = req.body
    const { shop, author } = req

    try {

        // Validate request body
        await Category.validate({ author, name, shop })

        // Create object
        const category = await Category.create({
            author,
            name,
            shop,
        })

        // Send response
        res.send(201, category.modelProjection())
    } catch (error) {
        /* istanbul ignore next */
        return next(new BadRequestError(error))
    }
}

export const getCategory = async ({ params }, res, next) => {
    try {
        const { id } = params
        const category = await Category.findById(id)

        if (!category) {
            return next(new ResourceNotFoundError('category not found'))
        }

        res.send(200, category.modelProjection())
    } catch (error) {
        return next(new BadRequestError(error))
    }
}

export const updateCategory = async ({ params, user, body }, res, next) => {
    try {
        const { id } = params
        const { name } = body

        const category = await Category.findById(id)

        if (!category) {
            return next(new ResourceNotFoundError('category not found'))
        }

        if (user.role !== 'admin' && !category.author.equals(user._id)) {
            return next(new UnauthorizedError('cannot update other users category'))
        }

        const data = await merge(category, { name }).save()

        res.send(200, data.modelProjection())
    } catch (error) {
        return next(new BadRequestError(error))
    }
}

export const deleteCategory = async ({ params, user }, res, next) => {
    try {
        const { id } = params

        const category = await Category.findById(id)

        if (!category) {
            return next(new ResourceNotFoundError('category not found'))
        }

        if (user.role !== 'admin' && !category.author.equals(user._id)) {
            return next(new UnauthorizedError('cannot delete other users category'))
        }

        await category.removeArticles()

        await Category.deleteOne({ _id: id })

        res.send(204)
    } catch (error) {
        return next(new BadRequestError(error))
    }
}
