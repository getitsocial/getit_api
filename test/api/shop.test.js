import request from 'supertest'
import { isJWT } from 'validator'
import Model from '~/api/shop/model'
import User from '~/api/user/model'
import { serverConfig } from '~/config'
import server from '~/server'
import { sign } from '~/services/guard'


let dataObject, 
    adminUser,
    adminToken,
    defaultUser,
    defaultToken,
    apiEndpoint = 'shops'

beforeEach(async (done) => {
    
    // Create user
    adminUser = await User.create({ name: 'Maximilian', email: 'max1@moritz.com', password: 'Max123!!!', role: 'admin' })
    defaultUser = await User.create({ name: 'Maximilian', email: 'max2@moritz.com', password: 'Max123!!!', role: 'user' })
   
    // Create object
    dataObject = await Model.create({ name: 'shopname', size: 3, category: 'clothing', contact: { phone: 12345 }, companyType: 'EU', author: defaultUser._id, address: { label: 'Goethestraße 26, 76135 Karlsruhe, Deutschland', city: 'Karlsruhe', country: 'DEU', county: 'Karlsruhe (Stadt)', district: 'Weststadt', houseNumber: 26, locationId: 'NT_0OLEZjK0pT1GkekbvJmsHC_yYD', state: 'Baden-Württemberg', street: 'Goethestrasse', postalCode: 76135 } })
    
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
        expect(typeof body.polygonCoordinates).toEqual('object')
        expect(Array.isArray(body.polygonCoordinates.coordinates)).toBe(true)
        expect(body.address.display).toEqual('Goethestrasse 26, 76135 Karlsruhe')

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
            .send({ name: 'shopname_9', size: 3, category: 'clothing', contact: { phone: 12345 }, companyType: 'EU', author: defaultUser._id, address: { label: 'label', city: 'city', country: 'country', county: 'county', district: 'district', houseNumber: 26, locationId: 'NT_0OLEZjK0pT1GkekbvJmsHC_yYD', state: 'state', street: 'street', postalCode: 76135 } })
        
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

        expect(status).toBe(204)
    })

    test(`DELETE /${apiEndpoint}/:id 404`, async () => {
        const { status } = await request(server)
            .delete(`${serverConfig.endpoint}/${apiEndpoint}/123456789098765432123456`)
            .set('Authorization', 'Bearer ' + defaultToken)

        expect(status).toBe(400)
    })

})