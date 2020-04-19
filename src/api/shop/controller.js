import { BadRequestError, ConflictError } from 'restify-errors'
import slugify from 'slugify'

import Shop from './model'

export const deleteAll = async(req, res) => {
    await Shop.deleteMany()
    res.json('success')
}


export const activeShop = async(req, res, next) => {
    try {
        const { shop } = req.user
        const response = await Shop.findById(shop)
        res.json(response)
    } catch (error) {
        return next(new BadRequestError(error))

    }
}


export const checkName = async(req, res, next) => {
    try {
        // Parse values
        const { name } = req?.body
        const { user } = req

        // Body name is required
        if(!name) new BadRequestError('name is required')

        // Modify name
        const slugName = slugify(name, {
            lower: true
        })

        // Try to find existing shop
        const shop = await Shop.findOne({shopId: slugName })
        
        // Check if shop equals the users shop (shop edit mode)
        if(shop && !shop.equals(user?.shop)) 
            throw new ConflictError('Shopname existiert bereits')
        
        res.send()
    } catch (error) {
        return next(new BadRequestError(error))
    }
}
