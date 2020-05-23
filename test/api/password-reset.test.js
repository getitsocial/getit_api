import request from 'supertest'
import { isJWT } from 'validator'
import server from '~/server'
import { serverConfig } from '~/config'
import { sign } from '~/services/guard'
import User from '~/api/user/model'
import PasswordResetModel from '~/api/password-reset/model'

let defaultToken,
    defaultUser,
    defaultPasswordReset,
    apiEndpoint = 'password-resets'


beforeEach(async () => {

    // Create User
    defaultUser = await User.create({
        name: 'Maximilian',
        email: 'max1@moritz.com',
        password: 'Max123!!!',
        role: 'user'
    })
    // Create password reset
    defaultPasswordReset = await PasswordResetModel.create({ user: defaultUser._id })

    defaultToken = await sign(defaultUser)
    expect(isJWT(defaultToken)).toBe(true)

})

describe(`Test /${apiEndpoint} endpoint:`, () => {

    test(`POST /${apiEndpoint} 201`, async () => {
        const { statusCode } = await request(server)
            .post(`${serverConfig.endpoint}/${apiEndpoint}`)
            .set('Authorization', 'Bearer ' + serverConfig.masterKey)
            .send({ email: 'max1@moritz.com', link: 'https://getitapp.herokuapp.com/api/password-resets/' })
        expect(statusCode).toBe(201)
    })

    test(`POST /${apiEndpoint} 401`, async () => {
        const { statusCode } = await request(server)
            .post(`${serverConfig.endpoint}/${apiEndpoint}`)
            .send({ email: 'max1@moritz.com', link: 'https://getitapp.herokuapp.com/api/password-resets/' })

        expect(statusCode).toBe(401)
    })

    test(`POST /${apiEndpoint} 400`, async () => {
        const { statusCode } = await request(server)
            .post(`${serverConfig.endpoint}/${apiEndpoint}`)
            .set('Authorization', 'Bearer ' + serverConfig.masterKey)
            .send({ link: 'https://getitapp.herokuapp.com/api/password-resets/' })
        expect(statusCode).toBe(400)
    })

    test(`POST /${apiEndpoint} 400`, async () => {
        const { statusCode } = await request(server)
            .post(`${serverConfig.endpoint}/${apiEndpoint}`)
            .set('Authorization', 'Bearer ' + serverConfig.masterKey)
            .send({ email: 'max1@moritz.com' })
        expect(statusCode).toBe(400)
    })

    test(`GET /${apiEndpoint}/:token 200`, async () => {
        const { statusCode, body } = await request(server)
            .get(`${serverConfig.endpoint}/${apiEndpoint}/${defaultPasswordReset.token}`)

        expect(typeof body.picture).toBe('object')
        expect(body.name).toBe('Maximilian')
        expect(body.location).toBeUndefined()
        expect(body.password).toBeUndefined()
        expect(body.role).toBeUndefined()
        expect(body.email).toBeUndefined()
        expect(body.shops).toBeUndefined()
        expect(body.activeShop).toBeUndefined()

        expect(statusCode).toBe(200)
    })

    test(`GET /${apiEndpoint}/:token 400`, async () => {
        const { statusCode } = await request(server)
            .get(`${serverConfig.endpoint}/${apiEndpoint}/123`)

        expect(statusCode).toBe(400)
    })

    test(`PATCH /${apiEndpoint}/:token 204`, async () => {
        const { password: oldHashedPassword } = await User.findById(defaultUser._id)

        const { statusCode } = await request(server)
            .patch(`${serverConfig.endpoint}/${apiEndpoint}/${defaultPasswordReset.token}`)
            .send({ password: 'MeinNeuesSuperGeilesPasswort2!!!!' })

        const { password: newHashedPassword } = await User.findById(defaultUser._id)

        expect(statusCode).toBe(204)
        expect(oldHashedPassword).not.toBe(newHashedPassword)
    })

    test(`PATCH /${apiEndpoint}/:token 400`, async () => {
        const { password: oldHashedPassword } = await User.findById(defaultUser._id)

        const { statusCode } = await request(server)
            .patch(`${serverConfig.endpoint}/${apiEndpoint}/${defaultPasswordReset.token}`)
            .send({ password: 'zu unsicher' })

        const { password: newHashedPassword } = await User.findById(defaultUser._id)

        expect(statusCode).toBe(400)
        expect(oldHashedPassword).toBe(newHashedPassword)
    })

})