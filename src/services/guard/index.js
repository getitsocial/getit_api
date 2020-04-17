import jwt from 'jsonwebtoken'
import redis from 'redis'
import  { default as JWTR }  from 'jwt-redis'
import rJWT from 'restify-jwt-community'
import { UnauthorizedError } from 'restify-errors'
import { extractToken } from '~/utils'
import { serverConfig, dbIndex } from '~/config'

export const redisClient = redis.createClient(dbIndex)
const jwtr = new JWTR(redisClient)

// Get JWT Secret
const { secret } = serverConfig?.jwt

const isRevokedCallback = async (req, res, done) => {
    try {
        await jwtr.verify(extractToken(req), secret)
        done(null, false)
    } catch( error ) {
        done(null, true)
    }
}

// Define user roles
export const roles = ['user', 'admin']

export const sign = async ({ _id, role, shop }) =>  
    jwtr.sign({_id, role, shop: shop ? shop._id: null}, secret, {
        expiresIn: '8d'
    })


export const decode = async (token) => jwt.decode(token)

// remove jti from redis
export const destroyJti = async (jti) => jwtr.destroy(jti, secret)

// Destroy token from index
export const destroy = async (req) => {
    const { jti } = await decode(extractToken(req))
    await destroyJti(jti)
}

// destroy jti and return new user token
export const refreshToken = async (jti, user) => {
    await destroyJti(jti)
    return await sign(user)
} 

export const doorman = (passedRoles) =>  
    [
        rJWT({...serverConfig.jwt, ...{ isRevoked: isRevokedCallback }}), ((req, res, next) =>
            (roles.some(r => passedRoles.includes(r)) && passedRoles.includes(req.user?.role) ? next() : next(new UnauthorizedError()))
        )
        
    ]

export const validateMail = async (req, id) => (await decode(extractToken(req)))._id === id

export const masterman = () => ((req, res, next) => 
    (serverConfig.masterKey === extractToken(req)) ? next() : next(new UnauthorizedError())
)
    