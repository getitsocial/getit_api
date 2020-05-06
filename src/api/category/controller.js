import { BadRequestError } from 'restify-errors'
import Category from './model'

export const getCategories = async({ shop }, res, next) => {
    try {
        // Find active shop
        if (!shop) return next(new BadRequestError('no active shop specified'))
        
        // Find objects        
        const categories = await Category.find({shop: shop._id}).populate([{ path: 'author', select: 'name picture' }, { path: 'article_count' }])

        // Send response 
        res.send(200, categories)

    } catch(error) {
        /* istanbul ignore next */ 
        return next(new BadRequestError(error))
    }

}

export const createCategory = async({ body, shop }, res, next) => {
    // Pass values
    const { author, name } = body

    try {

        if (!shop) return next(new BadRequestError('no active shop specified'))

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
