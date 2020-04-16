import { EventEmitter } from 'events'
import MongodbMemoryServer from 'mongodb-memory-server'
import mongoose from '~/services/mongoose'
import { redisClient } from '~/services/guard'

EventEmitter.defaultMaxListeners = Infinity

global.Array = Array
global.Date = Date
global.Function = Function
global.Math = Math
global.Number = Number
global.Object = Object
global.RegExp = RegExp
global.String = String
global.Uint8Array = Uint8Array
global.WeakMap = WeakMap
global.Set = Set
global.Error = Error
global.TypeError = TypeError
global.parseInt = parseInt
global.parseFloat = parseFloat

let mongoServer

beforeAll(async () => {
    mongoServer = new MongodbMemoryServer()
    const mongoUri = await mongoServer.getConnectionString()
    await mongoose.connect(mongoUri, {
        useNewUrlParser: true, 
        useUnifiedTopology: true,
        useCreateIndex: true
    }, (err) => {
        if (err) console.error(err)
    })
})

afterAll(() => {
    mongoose.connection.close()
    mongoServer.stop()
    redisClient.quit()
})  

afterEach(() => {
    const { collections } = mongoose.connection
    const promises = []
    Object.keys(collections).forEach((collection) => {
        promises.push(collections[collection].remove())
    })
    return Promise.all(promises)
})
