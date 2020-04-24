import { BadRequestError } from 'restify-errors'
import Category from './model'
import User from '~/api/user/model'

export const deleteAll = async(req, res) => {
    await Category.deleteMany()
    res.json('success')
}


export const createCategory = async({ body }, res, next) => {
    // Pass values
    const { author, name } = body

    try {

        // Find active shop
        const { activeShop } = await User.findById(author._id)

        if (!activeShop) return next(new BadRequestError('no active shop specified'))

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

