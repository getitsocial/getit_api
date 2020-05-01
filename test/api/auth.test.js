import request from 'supertest'
import { Router } from 'restify-router'
import { isJWT } from 'validator'

import server from '~/server'
import { serverConfig } from '~/config'
import { doorman, verify } from '~/services/guard'
import { sign, decode } from '~/services/guard'
import User from '~/api/user/model'
import { TokenDestroyedError } from 'jwt-redis'

const { secret } = serverConfig?.jwt

let token, 
    apiEndpoint = 'test'

beforeAll(async (done) => {
    // Define router
    const router = new Router()

    // Test simple post request
    router.post('/test', doorman('admin'), ((req, res, next) => {
        res.json({ content: 'Post Success!' })
        next()
    }))

    // Apply router to server
    router.applyRoutes(server)

    done()
})

beforeEach(async () => {
    // Create User
    const adminUser = await User.create({ name: 'Maximilian', email: 'max1@moritz.com', password: 'Max123!!!', role: 'admin', verified: true })
    await User.create({ name: 'Maximilian', email: 'max2@moritz.com', password: 'Max123!!!', role: 'admin' }) // unverified user
    
    expect(typeof adminUser).toBe('object')
    expect(typeof adminUser._id).toBe('object')
    expect(Array.isArray([adminUser.keyworkds])).toBe(true)
    expect(typeof adminUser.name).toBe('string')
    expect(typeof adminUser.picture).toBe('object')
    expect(typeof adminUser.email).toBe('string')
    expect(typeof adminUser.password).toBe('string')
    expect(typeof adminUser.role).toBe('string')
    expect(adminUser.name).toBe(adminUser.name)
    expect(adminUser.email).toBe(adminUser.email)
    expect(adminUser.role).toBe(adminUser.role)

    // Sign User - JWT starts with "ey"
    token = await sign(adminUser)
    expect(isJWT(token)).toBe(true)

    // Decode signed user
    const { _id, role } = await decode(token)
    expect(typeof _id).toBe('string')
    expect(typeof role).toBe('string')
    expect(role).toBe('admin')
})

describe('Auth Test:', () => {


    test('TEST model validation', async (done) => {
        try {
            await User.validate({ email: 'testmail@testmail.com', password: 'invalidPassword' })
        } catch(error) {
            expect(typeof error?.errors?.password).toBe('object')
        }
        done()
    })

    test(`POST ${serverConfig.endpoint}/auth 200`, async (done) => {
        const { body, statusCode, header } = await request(server)
            .post(`${serverConfig.endpoint}/auth`)
            .send({ email: 'max1@moritz.com', password: 'Max123!!!', token: serverConfig.masterKey })
        
        expect(statusCode).toBe(200)
        expect(header['content-type']).toBe('application/json')
        expect(typeof body).toBe('object')
        expect(typeof body._id).toBe('string')
        expect(typeof body.role).toBe('string')
        expect(typeof body.token).toBe('string')
        expect(body.role).toBe('admin')
        done()
    })

    test(`POST ${serverConfig.endpoint}/auth 401 - without verified email`, async (done) => {
        const { statusCode } = await request(server)
            .post(`${serverConfig.endpoint}/auth`)
            .send({ email: 'max2@moritz.com', password: 'Max123!!!', token: serverConfig.masterKey  })

        expect(statusCode).toBe(401)
        done()
    })

    test(`POST ${serverConfig.endpoint}/auth 401 - without master key`, async (done) => {
        const { statusCode } = await request(server)
            .post(`${serverConfig.endpoint}/auth`)
            .send({ email: 'max1@moritz.com', password: 'Max123!!!' })
        
        expect(statusCode).toBe(401)
        done()
    })

    test(`POST ${serverConfig.endpoint}/auth 400 - invalid email`, async (done) => {
        const { statusCode } = await request(server)
            .post(`${serverConfig.endpoint}/auth`)
            .send({ email: 'unknown@user.com', password: 'Max123!!!', token: serverConfig.masterKey })
        
        expect(statusCode).toBe(400)
        done()
    })

    test(`POST ${serverConfig.endpoint}/auth 400 - invalid password`, async (done) => {
        const { statusCode } = await request(server)
            .post(`${serverConfig.endpoint}/auth`)
            .send({ email: 'max1@moritz.com', password: 'Max123!!?!', token: serverConfig.masterKey })
        
        expect(statusCode).toBe(400)
        done()
    })

    test(`POST ${serverConfig.endpoint}/auth 400`, async (done) => {
        const { body, statusCode, header } = await request(server)
            .post(`${serverConfig.endpoint}/auth`)
            .send({ badRequest: 'sooo bad... muahaha...', token: serverConfig.masterKey })
        
        expect(statusCode).toBe(400)
        expect(header['content-type']).toBe('application/json')
        expect(typeof body).toBe('object')
        done()
    })


    test(`POST /${apiEndpoint} 200 (Header)`, async (done) => {
        const { body, statusCode, header } = await request(server)
            .post(`/${apiEndpoint}`)
            .set('Authorization', 'Bearer ' + token)
        
        expect(statusCode).toBe(200)
        expect(header['content-type']).toBe('application/json')
        expect(typeof body).toBe('object')
        expect(typeof body.content).toBe('string')
        expect(body.content).toBe('Post Success!')
        done()
    })

    test(`POST /${apiEndpoint} 200 (Body)`, async (done) => {
        const { body, statusCode, header } = await request(server)
            .post(`/${apiEndpoint}`)
            .send({ token: token })
        
        expect(statusCode).toBe(200)
        expect(header['content-type']).toBe('application/json')
        expect(typeof body).toBe('object')
        expect(typeof body.content).toBe('string')
        expect(body.content).toBe('Post Success!')
        done()
    })

    test(`POST /${apiEndpoint} 200 (Params)`, async (done) => {
        const { body, statusCode, header } = await request(server)
            .post(`/${apiEndpoint}`)
            .query({ token: token })
        
        expect(statusCode).toBe(200)
        expect(header['content-type']).toBe('application/json')
        expect(typeof body).toBe('object')
        expect(typeof body.content).toBe('string')
        expect(body.content).toBe('Post Success!')
        done()
    })

    test(`POST /${apiEndpoint} 401`, async (done) => {
        const { body, statusCode, header } = await request(server)
            .post(`/${apiEndpoint}`)
        
        expect(statusCode).toBe(401),
        expect(header['content-type']).toBe('application/json')
        expect(body.code).toBe('Unauthorized')
        done()
    })


    test('POST /auth/logout 200', async (done) => {
        const { statusCode } = await request(server)
            .post(`${serverConfig.endpoint}/auth/logout`)
            .set('Authorization', 'Bearer ' + token)
        expect(statusCode).toBe(200)

        await expect(verify(token, secret)).rejects.toThrow(TokenDestroyedError)
        done()
    })
     
    test(`POST /${apiEndpoint}/logout 401`, async (done) => {
        const { statusCode } = await request(server)
            .post(`${serverConfig.endpoint}/auth/logout`)

        expect(statusCode).toBe(401)
        await expect(verify(token, secret)).resolves.not.toThrow(TokenDestroyedError)

        done()
    })

})