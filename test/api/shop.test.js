import request from 'supertest'
import { isJWT } from 'validator'
import server from '~/server'
import { serverConfig } from '~/config'
import Model from '~/api/shop/model'
import { sign } from '~/services/guard'
import User from '~/api/user/model'


let dataObject, 
    adminToken,
    defaultUser,
    defaultToken,
    apiEndpoint = 'shops'

beforeEach(async (done) => {
    
    // Create user
    const adminUser = new User({ name: 'Maximilian', email: 'max1@moritz.com', password: 'Max123!!!', role: 'admin' })
    defaultUser = new User({ name: 'Maximilian', email: 'max2@moritz.com', password: 'Max123!!!', role: 'user' })
   
    // Create object
    dataObject = await Model.create({ name: 'shopname', category: 'clothing', contact: { tel: 12345, email: 'me@domain.de', address: { city: 'pfungstadt', street: 'my street', zip: 64319, number: 42 }}, user: defaultUser._id })
    
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
        expect(firstItem.id).toBeTruthy()
        expect(firstItem.updatedAt).toBeUndefined()
    })
 
    test(`GET /${apiEndpoint}:id 200`, async () => {
        const { status, body } = await request(server)
            .get(`${serverConfig.endpoint}/${apiEndpoint}/${dataObject._id}`)
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
            .send({ name: 'shopname', category: 'clothing', contact: { tel: 12345, email: 'me@domain.de', address: { city: 'pfungstadt', street: 'my street', zip: 64319, number: 42 }}, user: defaultUser._id })
        
        expect(status).toBe(201)
        expect(typeof body).toEqual('object')
    })
    
    test(`PATCH /${apiEndpoint}/:id 200`, async () => {
        const { status, body } = await request(server)
            .patch(`${serverConfig.endpoint}/${apiEndpoint}/${dataObject._id}`)
            .set('Authorization', 'Bearer ' + defaultToken)
            .send({ contact: { tel: 42}})
        
        expect(status).toBe(200)
        expect(typeof body).toEqual('object')
    })

    test(`PATCH /${apiEndpoint}/:id 404`, async () => {
        const { status } = await request(server)
            .patch(`${serverConfig.endpoint}/${apiEndpoint}/123456789098765432123456`)
            .set('Authorization', 'Bearer ' + defaultToken)
            .send({ contact: { tel: 42}})
        
        expect(status).toBe(404)
    })
    
    test(`DELETE /${apiEndpoint}/:id 200`, async () => {
        const { status } = await request(server)
            .delete(`${serverConfig.endpoint}/${apiEndpoint}/${dataObject._id}`)
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
        const { status, body, header } = await request(server)
            .delete(`${serverConfig.endpoint}/${apiEndpoint}/all`)
            .set('Authorization', 'Bearer ' + defaultToken)

        expect(status).toBe(401)
        expect(header['content-type']).toBe('application/json')
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