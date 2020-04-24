import restify, { plugins } from 'restify'
import { Router } from 'restify-router'
import { connect } from '~/services/mongoose'
import { serverConfig, dbConfig, i18nConfig } from '~/config' 
import routes from '~/api'
import i18n from 'i18n'
import { join } from 'path'

const router = new Router()
const server = restify.createServer(serverConfig.server)
const processMode =  process.env.NODE_ENV

/**
 * configure i18n
 */
i18n.configure(i18nConfig)
server.use(i18n.init)

/**
 * Server dependencies
 */
server.use(plugins.throttle(serverConfig.throttle))
server.use(plugins.acceptParser(server.acceptable))
server.use(plugins.bodyParser({mapParams: true, mapFiles: true, requestBodyOnGet: false}))
server.use(plugins.queryParser())
server.use(plugins.gzipResponse())

/**
 * Import all routes
 */
router.add(serverConfig?.endpoint, routes)

/* istanbul ignore next */ 
router.get('/', (req, res, next) => {
    res.send(`${res.__('hello')} ${server.name}!`)
    next()
})

// Static files
router.get('/api/static/*', restify.plugins.serveStatic({
    directory: __dirname,
}))

router.applyRoutes(server)

/**
 * Connect to database
 */
/* istanbul ignore next */ 
if(processMode !== 'test') {
    (async () => {
        try {
            await connect(dbConfig)
            console.clear()
            await server.listen((serverConfig.port || 3000), () => 
                console.log('\x1b[36m',`Server ${server.name} listen in ${processMode} mode`,'\x1b[0m'))
        } catch {
            throw new Error('mongodb connection failed!')
        }
    })()
} 

/* istanbul ignore next */ 
server.on('uncaughtException', (req, res, route, err) => 
    console.error(err))

/* istanbul ignore next */ 
if(processMode === 'development')
    server.on('after', restify.plugins.metrics({ server: server }, (err, metrics) => 
        console.info(metrics)))

/**
 * Export for testing
 * @returns {Function} the main Server
 */
export default server
