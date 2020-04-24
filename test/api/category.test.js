import request from 'supertest'
import { isJWT } from 'validator'
import server from '~/server'
import { serverConfig } from '~/config'
import Model from '~/api/category/model'
import { sign } from '~/services/guard'
import User from '~/api/user/model'
import Shop from '~/api/shop/model'

let dataObject, 
    adminToken,
    defaultShop, 
    defaultUser,
    defaultToken,
    apiEndpoint = 'categories'

beforeEach(async (done) => {

    // Create user
    const adminUser = new User({ name: 'Maximilian', email: 'max1@moritz.com', password: 'Max123!!!', role: 'admin' })
    defaultUser = new User({ name: 'Maximilian', email: 'max2@moritz.com', password: 'Max123!!!', role: 'user' })

    defaultShop = await Shop.create({ name: 'shopname', size: 3, category: 'clothing', contact: { phone: 12345 }, companyType: 'EU', author: adminUser._id, address: { label: 'Goethestraße 26, 76135 Karlsruhe, Deutschland', city: 'Karlsruhe', country: 'DEU', county: 'Karlsruhe (Stadt)', district: 'Weststadt', houseNumber: 26, locationId: 'NT_0OLEZjK0pT1GkekbvJmsHC_yYD', state: 'Baden-Württemberg', street: 'Goethestrasse', postalCode: 76135 } })

    // Create object
    dataObject = await Model.create({ name: 'test_category', shop: defaultShop._id, author: defaultUser._id })
    
    
    // Sign in user
    adminToken = await sign(adminUser)
    expect(isJWT(adminToken)).toBe(true)
    
    defaultToken = await sign(defaultUser)
    expect(isJWT(defaultToken)).toBe(true)
    
    done()
})

describe(`Test /${apiEndpoint} endpoint:`, () => {

    test(`GET /${apiEndpoint} 200`, async () => {
        const {statusCode, body} = await request(server)
            .get(`${serverConfig.endpoint}/${apiEndpoint}`)
            .set('Authorization', 'Bearer ' + defaultToken)

        const firstItem = body[0]
        
        expect(statusCode).toBe(200)
        expect(Array.isArray(body)).toBe(true)
        expect(typeof firstItem.name).toEqual('string')
        expect(firstItem.name).toEqual(dataObject.name)
        expect(firstItem.id).toBeTruthy()
        expect(firstItem.updatedAt).toBeUndefined()
    })

    test(`GET /${apiEndpoint}:id 200`, async () => {
        const { status, body } = await request(server)
            .get(`${serverConfig.endpoint}/${apiEndpoint}/${dataObject.id}`)
            .set('Authorization', 'Bearer ' + defaultToken)
        
        expect(status).toBe(200)
        expect(typeof body).toEqual('object')
        expect(body.name).toEqual(dataObject.name)
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
            .send({ name: 'hello world', shop: defaultShop._id, author: defaultUser._id })
        
        expect(status).toBe(201)
        expect(typeof body).toEqual('object')
        expect(body.name).toEqual('hello world')
    })
    
    test(`PATCH /${apiEndpoint}/:id 200`, async () => {
        const { status, body } = await request(server)
            .patch(`${serverConfig.endpoint}/${apiEndpoint}/${dataObject.id}`)
            .set('Authorization', 'Bearer ' + defaultToken)
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
    
    test(`DELETE /${apiEndpoint}/:id 200`, async () => {
        const { status } = await request(server)
            .delete(`${serverConfig.endpoint}/${apiEndpoint}/${dataObject.id}`)
            .set('Authorization', 'Bearer ' + defaultToken)

        expect(status).toBe(200)
    })

    test(`DELETE /${apiEndpoint}/:id 404`, async () => {
        const { status } = await request(server)
            .delete(`${serverConfig.endpoint}/${apiEndpoint}/123456789098765432123456`)
            .set('Authorization', 'Bearer ' + defaultToken)
        
        expect(status).toBe(404)
    })

    test(`DELETE /${apiEndpoint}/all 401`, async () => {
        const { status, body } = await request(server)
            .delete(`${serverConfig.endpoint}/${apiEndpoint}/all`)
            .set('Authorization', 'Bearer ' + defaultToken)
        
        expect(status).toBe(401)
        expect(body.code).toBe('Unauthorized')
    })

    test(`DELETE /${apiEndpoint}/all 200`, async () => {
        const { status } = await request(server)
            .delete(`${serverConfig.endpoint}/${apiEndpoint}/all`)
            .set('Authorization', 'Bearer ' + adminToken)

        expect(status).toBe(200)
    })

    test(`DELETE /${apiEndpoint}/all 401`, async () => {
        const { status } = await request(server)
            .delete(`${serverConfig.endpoint}/${apiEndpoint}/all`)
            .set('Authorization', 'Bearer ' + defaultToken)

        expect(status).toBe(401)
    })
    

})