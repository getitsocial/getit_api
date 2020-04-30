import 'dotenv/config'
import { requireProcessEnv, extractToken } from '~/utils'

export const serverConfig = {
    endpoint: '/api',
    port: process.env.PORT,
    server: {
        name: requireProcessEnv('APP_NAME'),
        version: process.env.APP_VERSION
    },
    throttle: {
        burst: 100,     // Max 10 concurrent requests (if tokens)
        rate: 2,        // Steady state: 2 request / 1 seconds
        ip: true,       // throttle per IP
    },
    masterKey: requireProcessEnv('MASTER_KEY'),
    jwt: {
        secret: requireProcessEnv('JWT_SECRET'),
        credentialsRequired: false,
        getToken: (req) => extractToken(req)
    },
    sendgridKey: requireProcessEnv('SENDGRID_KEY'),
    emailTemplates: {
        welcome: 'd-e77bbfffbb884f9e82b21ccaa664d867',
        forgot: 'd-6d6874a8a81b4ae68ccda1804e29bc9f'
    },
    defaultEmail: 'no-reply@getit.social'
}

export const dbConfig = {
    url: process.env.MONGODB_URI,
    options: {
        useNewUrlParser: true, 
        useUnifiedTopology: true,
        useCreateIndex: true,
        useFindAndModify: true
    }
}

export const dbIndex = {
    url: process.env.REDIS_URL
}

export const restConfig = {
    /**
     * You can customize global rest configurations here
     * sort: '-createdAt'
     * outputFormat: 'json-api'
     */
    pageSize: 50
}

export const i18nConfig = {
    locales: ['en', 'de'],
    directory: './locales',
    defaultLocale: 'en',
}

export const cloudinaryConfig = {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,    
}