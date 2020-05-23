import request from 'supertest'
import { isJWT } from 'validator'
import server from '~/server'
import { serverConfig } from '~/config'
import { sign } from '~/services/guard'
import User from '~/api/user/model'
import { existsSync } from 'fs'
import { mediaSettings, uploadToCloudinary } from '~/services/mediaupload'

let adminToken,
    filePath = `${__dirname}/../ressources/cat.jpeg`,
    defaultUser,
    defaultToken,
    defaultPublicId,
    apiEndpoint = 'media'

beforeAll(async (done) => {

    // Create user
    const adminUser = await User.create({ name: 'Maximilian',
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


    adminToken = await sign(adminUser)
    expect(isJWT(adminToken)).toBe(true)

    defaultToken = await sign(defaultUser)
    expect(isJWT(defaultToken)).toBe(true)


    const settings = mediaSettings('test')
    settings.tags = [ defaultUser._id ]
    delete settings.crop

    const response = await uploadToCloudinary(filePath, settings)
    defaultPublicId = response.public_id
    done()

})

describe(`Test /${apiEndpoint} endpoint:`, () => {

    test(`POST /${apiEndpoint} 200`, async () => {
        expect(existsSync(filePath)).toBe(true)

        const { statusCode, body } = await request(server)
            .post(`${serverConfig.endpoint}/${apiEndpoint}/article`)
            .set('Authorization', 'Bearer ' + defaultToken)
            .attach('file', filePath)

        expect(statusCode).toBe(200)
        expect(typeof body.id).toBe('string')
        expect(typeof body.url).toBe('string')

    }, 30000)

    test(`POST /${apiEndpoint} 401`, async () => {
        expect(existsSync(filePath)).toBe(true)

        const { statusCode } = await request(server)
            .post(`${serverConfig.endpoint}/${apiEndpoint}/logo`)
            .attach('file', filePath)

        expect(statusCode).toBe(401)

    }, 30000)

    test(`POST /${apiEndpoint} 400`, async () => {
        expect(existsSync(filePath)).toBe(true)

        const { statusCode } = await request(server)
            .post(`${serverConfig.endpoint}/${apiEndpoint}/lelelelelel`)
            .set('Authorization', 'Bearer ' + defaultToken)
            .attach('file', filePath)

        expect(statusCode).toBe(400)

    }, 30000)

    test(`POST /${apiEndpoint} 400`, async () => {

        const { statusCode } = await request(server)
            .post(`${serverConfig.endpoint}/${apiEndpoint}/user`)
            .set('Authorization', 'Bearer ' + defaultToken)

        expect(statusCode).toBe(400)
    }, 30000)

    test(`DELETE /${apiEndpoint} 204`, async () => {
        const { statusCode } = await request(server)
            .delete(`${serverConfig.endpoint}/${apiEndpoint}/${defaultPublicId}`)
            .set('Authorization', 'Bearer ' + defaultToken)

        expect(statusCode).toBe(204)
    }, 30000)

    test(`DELETE /${apiEndpoint} 401`, async () => {
        const { statusCode } = await request(server)
            .delete(`${serverConfig.endpoint}/${apiEndpoint}/${defaultPublicId}`)

        expect(statusCode).toBe(401)
    }, 30000)

    test(`DELETE /${apiEndpoint} 401`, async () => {
        const { statusCode } = await request(server)
            .delete(`${serverConfig.endpoint}/${apiEndpoint}/${defaultPublicId}`)
            .set('Authorization', 'Bearer ' + adminToken)

        expect(statusCode).toBe(401)
    }, 30000)

})