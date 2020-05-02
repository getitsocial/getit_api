import 'dotenv/config'
import request from 'supertest'
import server from '~/server'
import { sign, doorman } from '~/services/guard'
import { isJWT } from 'validator'
import { Router } from 'restify-router'
import { addShop, addAuthor } from '~/services/modelModifier'
import User from '~/api/user/model'
import Shop from '~/api/shop/model'


let adminUser,
    adminToken,
    shop,
    apiEndpoint = 'test'

beforeAll(async (done) => {

    adminUser = await User.create({ name: 'Maximilian', email: 'max1@moritz.com', password: 'Max123!!!', role: 'admin' })

    shop = await Shop.create({ 
        name: 'shopname', 
        size: 5, 
        category: 'clothing',
        contact: { 
            phone: 12345
        }, 
        companyType: 'EU',
        author: adminUser._id,
        address: { 
            label: 'Goethestraße 26, 76135 Karlsruhe, Deutschland',
            city: 'Karlsruhe',
            country: 'DEU', 
            county: 'Karlsruhe (Stadt)',
            district: 'Weststadt',
            houseNumber: 4,
            locationId: 'NT_0OLEZjK0pT1GkekbvJmsHC_yYD', 
            state: 'Baden-Württemberg', 
            street: 'Goethestrasse 26', 
            postalCode: 76135 
        },
        deliveryOptions: ['PU']
    })

    adminUser.shops.push(shop._id)
    adminUser.activeShop = shop._id
    await adminUser.save()

    // Sign in user
    adminToken = await sign(adminUser)
    expect(isJWT(adminToken)).toBe(true)

 
    describe('Add Testrouter', () => {
        const router = new Router()

        router.post('/test/shop', [doorman(['admin', 'user']), addShop()], (({ body }, res, next) => {
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

        router.post('/test/shop/nodoorman', addShop(), (({ body }, res, next) => {
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
describe('modelModifier Test:',  () => {

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
