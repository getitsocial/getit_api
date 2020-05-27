import request from 'supertest'
import { isJWT } from 'validator'
import server from '~/server'
import { serverConfig } from '~/config'
import { sign } from '~/services/guard'
import User from '!/user'
import Verification from '!/verification'

let defaultUser,
    defaultToken,
    defaultVerification,
    apiEndpoint = 'verification'

beforeEach(async (done) => {

    defaultUser = await User.create({
        name: 'Maximilian',
        email: 'max2@moritz.com',
        password: 'Max123!!!',
        role: 'user'
    })
    defaultVerification = await Verification.create({ user: defaultUser._id })
    defaultToken = await sign(defaultUser)
    expect(isJWT(defaultToken)).toBe(true)

    done()
})


describe(`Test /${apiEndpoint} endpoint:`, () => {

    test(`GET /${apiEndpoint} 200`, async () => {
        const { statusCode } = await request(server)
            .get(`${serverConfig.endpoint}/${apiEndpoint}/${defaultVerification.token}`)

        expect(statusCode).toBe(204)
        const user = await User.findById(defaultUser._id)
        expect(user.verified).toBe(true)
    })

    test(`GET /${apiEndpoint} 400`, async () => {
        const { statusCode } = await request(server)
            .get(`${serverConfig.endpoint}/${apiEndpoint}/123`)

        expect(statusCode).toBe(400)
    })

})