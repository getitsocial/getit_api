import request from 'supertest'
import { isJWT } from 'validator'
import Shop from '!/shop'
import User from '!/user'
import Category from '!/category'
import Article from '!/article'

import { serverConfig } from '~/config'
import server from '~/server'
import { sign } from '~/services/guard'
import { defaultShopData, defaultArticleData } from '../data'
import { parseOpeningHours } from '~/utils'
import { encode } from 'ngeohash'

let defaultShop,
    adminShop,
    adminUser,
    adminToken,
    defaultUser,
    defaultToken,
    apiEndpoint = 'consumer/shops'

beforeEach(async (done) => {

    const parsedOpeningHours = parseOpeningHours(defaultShopData().openingHours)
    // Create user
    adminUser = await User.create({
        name: 'Maximilian',
        email: 'max1@moritz.com',
        password: 'Max123!!!',
        role: 'admin'
    })
    defaultUser = await User.create({
        name: 'Maximilian',
        email: 'max2@moritz.com',
        password: 'Max123!!!',
        role: 'user'
    })

    // Create shop
    defaultShop = await Shop.create(defaultShopData({ author: defaultUser._id, parsedOpeningHours }))
    adminShop = await Shop.create(defaultShopData({
        author: adminUser._id,
        name: 'shopname_1',
        parsedOpeningHours,
        openingHours: {}
    }))

    const category = await Category.create({ name: 'test_category_1', author: defaultUser._id, shop: defaultShop._id })
    await Category.create({ name: 'test_category_2', author: defaultUser._id, shop: defaultShop._id })

    await Article.create(defaultArticleData({ category: category._id, author: defaultUser._id, shop: defaultShop._id }))
    await Article.create(defaultArticleData({ category: category._id, author: defaultUser._id, shop: defaultShop._id }))

    expect(defaultShop.contact.facebook).toBe('https://facebook.de')
    expect(defaultShop.contact.instagram).toBe('https://instagram.de')

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

    test(`GET /${apiEndpoint}/near 200`, async () => {
        const { statusCode, body } = await request(server)
            .get(`${serverConfig.endpoint}/${apiEndpoint}/near/${encode(49.009387, 8.377048)}`)
            .set('Authorization', 'Bearer ' + defaultToken)

        expect(Array.isArray(body)).toBe(true)
        expect(body).toHaveLength(2)
        expect(statusCode).toBe(200)
    })

    test(`GET /${apiEndpoint}/near unpublished shop 200`, async () => {
        defaultShop.set({ published: false })
        await defaultShop.save()

        const { statusCode, body } = await request(server)
            .get(`${serverConfig.endpoint}/${apiEndpoint}/near/${encode(49.009387, 8.377048)}`)
            .set('Authorization', 'Bearer ' + defaultToken)

        expect(Array.isArray(body)).toBe(true)
        expect(body).toHaveLength(1)
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

})