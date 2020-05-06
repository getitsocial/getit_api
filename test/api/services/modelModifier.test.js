import 'dotenv/config'
import request from 'supertest'
import server from '~/server'
import { sign, doorman } from '~/services/guard'
import { isJWT } from 'validator'
import { Router } from 'restify-router'
import { addShop, addAuthor, showShop } from '~/services/modelModifier'
import User from '~/api/user/model'
import Shop from '~/api/shop/model'
import { defaultShopData } from '../data'


let adminUser,
    adminToken,
    defaultToken,
    shop,
    apiEndpoint = 'test'

beforeAll(async (done) => {

    const router = new Router()

    router.get('/test/showShop', [doorman(['admin', 'user']), showShop()], ((req, res, next) => {
        try {
            next(res.json({ shop }))
        } catch (error) {      
            next(error)
        }
    }))
        
    router.get('/test/showShop/nodoorman', [showShop()], ((req, res, next) => {
        try {
            next(res.json({ shop }))
        } catch (error) {      
            next(error)
        }
    }))
        

    router.post('/test/shop', [doorman(['admin', 'user']), addShop()], (({ body }, res, next) => {
        try {
            next(res.json({ ...body }))
        } catch (error) {      
            next(error)
        }
    }))

    router.post('/test/shop/nodoorman', addShop(), (({ body }, res, next) => {
        try {
            next(res.json({ ...body }))
        } catch (error) {      
            next(error)
        }
    }))


    router.post('/test/author', [doorman(['admin', 'user']), addAuthor()], (({ body }, res, next) => {
        try {
            next(res.json({ ...body }))
        } catch (error) {      
            next(error)
        }
    }))

    router.post('/test/author/nodoorman', addAuthor(), (({ body }, res, next) => {
        try {
            next(res.json({ ...body }))
        } catch (error) {      
            next(error)
        }
    }))

    router.applyRoutes(server)
    done()
})

beforeEach(async (done) => {

    const defaultUser = await User.create({ name: 'Maximilian', email: 'max42@moritz.com', password: 'Max123!!!', role: 'admin' })

    adminUser = await User.create({ name: 'Maximilian', email: 'max1@moritz.com', password: 'Max123!!!', role: 'admin' })
    shop = await Shop.create(defaultShopData({ author: adminUser._id }))

    adminUser.shops.push(shop._id)
    adminUser.activeShop = shop._id
    await adminUser.save()

    // Sign in user
    adminToken = await sign(adminUser)
    expect(isJWT(adminToken)).toBe(true)
    done()

    // Sign in user
    defaultToken = await sign(defaultUser)
    expect(isJWT(defaultToken)).toBe(true)
    done()    
    
})

describe('modelModifier Test:',  () => {

    test(`GET /${apiEndpoint} 200 showShop`, async (done) => {
        const { body, statusCode, header } = await request(server)
            .get(`/${apiEndpoint}/showShop`)
            .set('Authorization', 'Bearer ' + adminToken)

        expect(statusCode).toBe(200)
        expect(header['content-type']).toBe('application/json')
        expect(body.shop._id).toBe(adminUser.activeShop.toString()) 

        done()
    })

    test(`GET /${apiEndpoint} 401 showShop missing token`, async (done) => {
        const { statusCode } = await request(server)
            .get(`/${apiEndpoint}/showShop`)

        expect(statusCode).toBe(401)
        done()
    })

    test(`GET /${apiEndpoint} 401 showShop no doorman`, async (done) => {
        const { statusCode } = await request(server)
            .get(`/${apiEndpoint}/showShop/nodoorman`)
            .set('Authorization', 'Bearer ' + adminToken)
            
        expect(statusCode).toBe(401)
        done()
    })

    test(`POST /${apiEndpoint} 200 addShop`, async (done) => {
        const { body, statusCode, header } = await request(server)
            .post(`/${apiEndpoint}/shop`)
            .set('Authorization', 'Bearer ' + adminToken)
            .send({ hello: 'there' })

        
        expect(statusCode).toBe(200)
        expect(header['content-type']).toBe('application/json')
        expect(body.shop).toBe(shop._id.toString()) 

        done()
    })

    test(`POST /${apiEndpoint} 200 addAuthor`, async (done) => {
        const { body, statusCode, header } = await request(server)
            .post(`/${apiEndpoint}/author`)
            .set('Authorization', 'Bearer ' + adminToken)
            .send({ hello: 'there' })
            
        expect(statusCode).toBe(200)
        expect(header['content-type']).toBe('application/json')
        expect(body.author._id).toBe(adminUser._id.toString()) 

        done()
    })

    test(`POST /${apiEndpoint} 401 addAuthor`, async (done) => {
        const { statusCode } = await request(server)
            .post(`/${apiEndpoint}/author/nodoorman`)
            .set('Authorization', 'Bearer ' + adminToken)
            .send({ hello: 'there' })
            
        expect(statusCode).toBe(401)
        done()
    })

    test(`POST /${apiEndpoint} 401 addShop`, async (done) => {
        const { statusCode } = await request(server)
            .post(`/${apiEndpoint}/shop/nodoorman`)
            .set('Authorization', 'Bearer ' + adminToken)
            .send({ hello: 'there' })
            
        expect(statusCode).toBe(401)
        done()
    })

    test(`POST /${apiEndpoint} 400 addShop`, async (done) => {
        const { statusCode } = await request(server)
            .post(`/${apiEndpoint}/shop`)
            .set('Authorization', 'Bearer ' + adminToken)

        
        expect(statusCode).toBe(400)

        done()
    })

    test(`POST /${apiEndpoint} 400 addAuthor`, async (done) => {
        const { statusCode } = await request(server)
            .post(`/${apiEndpoint}/author`)
            .set('Authorization', 'Bearer ' + adminToken)

        expect(statusCode).toBe(400)

        done()
    })
 
})
