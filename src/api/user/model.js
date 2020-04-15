import crypto from 'crypto'
import randtoken from 'rand-token'
import mongoose, { Schema } from 'mongoose'
import { isEmail } from 'validator'
import { BadRequestError } from 'restify-errors'
// import { serverConfig } from '~/config'
import { hashPassword, passwordValidator } from '~/utils'
// import { sendDynamicMail } from '~/services/sendgrid'
// let { emailTemplates } = serverConfig
// 
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
        type: String,
        trim: true
    },
    location: {
        type: Object
    },
    description: { type: String, required: false, maxlength: 2000 },
    shops: [{
        type: Schema.Types.ObjectId, 
        ref: 'Shop'
    }]
}, {
    timestamps: true,
    toJSON: {
        virtuals: true
    }
})

userSchema.path('email').set(function (email) {
    if (!this.picture || this.picture.indexOf('https://api.adorable.io') === 0) 
        this.picture = `https://api.adorable.io/avatars/285/${email}.png`

    if (!this.name)
        this.name = email.replace(/^(.+)@.+$/, '$1')
    
    return email
})

userSchema.post('save', function (error, document, next) {
    next( error?.code === 11000 
        ?   'Diese E-Mail Adresse existiert bereits.'
        :   error)
})

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

userSchema.pre('save', function (next) {
    console.log(this.isModified('picture'))
    console.log(this.picture)
    if (this.isModified('picture') && !this.picture) 
        this.picture = `https://api.adorable.io/avatars/285/${this.email}.png`
    next()
})


export const modelProjection = function(req, item = this, cb) {
    let view = {}
    let fields = ['_id', 'name', 'email', 'picture', 'role', 'userSettings', 'createdAt', 'shops', 'location', 'description']

    /*
     * If user logged or have speicific role.

    if (req.user?.role === 'admin') {
        fields = [...fields, 'createdAt']
    }

     */

    fields.forEach((field) => { view[field] = item[field] })


    /* 
     * If the projection calls from a array, you have a cb. Else return view
     */
    
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
            return user.save()
        } else {
            const password = randtoken.generate(32, 'aA1!&bB2§/cC3$(dD4%)')
            const newUser =  this.create({ services: { [service]: id }, email, password, name, picture })

            /**
             *   Send welcome Mail
             *   await sendDynamicMail({ toEmail: email,
             *       templateId: emailTemplates.welcome,
             *       dynamic_template_data: {
             *           username: name
             *       }
             *   })
             */

            return newUser
        }
    }
}

userSchema.methods = {
    modelProjection
}

userSchema.index({'$**': 'text'})

export default mongoose.model('User', userSchema)