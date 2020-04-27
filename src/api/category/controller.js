import { BadRequestError } from 'restify-errors'
import Category from './model'
import User from '~/api/user/model'

// Get Active shop
const getActiveShop = async(user, next) => {
    const { activeShop } = await User.findById(user._id)
    if (!activeShop) return next(new BadRequestError('no active shop specified'))
    return activeShop
}

export const getCategories = async({ user }, res, next) => {
    try {
        // Find active shop
        const activeShop = await getActiveShop(user, next)

        // Find objects
        const categories = await Category.find({ shop: activeShop })
        const data = []
        categories.forEach((category) => data.push(category.modelProjection()))

        // Send response 
        res.send(200, data)
    } catch(error) {
        /* istanbul ignore next */ 
        return next(new BadRequestError(error))
    }

}

export const createCategory = async({ body }, res, next) => {
    // Pass values
    const { author, name } = body

    try {

        // Find active shop
        const activeShop = await getActiveShop(author, next)

        // Validate request body
        await Category.validate({ author: author._id, name, shop: activeShop })
            
        // Create object
        const category = await Category.create({ author: author._id, name, shop: activeShop })
    
        // Send response 
        res.send(201, category.modelProjection())
    
    } catch (error) {
        /* istanbul ignore next */ 
        return next(new BadRequestError(error))
    }
}

export const deleteAll = async(req, res) => {
    await Category.deleteMany()
    res.json('success')
}

