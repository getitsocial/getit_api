import { BadRequestError, UnauthorizedError, NotFoundError } from 'restify-errors'
import { merge } from 'lodash'
import { sendDynamicMail } from '~/services/sendgrid'
import { serverConfig } from '~/config'
import model from './model'

const { emailTemplates } = serverConfig

export const getMe = async({ user }, res, next) => {
    try {

        if(!user)
            return next(new BadRequestError('cannot find user'))

        // Find user
        const result = await model.findById(user._id)
        
        // Send response 
        res.send(200, result.modelProjection())

    } catch (error) {
        /* istanbul ignore next */ 
        return next(new BadRequestError(error))
    }
}

export const create = async({ body }, res, next) => {
    // Pass values
    const { email, password, name } = body

    try {

        // Validate request body
        await model.validate({ email, password, name })
        
        // Create object
        const data = await model.create({ email, password, name })

        
        // Send welcome Mail
        await sendDynamicMail({ toEmail: email,
            templateId: emailTemplates.welcome,
            dynamic_template_data: {
                username: name
            }
        })
             

        // Send response 
        res.send(201, data.modelProjection())

    } catch (error) {
        /* istanbul ignore next */ 
        return next(new BadRequestError(error))
    }
}

export const update = async({ user, params, body }, res, next) => {
    // Pass values
    const { name, picture, email, description, userSettings, location, role } = body
    
    try {

        // Find User
        const result = await model.findById(params.id === 'me' ? user._id : params.id)

        const isAdmin = user.role === 'admin'
        const isSelfUpdate = params.id === 'me' ? true : (result._id.equals(user._id))

        // Check permissions
        if (!isSelfUpdate && !isAdmin)
            return next(new BadRequestError('You can\'t change other user\'s data'))

        // For merge nested Objects 
        result.markModified('location')

        // Save user
        const data = await merge(result, { name, picture, email, description, userSettings, location, role }).save()
        
        // Send response 
        res.send(201, data.modelProjection())

    } catch(error) {
        /* istanbul ignore next */ 
        return next(new BadRequestError(error))
    }
}

export const updatePassword = async ({ body , params, user }, res, next) => {
    // Pass values
    const { password } = body
    
    try {
        // Find User
        const result = await model.findById(params.id === 'me' ? user._id : params.id)

        // Check permissions
        if (!result._id.equals(user._id)) 
            return next(new UnauthorizedError('You can\'t change other user\'s password'))
        
        // Save user
        const data = await result.set({ password }).save()
        
        // Send response 
        res.send(201, data.modelProjection())

    } catch(error) {
        /* istanbul ignore next */ 
        return next(new BadRequestError(error))
    }
}



export const deleteUser = async({ user, params }, res, next) => {
    
    try {

        const isAdmin = user.role === 'admin'

        const isSelfUpdate = params.id === 'me' ? true : (params.id === user._id)

        // Check permissions
        if (!isSelfUpdate && !isAdmin)
            return next(new UnauthorizedError('You can\'t delete other users'))


        await model.findByIdAndDelete(params.id === 'me' ? user._id : params.id)
        
        // Send response 
        res.send(204)

    } catch (error) {
        /* istanbul ignore next */ 
        return next(new BadRequestError(error))
    }
}


export const getActiveShop = async({ user, params }, res, next) => {
    
    try {

        const isAdmin = user.role === 'admin'

        const isSelfUpdate = params.id === 'me' ? true : (params.id === user._id)

        // Check permissions
        if (!isSelfUpdate && !isAdmin)
            return next(new UnauthorizedError('You can\'t get the active shop of other users'))


        const { activeShop } = await model.findById(params.id === 'me' ? user._id : params.id).populate('activeShop')
        if (!activeShop) 
            return next(new NotFoundError('no active shop specified'))

        res.send(200, activeShop)

    } catch (error) {
        /* istanbul ignore next */ 
        return next(new BadRequestError(error))
    }
}


export const setActiveShop = async({ user, params, body }, res, next) => {
    
    const { shopId } = body

    try {

        const isAdmin = user.role === 'admin'

        const isSelfUpdate = params.id === 'me' ? true : (params.id === user._id)

        // Check permissions
        if (!isSelfUpdate && !isAdmin)
            return next(new UnauthorizedError('You can\'t delete other users'))


        const dbUser = await model.findById(params.id === 'me' ? user._id : params.id)
        
        if (!dbUser.shops.includes(shopId)) 
            return next(new BadRequestError('not a valid shop'))

        dbUser.set('activeShop', shopId)

        res.send(204)

    } catch (error) {
        /* istanbul ignore next */ 
        return next(new BadRequestError(error))
    }
}