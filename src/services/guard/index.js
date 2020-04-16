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

export const sign = async ({ _id, role, shops }) => 
    jwtr.sign({_id, role, shops}, secret, {
        expiresIn: '8d'
    })

export const decode = async (token) => 
    jwt.decode(token)

// Destroy token from index
export const destroy = async (req) => {
    const { jti } = await decode(extractToken(req))
    await destroyJTI(jti)
}

export const destroyJTI = async (jti) => {
    await jwtr.destroy(jti, secret)
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
    