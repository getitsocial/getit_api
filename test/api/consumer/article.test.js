import request from 'supertest'
import { isJWT } from 'validator'
import server from '~/server'
import { serverConfig } from '~/config'
import Article from '!/article'
import Category from '!/category'
import User from '!/user'
import Shop from '!/shop'
import { sign } from '~/services/guard'
import { defaultShopData, defaultArticleData } from '../data'
import { parseOpeningHours } from '~/utils'

let defaultArticle,
    defaultCategory,
    adminToken,
    defaultUser,
    defaultShop,
    noShopToken,
    defaultToken,
    apiEndpoint = 'consumer/articles'

beforeEach(async (done) => {
    const parsedOpeningHours = parseOpeningHours(defaultShopData().openingHours)

    // Create user
    const adminUser = await User.create({
        name: 'Maximilian',
        email: 'max1@moritz.com',
        password: 'Max123!!!',
        role: 'admin',
    })
    defaultUser = await User.create({
        name: 'Maximilian',
        email: 'max2@moritz.com',
        password: 'Max123!!!',
        role: 'user',
    })
    const noShopUser = await User.create({
        name: 'Bertchen',
        email: 'bert@moritz.com',
        password: 'Max123!!!',
        role: 'user',
    })

    defaultShop = await Shop.create(
        defaultShopData({ author: adminUser._id, parsedOpeningHours })
    )

    defaultUser.shops.push(defaultShop._id)
    defaultUser.activeShop = defaultShop._id
    await defaultUser.save()

    defaultCategory = await Category.create({
        name: 'things',
        author: defaultUser._id,
        shop: defaultShop._id,
    })

    defaultArticle = await Article.create(
        defaultArticleData({
            category: defaultCategory._id,
            author: defaultUser._id,
            shop: defaultShop._id,
        })
    )
    await Article.create(
        defaultArticleData({
            name: 'kebab_1',
            category: defaultCategory._id,
            author: adminUser._id,
            shop: defaultShop._id,
        })
    )

    const view = defaultArticle.modelProjection()
    expect(view.updatedAt).toBeUndefined()
    expect(view.name).toBe('kebab')
    expect(view.articleNumber).toBeTruthy()
    expect(view.stock).toBe(3)
    expect(view.price).toBe(4)
    expect(view.size).toBe('thicc')
    expect(view.currency).toBe('Euro')

    noShopToken = await sign(noShopUser)
    expect(isJWT(noShopToken)).toBe(true)

    // Sign in user
    adminToken = await sign(adminUser)
    expect(isJWT(adminToken)).toBe(true)

    defaultToken = await sign(defaultUser)
    expect(isJWT(defaultToken)).toBe(true)
    done()
})

describe(`Test /${apiEndpoint} endpoint:`, () => {

    test(`GET /${apiEndpoint} 200`, async () => {
        const { statusCode, body } = await request(server)
            // eslint-disable-next-line max-len
            .get(`${serverConfig.endpoint}/${apiEndpoint}?category=${defaultCategory._id}&shopId=${defaultShop.shopId}`)

        expect(body.rows[0].author.name).not.toBeUndefined()
        expect(body.rows[0].author.picture).not.toBeUndefined()
        expect(body.rows[0].category.name).not.toBeUndefined()

        expect(statusCode).toBe(200)
        expect(Array.isArray(body.rows)).toBe(true)
        expect(body.rows).toHaveLength(2)
        expect(typeof body.nextPage).not.toBeUndefined()
        expect(typeof body.prevPage).not.toBeUndefined()
        expect(body.count).toBe(2)
    })

    test(`GET /${apiEndpoint} 404`, async () => {
        const { statusCode } = await request(server)
            // eslint-disable-next-line max-len
            .get(`${serverConfig.endpoint}/${apiEndpoint}?category=${defaultCategory._id}&shopId=kekek`)

        expect(statusCode).toBe(404)

    })

    test(`GET /${apiEndpoint} 200`, async () => {
        const { statusCode, body } = await request(server)
            // eslint-disable-next-line max-len
            .get(`${serverConfig.endpoint}/${apiEndpoint}?category=${defaultCategory._id}&limit=1&shopId=${defaultShop.shopId}`)

        expect(statusCode).toBe(200)
        expect(Array.isArray(body.rows)).toBe(true)
        expect(body.rows).toHaveLength(1)
        expect(typeof body.nextPage).not.toBeUndefined()
        expect(typeof body.prevPage).not.toBeUndefined()
        expect(body.count).toBe(2)
    })

    test(`GET /${apiEndpoint} 200`, async () => {
        const { statusCode, body } = await request(server)
        // eslint-disable-next-line max-len
            .get(`${serverConfig.endpoint}/${apiEndpoint}?category=${defaultCategory._id}&limit=1&shopId=${defaultShop.shopId}`)
            .set('Authorization', 'Bearer ' + defaultToken)

        expect(statusCode).toBe(200)
        expect(Array.isArray(body.rows)).toBe(true)
        expect(body.rows).toHaveLength(1)
        expect(typeof body.nextPage).not.toBeUndefined()
        expect(typeof body.prevPage).not.toBeUndefined()
        expect(body.count).toBe(2)
    })

    test(`GET /${apiEndpoint} 200`, async () => {
        const { statusCode, body } = await request(server)
        // eslint-disable-next-line max-len
            .get(`${serverConfig.endpoint}/${apiEndpoint}?catego2ry=${defaultCategory._id}&limit=1&shopId=${defaultShop.shopId}`)

        expect(statusCode).toBe(200)
        expect(Array.isArray(body.rows)).toBe(true)
        expect(body.rows).toHaveLength(1)
        expect(typeof body.nextPage).not.toBeUndefined()
        expect(typeof body.prevPage).not.toBeUndefined()
        expect(body.count).toBe(2)
    })

    test(`GET /${apiEndpoint} 400`, async () => {
        const { statusCode } = await request(server)
            .get(`${serverConfig.endpoint}/${apiEndpoint}?category=${defaultCategory._id}&limit=1&`)

        expect(statusCode).toBe(400)
    })

    test(`GET /${apiEndpoint} 200`, async () => {
        const { statusCode, body } = await request(server)
            // eslint-disable-next-line max-len
            .get(`${serverConfig.endpoint}/${apiEndpoint}?category=${defaultCategory._id}&page=2&shopId=${defaultShop.shopId}`)

        expect(statusCode).toBe(200)
        expect(Array.isArray(body.rows)).toBe(true)
        expect(body.rows).toHaveLength(0)
        expect(typeof body.nextPage).not.toBeUndefined()
        expect(typeof body.prevPage).not.toBeUndefined()
        expect(body.count).toBe(2)
    })

    test(`GET /${apiEndpoint} 200`, async () => {
        const { statusCode, body } = await request(server)
            // eslint-disable-next-line max-len
            .get(`${serverConfig.endpoint}/${apiEndpoint}?category=${defaultCategory._id}&shopId=${defaultShop.shopId}`)

        expect(statusCode).toBe(200)
        expect(Array.isArray(body.rows)).toBe(true)
    })

    test(`GET /${apiEndpoint} 200`, async () => {
        const { statusCode, body } = await request(server)
            // eslint-disable-next-line max-len
            .get(`${serverConfig.endpoint}/${apiEndpoint}?category=${defaultCategory._id}&shopId=${defaultShop.shopId}&search=_1`)

        expect(statusCode).toBe(200)
        expect(Array.isArray(body.rows)).toBe(true)
        expect(body.rows).toHaveLength(1)
    })

    test(`GET /${apiEndpoint} 200`, async () => {
        const { statusCode, body } = await request(server)
            // eslint-disable-next-line max-len
            .get(`${serverConfig.endpoint}/${apiEndpoint}?category=${defaultCategory._id}&shopId=${defaultShop.shopId}&search=kebab`)

        expect(statusCode).toBe(200)
        expect(Array.isArray(body.rows)).toBe(true)
        expect(body.rows).toHaveLength(2)

    })
    // end public

    test(`GET /${apiEndpoint}:id 200`, async () => {
        const { status, body } = await request(server)
            .get(
                `${serverConfig.endpoint}/${apiEndpoint}/${defaultArticle._id}`
            )

        expect(body.author.name).not.toBeUndefined()
        expect(body.author.picture).not.toBeUndefined()
        expect(body.category.name).not.toBeUndefined()
        expect(status).toBe(200)
        expect(typeof body).toEqual('object')
    })



    test(`GET /${apiEndpoint}/:id 404`, async () => {
        const { status } = await request(server)
            .get(`${serverConfig.endpoint}/${apiEndpoint}/123456789098765432123456`)

        expect(status).toBe(404)
    })


})
