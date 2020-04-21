import { BadRequestError } from 'restify-errors'
import model from '~/api/user/model'
import { sign, decode, destroy } from '~/services/guard'
import { comparePassword, providerAuth } from '~/utils'
import { refreshToken } from '~/services/guard'

/**
 * @throws {BadRequestError} 400 Error - invalid email or password
 */
const errorHandler = (next) => 
    next(new BadRequestError('E-Mail oder Passwort falsch.'))

const signHandler = async (user, res) => {
    // Sign Token
    const token = await sign(user)
    const { _id, role } = await decode(token)
    // Send response
    res.send({ _id, role, token, shop: user.shop })
}

export const authenticate = async({ body }, res, next) => {
    // Pass values
    const { email, password } = body
    
    try {
        // Validate request body
        await model.validate({ email, password })
        
        // Find user
        const user = await model.findOne({ email })
        if(!user) 
            return errorHandler(next)
        
        // Compare password
        const comparedPassword = await comparePassword(password, user.password)
        if(!comparedPassword) 
            return errorHandler(next)

        // Sign in user
        await signHandler(user, res)

    } catch(error) {
        return next(new BadRequestError(error))
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

export const refreshUserToken = async({ user }, res) => {
    
    const { jti, _id } = user
    const newUser = await model.findById(_id)
    
    // destroy old jti and sign new token
    const token = await refreshToken(jti, newUser)
    const { role, shop } = await decode(token)

    // Send response 
    res.send({ _id, role, token, shop })
}

export const logout = async(req, res, next) => {
    try {
        await destroy(req)
        res.send('success')    
    } catch (error) {
        next(new BadRequestError('Logout was unsuccessful'))
    }
}