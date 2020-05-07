import { BadRequestError, ResourceNotFoundError } from 'restify-errors'
import Category from './model'

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

        const categories = await Category.paginate({ shop: shop._id }, options)
        
        const data = []
        categories.docs.forEach(category => data.push(category.modelProjection()))
        // Send response 
        res.send(200, data)

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
