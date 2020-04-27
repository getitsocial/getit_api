import { BadRequestError, ConflictError, UnauthorizedError } from 'restify-errors'
import slugify from 'slugify'
import { merge } from 'lodash'
import User from '~/api/user/model'
import Shop from './model'

export const deleteAll = async(req, res) => {
    await Shop.deleteMany()
    res.json('success')
}


export const checkName = async(req, res, next) => {
    try {
        // Parse values
        const { name } = req?.body
        const user = await User.findById(req.user)

        // Body name is required
        if(!name) new BadRequestError('name is required')

        // Modify name
        const slugName = slugify(name, {
            lower: true
        })

        // Try to find existing shop
        const shop = await Shop.findOne({shopId: slugName })
        
        // Check if shop equals the users shop (shop edit mode)
        if(shop && !shop.equals(user?.activeShop)) 
            throw new ConflictError('shopname exists already')
        
        res.send()
    } catch (error) {
        return next(new BadRequestError(error))
    }
}


export const deleteShop = async({ user, params }, res, next) => {
    const { id } = params
    
    try {

        const { author } = await Shop.findById(id)

        const isAdmin = user.role === 'admin'

        // check if the user is the author of the shop
        const isSelfUpdate = author.equals(user._id)

        // Check permissions
        if (!isSelfUpdate && !isAdmin)
            return next(new UnauthorizedError('You can\'t delete other users'))


        await Shop.findByIdAndDelete(id)
        
        // Send response 
        res.send(204)

    } catch (error) {
        /* istanbul ignore next */ 
        return next(new BadRequestError(error))
    }
}

export const createShop = async({ body }, res, next) => {
    
    // Pass values
    const { name, contact, shopId, address, companyType, logo, picture, size, author, description, published } = body

    try {

        // Validate request body
        await Shop.validate({ name, contact, shopId, address, companyType, logo, picture, size, author, description, published })

        // Create object
        const shop = await Shop.create({ name, contact, shopId, address, companyType, logo, picture, size, author, description, published, users: [author] })

        const user = await User.findById(author._id)
        if (!user.activeShop) { // first shop (onboarding)
            user.activeShop = shop._id
        }
        user.shops.push(shop._id)
        await user.save()

        // Send response 
        res.send(201, shop.modelProjection())

    } catch (error) {
        /* istanbul ignore next */ 
        return next(new BadRequestError(error))
    }
}

export const updateShop = async({ body, params }, res, next) => {
    // Pass values
    const { id } = params
    const { name, contact, shopId, address, companyType, logo, picture, size, author, description, published } = body

    try {

        // Validate request body
        await Shop.validate({ name, contact, shopId, address, companyType, logo, picture, size, author, description, published })

        // find object
        const shop = await Shop.findById(id)

        // Merge data
        const data = await merge(shop, { name, contact, shopId, address, companyType, logo, picture, size, author, description, published }).save()

        // Send response 
        res.send(201, data.modelProjection())

    } catch (error) {
        /* istanbul ignore next */ 
        return next(new BadRequestError(error))
    }
}

