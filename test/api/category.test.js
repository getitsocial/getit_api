import request from 'supertest'
import { isJWT } from 'validator'
import server from '~/server'
import { serverConfig } from '~/config'
import Category from '~/api/category/model'
import { sign } from '~/services/guard'
import User from '~/api/user/model'
import Shop from '~/api/shop/model'
import Article from '~/api/article/model'
import { defaultShopData, defaultArticleData } from './data'

let defaultCategory,
    adminCategory,
    adminToken,
    defaultShop, 
    defaultUser,
    adminUser,
    defaultToken,
    apiEndpoint = 'categories'

beforeEach(async (done) => {

    // Create user
    adminUser = await User.create({ name: 'Maximilian', email: 'max1@moritz.com', password: 'Max123!!!', role: 'admin' })
    defaultUser =  await User.create({ name: 'Maximilian', email: 'max2@moritz.com', password: 'Max123!!!', role: 'user' })

    defaultShop = await Shop.create(defaultShopData({ author: defaultUser._id }))
    // Create object
    defaultUser.activeShop = defaultShop._id
    defaultUser.shops.push(defaultShop._id)
    await defaultUser.save()

    adminCategory = await Category.create({ name: 'test_category', author: adminUser._id, shop: defaultShop._id })

    defaultCategory = await Category.create({ name: 'test_category', author: defaultUser._id, shop: defaultShop._id })
    await Category.create({ name: 'test_category_1', author: defaultUser._id, shop: defaultShop._id })
    
    // Sign in user
    adminToken = await sign(adminUser)
    expect(isJWT(adminToken)).toBe(true)
    
    defaultToken = await sign(defaultUser)
    expect(isJWT(defaultToken)).toBe(true)
    
    done()
})

test('Remove articles when deleting a category', async () => {
    const removeCategory = await Category.create({ name: 'test_category', author: defaultUser._id, shop: defaultShop._id })

    const defaultArticle = await Article.create(defaultArticleData({ category: removeCategory._id, author: defaultUser._id, shop: defaultShop._id }))

    await removeCategory.remove()

    expect(await Article.findById(defaultArticle._id)).toBeNull()

})

describe(`Test /${apiEndpoint} endpoint:`, () => {

    test(`GET /${apiEndpoint} 200`, async () => {
        const { statusCode, body } = await request(server)
            .get(`${serverConfig.endpoint}/${apiEndpoint}`)
            .set('Authorization', 'Bearer ' + defaultToken)
        const firstItem = body.rows[0]

        expect(body.count).toBe(3)
        expect(body.rows.length).toBe(3)
        expect(statusCode).toBe(200)
        expect(Array.isArray(body.rows)).toBe(true)
        expect(typeof firstItem.name).toEqual('string')
        expect(firstItem.name).toEqual(defaultCategory.name)
        expect(firstItem._id).toBeTruthy()
        expect(firstItem.updatedAt).toBeUndefined()
    })

    test(`GET /${apiEndpoint} 200`, async () => {
        const { statusCode, body } = await request(server)
            .get(`${serverConfig.endpoint}/${apiEndpoint}?page=1&limit=1`)
            .set('Authorization', 'Bearer ' + defaultToken)

        expect(body.rows.length).toBe(1)
        expect(statusCode).toBe(200)
        expect(Array.isArray(body.rows)).toBe(true)
    })

    test(`GET /${apiEndpoint} 200`, async () => {
        const { statusCode, body } = await request(server)
            .get(`${serverConfig.endpoint}/${apiEndpoint}?limit=1`)
            .set('Authorization', 'Bearer ' + defaultToken)

        expect(body.rows.length).toBe(1)
        expect(statusCode).toBe(200)
        expect(Array.isArray(body.rows)).toBe(true)
    })

    test(`GET /${apiEndpoint} 200`, async () => {
        const { statusCode, body } = await request(server)
            .get(`${serverConfig.endpoint}/${apiEndpoint}?page=1`)
            .set('Authorization', 'Bearer ' + defaultToken)

        expect(body.rows.length).toBe(3)
        expect(statusCode).toBe(200)
        expect(Array.isArray(body.rows)).toBe(true)
    })

    test(`GET /${apiEndpoint} 400 - no id`, async () => {
        const { statusCode } = await request(server)
            .get(`${serverConfig.endpoint}/${apiEndpoint}`)
            .set('Authorization', 'Bearer ' + adminToken)

        expect(statusCode).toBe(400)
    })
    
    test(`GET /${apiEndpoint}:id 401`, async () => {
        const { status } = await request(server)
            .get(`${serverConfig.endpoint}/${apiEndpoint}/${defaultCategory._id}`)
        
        expect(status).toBe(401)
    })
    
    test(`GET /${apiEndpoint}:id 200`, async () => {
        const { status, body } = await request(server)
            .get(`${serverConfig.endpoint}/${apiEndpoint}/${defaultCategory._id}`)
            .set('Authorization', 'Bearer ' + defaultToken)
        
        expect(status).toBe(200)
        expect(typeof body).toEqual('object')
        expect(body.updatedAt).toBeUndefined() // make sure that modelProjection is somehow working
        expect(body.name).toEqual(defaultCategory.name)
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
            .send({ name: 'hello world' })
        expect(status).toBe(201)
        expect(typeof body).toEqual('object')
        expect(body.name).toEqual('hello world')
    })

    test(`POST /${apiEndpoint} 201`, async () => {
        const { status } = await request(server)
            .post(`${serverConfig.endpoint}/${apiEndpoint}`)
            .set('Authorization', 'Bearer ' + adminToken)
            .send({ name: 'hello world' })
        expect(status).toBe(400)
    })

    test(`PATCH /${apiEndpoint}/:id 200`, async () => {
        const { status, body } = await request(server)
            .patch(`${serverConfig.endpoint}/${apiEndpoint}/${defaultCategory._id}`)
            .set('Authorization', 'Bearer ' + defaultToken)
            .send({ name: 'newname' })
        
        expect(status).toBe(200)
        expect(typeof body).toEqual('object')
        expect(body.name).toEqual('newname')
    })

    test(`PATCH /${apiEndpoint}/:id 200`, async () => {
        const { status, body } = await request(server)
            .patch(`${serverConfig.endpoint}/${apiEndpoint}/${defaultCategory._id}`)
            .set('Authorization', 'Bearer ' + adminToken)
            .send({ name: 'newname' })
        
        expect(status).toBe(200)
        expect(typeof body).toEqual('object')
        expect(body.name).toEqual('newname')
    })

    test(`PATCH /${apiEndpoint}/:id 404`, async () => {
        const { status } = await request(server)
            .patch(`${serverConfig.endpoint}/${apiEndpoint}/123456789098765432123456`)
            .set('Authorization', 'Bearer ' + defaultToken)
            .send({ name: 'test' })
        
        expect(status).toBe(404)
    })
    
    test(`PATCH /${apiEndpoint}/:id 401`, async () => {
        const { status } = await request(server)
            .patch(`${serverConfig.endpoint}/${apiEndpoint}/${adminCategory._id}`)
            .set('Authorization', 'Bearer ' + defaultToken)
            .send({ name: 'test' })
        
        expect(status).toBe(401)
    })

    test(`PATCH /${apiEndpoint}/:id 401`, async () => {
        const { status } = await request(server)
            .patch(`${serverConfig.endpoint}/${apiEndpoint}/${defaultCategory._id}`)
            .send({ name: 'test' })
        
        expect(status).toBe(401)
    })

    test(`DELETE /${apiEndpoint}/:id 204`, async () => {
        const { status } = await request(server)
            .delete(`${serverConfig.endpoint}/${apiEndpoint}/${defaultCategory._id}`)
            .set('Authorization', 'Bearer ' + defaultToken)

        expect(status).toBe(204)
    })

    test(`DELETE /${apiEndpoint}/:id 204`, async () => {
        const { status } = await request(server)
            .delete(`${serverConfig.endpoint}/${apiEndpoint}/${defaultCategory._id}`)
            .set('Authorization', 'Bearer ' + adminToken)

        expect(status).toBe(204)
    })

    test(`DELETE /${apiEndpoint}/:id 401`, async () => {
        const { status } = await request(server)
            .delete(`${serverConfig.endpoint}/${apiEndpoint}/${adminCategory._id}`)
            .set('Authorization', 'Bearer ' + defaultToken)

        expect(status).toBe(401)
    })

    test(`DELETE /${apiEndpoint}/:id 404`, async () => {
        const { status } = await request(server)
            .delete(`${serverConfig.endpoint}/${apiEndpoint}/123456789098765432123456`)
            .set('Authorization', 'Bearer ' + defaultToken)
        
        expect(status).toBe(404)
    })

})