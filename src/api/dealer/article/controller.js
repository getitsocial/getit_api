import {
    BadRequestError,
    UnauthorizedError,
    ResourceNotFoundError,
} from 'restify-errors'
import { mergeWith, isArray } from 'lodash'
import Article from '!/article'
import User from '!/user'

export const getArticles = async ({ query, user }, res, next) => {
    try {
        const { activeShop } = await User.findById(user._id)

        const { page, limit, categoryId, _id = activeShop?._id, search } = query

        if (!_id) {
            return next(new BadRequestError('no active shop specified'))
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

        const { totalDocs, docs, nextPage, prevPage } = await Article.paginate(
            { shop: _id, category: categoryId, ...searchParams },
            options
        )

        const rows = []
        docs.forEach((article) => {
            rows.push(article.modelProjection())
        })

        // Send response
        res.send(200, { count: totalDocs, rows, nextPage, prevPage })
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

export const createArticle = async (req, res, next) => {
    const {
        name,
        articleNumber,
        stock,
        price,
        size,
        currency,
        description,
        picture,
        category,
        published,
        tax,
    } = req.body

    const { author, shop } = req
    try {
        await Article.validate({
            name,
            articleNumber,
            stock,
            price,
            size,
            currency,
            description,
            picture,
            category,
            published,
            tax,
            author,
            shop,
        })

        const article = await Article.create({
            name,
            articleNumber,
            stock,
            price,
            size,
            currency,
            description,
            picture,
            category,
            published,
            tax,
            author,
            shop,
        })
        // Send response
        res.send(201, article.modelProjection())
    } catch (error) {
        // console.log(error)
        return next(new BadRequestError(error))
    }
}

export const updateArticle = async ({ body, params, user }, res, next) => {
    const { id } = params
    const {
        name,
        articleNumber,
        stock,
        price,
        size,
        currency,
        description,
        picture,
        category,
        author,
        shop,
        published,
        tax,
    } = body

    try {
        // find object
        const article = await Article.findById(id)

        if (!article) {
            return next(new ResourceNotFoundError('article not found'))
        }

        // Check user role
        if (user.role !== 'admin' && !article.author.equals(user._id)) {
            return next(
                new UnauthorizedError('you are not the author of this article')
            )
        }

        // Check if picture not defined and set default picture
        if (picture && !Object.keys(picture).length) {
            picture.url = '/api/static/placeholder.png'
            picture.id = 'placeholder'
        }

        // merge and save
        const data = mergeWith(
            article,
            {
                name,
                articleNumber,
                stock,
                price,
                size,
                currency,
                description,
                picture,
                category,
                author,
                shop,
                published,
                tax,
            },
            (obj, src) => {
                if (isArray(obj)) {return src}
            }
        )

        await data.save()

        // Send response
        res.send(200, data.modelProjection())
    } catch (error) {
        return next(new BadRequestError(error))
    }
}

export const deleteArticle = async ({ params, user }, res, next) => {
    const { id } = params

    try {
        // find object
        const article = await Article.findById(id)

        if (!article) {
            return next(new ResourceNotFoundError('article not found'))
        }

        // Check user role
        if (user.role !== 'admin' && !article.author.equals(user._id)) {
            return next(
                new UnauthorizedError('you are not the author of this article')
            )
        }

        await Article.deleteOne({ _id: id })

        // Send response
        res.send(204)
    } catch (error) {
        return next(new BadRequestError(error))
    }
}
