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
import { parseOpeningHours } from '~/utils'


let adminUser,
    adminToken,
    shop,
    apiEndpoint = 'test'

// Add routes
beforeAll(async (done) => {
    describe('Add Testrouter', () => {
        const router = new Router()


        router.get('/test/showShop', [doorman(['admin', 'user']), showShop()], (({ shop }, res, next) => {
            try {
                res.json({ shop })
            } catch (error) {
                next(error)
            }
        }))


        router.post('/test/shop', [doorman(['admin', 'user']), addShop()], (({ body }, res, next) => {
            try {
                res.json({ ...body })
            } catch (error) {
                next(error)
            }
        }))

        router.post('/test/shop/nodoorman', addShop(), (({ body }, res, next) => {
            try {
                res.json({ ...body })
            } catch (error) {
                next(error)
            }
        }))


        router.post('/test/author', [doorman(['admin', 'user']), addAuthor()], (({ body }, res, next) => {
            try {
                res.json({ ...body })
            } catch (error) {
                next(error)
            }
        }))

        router.post('/test/author/nodoorman', addAuthor(), (({ body }, res, next) => {
            try {
                res.json({ ...body })
            } catch (error) {
                next(error)
            }
        }))

        router.applyRoutes(server)
    })

    done()
})

beforeEach(async (done) => {

    const parsedOpeningHours = parseOpeningHours(defaultShopData().openingHours)

    adminUser = await User.create({
        name: 'Maximilian',
        email: 'max1@moritz.com',
        password: 'Max123!!!',
        role: 'admin'
    })

    shop = await Shop.create(defaultShopData({ author: adminUser._id, parsedOpeningHours }))

    adminUser.shops.push(shop._id)
    adminUser.activeShop = shop._id

    await adminUser.save()

    // Sign in user
    adminToken = await sign(adminUser)
    expect(isJWT(adminToken)).toBe(true)

    done()
})

describe('modelModifier Test:',  () => {

    test(`GET /${apiEndpoint} 200 showShop`, async (done) => {
        const { body: { shop }, statusCode, header } = await request(server)
            .get(`/${apiEndpoint}/showShop`)
            .set('Authorization', 'Bearer ' + adminToken)

        expect(statusCode).toBe(200)
        expect(header['content-type']).toBe('application/json')
        expect(shop._id).toBe(adminUser.activeShop.toString())

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
