import request from 'supertest'
import { isJWT } from 'validator'
import Model from '~/api/shop/model'
import User from '~/api/user/model'
import { serverConfig } from '~/config'
import server from '~/server'
import { sign } from '~/services/guard'


let dataObject,
    dataObject1,
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
    dataObject = await Model.create({ name: 'shopname', size: 3, logo: { url: 'https://i.picsum.photos/id/368/200/300.jpg' }, category: 'clothing', contact: { phone: 12345 }, companyType: 'EU', author: defaultUser._id, address: { label: 'Goethestraße 26, 76135 Karlsruhe, Deutschland', city: 'Karlsruhe', country: 'DEU', county: 'Karlsruhe (Stadt)', district: 'Weststadt', houseNumber: 26, locationId: 'NT_0OLEZjK0pT1GkekbvJmsHC_yYD', state: 'Baden-Württemberg', street: 'Goethestrasse', postalCode: 76135 } })
    dataObject1 = await Model.create({ name: 'shopname_1', size: 3, logo: { url: 'https://i.picsum.photos/id/368/200/300.jpg' }, category: 'clothing', contact: { phone: 12345 }, companyType: 'EU', author: adminUser._id, address: { label: 'Goethestraße 26, 76135 Karlsruhe, Deutschland', city: 'Karlsruhe', country: 'DEU', county: 'Karlsruhe (Stadt)', district: 'Weststadt', houseNumber: 26, locationId: 'NT_0OLEZjK0pT1GkekbvJmsHC_yYD', state: 'Baden-Württemberg', street: 'Goethestrasse', postalCode: 76135 } })

    defaultUser.activeShop = dataObject._id
    defaultUser.shops.push(dataObject._id)
    await defaultUser.save()

    adminUser.shops.push(dataObject._id)
    await adminUser.save()

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
        expect(firstItem._id).toBeTruthy()
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
        expect((await User.findById(defaultUser._id)).activeShop.toString()).toBe(body._id)
        expect((await User.findById(defaultUser._id)).shops.includes(body._id)).toBe(true)
        
    })
    
    test(`PATCH /${apiEndpoint}/:id 200`, async () => {
        const { status, body } = await request(server)
            .patch(`${serverConfig.endpoint}/${apiEndpoint}/${dataObject._id}`)
            .set('Authorization', 'Bearer ' + defaultToken)
            .send({ contact: { phone: 42 }})
        expect(status).toBe(200)
        expect(typeof body).toEqual('object')
        expect(body.contact.phone).toEqual('42')
        // make sure that if logo is undefined we dont set the placeholder logo
        expect(body.logo.url).not.toEqual('/api/static/placeholder.png')
    })

    test(`PATCH /${apiEndpoint}/:id 200 admin patch`, async () => {
        const { status, body } = await request(server)
            .patch(`${serverConfig.endpoint}/${apiEndpoint}/${dataObject._id}`)
            .set('Authorization', 'Bearer ' + adminToken)
            .send({ contact: { phone: 42 }})
        expect(status).toBe(200)
        expect(typeof body).toEqual('object')
        expect(body.contact.phone).toEqual('42')
        // make sure that if logo is undefined we dont set the placeholder logo
        expect(body.logo.url).not.toEqual('/api/static/placeholder.png')
    })


    test(`PATCH /${apiEndpoint}/:id 200 Delete logo`, async () => {
        const { body, status } = await request(server)
            .patch(`${serverConfig.endpoint}/${apiEndpoint}/${dataObject._id}`)
            .set('Authorization', 'Bearer ' + defaultToken)
            .send({ logo: {} })

        expect(status).toBe(200)
        expect(typeof body).toEqual('object')
        expect(body.logo.url).toEqual('/api/static/placeholder.png')
        expect(body.logo.id).toEqual('placeholder')
        
        const shop = await Model.findById(dataObject._id) 
        expect(shop.logo.url).toEqual('/api/static/placeholder.png')
        expect(shop.logo.id).toEqual('placeholder')

    })

    test(`PATCH /${apiEndpoint}/:id 200 Set logo`, async () => {
        const { body, status } = await request(server)
            .patch(`${serverConfig.endpoint}/${apiEndpoint}/${dataObject._id}`)
            .set('Authorization', 'Bearer ' + defaultToken)
            .send({ logo: { url: 'someotherurl' } })

        expect(status).toBe(200)
        expect(typeof body).toEqual('object')
        expect(body.logo.url).toEqual('someotherurl')
        expect(body.logo.id).toEqual('placeholder')
        
        const shop = await Model.findById(dataObject._id) 
        expect(shop.logo.url).toEqual('someotherurl')
        expect(shop.logo.id).toEqual('placeholder')

    })


    test(`PATCH /${apiEndpoint}/:id 200 Delete picture`, async () => {
        const { body, status } = await request(server)
            .patch(`${serverConfig.endpoint}/${apiEndpoint}/${dataObject._id}`)
            .set('Authorization', 'Bearer ' + defaultToken)
            .send({ picture: {} })

        expect(status).toBe(200)
        expect(typeof body).toEqual('object')
        expect(body.picture.url).toEqual('/api/static/placeholder-bg.png')
        expect(body.picture.id).toEqual('placeholder')
        
        const shop = await Model.findById(dataObject._id) 
        expect(shop.picture.url).toEqual('/api/static/placeholder-bg.png')
        expect(shop.picture.id).toEqual('placeholder')

    })

    test(`PATCH /${apiEndpoint}/:id 200 Set picture`, async () => {
        const { body, status } = await request(server)
            .patch(`${serverConfig.endpoint}/${apiEndpoint}/${dataObject._id}`)
            .set('Authorization', 'Bearer ' + defaultToken)
            .send({ picture: { url: 'someotherurl' } })

        expect(status).toBe(200)
        expect(typeof body).toEqual('object')
        expect(body.picture.url).toEqual('someotherurl')
        expect(body.picture.id).toEqual('placeholder')
        
        const shop = await Model.findById(dataObject._id) 
        expect(shop.picture.url).toEqual('someotherurl')
        expect(shop.picture.id).toEqual('placeholder')

    })

    test(`PATCH /${apiEndpoint}/:id 401`, async () => {
        const { status } = await request(server)
            .patch(`${serverConfig.endpoint}/${apiEndpoint}/${dataObject1._id}`)
            .set('Authorization', 'Bearer ' + defaultToken)
            .send({ contact: { phone: 42 }})
        
        expect(status).toBe(401)
    })

    test(`PATCH /${apiEndpoint}/:id 404`, async () => {
        const { status } = await request(server)
            .patch(`${serverConfig.endpoint}/${apiEndpoint}/123456789098765432123456`)
            .set('Authorization', 'Bearer ' + defaultToken)
            .send({ contact: { phone: 42 }})
        
        expect(status).toBe(404)
    })
    
    test(`DELETE /${apiEndpoint}/:id 200`, async () => {
        const { status } = await request(server)
            .delete(`${serverConfig.endpoint}/${apiEndpoint}/${dataObject._id}`)
            .set('Authorization', 'Bearer ' + defaultToken)


        
        // Make sure that the shop got deleted in the shops array from our users
        expect((await User.findById(defaultUser._id)).shops.includes(dataObject._id)).toBe(false)
        expect((await User.findById(adminUser._id)).shops.includes(dataObject._id)).toBe(false)

        expect(status).toBe(204)
    })

    test(`DELETE /${apiEndpoint}/:id 404`, async () => {
        const { status } = await request(server)
            .delete(`${serverConfig.endpoint}/${apiEndpoint}/123456789098765432123456`)
            .set('Authorization', 'Bearer ' + defaultToken)

        expect(status).toBe(400)
    })

})