import { BadRequestError } from 'restify-errors'
import { merge } from 'lodash'
// import { sendDynamicMail } from '~/services/sendgrid'
// import { serverConfig } from '~/config'
import model from './model'

// let { emailTemplates } = serverConfig

export const getMe = async({ user }, res, next) => {
    try {

        if(!user) {
            return next(new BadRequestError('cannot find user'))
        }
        // Find user
        let result = await model.findById(user._id)

        // Send response 
        res.send(200, result.modelProjection())

    } catch (error) {
        /* istanbul ignore next */ 
        return next(new BadRequestError(error))
    }
}

export const create = async({ body }, res, next) => {
    // Pass values
    let { email, password, name, shops } = body
    
    try {

        // Validate request body
        await model.validate({ email, password, name, shops })
        
        // Create object
        const data = await model.create({ email, password, name, shops })

        /**
             *   Send welcome Mail
             *   await sendDynamicMail({ toEmail: email,
             *       templateId: emailTemplates.welcome,
             *       dynamic_template_data: {
             *           username: name
             *       }
             *   })
             */

        // Send response 
        res.send(201, data.modelProjection())

    } catch (error) {
        /* istanbul ignore next */ 
        return next(new BadRequestError(error))
    }
}

export const update = async({ user, params, body }, res, next) => {
    // Pass values
    let { name, picture, email, description, userSettings, role } = body
    
    try {

        // Find User
        let result = await model.findById(params.id === 'me' ? user._id : params.id)

        const isAdmin = user.role === 'admin'
        const isSelfUpdate = params.id === 'me' ? true : (result._id.equals(user._id))

        // Check permissions
        if (!isSelfUpdate && !isAdmin) {
            /* istanbul ignore next */ 
            return next(new BadRequestError('You can\'t change other user\'s data'))
        }

        // Save user
        const data = await merge(result, { name, picture, email, description, userSettings, role }).save()
        
        // Send response 
        res.send(201, data.modelProjection())

    } catch(error) {
        /* istanbul ignore next */ 
        return next(new BadRequestError(error))
    }
}

export const updatePassword = async ({ body , params, user }, res, next) => {
    // Pass values
    let { password } = body
    
    try {
        // Find User
        let result = await model.findById(params.id === 'me' ? user._id : params.id)

        // Check permissions
        if (!result._id.equals(user._id)) {
            /* istanbul ignore next */ 
            return next(new BadRequestError('You can\'t change other user\'s password'))
        }

        // result.password = password
        
        // Save user
        const data = await result.set({ password }).save()
        
        // Send response 
        res.send(201, data.modelProjection())

    } catch(error) {
        /* istanbul ignore next */ 
        return next(new BadRequestError(error))
    }
}

export const changeShop = async({ user, params, body }, res, next) => {
    const { role } = user
    const { shop } = body
    try {
        
        const user = await model.findById(params.id)
        let shops = user.shops

        // Check permissions
        // there could be problems comparing objects with strings
        const isAdmin = role === 'admin'

        const isValidShop = shops.includes(shop)

        // Check permissions
        if (!isValidShop && !isAdmin) {
            /* istanbul ignore next */ 
            return next(new BadRequestError('You can\'t change the shop'))
        }
        // sort 
        shops = [shop, ...shops.filter(id => id.toString() !== shop)]
        
        // Save user
        await user.set({ shops }).save()
        
        // Send response 
        res.send(201, user.modelProjection())

    } catch(error) {
        console.log(error)
        /* istanbul ignore next */ 
        return next(new BadRequestError(error))
    }
}
