import { BadRequestError, ConflictError, UnauthorizedError, NotFoundError } from 'restify-errors'
import slugify from 'slugify'
import { mergeWith, isArray } from 'lodash' 
import User from '~/api/user/model'
import Shop from './model'


export const checkName = async(req, res, next) => {
    try {
        // Parse values
        const { name } = req?.body
        const user = await User.findById(req.user)

        // Body name is required
        if (!name) return next(new BadRequestError('name is required'))

        // Modify name
        const slugName = slugify(name, {
            lower: true
        })

        // Try to find existing shop
        const shop = await Shop.findOne({ shopId: slugName })
        
        // Check if shop equals the users shop (shop edit mode)
        if (shop && !shop.equals(user?.activeShop)) 
            return next(new ConflictError('shopname exists already'))
        
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
        if (!isSelfUpdate && !isAdmin) {
            return next(new UnauthorizedError('You can\'t delete other users'))
        }

        (await Shop.findByIdAndDelete(id)).removeUsers()
        
        // Send response 
        res.send(204)

    } catch (error) {
        /* istanbul ignore next */ 
        return next(new BadRequestError(error))
    }
}

export const createShop = async({ body }, res, next) => {
    
    // Pass values
    const { name, contact, shopId, address, companyType, logo, picture, size, author, description, published, deliveryOptions, openingHours } = body

    try {

        // Validate request body
        await Shop.validate({ name, contact, shopId, address, companyType, logo, picture, size, author, description, published, deliveryOptions })

        // Create object
        const shop = await Shop.create({ name, contact, shopId, address, companyType, logo, picture, size, author, description, published, deliveryOptions, users: [author], openingHours })

        await User.updateOne({_id: author._id }, { activeShop: shop._id, '$push': { shops: shop._id }})

        // Send response 
        res.send(201, shop.modelProjection())

    } catch (error) {
        /* istanbul ignore next */ 
        return next(new BadRequestError(error))
    }
}

export const updateShop = async({ body, params, user }, res, next) => {
    // Pass values
    const { id } = params
    const { name, contact, shopId, address, companyType, logo, picture, size, author, description, published, deliveryOptions, openingHours } = body

    try {

        // find object
        const shop = await Shop.findById(id)

        if (!shop) {
            return next(new NotFoundError('shop not found'))
        } 

        if (user.role !== 'admin' && !shop.author.equals(user._id)) {
            return next(new UnauthorizedError('you are not the author of this shop'))
        }

        // Check if picture not defined and set default picture
        if (picture && !Object.keys(picture).length) {
            picture.url = '/api/static/placeholder-bg.png'
            picture.id = 'placeholder'
        }
        
        if (logo && !Object.keys(logo).length){
            logo.url = '/api/static/placeholder.png'
            logo.id ='placeholder'
        }

        // merge and save

        const data = mergeWith(shop, { name, contact, shopId, address, companyType, logo, picture, size, author, description, published, deliveryOptions, openingHours }, (obj, src) => {
            if (isArray(obj)) return src
        })
        
        await data.save()
        
        // Send response 
        res.send(200, data.modelProjection())

    } catch (error) {
        /* istanbul ignore next */ 
        return next(new BadRequestError(error))
    }
}

