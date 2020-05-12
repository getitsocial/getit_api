import request from 'supertest'
import { isJWT } from 'validator'
import Shop from '~/api/shop/model'
import User from '~/api/user/model'
import { serverConfig } from '~/config'
import server from '~/server'
import { sign } from '~/services/guard'
import { defaultShopData } from './data'
import { parseOpeningHours } from '~/utils'
import { encode } from 'ngeohash'

let defaultShop,
    adminShop,
    adminUser,
    adminToken,
    defaultUser,
    defaultToken,
    apiEndpoint = 'shops'

beforeEach(async (done) => {
    
    const parsedOpeningHours = parseOpeningHours(defaultShopData().openingHours)
    // Create user 
    adminUser = await User.create({ name: 'Maximilian', email: 'max1@moritz.com', password: 'Max123!!!', role: 'admin' })
    defaultUser = await User.create({ name: 'Maximilian', email: 'max2@moritz.com', password: 'Max123!!!', role: 'user' })

    // Create shop
    defaultShop = await Shop.create(defaultShopData({ author: defaultUser._id, parsedOpeningHours }))
    adminShop = await Shop.create(defaultShopData({ author: adminUser._id, name: 'shopname_1', parsedOpeningHours, openingHours: {} }))

    expect(defaultShop.contact.website).toBe('https://google.de')

    // Set shops in user
    defaultUser.activeShop = defaultShop._id
    defaultUser.shops.push(defaultShop._id)
    await defaultUser.save()

    adminUser.shops.push(defaultShop._id)
    adminUser.activeShop = adminShop._id
    await adminUser.save()

    // Sign in user
    adminToken = await sign(adminUser)
    expect(isJWT(adminToken)).toBe(true)

    defaultToken = await sign(defaultUser)
    expect(isJWT(defaultToken)).toBe(true)
    
    done()
})

describe(`Test /${apiEndpoint} endpoint:`, () => {

    test(`POST /${apiEndpoint}/checkName 200`, async () => {
        const { statusCode } = await request(server)
            .post(`${serverConfig.endpoint}/${apiEndpoint}/checkName`)
            .set('Authorization', 'Bearer ' + defaultToken)
            .send({ name: 'somerandomassshopname_42' })

        expect(statusCode).toBe(200)
    })

    test(`POST /${apiEndpoint}/checkName 400`, async () => {
        const { statusCode } = await request(server)
            .post(`${serverConfig.endpoint}/${apiEndpoint}/checkName`)
            .set('Authorization', 'Bearer ' + defaultToken)
            .send({ wrongparam: 'somerandomassshopname_42' })

        expect(statusCode).toBe(400)
    })

    test(`POST /${apiEndpoint}/checkName 409 existing name`, async () => {
        const { statusCode } = await request(server)
            .post(`${serverConfig.endpoint}/${apiEndpoint}/checkName`)
            .set('Authorization', 'Bearer ' + defaultToken)
            .send({ name: 'shopname_1' })
            
        expect(statusCode).toBe(409)
    }) 

    test(`GET /${apiEndpoint}/near 200`, async () => {
        const { statusCode, body } = await request(server)
            .get(`${serverConfig.endpoint}/${apiEndpoint}/near/${encode(49.009387, 8.377048)}`)
            .set('Authorization', 'Bearer ' + defaultToken)

        expect(Array.isArray(body)).toBe(true)
        expect(body.length).toBe(2)
        expect(statusCode).toBe(200)
    })
  
    test(`GET /${apiEndpoint}/near unpublished shop 200`, async () => {
        defaultShop.set({ published: false })
        await defaultShop.save()

        const { statusCode, body } = await request(server)
            .get(`${serverConfig.endpoint}/${apiEndpoint}/near/${encode(49.009387, 8.377048)}`)
            .set('Authorization', 'Bearer ' + defaultToken)

        expect(Array.isArray(body)).toBe(true)
        expect(body.length).toBe(1)
        expect(statusCode).toBe(200)
        expect(body[0].updatedAt).toBeUndefined() // make sure that modelProjection is somehow working

    })

    test(`GET /${apiEndpoint}:id 200`, async () => {
        const { status, body } = await request(server)
            .get(`${serverConfig.endpoint}/${apiEndpoint}/${defaultShop.shopId}`)
            .set('Authorization', 'Bearer ' + defaultToken)
        
        expect(status).toBe(200)
        expect(typeof body).toEqual('object')
        expect(body.displayPosition).not.toBeUndefined()
        expect(body.position).toBeUndefined()
        expect(typeof body.isOpen).toBe('boolean')
        expect(body.updatedAt).toBeUndefined() // make sure that modelProjection is somehow working

    })

    test(`GET /${apiEndpoint}:id 200`, async () => {
        const { status } = await request(server)
            .get(`${serverConfig.endpoint}/${apiEndpoint}/${defaultShop._id}`)
        
        expect(status).toBe(404)
    })
    
    test(`GET /${apiEndpoint}/:id 404`, async () => {
        const { status } = await request(server)
            .get(`${serverConfig.endpoint}/${apiEndpoint}/123456789098765432123456`)

        expect(status).toBe(404)
    })

    test(`POST /${apiEndpoint} 201`, async () => {
        const { status, body } = await request(server)
            .post(`${serverConfig.endpoint}/${apiEndpoint}`)
            .set('Authorization', 'Bearer ' + defaultToken)
            .send(defaultShopData({ author: defaultUser._id, name: 'shopname_9', openingHours: { wednesday: [{ open: '00:00', close: '00:00'}]}}))
       
        expect(status).toBe(201)
        expect(typeof body).toEqual('object')

        expect(Array.isArray(body.deliveryOptions)).toBe(true)
        expect(body.deliveryOptions.length).toBe(1)
        expect(body.deliveryOptions[0]).toBe('PU')
        expect(body.name).toBe('shopname_9')
        expect(body.contact.phone).toBe('12345')
        expect(body.address.label).toBe(defaultShopData().address.label)
        expect(body.address.city).toBe(defaultShopData().address.city)
        expect(body.address.country).toBe(defaultShopData().address.country)
        expect(body.address.county).toBe(defaultShopData().address.county)
        expect(body.address.district).toBe(defaultShopData().address.district)
        expect(body.address.houseNumber).toBe(defaultShopData().address.houseNumber)
        expect(body.address.locationId).toBe(defaultShopData().address.locationId)
        expect(body.address.state).toBe(defaultShopData().address.state)
        expect(body.address.street).toBe(defaultShopData().address.street)
        expect(body.address.postalCode).toBe(defaultShopData().address.postalCode)
        // make sure that the shop got added to the user
        expect((await User.findById(defaultUser._id)).activeShop.toString()).toBe(body._id)
        expect((await User.findById(defaultUser._id)).shops.includes(body._id)).toBe(true)

    })

    test(`POST /${apiEndpoint} 400 wrong openingHours: allDayOpen + more segments `, async () => {
        const { status, body } = await request(server)
            .post(`${serverConfig.endpoint}/${apiEndpoint}`)
            .set('Authorization', 'Bearer ' + defaultToken)
            .send(defaultShopData({ author: defaultUser._id, name: 'shopname_9', openingHours: { wednesday: [{ open: '00:00', close: '00:00' }, { open: '15:00', close: '15:15' }]}}))
        expect(status).toBe(400)
        expect(typeof body).toEqual('object')
        
    })

    test(`POST /${apiEndpoint} 400 wrong openingHours: closing before opening`, async () => {
        const { status, body } = await request(server)
            .post(`${serverConfig.endpoint}/${apiEndpoint}`)
            .set('Authorization', 'Bearer ' + defaultToken)
            .send(defaultShopData({ author: defaultUser._id, name: 'shopname_9', openingHours: { wednesday: [{ open: '15:30', close: '15:15' }]}}))

        expect(status).toBe(400)
        expect(typeof body).toEqual('object')
          
    })

    test(`POST /${apiEndpoint} 400 wrong openingHours: invalid values`, async () => {
        const { status, body } = await request(server)
            .post(`${serverConfig.endpoint}/${apiEndpoint}`)
            .set('Authorization', 'Bearer ' + defaultToken)
            .send(defaultShopData({ author: defaultUser._id, name: 'shopname_42', openingHours: { wednesday: [{ open: '24:01', close: '25:30' }]}}))

        expect(status).toBe(400)
        expect(typeof body).toEqual('object')
        
    })
    test(`POST /${apiEndpoint} 400 same shop name`, async () => {
        const { status } = await request(server)
            .post(`${serverConfig.endpoint}/${apiEndpoint}`)
            .set('Authorization', 'Bearer ' + defaultToken)
            .send(defaultShopData({ author: adminUser._id, name: 'shopname_1' }))
        expect(status).toBe(400) 
        
    })
    
    test(`PATCH /${apiEndpoint}/:id 200`, async () => {
        const { status, body } = await request(server)
            .patch(`${serverConfig.endpoint}/${apiEndpoint}/${defaultShop._id}`)
            .set('Authorization', 'Bearer ' + defaultToken)
            .send({ contact: { phone: 42 }, openingHours: { monday: [{ open: '00:00', close: '00:00' }]}, deliveryOptions: ['MU', 'LD']})
        expect(status).toBe(200)
        expect(typeof body).toEqual('object')

        // make sure we only update the updated fields in our nested object, not everything
        expect(body.contact.phone).toEqual('42')
        expect(body.contact.instagram).toBe('https://www.instagram.com/barackobama/?hl=de')

        expect(Array.isArray(body.deliveryOptions)).toBe(true)
        expect(body.deliveryOptions.length).toBe(2)
        expect(body.deliveryOptions).toEqual(['MU', 'LD'])
        // make sure that if 'logo' is undefined in our patch we dont set the placeholder logo on accident
        expect(body.logo.url).not.toEqual('/api/static/placeholder.png')
    })

    test(`PATCH /${apiEndpoint}/:id 200 delete deliveryOptions`, async () => {
        const { status, body } = await request(server)
            .patch(`${serverConfig.endpoint}/${apiEndpoint}/${defaultShop._id}`)
            .set('Authorization', 'Bearer ' + defaultToken)
            .send({ contact: { phone: 42 }, openingHours: { monday: [ { open: '00:00', close: '00:00' }]}, deliveryOptions: [] })
        expect(status).toBe(200)
        expect(typeof body).toEqual('object')

        // make sure we only update the updated fields in our nested object, not everything
        expect(body.contact.phone).toEqual('42')
        expect(body.contact.instagram).toBe('https://www.instagram.com/barackobama/?hl=de')

        expect(Array.isArray(body.deliveryOptions)).toBe(true)
        expect(body.deliveryOptions.length).toBe(0)
        expect(body.deliveryOptions).toEqual([])
        // make sure that if 'logo' is undefined in our patch we dont set the placeholder logo on accident
        expect(body.logo.url).not.toEqual('/api/static/placeholder.png')
    })

    test(`PATCH /${apiEndpoint}/:id 200 without deliveryOptions`, async () => {
        const { status, body } = await request(server)
            .patch(`${serverConfig.endpoint}/${apiEndpoint}/${defaultShop._id}`)
            .set('Authorization', 'Bearer ' + defaultToken)
            .send({ contact: { phone: 42 }})
        expect(status).toBe(200)
        expect(typeof body).toEqual('object')

        // make sure we only update the updated fields in our nested object, not everything
        expect(body.contact.phone).toEqual('42')

        // make sure that undefined deliverOptions doesnt overwrite the actual deliveryOptions:D
        expect(Array.isArray(body.deliveryOptions)).toBe(true)
        expect(body.deliveryOptions).toEqual(['PU'])

        // make sure that if 'logo' is undefined in our patch we dont set the placeholder logo on accident
        expect(body.logo.url).not.toEqual('/api/static/placeholder.png')
    })

    test(`PATCH /${apiEndpoint}/:id 200 admin patch`, async () => {
        const { status, body } = await request(server)
            .patch(`${serverConfig.endpoint}/${apiEndpoint}/${defaultShop._id}`)
            .set('Authorization', 'Bearer ' + adminToken)
            .send({ contact: { phone: 42 }})
        expect(status).toBe(200)
        expect(typeof body).toEqual('object')
        expect(body.contact.phone).toEqual('42')
        // make sure that if 'logo' is undefined in our patch we dont set the placeholder logo on accident
        expect(body.logo.url).not.toEqual('/api/static/placeholder.png')
    })

    test(`PATCH /${apiEndpoint}/:id 200 Delete logo`, async () => {
        const { body, status } = await request(server)
            .patch(`${serverConfig.endpoint}/${apiEndpoint}/${defaultShop._id}`)
            .set('Authorization', 'Bearer ' + defaultToken)
            .send({ logo: {} })

        expect(status).toBe(200)
        expect(typeof body).toEqual('object')
        expect(body.logo.url).toEqual('/api/static/placeholder.png')
        expect(body.logo.id).toEqual('placeholder')
        
        // check in database too:
        const shop = await Shop.findById(defaultShop._id) 
        expect(shop.logo.url).toEqual('/api/static/placeholder.png')
        expect(shop.logo.id).toEqual('placeholder')

    })

    test(`PATCH /${apiEndpoint}/:id 200 Set logo`, async () => {
        const { body, status } = await request(server)
            .patch(`${serverConfig.endpoint}/${apiEndpoint}/${defaultShop._id}`)
            .set('Authorization', 'Bearer ' + defaultToken)
            .send({ logo: { url: 'someotherurl' } })

        expect(status).toBe(200)
        expect(typeof body).toEqual('object')
        expect(body.logo.url).toEqual('someotherurl')
        expect(body.logo.id).toEqual('placeholder')
        
        const shop = await Shop.findById(defaultShop._id) 
        expect(shop.logo.url).toEqual('someotherurl')
        expect(shop.logo.id).toEqual('placeholder')

    })

    test(`PATCH /${apiEndpoint}/:id 200 Delete picture`, async () => {
        const { body, status } = await request(server)
            .patch(`${serverConfig.endpoint}/${apiEndpoint}/${defaultShop._id}`)
            .set('Authorization', 'Bearer ' + defaultToken)
            .send({ picture: {} })

        expect(status).toBe(200)
        expect(typeof body).toEqual('object')
        expect(body.picture.url).toEqual('/api/static/placeholder-bg.png')
        expect(body.picture.id).toEqual('placeholder')
        
        const shop = await Shop.findById(defaultShop._id) 
        expect(shop.picture.url).toEqual('/api/static/placeholder-bg.png')
        expect(shop.picture.id).toEqual('placeholder')

    })

    test(`PATCH /${apiEndpoint}/:id 200 Set picture`, async () => {
        const { body, status } = await request(server)
            .patch(`${serverConfig.endpoint}/${apiEndpoint}/${defaultShop._id}`)
            .set('Authorization', 'Bearer ' + defaultToken)
            .send({ picture: { url: 'someotherurl' } })

        expect(status).toBe(200)
        expect(typeof body).toEqual('object')
        expect(body.picture.url).toEqual('someotherurl')
        expect(body.picture.id).toEqual('placeholder')
        
        const shop = await Shop.findById(defaultShop._id) 
        expect(shop.picture.url).toEqual('someotherurl')
        expect(shop.picture.id).toEqual('placeholder')

    })

    test(`PATCH /${apiEndpoint}/:id 401`, async () => {
        const { status } = await request(server)
            .patch(`${serverConfig.endpoint}/${apiEndpoint}/${adminShop._id}`)
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
            .delete(`${serverConfig.endpoint}/${apiEndpoint}/${defaultShop._id}`)
            .set('Authorization', 'Bearer ' + defaultToken)

        // Make sure that the shop got deleted in the shops array from our users
        expect((await User.findById(defaultUser._id)).shops.includes(defaultShop._id)).toBe(false)
        expect((await User.findById(adminUser._id)).shops.includes(defaultShop._id)).toBe(false)

        expect(status).toBe(204)
    })

    test(`DELETE /${apiEndpoint}/:id 401`, async () => {
        const { status } = await request(server)
            .delete(`${serverConfig.endpoint}/${apiEndpoint}/${adminShop._id}`)
            .set('Authorization', 'Bearer ' + defaultToken)

        expect(status).toBe(401)
    })

    test(`DELETE /${apiEndpoint}/:id 404`, async () => {
        const { status } = await request(server)
            .delete(`${serverConfig.endpoint}/${apiEndpoint}/123456789098765432123456`)
            .set('Authorization', 'Bearer ' + defaultToken)

        expect(status).toBe(400)
    }) 
})