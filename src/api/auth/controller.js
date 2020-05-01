import { BadRequestError, UnauthorizedError } from 'restify-errors'
import model from '~/api/user/model'
import { sign, decode, destroy } from '~/services/guard'
import { comparePassword, providerAuth } from '~/utils'

/**
 * @throws {BadRequestError} 400 Error - invalid email or password
 */
const errorHandler = (res, next) => 
    next(new BadRequestError(res.__('wrong email or password')))

const signHandler = async (user, res) => {
    // Sign Token
    const token = await sign(user)
    const { _id, role } = await decode(token)
    // Send response
    res.send({ _id, role, token })
}

export const authenticate = async({ body }, res, next) => {
    // Pass values
    const { email, password } = body
    
    try {
        // Validate request body
        await model.validate({ email, password })

        // Find user
        const user = await model.findOne({ email })
        if (!user) 
            return errorHandler(res, next)
        
        if (!user.verified)
            return next(new UnauthorizedError('mail is not verified'))
        
        // Compare password
        const comparedPassword = await comparePassword(password, user.password)
        if (!comparedPassword) 
            return errorHandler(res, next)

        // Sign in user
        await signHandler(user, res)

    } catch(error) {
        return next(new BadRequestError(res.__(error.message)))
    }
}

export const providerAuthenticate = async({ body, params }, res, next) => {
    // Pass values
    const { provider } = params
    const { token } = body

    try {
        // Get user from external provider
        const providerUser = await providerAuth[provider](token)
        const user = await model.createFromService(providerUser)
       
        // Sign in user
        await signHandler(user, res)
        
    } catch(error) {
        return next(new BadRequestError(error))
    }

}

export const logout = async(req, res, next) => {
    try {
        await destroy(req)
        res.send('success')    
    } catch (error) {
        next(new BadRequestError('Logout was unsuccessful'))
    }
}