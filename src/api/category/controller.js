import { BadRequestError, ResourceNotFoundError, UnauthorizedError } from 'restify-errors'
import Category from './model'
import { merge } from 'lodash'

export const getCategories = async({ shop, query }, res, next) => {
    
    try {

        if (!shop) {
            return next(new BadRequestError('no active shop specified'))
        }

        const { page, limit } = query
        
        const options = {
            page: page ?? 1,
            limit: limit ?? 20,
            populate: [{ path: 'author', select: 'name picture' }, { path: 'article_count' }]
        }

        const { totalDocs, docs} = await Category.paginate({ shop: shop._id }, options)
        
        const data = []
        docs.forEach(category => data.push(category.modelProjection()))
        // Send response 
        res.send(200, { count: totalDocs, rows: data })

    } catch(error) {
        /* istanbul ignore next */ 
        return next(new BadRequestError(error))
    }

}

export const createCategory = async({ body, shop }, res, next) => {
    // Pass values
    const { author, name } = body

    try {

        if (!shop) {
            return next(new BadRequestError('no active shop specified'))
        }

        // Validate request body
        await Category.validate({ author: author._id, name, shop })
            
        // Create object
        const category = await Category.create({ author: author._id, name, shop })
    
        // Send response 
        res.send(201, category.modelProjection())
    
    } catch (error) {
        /* istanbul ignore next */ 
        return next(new BadRequestError(error))
    }
}

export const getCategory = async({ params }, res, next) => {

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

export const updateCategory = async({ params, user, body }, res, next) => {

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

export const deleteCategory = async({ params, user }, res, next) => {

    try {

        const { id } = params

        const category = await Category.findById(id)
        
        if (!category) {
            return next(new ResourceNotFoundError('category not found'))
        }

        if (user.role !== 'admin' && !category.author.equals(user._id)) {
            return next(new UnauthorizedError('cannot delete other users category'))
        }

        await Category.findByIdAndDelete(id)        

        res.send(204)

    } catch (error) {
        return next(new BadRequestError(error))
    }

}
