import { BadRequestError, UnauthorizedError, ResourceNotFoundError } from 'restify-errors'
import { mergeWith, isArray } from 'lodash' 
import Article from './model'

export const getArticles = async({ shop, query }, res, next) => {
    
    try {

        if (!shop) {
            return next(new BadRequestError('no active shop specified'))
        }

        const { page, limit, categoryId } = query
        
        const options = {
            page: page ?? 1,
            limit: limit ?? 20,
            populate: [{ path: 'author', select: 'name picture' }, { path: 'category', select: 'name' }]
        }

        const { totalDocs, docs, nextPage, prevPage } = await Article.paginate({ shop: shop._id, category: categoryId }, options)
        
        const data = []
        docs.forEach(article => data.push(article.modelProjection()))
        
        // Send response 
        res.send(200, { count: totalDocs, rows: data, nextPage, prevPage })

    } catch(error) {
        /* istanbul ignore next */ 
        return next(new BadRequestError(error))
    }

}

export const getArticle = async({ params }, res, next) => {

    try {

        const { id } = params
        const article = await Article.findById(id)?.populate([{ path: 'author', select: 'name picture' }, { path: 'category', select: 'name' }])

        if (!article) {
            return next(new ResourceNotFoundError('article not found'))
        }

        res.send(200, article.modelProjection())

    } catch (error) {
        return next(new BadRequestError(error))
    }

}

export const createArticle = async({ body }, res, next) => {

    const { name, articleNumber, stock, price, size, currency, description, picture, category, published, tax, author, shop } = body

    try {

        await Article.validate({ name, articleNumber, stock, price, size, currency, description, picture, category, published, tax, author, shop })

        const article = await Article.create({ name, articleNumber, stock, price, size, currency, description, picture, category, published, tax, author, shop })        
        // Send response 
        res.send(201, article.modelProjection())
    } catch(error) {
        // console.log(error)
        return next(new BadRequestError(error))
    }
}

export const updateArticle = async({ body, params, user }, res, next) => {

    const { id } = params
    const { name, articleNumber, stock, price, size, currency, description, picture, category, author, shop, published, tax, } = body

    try {

        // find object
        const article = await Article.findById(id)

        if (!article) {
            return next(new ResourceNotFoundError('article not found'))
        } 

        // Check user role
        if (user.role !== 'admin' && !article.author.equals(user._id)) {
            return next(new UnauthorizedError('you are not the author of this article'))
        }

        // Check if picture not defined and set default picture
        if (picture && !Object.keys(picture).length) {
            picture.url = '/api/static/placeholder.png'
            picture.id = 'placeholder'
        }
        
        // merge and save
        const data = mergeWith(article, { name, articleNumber, stock, price, size, currency, description, picture, category, author, shop, published, tax, }, (obj, src) => {
            if (isArray(obj)) return src
        })
        
        await data.save()
        
        // Send response 
        res.send(200, data.modelProjection())
    } catch(error) {
        return next(new BadRequestError(error))
    }
}

export const deleteArticle = async({ params, user }, res, next) => {

    const { id } = params

    try {

        // find object
        const article = await Article.findById(id)

        if (!article) {
            return next(new ResourceNotFoundError('article not found'))
        } 

        // Check user role
        if (user.role !== 'admin' && !article.author.equals(user._id)) {
            return next(new UnauthorizedError('you are not the author of this article'))
        }

        await Article.deleteOne({ _id: id })
        
        // Send response 
        res.send(204)
    } catch(error) {
        return next(new BadRequestError(error))
    }
}
