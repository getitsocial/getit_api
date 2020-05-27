import request from 'supertest'
import { isJWT } from 'validator'
import server from '~/server'
import { serverConfig } from '~/config'
import { sign } from '~/services/guard'
import User from '!/user'
import Shop from '!/shop'
import Article from '!/article'
import Category from '!/category'
import { defaultShopData, defaultArticleData } from '../data'
import { parseOpeningHours } from '~/utils'

let defaultCategory,
    adminToken,
    defaultShop,
    defaultUser,
    adminUser,
    defaultToken,
    apiEndpoint = 'consumer/categories'

beforeEach(async (done) => {


    const parsedOpeningHours = parseOpeningHours(defaultShopData().openingHours)
    // Create user
    adminUser = await User.create({
        name: 'Maximilian',
        email: 'max1@moritz.com',
        password: 'Max123!!!',
        role: 'admin'
    })
    defaultUser =  await User.create({
        name: 'Maximilian',
        email: 'max2@moritz.com',
        password: 'Max123!!!',
        role: 'user'
    })

    defaultShop = await Shop.create(defaultShopData({ author: defaultUser._id, parsedOpeningHours }))
    // Create object
    defaultUser.activeShop = defaultShop._id
    defaultUser.shops.push(defaultShop._id)
    await defaultUser.save()

    await Category.create({ name: 'test_category', author: adminUser._id, shop: defaultShop._id })

    defaultCategory = await Category.create({ name: 'test_category', author: defaultUser._id, shop: defaultShop._id })
    await Category.create({ name: 'test_category_1', author: defaultUser._id, shop: defaultShop._id })

    await Article.create(defaultArticleData({
        category: defaultCategory._id,
        author: defaultUser._id,
        shop: defaultShop._id
    }))


    // Sign in user
    adminToken = await sign(adminUser)
    expect(isJWT(adminToken)).toBe(true)

    defaultToken = await sign(defaultUser)
    expect(isJWT(defaultToken)).toBe(true)

    done()
})


describe(`Test /${apiEndpoint} endpoint:`, () => {

    test(`GET /${apiEndpoint} 200 public`, async () => {
        const { statusCode, body } = await request(server)
            .get(`${serverConfig.endpoint}/${apiEndpoint}?shopId=${defaultShop.shopId}`)

        const firstItem = body.rows[0]
        expect(body.count).toBe(3)
        expect(body.rows).toHaveLength(3)
        expect(statusCode).toBe(200)
        expect(Array.isArray(body.rows)).toBe(true)
        expect(typeof firstItem.name).toEqual('string')
        expect(firstItem.name).toEqual(defaultCategory.name)
        expect(firstItem._id).toBeTruthy()
        expect(firstItem.updatedAt).toBeUndefined()
    })

    test(`GET /${apiEndpoint} 400 public`, async () => {
        const { statusCode } = await request(server)
            .get(`${serverConfig.endpoint}/${apiEndpoint}`)
        expect(statusCode).toBe(400)
    })

    test(`GET /${apiEndpoint} 404 public`, async () => {
        const { statusCode } = await request(server)
            .get(`${serverConfig.endpoint}/${apiEndpoint}?shopId=lololololol`)
        expect(statusCode).toBe(404)
    })

    test(`GET /${apiEndpoint} 200 public page && limit`, async () => {
        const { statusCode, body } = await request(server)
            .get(`${serverConfig.endpoint}/${apiEndpoint}?shopId=${defaultShop.shopId}&page=1&limit=1`)

        expect(body.rows).toHaveLength(1)
        expect(statusCode).toBe(200)
        expect(Array.isArray(body.rows)).toBe(true)
    })

    test(`GET /${apiEndpoint} 200 public limit`, async () => {
        const { statusCode, body } = await request(server)
            .get(`${serverConfig.endpoint}/${apiEndpoint}?shopId=${defaultShop.shopId}&limit=1`)

        expect(body.rows).toHaveLength(1)
        expect(statusCode).toBe(200)
        expect(Array.isArray(body.rows)).toBe(true)
    })

    test(`GET /${apiEndpoint} 200 public page`, async () => {
        const { statusCode, body } = await request(server)
            .get(`${serverConfig.endpoint}/${apiEndpoint}?shopId=${defaultShop.shopId}&page=1`)

        expect(body.rows).toHaveLength(3)
        expect(statusCode).toBe(200)
        expect(Array.isArray(body.rows)).toBe(true)
    })

    test(`GET /${apiEndpoint} 200 search`, async () => {
        const { statusCode, body } = await request(server)
            .get(`${serverConfig.endpoint}/${apiEndpoint}?shopId=${defaultShop.shopId}&search=test_`)

        expect(body.rows).toHaveLength(3)
        expect(statusCode).toBe(200)
        expect(Array.isArray(body.rows)).toBe(true)
    })

    test(`GET /${apiEndpoint} 200 search`, async () => {
        const { statusCode, body } = await request(server)
            .get(`${serverConfig.endpoint}/${apiEndpoint}?shopId=${defaultShop.shopId}&search=_1`)

        const firstItem = body.rows[0]
        expect(body.rows).toHaveLength(1)
        expect(firstItem.name).toEqual('test_category_1')
        expect(statusCode).toBe(200)
        expect(Array.isArray(body.rows)).toBe(true)
    })

})