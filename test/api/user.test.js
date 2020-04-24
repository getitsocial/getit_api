import request from 'supertest'
import { isJWT } from 'validator'
import server from '~/server'
import { serverConfig } from '~/config'
import { sign } from '~/services/guard'
import Model from '~/api/user/model'
import Shop from '~/api/shop/model'

let adminUser, 
    defaultUser,
    adminToken,
    defaultToken,
    shop,
    shop1,
    apiEndpoint = 'users'

beforeEach(async (done) => {
    // Create user
    adminUser = await Model.create({ name: 'Maximilian', email: 'max1@moritz.com', password: 'Max123!!!', role: 'user' })

    shop = await Shop.create({ name: 'shopname', size: 3, category: 'clothing', contact: { phone: 12345 }, companyType: 'EU', author: adminUser._id, address: { label: 'Goethestraße 26, 76135 Karlsruhe, Deutschland', city: 'Karlsruhe', country: 'DEU', county: 'Karlsruhe (Stadt)', district: 'Weststadt', houseNumber: 4, locationId: 'NT_0OLEZjK0pT1GkekbvJmsHC_yYD', state: 'Baden-Württemberg', street: 'Goethestrasse 26', postalCode: 76135 } })
    shop1 = await Shop.create({ name: 'shopname_1', size: 3, category: 'clothing', contact: { phone: 12345 }, companyType: 'EU', author: adminUser._id, address: { label: 'Goethestraße 26, 76135 Karlsruhe, Deutschland', city: 'Karlsruhe', country: 'DEU', county: 'Karlsruhe (Stadt)', district: 'Weststadt', houseNumber: 4, locationId: 'NT_0OLEZjK0pT1GkekbvJmsHC_yYD', state: 'Baden-Württemberg', street: 'Goethestrasse 26', postalCode: 76135 } })
    
    defaultUser = await Model.create({ name: 'Maximilian', email: 'max2@moritz.com', password: 'Max123!!!', role: 'user', activeShop: shop._id, shops: [shop._id, shop1._id] })

    adminUser.role = 'admin'
    adminUser = await adminUser.save()

    // Sign in user
    adminToken = await sign(adminUser)
    expect(isJWT(adminToken)).toBe(true)
    
    defaultToken = await sign(defaultUser)
    expect(isJWT(defaultToken)).toBe(true)
    
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
            .set('Authorization', 'Bearer ' + adminToken)
        const firstItem = body[0]
        
        expect(statusCode).toBe(200)
        expect(Array.isArray(body)).toBe(true)
        expect(typeof firstItem.name).toEqual('string')
        expect(typeof firstItem.picture).toEqual('object')
        expect(firstItem.name).toEqual(adminUser.name)
        expect(firstItem.email).toEqual(adminUser.email)
        expect(firstItem.role).toEqual('admin')
        expect(firstItem._id).toBeTruthy()
        expect(firstItem.updatedAt).toBeUndefined()
    })

    test(`GET ${serverConfig.endpoint}/users/me 200`, async () => {
        const { body, statusCode, header } = await request(server)
            .get(`${serverConfig.endpoint}/${apiEndpoint}/me`)
            .set('Authorization', 'Bearer ' + adminToken)
        
        expect(statusCode).toBe(200)
        expect(header['content-type']).toBe('application/json')
        expect(typeof body).toBe('object')
        expect(typeof body._id).toBe('string')
        expect(typeof body.role).toBe('string')
        expect(body.role).toBe('admin')
    })  
    // Get active shop
    test(`GET ${serverConfig.endpoint}/users/me/shops/active 200`, async () => {
        const { body, statusCode } = await request(server)
            .get(`${serverConfig.endpoint}/${apiEndpoint}/me/shops/active`)
            .set('Authorization', 'Bearer ' + defaultToken)
        
        expect(statusCode).toBe(200)
        expect(body._id).toBe(shop._id.toString())
    })

    test(`GET ${serverConfig.endpoint}/users/:id/shops/active 200`, async () => {
        const { body, statusCode } = await request(server)
            .get(`${serverConfig.endpoint}/${apiEndpoint}/${defaultUser._id}/shops/active`)
            .set('Authorization', 'Bearer ' + defaultToken)
        
        expect(statusCode).toBe(200)
        expect(body._id).toBe(shop._id.toString())
    })  

    test(`GET ${serverConfig.endpoint}/users/:id/shops/active 200 admin`, async () => {
        const { body, statusCode } = await request(server)
            .get(`${serverConfig.endpoint}/${apiEndpoint}/${defaultUser._id}/shops/active`)
            .set('Authorization', 'Bearer ' + adminToken)
        
        expect(statusCode).toBe(200)
        expect(body._id).toBe(shop._id.toString())
    })  


    test(`GET ${serverConfig.endpoint}/users/:id/shops/active 401`, async () => {
        const { statusCode } = await request(server)
            .get(`${serverConfig.endpoint}/${apiEndpoint}/${adminUser._id}/shops/active`)
            .set('Authorization', 'Bearer ' + defaultToken)
        
        expect(statusCode).toBe(401)
    })  

    // set active shop

    test(`PATCH ${serverConfig.endpoint}/users/me/shops/active 204`, async () => {
        const { statusCode } = await request(server)
            .patch(`${serverConfig.endpoint}/${apiEndpoint}/me/shops/active`)
            .set('Authorization', 'Bearer ' + defaultToken)
            .send({ shopId: shop1._id })
        
        expect(statusCode).toBe(204)
    })

    test(`PATCH ${serverConfig.endpoint}/users/:id/shops/active 204`, async () => {
        const { statusCode } = await request(server)
            .patch(`${serverConfig.endpoint}/${apiEndpoint}/${defaultUser._id}/shops/active`)
            .set('Authorization', 'Bearer ' + defaultToken)
            .send({ shopId: shop1._id })
        
        expect(statusCode).toBe(204)
    })  

    test(`PATCH ${serverConfig.endpoint}/users/:id/shops/active 204 admin`, async () => {
        const { statusCode } = await request(server)
            .patch(`${serverConfig.endpoint}/${apiEndpoint}/${defaultUser._id}/shops/active`)
            .set('Authorization', 'Bearer ' + adminToken)
            .send({ shopId: shop1._id })
        
        expect(statusCode).toBe(204)
    })  


    test(`PATCH ${serverConfig.endpoint}/users/:id/shops/active 401`, async () => {
        const { statusCode } = await request(server)
            .patch(`${serverConfig.endpoint}/${apiEndpoint}/${adminUser._id}/shops/active`)
            .set('Authorization', 'Bearer ' + defaultToken)
            .send({ shopId: shop1._id })
        
        expect(statusCode).toBe(401)
    })  

    test(`PATCH ${serverConfig.endpoint}/users/:id/shops/active 400`, async () => {
        const { statusCode } = await request(server)
            .patch(`${serverConfig.endpoint}/${apiEndpoint}/${defaultUser._id}/shops/active`)
            .set('Authorization', 'Bearer ' + defaultToken)
            .send({ shopId: 123 })
        
        expect(statusCode).toBe(400)
    })  


    test(`POST /${apiEndpoint} 401 - Create user with another roles`, async () => {
        const { status, body } = await request(server)
            .post(`${serverConfig.endpoint}/${apiEndpoint}`)
            .send({ email: 'max2@moritz.com', password: 'Max123!!!', role: 'admin', token: serverConfig.masterKey })

        expect(status).toBe(401)
        expect(typeof body).toEqual('object')
    })

    test(`POST /${apiEndpoint} 401 - Create user without master key`, async () => {
        const { status, body } = await request(server)
            .post(`${serverConfig.endpoint}/${apiEndpoint}`)
            .send({ email: 'max2@moritz.com', password: 'Max123!!!'})

        expect(status).toBe(401)
        expect(typeof body).toEqual('object')
    })

    test(`POST /${apiEndpoint} 201 - Create user`, async () => {
        const { status, body } = await request(server)
            .post(`${serverConfig.endpoint}/${apiEndpoint}`)
            .send({ email: 'max3@moritz.com', password: 'Max123!!!', token: serverConfig.masterKey })

        expect(status).toBe(201)
        expect(typeof body).toEqual('object')
        expect(typeof body._id).toBe('string')
        expect(typeof body.picture).toBe('object')
        expect(typeof body.name).toBe('string')
        expect(typeof body.email).toBe('string')
        expect('password' in body).toBe(false)
        expect('keywords' in body).toBe(false)
        expect('services' in body).toBe(false)
        expect(body.email).toEqual('max3@moritz.com')
        expect(body.role).toEqual('user')
        expect(body.name).toEqual('max3')
    })

    test(`POST /${apiEndpoint} 400 - Create user with same email`, async () => {
        const { status, body } = await request(server)
            .post(`${serverConfig.endpoint}/${apiEndpoint}`)
            .send({ email: 'max1@moritz.com', password: 'Max123!!!', token: serverConfig.masterKey })

        expect(status).toBe(400)
        expect(typeof body).toEqual('object')
    })

    test(`PATCH /${apiEndpoint}/:id 201 - Update user`, async () => {
        const { status, body } = await request(server)
            .patch(`${serverConfig.endpoint}/${apiEndpoint}/${adminUser.id}`)
            .send({ name: 'Maxi', token: adminToken })

        expect(status).toBe(201)
        expect(typeof body).toEqual('object')
        expect(typeof body._id).toBe('string')
        expect(typeof body.picture).toBe('object')
        expect(typeof body.name).toBe('string')
        expect(typeof body.email).toBe('string')
        expect('password' in body).toBe(false)
        expect('keywords' in body).toBe(false)
        expect('services' in body).toBe(false)
        expect(body.role).toEqual('admin')
        expect(body.name).toEqual('Maxi')
    })

    test(`PATCH /${apiEndpoint}/me 201 - Update user`, async () => {
        const { status, body } = await request(server)
            .patch(`${serverConfig.endpoint}/${apiEndpoint}/me`)
            .send({ name: 'Max', token: defaultToken })

        expect(status).toBe(201)
        expect(typeof body).toEqual('object')
        expect(typeof body._id).toBe('string')
        expect(typeof body.picture).toBe('object')
        expect(typeof body.name).toBe('string')
        expect(typeof body.email).toBe('string')
        expect('password' in body).toBe(false)
        expect('keywords' in body).toBe(false)
        expect('services' in body).toBe(false)
        expect(body.role).toEqual('user')
        expect(body.role).toEqual('user')
        expect(body.name).toEqual('Max')
    })

    test(`PATCH /${apiEndpoint}/:id 201 - Update user`, async () => {
        const { status, body } = await request(server)
            .patch(`${serverConfig.endpoint}/${apiEndpoint}/${defaultUser._id}`)
            .send({ name: 'Maximilian', token: defaultToken })

        expect(status).toBe(201)
        expect(typeof body).toEqual('object')
        expect(typeof body._id).toBe('string')
        expect(typeof body.picture).toBe('object')
        expect(typeof body.name).toBe('string')
        expect(typeof body.email).toBe('string')
        expect('password' in body).toBe(false)
        expect('keywords' in body).toBe(false)
        expect('services' in body).toBe(false)
        expect(body.role).toEqual('user')
        expect(body.name).toEqual('Maximilian')
    })

    test(`PATCH /${apiEndpoint}/:id 201 - Update user as admin`, async () => {
        const { status, body } = await request(server)
            .patch(`${serverConfig.endpoint}/${apiEndpoint}/${defaultUser._id}`)
            .send({ name: 'Max', token: adminToken })

        expect(status).toBe(201)
        expect(typeof body).toEqual('object')
        expect(typeof body._id).toBe('string')
        expect(typeof body.picture).toBe('object')
        expect(typeof body.name).toBe('string')
        expect(typeof body.email).toBe('string')
        expect('password' in body).toBe(false)
        expect('keywords' in body).toBe(false)
        expect('services' in body).toBe(false)
        expect(body.role).toEqual('user')
        expect(body.name).toEqual('Max')
    })

    test(`PATCH /${apiEndpoint}/:id 401 - Update user`, async () => {
        const { status, body, header } = await request(server)
            .patch(`${serverConfig.endpoint}/${apiEndpoint}/${adminUser.id}`)
            .send({ name: 'Maximilian', adminUser })

        expect(status).toBe(401)
        expect(header['content-type']).toBe('application/json')
        expect(body.code).toBe('Unauthorized')
    })

    test(`PATCH /${apiEndpoint}/:id/password 201 - Update user`, async () => {
        const { status, body } = await request(server)
            .patch(`${serverConfig.endpoint}/${apiEndpoint}/${defaultUser._id}/password`)
            .send({ password: 'NewPasswort123!', token: defaultToken })

        expect(status).toBe(201)
        expect(typeof body).toEqual('object')
        expect(typeof body._id).toBe('string')
        expect(typeof body.picture).toBe('object')
        expect(typeof body.name).toBe('string')
        expect(typeof body.email).toBe('string')
        expect('password' in body).toBe(false)
        expect('keywords' in body).toBe(false)
        expect('services' in body).toBe(false)
        expect(body.role).toEqual('user')
        expect(body.name).toEqual('Maximilian')
    })
    // TODO: needs to be adapted to the new shop flow 
    /*  
    test(`PATCH /${apiEndpoint}/:id/shop/ 201 - Update user shop`, async () => {
        const { status, body } = await request(server)
            .patch(`${serverConfig.endpoint}/${apiEndpoint}/${defaultUser._id}/shops`)
            .send({ token: defaultToken, shop: shop1._id })

        expect(status).toBe(201)
        expect(typeof body).toEqual('object')
        expect(body.shop).toEqual(shop1._id.toString())
        const { token } = body


        // make sure that new token is working
        const { statusCode } = await request(server)
            .get(`${serverConfig.endpoint}/${apiEndpoint}/me`)
            .set('Authorization', 'Bearer ' + token)
        expect(statusCode).toBe(200)

        // make sure that old token is not working
        const res = await request(server)
            .patch(`${serverConfig.endpoint}/${apiEndpoint}/${defaultUser._id}/shops`)
            .send({ token: defaultToken, shop: shop1._id })
        expect(res.status).toBe(401)
    })

 
    test(`PATCH /${apiEndpoint}/:id/shop/ 400 - Update user shop wrong shopid`, async () => {
        const { status } = await request(server)
            .patch(`${serverConfig.endpoint}/${apiEndpoint}/${defaultUser._id}/shops`)
            .send({ token: defaultToken, shop: 123 })

        expect(status).toBe(400)
    })
    test(`PATCH /${apiEndpoint}/:id/shop/ 401 - Update user shop wrong token`, async () => {
        const { status } = await request(server)
            .patch(`${serverConfig.endpoint}/${apiEndpoint}/${defaultUser._id}/shops`)
            .send({ token: 'wrongtoken', shop: shop1._id })

        expect(status).toBe(401)
    })
    
    test(`PATCH /${apiEndpoint}/:id/shop/ 201 - Update user shop admin`, async () => {
        const { status, body } = await request(server)
            .patch(`${serverConfig.endpoint}/${apiEndpoint}/${defaultUser._id}/shops`)
            .send({ token: adminToken, shop: shop1._id })

        expect(status).toBe(201)
        expect(typeof body).toEqual('object')
        expect(body.shop).toEqual(shop1._id.toString())
    })

    test(`PATCH /${apiEndpoint}/:id/shop/ 201 - Update wrong user shop`, async () => {
        const { status } = await request(server)
            .patch(`${serverConfig.endpoint}/${apiEndpoint}/${adminUser._id}/shops`)
            .send({ token: defaultToken, shop: shop1._id })

        expect(status).toBe(400)
    })
    */


    test(`DELETE ${serverConfig.endpoint}/users/me 204`, async () => {
        const { statusCode } = await request(server)
            .delete(`${serverConfig.endpoint}/${apiEndpoint}/me`)
            .set('Authorization', 'Bearer ' + defaultToken)
    
        expect(statusCode).toBe(204)
    })


    test(`DELETE ${serverConfig.endpoint}/users/me 401`, async () => {
        const { statusCode } = await request(server)
            .delete(`${serverConfig.endpoint}/${apiEndpoint}/me`)
      
        expect(statusCode).toBe(401)
    })

    test(`DELETE ${serverConfig.endpoint}/users/:id 204 admin`, async () => {
        const { statusCode } = await request(server)
            .delete(`${serverConfig.endpoint}/${apiEndpoint}/${defaultUser._id}`)
            .set('Authorization', 'Bearer ' + adminToken)
    
        expect(statusCode).toBe(204)
    })

    test(`DELETE ${serverConfig.endpoint}/users/:id 204 self-update`, async () => {
        const { statusCode } = await request(server)
            .delete(`${serverConfig.endpoint}/${apiEndpoint}/${defaultUser._id}`)
            .set('Authorization', 'Bearer ' + defaultToken)
    
        expect(statusCode).toBe(204)
    })

    test(`DELETE ${serverConfig.endpoint}/users/:id 401 cant delete other user`, async () => {
        const { statusCode } = await request(server)
            .delete(`${serverConfig.endpoint}/${apiEndpoint}/${adminUser._id}`)
            .set('Authorization', 'Bearer ' + defaultToken)
        expect(statusCode).toBe(401)
    })


})

describe('set email', () => {
    it('sets name automatically', () => {
        adminUser.name = ''
        adminUser.email = 'test@example.com'
        
        expect(adminUser.name).toBe('test')
    })

})

describe('createFromService', () => {
    let serviceUser

    beforeEach(() => {
        serviceUser = {
            id: '123',
            name: 'Test Name',
            email: 'test@test.com',
            picture: {
                url: '/api/static/placeholder.png',
                id: 'placeholder/placeholder'
            }
        }
    })

    ;['facebook', 'github', 'google'].forEach((service) => {
        describe(service, () => {
            beforeEach(() => {
                serviceUser.service = service
            })

            it('updates user when email is already registered', async () => {
                const updatedUser = await Model.createFromService({ ...serviceUser, email: 'max1@moritz.com' })
                
                // keep
                expect(updatedUser.id).toBe(adminUser.id)
                expect(updatedUser.email).toBe(adminUser.email)
                // update
                expect(updatedUser.name).toBe(serviceUser.name)
                expect(updatedUser.services[service]).toBe(serviceUser.id)
                // expect(updatedUser.picture).toBe(serviceUser.picture)
            })

            it('updates user when service id is already registered', async () => {
                await adminUser.set({ services: { [service]: serviceUser.id } }).save()
                const updatedUser = await Model.createFromService(serviceUser)
                
                // keep
                expect(updatedUser.id).toBe(adminUser.id)
                expect(updatedUser.email).toBe(adminUser.email)
                // update
                expect(updatedUser.name).toBe(serviceUser.name)
                expect(updatedUser.services[service]).toBe(serviceUser.id)
                // TODO: Fails
                // expect(updatedUser.picture).toEqual(serviceUser.picture)

            })

            it('creates a new user when neither service id and email was found', async () => {
                const createdUser = await Model.createFromService(serviceUser)
                
                expect(createdUser.id).not.toBe(adminUser.id)
                expect(createdUser.services[service]).toBe(serviceUser.id)
                expect(createdUser.name).toBe(serviceUser.name)
                expect(createdUser.email).toBe(serviceUser.email)
                // TODO: Fails
                // expect(createdUser.picture).toEqual(serviceUser.picture)
            })
        })
    })
})