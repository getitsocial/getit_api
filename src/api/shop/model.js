import mongoose, { Schema } from 'mongoose'
import slugify from 'slugify'
import request from 'request-promise'
import circleToPolygon from 'circle-to-polygon'
import User from '~/api/user/model'

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
        facebook: { // TODO: Add validation
            type: String,
        },
        instagram: { // TODO: Add validation
            type: String,
        }
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
    // TODO: Add validation + tests + virtuals?
    openingHours: {
        type: Object,
        monday: { open: { type: Number, min: 0, max: 1440 }, close: { type: Number, min: 0, max: 1440 }, allDayOpen: { type: Boolean }, allDayClosed: { type: Boolean } },
        tuesday: { open: { type: Number, min: 0, max: 1440 }, close: { type: Number, min: 0, max: 1440 }, allDayOpen: { type: Boolean }, allDayClosed: { type: Boolean } },
        wednesday: { open: { type: Number, min: 0, max: 1440 }, close: { type: Number, min: 0, max: 1440 }, allDayOpen: { type: Boolean }, allDayClosed: { type: Boolean } },
        thursday: { open: { type: Number, min: 0, max: 1440 }, close: { type: Number, min: 0, max: 1440 }, allDayOpen: { type: Boolean }, allDayClosed: { type: Boolean } },
        friday: { open: { type: Number, min: 0, max: 1440 }, close: { type: Number, min: 0, max: 1440 }, allDayOpen: { type: Boolean }, allDayClosed: { type: Boolean } },
        saturday: { open: { type: Number, min: 0, max: 1440 }, close: { type: Number, min: 0, max: 1440 }, allDayOpen: { type: Boolean }, allDayClosed: { type: Boolean } },
        sunday: { open: { type: Number, min: 0, max: 1440 }, close: { type: Number, min: 0, max: 1440 }, allDayOpen: { type: Boolean }, allDayClosed: { type: Boolean } },
    },
    deliveryOptions: {
        type: [String],
        required: true,
        enum: ['PU', 'MU', 'LD']
    },
    companyType: {
        type: String,
        required: true,
        enum: ['SS','EU','PG','GN','GP','AG']
    },
    logo: {
        url: { type: String, default: '/api/static/placeholder.png' },
        id: { type: String, default: 'placeholder' }
    },
    picture: {
        url: { type: String, default: '/api/static/placeholder-bg.png' },
        id: { type: String, default: 'placeholder' }
    },
    size: {
        type: Number,
        required: true,
        enum: [1, 5, 20, 200 ] // 1-5, 5-20, 20-200, 200-1000
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
    const fields = ['_id', 'shopId', 'name', 'contact', 'address', 'companyType', 'logo', 'picture', 'size', 'description', 'polygonCoordinates', 'openingHours', 'deliveryOptions']

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

export const removeUsers = async function(item = this) {    

    const { _id } = item

    await User.updateMany({ shops: _id }, {'$pull': { shops: _id }})
    
    // If we decide to remove the activeShop too: {'$unset': { 'activeShop': ''}}
}


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
    modelProjection,
    removeUsers
}

shopSchema.index({'$**': 'text'})

export default mongoose.model('Shop', shopSchema)