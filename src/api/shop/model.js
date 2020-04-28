import mongoose, { Schema } from 'mongoose'
import slugify from 'slugify'
import request from 'request-promise'
import circleToPolygon from 'circle-to-polygon'
import { isEmpty } from 'lodash' 

const apiKey = process.env.HERE_API

const shopSchema = new Schema({
    name: { 
        type: String, 
        required: true,
        unique: true
    },
    contact: {
        phone: { 
            type: String, 
            required: true 
        },
        website: { 
            type: String, 
            required: false 
        },
    },
    shopId: { 
        type: String,
        unique: true,
        default: function() {
            return slugify(this.name, {
                lower: true,
            })
        },
    },
    address: {
        label: { type: String, required: true },
        city: { type: String, required: true },
        country: { type: String, required: true },
        county: { type: String, required: true },
        district: { type: String, required: true },
        houseNumber: { type: String, required: false },
        locationId: { type: String, required: true },
        state: { type: String, required: true },
        street: { type: String, required: true },
        postalCode: { type: Number, required: true },
    },
    companyType: {
        type: String,
        required: true,
        enum: ['SS','EU','PG','GN','GP','AG']
    },
    logo: {}, 
    picture: {},
    size: {
        type: Number,
        required: true
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User', 
        required: true
    },
    description: { type: String, required: false },
    published: {
        type: Boolean,
        default: true
    },
    displayPosition: {
        latitude: { type: Number }, 
        longitude: { type: Number },
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true
    }
})

export const modelProjection = function(req, item = this, cb) {    

    const view = {}
    const fields = ['id', 'shopId', 'name', 'contact', 'address', 'companyType', 'logo', 'picture', 'size', 'description', 'polygonCoordinates']

    fields.forEach((field) => { view[field] = item[field] })

    if(!cb)
        return view

    cb(null, view)

}

// Get coordinates if locationId changed
shopSchema.pre('save', async function (next) {
    if (!this.isModified('address.locationId')) next()
    /* istanbul ignore next */
    try {
        // dont touch
        const { response: { view: [ { result: [ { location: { displayPosition }}]}]}} = await request({ uri: `https://geocoder.ls.hereapi.com/6.2/geocode.json?locationid=${this.address.locationId}&jsonattributes=1&gen=9&apiKey=${apiKey}`, json: true })
        this.displayPosition = displayPosition
        next()
    } catch(error) {
        next(error)
    }
})

shopSchema.pre('save', async function (next) {
    /* istanbul ignore next */
    try {
        if(isEmpty(this.picture) || !this.picture) {
            this.picture = {
                url: '/api/static/placeholder-bg.png',
                id: 'placeholder'
            }
        }

        if(isEmpty(this.logo) || !this.logo) {
            this.logo = {
                url: '/api/static/placeholder.png',
                id: 'placeholder'
            }
        }
        next()
    } catch(error) {
        next(error)
    }
})

shopSchema.virtual('polygonCoordinates').get(function () {
    try {
        return circleToPolygon([this.displayPosition.longitude, this.displayPosition.latitude], 100, 32)
    } catch (error) {
        return  []
    }
})

shopSchema.virtual('address.display').get(function () {
    return `${this.address.street} ${this.address.houseNumber}, ${this.address.postalCode} ${this.address.city}`
})


shopSchema.methods = {
    modelProjection
}

shopSchema.index({'$**': 'text'})

export default mongoose.model('Shop', shopSchema)