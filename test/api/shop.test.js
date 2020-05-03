import request from 'supertest'
import { isJWT } from 'validator'
import Shop from '~/api/shop/model'
import User from '~/api/user/model'
import { serverConfig } from '~/config'
import server from '~/server'
import { sign } from '~/services/guard'


let defaultShop,
    adminShop,
    adminUser,
    adminToken,
    defaultUser,
    defaultToken,
    apiEndpoint = 'shops'

beforeEach(async (done) => {
    
    // Create user
    adminUser = await User.create({ name: 'Maximilian', email: 'max1@moritz.com', password: 'Max123!!!', role: 'admin' })
    defaultUser = await User.create({ name: 'Maximilian', email: 'max2@moritz.com', password: 'Max123!!!', role: 'user' })
   

    defaultShop = await Shop.create({
        name: 'shopname', 
        size: 5, 
        logo: { url: 'https://i.picsum.photos/id/368/200/300.jpg' }, 
        category: 'clothing', 
        contact: { phone: 12345, instagram: 'https://www.instagram.com/barackobama/?hl=de' }, 
        companyType: 'EU', 
        author: defaultUser._id, 
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
        deliveryOptions: ['PU'],
        openingHours: {
            monday: { open: 1000, close: 1001, allDayOpen: false, allDayClosed: false },
            tuesday: { open: 1000, close: 1001, allDayOpen: false, allDayClosed: false },
            wednesday: { open: 1000, close: 1001, allDayOpen: false, allDayClosed: false },
            thursday: { open: 1000, close: 1001, allDayOpen: false, allDayClosed: false },
            friday: { open: 1000, close: 1001, allDayOpen: false, allDayClosed: false },
            saturday: { open: 1000, close: 1001, allDayOpen: false, allDayClosed: false },
            sunday: { open: 1000, close: 1001, allDayOpen: false, allDayClosed: false }

        }
    })


    adminShop = await Shop.create({
        name: 'shopname_1', 
        size: 5, 
        logo: { url: 'https://i.picsum.photos/id/368/200/300.jpg' }, 
        category: 'clothing', 
        contact: { phone: 12345 }, 
        companyType: 'EU', 
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
        deliveryOptions: ['PU'],
        openingHours: {
            monday: { open: 1000, close: 1001, allDayOpen: false, allDayClosed: false },
            tuesday: { open: 1000, close: 1001, allDayOpen: false, allDayClosed: false },
            wednesday: { open: 1000, close: 1001, allDayOpen: false, allDayClosed: false },
            thursday: { open: 1000, close: 1001, allDayOpen: false, allDayClosed: false },
            friday: { open: 1000, close: 1001, allDayOpen: false, allDayClosed: false },
            saturday: { open: 1000, close: 1001, allDayOpen: false, allDayClosed: false },
            sunday: { open: 1000, close: 1001, allDayOpen: false, allDayClosed: false }

        }
    })

    // set shops in user
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

    test(`GET /${apiEndpoint} 200`, async () => {
        const {statusCode, body} = await request(server)
            .get(`${serverConfig.endpoint}/${apiEndpoint}`)
            .set('Authorization', 'Bearer ' + defaultToken)

        const firstItem = body[0]

        expect(body.length).toBe(2)
        expect(statusCode).toBe(200)
        expect(Array.isArray(body)).toBe(true)
        expect(firstItem._id).toBeTruthy()
        expect(firstItem.updatedAt).toBeUndefined() // make sure that modelProjection is somehow working
    })
 
    test(`GET /${apiEndpoint}:id 200`, async () => {
        const { status, body } = await request(server)
            .get(`${serverConfig.endpoint}/${apiEndpoint}/${defaultShop._id}`)
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
            .send({
                name: 'shopname_9',
                size: 5,
                category: 'clothing', 
                contact: { 
                    phone: 12345 
                }, companyType: 'EU',
                author: defaultUser._id, 
                address: { 
                    label: 'label', 
                    city: 'city', 
                    country: 'country', 
                    county: 'county', 
                    district: 'district', 
                    houseNumber: 26, 
                    locationId: 'NT_0OLEZjK0pT1GkekbvJmsHC_yYD', 
                    state: 'state', 
                    street: 'street', 
                    postalCode: 76135 
                },
                deliveryOptions: ['PU'],
                openingHours: {
                    monday: { open: 1000, close: 1001, allDayOpen: false, allDayClosed: false },
                    tuesday: { open: 1000, close: 1001, allDayOpen: false, allDayClosed: false },
                    wednesday: { open: 1000, close: 1001, allDayOpen: false, allDayClosed: false },
                    thursday: { open: 1000, close: 1001, allDayOpen: false, allDayClosed: false },
                    friday: { open: 1000, close: 1001, allDayOpen: false, allDayClosed: false },
                    saturday: { open: 1000, close: 1001, allDayOpen: false, allDayClosed: false },
                    sunday: { open: 1000, close: 1001, allDayOpen: false, allDayClosed: false }

                }
            })
        expect(status).toBe(201)
        expect(typeof body).toEqual('object')
        

        // opening hours
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        days.forEach((day) => {
            expect(body.openingHours[day].open).toBe(1000)
            expect(body.openingHours[day].close).toBe(1001)
            expect(body.openingHours[day].allDayClosed).toBe(false)
            expect(body.openingHours[day].allDayOpen).toBe(false)
        })

        expect(Array.isArray(body.deliveryOptions)).toBe(true)
        expect(body.deliveryOptions.length).toBe(1)
        expect(body.deliveryOptions[0]).toBe('PU')

        expect(body.name).toBe('shopname_9')
        expect(body.contact.phone).toBe('12345')

        expect(body.address.label).toBe('label')
        expect(body.address.city).toBe('city')
        expect(body.address.country).toBe('country')
        expect(body.address.county).toBe('county')
        expect(body.address.district).toBe('district')
        expect(body.address.houseNumber).toBe('26')
        expect(body.address.locationId).toBe('NT_0OLEZjK0pT1GkekbvJmsHC_yYD')
        expect(body.address.state).toBe('state')
        expect(body.address.street).toBe('street')
        expect(body.address.postalCode).toBe(76135)

        // make sure that the shop got added to the user
        expect((await User.findById(defaultUser._id)).activeShop.toString()).toBe(body._id)
        expect((await User.findById(defaultUser._id)).shops.includes(body._id)).toBe(true)
        
    })


    test(`POST /${apiEndpoint} 400 same shop name`, async () => {
        const { status } = await request(server)
            .post(`${serverConfig.endpoint}/${apiEndpoint}`)
            .set('Authorization', 'Bearer ' + defaultToken)
            .send({
                name: 'shopname',
                size: 5,
                category: 'clothing', 
                contact: { 
                    phone: 12345,
                    instagram: 'https://www.instagram.com/barackobama/?hl=de'
                }, companyType: 'EU',
                author: defaultUser._id, 
                address: { 
                    label: 'label', 
                    city: 'city', 
                    country: 'country', 
                    county: 'county', 
                    district: 'district', 
                    houseNumber: 26, 
                    locationId: 'NT_0OLEZjK0pT1GkekbvJmsHC_yYD', 
                    state: 'state', 
                    street: 'street', 
                    postalCode: 76135 
                },
                deliveryOptions: ['PU'],
                openingHours: {
                    monday: { open: 1000, close: 1001, allDayOpen: false, allDayClosed: false },
                    tuesday: { open: 1000, close: 1001, allDayOpen: false, allDayClosed: false },
                    wednesday: { open: 1000, close: 1001, allDayOpen: false, allDayClosed: false },
                    thursday: { open: 1000, close: 1001, allDayOpen: false, allDayClosed: false },
                    friday: { open: 1000, close: 1001, allDayOpen: false, allDayClosed: false },
                    saturday: { open: 1000, close: 1001, allDayOpen: false, allDayClosed: false },
                    sunday: { open: 1000, close: 1001, allDayOpen: false, allDayClosed: false }

                }
            })
        expect(status).toBe(400) 
        
    })
    


    test(`PATCH /${apiEndpoint}/:id 200`, async () => {
        const { status, body } = await request(server)
            .patch(`${serverConfig.endpoint}/${apiEndpoint}/${defaultShop._id}`)
            .set('Authorization', 'Bearer ' + defaultToken)
            .send({ contact: { phone: 42 }, openingHours: { monday: { allDayClosed: true }}, deliveryOptions: ['MU', 'LD']})
        expect(status).toBe(200)
        expect(typeof body).toEqual('object')

        // make sure we only update the updated fields in our nested object, not everything
        expect(body.contact.phone).toEqual('42')
        expect(body.contact.instagram).toBe('https://www.instagram.com/barackobama/?hl=de')

        // opening hours
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        days.forEach((day) => {
            expect(body.openingHours[day].open).toBe(1000)
            expect(body.openingHours[day].close).toBe(1001)
            expect(body.openingHours[day].allDayClosed).toBe(day === 'monday')
            expect(body.openingHours[day].allDayOpen).toBe(false)
        })

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
            .send({ contact: { phone: 42 }, openingHours: { monday: { allDayClosed: true }}, deliveryOptions: [] })
        expect(status).toBe(200)
        expect(typeof body).toEqual('object')

        // make sure we only update the updated fields in our nested object, not everything
        expect(body.contact.phone).toEqual('42')
        expect(body.contact.instagram).toBe('https://www.instagram.com/barackobama/?hl=de')

        // opening hours
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        days.forEach((day) => {
            expect(body.openingHours[day].open).toBe(1000)
            expect(body.openingHours[day].close).toBe(1001)
            expect(body.openingHours[day].allDayClosed).toBe(day === 'monday')
            expect(body.openingHours[day].allDayOpen).toBe(false)
        })

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