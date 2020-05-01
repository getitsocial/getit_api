import randtoken from 'rand-token'
import mongoose, { Schema } from 'mongoose'
import { isEmail } from 'validator'
import { hashPassword, passwordValidator } from '~/utils'
import { sendDynamicMail } from '~/services/sendgrid'
import { serverConfig } from '~/config'

const { emailTemplates } = serverConfig

const roles = ['user', 'admin']

const userSchema = new Schema({
    email: {
        type: String,
        validate: isEmail,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        validate: passwordValidator,
        minlength: 6
    },
    name: {
        type: String,
        index: true,
        trim: true
    },
    services: {
        facebook: String,
        github: String,
        google: String
    },
    role: {
        type: String,
        enum: roles,
        default: 'user'
    },
    picture: {
        id: {
            type: String,
            default: 'placeholder'
        },
        url: {
            type: String,
            default: '/api/static/placeholder.png'
        },
    },
    shops: [{ 
        type: Schema.Types.ObjectId, 
        ref: 'Shop',
    }],
    activeShop: {
        type: Schema.Types.ObjectId,
        ref: 'Shop'
    },
    location: {
        type: Object
    },
    description: {
        type: String,
        required: false,
        maxlength: 2000
    },
    verified: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true
    },
    toObject: {
        virtuals: true
    }
})

// Set initial user picture generated by email
userSchema.path('email').set(function (email) {   
    if (!this.name)
        this.name = email.replace(/^(.+)@.+$/, '$1')
    
    return email
})


// Catch key error
userSchema.post('save', function (error, document, next) {
    next( error?.code === 11000 ? 'Diese E-Mail Adresse existiert bereits.' : error)
})

// Hash password if changed
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next()

    /* istanbul ignore next */
    try {
        this.password = await hashPassword(this.password)
        next()
    } catch(error) {
        next(error)
    }

})


export const modelProjection = function(req, item = this, cb) {
    
    const view = {}
    const fields = ['_id', 'name', 'email', 'picture', 'role', 'userSettings', 'createdAt', 'location', 'description', 'shops', 'activeShop']

    fields.forEach((field) => { view[field] = item[field] })
    
    if(!cb)
        return view

    cb(null, view)
    
}

userSchema.statics = {
    roles,
    async createFromService ({ service, id, email, name, picture }) {
        const user = await this.findOne({ $or: [{ [`services.${service}`]: id }, { email }] })
        if (user) {
            user.services[service] = id
            user.name = name
            user.picture = picture
            user.verified = true
            return user.save()
        } else {
            const password = randtoken.generate(32, 'aA1!&bB2§/cC3$(dD4%)')
            const newUser =  this.create({ services: { [service]: id }, email, password, name, picture, verified: true })

            if (process.env.NODE_ENV === 'prod') {
                // Send welcome Mail
                await sendDynamicMail({ toEmail: email,
                    templateId: emailTemplates.welcome,
                    dynamic_template_data: {
                        username: name
                    }
                })
            }

            return newUser
        }
    }
}

userSchema.methods = {
    modelProjection
}

userSchema.index({'$**': 'text'})

export default mongoose.model('User', userSchema)