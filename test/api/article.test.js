import request from 'supertest'
import { isJWT } from 'validator'
import server from '~/server'
import { serverConfig } from '~/config'
import Article from '~/api/article/model'
import Category from '~/api/category/model'
import { sign } from '~/services/guard'
import User from '~/api/user/model'
import Shop from '~/api/shop/model'

let defaultArticle, 
    defaultCategory,
    adminToken,
    defaultUser,
    defaultShop,
    defaultToken,
    apiEndpoint = 'articles'

beforeEach(async () => {

    // Create user
    const adminUser = await User.create({ name: 'Maximilian', email: 'max1@moritz.com', password: 'Max123!!!', role: 'admin' })
    defaultUser = await User.create({ name: 'Maximilian', email: 'max2@moritz.com', password: 'Max123!!!', role: 'user' })

    defaultShop = await Shop.create({
        name: 'shopname', 
        size: 5, 
        category: 'clothing', 
        contact: { 
            phone: 12345 
        }, companyType: 'EU', 
        author: adminUser._id, 
        address: { 
            label: 'Goethestraße 26, 76135 Karlsruhe, Deutschland', 
            city: 'Karlsruhe', 
            country: 'DEU', 
            county: 'Karlsruhe (Stadt)', 
            district: 'Weststadt', 
            houseNumber: 26, 
            locationId: 'NT_0OLEZjK0pT1GkekbvJmsHC_yYD', 
            state: 'Baden-Württemberg', 
            street: 'Goethestrasse', 
            postalCode: 76135 
        },
        deliveryOptions: ['PU']
    })
    
    defaultUser.shops.push(defaultShop._id)
    defaultUser.activeShop = defaultShop._id
    defaultUser.save()

    defaultCategory = await Category.create({ name: 'things', author: defaultUser._id, shop: defaultShop._id } )
    
    defaultArticle = await Article.create({
        name: 'kebab',
        articleNumber: '12345',
        stock: 3,
        price: 4,
        size: 'thicc',
        currency: 'Euro',
        category: defaultCategory._id,
        author: defaultUser._id,
        shop: defaultShop._id
    })
    
    const view = defaultArticle.modelProjection()
    expect(view.updatedAt).toBeUndefined()
    expect(view.name).toBe('kebab')
    expect(view.articleNumber).toBe('12345')
    expect(view.stock).toBe(3)
    expect(view.price).toBe(4)
    expect(view.size).toBe('thicc')
    expect(view.currency).toBe('Euro')
    
    // Sign in user
    adminToken = await sign(adminUser)
    expect(isJWT(adminToken)).toBe(true)
    
    defaultToken = await sign(defaultUser)
    expect(isJWT(defaultToken)).toBe(true)
    
})

describe(`Test /${apiEndpoint} endpoint:`, () => {

    test(`GET /${apiEndpoint} 200`, async () => {
        const {statusCode, body} = await request(server)
            .get(`${serverConfig.endpoint}/${apiEndpoint}?categoryId=${defaultCategory._id}`)
            .set('Authorization', 'Bearer ' + defaultToken)
        
        expect(statusCode).toBe(200)
        expect(Array.isArray(body)).toBe(true)

    })

    test(`GET /${apiEndpoint}:id 200`, async () => {
        const { status, body } = await request(server)
            .get(`${serverConfig.endpoint}/${apiEndpoint}/${defaultArticle._id}`)
            .set('Authorization', 'Bearer ' + defaultToken)

        expect(status).toBe(200)
        expect(typeof body).toEqual('object')
    })

    test(`GET /${apiEndpoint}/:id 404`, async () => {
        const { status } = await request(server)
            .get(`${serverConfig.endpoint}/${apiEndpoint}/123456789098765432123456`)
            .set('Authorization', 'Bearer ' + defaultToken)
        
        expect(status).toBe(404)
    })
    test(`POST /${apiEndpoint} 201`, async () => {


        const { status, body } = await request(server)
            .post(`${serverConfig.endpoint}/${apiEndpoint}`)
            .set('Authorization', 'Bearer ' + defaultToken)
            .send({
                name: 'kebab',
                articleNumber: '12345',
                stock: 3,
                price: 4,
                size: 'thicc',
                currency: 'Euro',
                category: defaultCategory._id,
                author: defaultUser._id,
            })

        expect(status).toBe(201)
        expect(typeof body).toEqual('object')
    })

    test(`PATCH /${apiEndpoint}/:id 200`, async () => {
        const { status, body } = await request(server)
            .patch(`${serverConfig.endpoint}/${apiEndpoint}/${defaultArticle._id}`)
            .set('Authorization', 'Bearer ' + defaultToken)
            .send({ price: 4 })
        
        expect(status).toBe(200)
        expect(typeof body).toEqual('object')
        expect(body.price).toEqual(4)
    })

         
    test(`PATCH /${apiEndpoint}/:id 404`, async () => {
        const { status } = await request(server)
            .patch(`${serverConfig.endpoint}/${apiEndpoint}/123456789098765432123456`)
            .set('Authorization', 'Bearer ' + defaultToken)
            .send({ description: 'test' })
        
        expect(status).toBe(404)
    })
    
    test(`DELETE /${apiEndpoint}/:id 200`, async () => {
        const { status } = await request(server)
            .delete(`${serverConfig.endpoint}/${apiEndpoint}/${defaultArticle._id}`)
            .set('Authorization', 'Bearer ' + defaultToken)

        expect(status).toBe(200)
    })
    
    test(`DELETE /${apiEndpoint}/:id 404`, async () => {
        const { status } = await request(server)
            .delete(`${serverConfig.endpoint}/${apiEndpoint}/123456789098765432123456`)
            .set('Authorization', 'Bearer ' + defaultToken)
    
        expect(status).toBe(404)
    })


})