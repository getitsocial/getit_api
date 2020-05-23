import request from 'supertest'
import { isJWT } from 'validator'
import server from '~/server'
import { serverConfig } from '~/config'
import { sign } from '~/services/guard'
import User from '~/api/user/model'

let defaultUser,
    defaultToken,
    apiEndpoint = 'maps'

beforeEach(async (done) => {

    // Create user
    defaultUser =  await User.create({
        name: 'Maximilian',
        email: 'max2@moritz.com',
        password: 'Max123!!!',
        role: 'user'
    })

    // Sign in
    defaultToken = await sign(defaultUser)
    expect(isJWT(defaultToken)).toBe(true)

    done()
})

describe(`Test /${apiEndpoint} endpoint:`, () => {

    test(`GET /${apiEndpoint}/geocode 200`, async () => {
        const { statusCode, body } = await request(server)
            .get(`${serverConfig.endpoint}/${apiEndpoint}/geocode?query=dummerstorfer+2`)
            .set('Authorization', 'Bearer ' + defaultToken)

        expect(statusCode).toBe(200)
        expect(typeof body).toEqual('object')

    })

    test(`GET /${apiEndpoint}/detail 200`, async () => {
        const { statusCode, body } = await request(server)
            .get(`${serverConfig.endpoint}/${apiEndpoint}/detail?locationid=NT_0OLEZjK0pT1GkekbvJmsHC_yYD`)
            .set('Authorization', 'Bearer ' + defaultToken)

        expect(statusCode).toBe(200)
        expect(typeof body).toEqual('object')

    })

    test(`GET /${apiEndpoint}/detail 400`, async () => {
        const { statusCode } = await request(server)
            .get(`${serverConfig.endpoint}/${apiEndpoint}/detail?cyka`)
            .set('Authorization', 'Bearer ' + defaultToken)

        expect(statusCode).toBe(400)

    })

})