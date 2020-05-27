import 'dotenv/config'
import request from 'supertest'
import server from '~/server'
import { sign, doorman } from '~/services/guard'
import { isJWT } from 'validator'
import { Router } from 'restify-router'
import { addShop, addAuthor } from '~/services/requestModifier'
import User from '!/user'
import Shop from '!/shop'
import { defaultShopData } from '../api/data'
import { parseOpeningHours } from '~/utils'

let adminUser,
    defaultUser,
    defaultToken,
    adminToken,
    shop,
    apiEndpoint = 'test'

// Add routes
beforeAll(async (done) => {
    describe('Add Testrouter', () => {
        const router = new Router()

        router.get('/test/addShop/required',
            [doorman(['admin', 'user']), addShop()],
            (({ shop }, res, next) => {
                try {
                    res.json({ shop })
                } catch (error) {
                    next(error)
                }
            }))

        router.get('/test/addShop',
            [doorman(['admin', 'user']), addShop({ required: false })],
            (({ shop }, res, next) => {
                try {
                    res.json({ shop })
                } catch (error) {
                    next(error)
                }
            }))

        router.get('/test/addAuthor',
            [doorman(['admin', 'user']), addAuthor()],
            (({ author }, res, next) => {
                try {
                    res.json({ author })
                } catch (error) {
                    next(error)
                }
            }))

        router.get('/test/addAuthor/nodoorman',
            [addAuthor({ required: false })],
            (({ author }, res, next) => {
                try {
                    res.json({ author })
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

    defaultUser = await User.create({
        name: 'Maximilian',
        email: 'max2@moritz.com',
        password: 'Max123!!!',
        role: 'user'
    })

    shop = await Shop.create(defaultShopData({ author: adminUser._id, parsedOpeningHours }))

    adminUser.shops.push(shop._id)
    adminUser.activeShop = shop._id

    await adminUser.save()

    // Sign in user
    adminToken = await sign(adminUser)
    expect(isJWT(adminToken)).toBe(true)

    defaultToken = await sign(defaultUser)
    expect(isJWT(defaultToken)).toBe(true)


    done()
})

describe('requestModifier Test addShop',  () => {

    test(`GET /${apiEndpoint} 200 addShop required`, async (done) => {
        const { body, statusCode, header } = await request(server)
            .get(`/${apiEndpoint}/addShop/required`)
            .set('Authorization', 'Bearer ' + adminToken)

        expect(statusCode).toBe(200)
        expect(header['content-type']).toBe('application/json')
        expect(body.shop._id).toBe(shop._id.toString())
        done()
    })

    test(`GET /${apiEndpoint} 400 addShop required`, async (done) => {
        const { statusCode, header } = await request(server)
            .get(`/${apiEndpoint}/addShop/required`)
            .set('Authorization', 'Bearer ' + defaultToken)

        expect(statusCode).toBe(400)
        expect(header['content-type']).toBe('application/json')
        done()
    })

    test(`GET /${apiEndpoint} 200 addShop not required`, async (done) => {
        const { body, statusCode, header } = await request(server)
            .get(`/${apiEndpoint}/addShop`)
            .set('Authorization', 'Bearer ' + adminToken)

        expect(statusCode).toBe(200)
        expect(header['content-type']).toBe('application/json')
        expect(body.shop._id).toBe(shop._id.toString())
        done()
    })

    test(`GET /${apiEndpoint} 200 addShop not required`, async (done) => {
        const { body, statusCode, header } = await request(server)
            .get(`/${apiEndpoint}/addShop`)
            .set('Authorization', 'Bearer ' + defaultToken)

        expect(statusCode).toBe(200)
        expect(header['content-type']).toBe('application/json')
        expect(body.shop).toBeUndefined()
        done()
    })

})



describe('requestModifier Test addAuthor',  () => {

    test(`GET /${apiEndpoint} 200 addAuthor`, async (done) => {
        const { body, statusCode, header } = await request(server)
            .get(`/${apiEndpoint}/addAuthor`)
            .set('Authorization', 'Bearer ' + adminToken)

        expect(statusCode).toBe(200)
        expect(header['content-type']).toBe('application/json')
        expect(body.author).toBe(adminUser._id.toString())
        done()
    })

    test(`GET /${apiEndpoint} 500 addAuthor missing doorman`, async (done) => {
        const { statusCode } = await request(server)
            .get(`/${apiEndpoint}/addAuthor/nodoorman`)
            .set('Authorization', 'Bearer ' + adminToken)

        expect(statusCode).toBe(500)
        done()
    })

})
