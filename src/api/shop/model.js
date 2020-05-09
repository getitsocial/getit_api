import mongoose, { Schema } from 'mongoose'
import slugify from 'slugify'
import request from 'request-promise'
import circleToPolygon from 'circle-to-polygon'
import User from '~/api/user/model'
import { openingHoursValidator, minutesToHHMM } from '~/utils'

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
    parsedOpeningHours: {
        type: Object,
        monday: [ { open: { type: Number }, close: { type: Number } } ],
        tuesday: [ { open: { type: Number }, close: { type: Number } } ],
        wednesday: [ { open: { type: Number }, close: { type: Number } } ],
        thursday: [ { open: { type: Number }, close: { type: Number } } ],
        friday: [ { open: { type: Number }, close: { type: Number } } ],
        saturday: [ { open: { type: Number }, close: { type: Number } } ],
        sunday: [ { open: { type: Number }, close: { type: Number } } ],
        exceptions: {},
        validate: openingHoursValidator
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
    position: {
        type: Object
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true
    }
})


export const modelProjection = function(req, item = this, cb) {    

    const view = {}
    const fields = ['_id', 'shopId', 'displayPosition', 'name', 'contact', 'address', 'companyType', 'logo', 'picture', 'size', 'description', 'polygonCoordinates', 'openingHours', 'deliveryOptions']

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
        this.position = { type: 'Point', coordinates: [ displayPosition.longitude, displayPosition.latitude ]}
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

shopSchema.virtual('displayPosition').get(function () {
    return { latitude: this.position.coordinates[1], longitude: this.position.coordinates[0] }
})

shopSchema.virtual('address.display').get(function () {
    return `${this.address.street} ${this.address.houseNumber}, ${this.address.postalCode} ${this.address.city}`
})

shopSchema.virtual('openingHours').get(function() {
    
    const openingHours = {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: [],
    }
    if (this.parsedOpeningHours === undefined) return openingHours
    const days = Object.keys(this.parsedOpeningHours).filter(day => day !== 'exceptions')

    days.forEach((day) => {
        openingHours[day] = this.parsedOpeningHours[day]
        openingHours[day].forEach((segment) => {
            segment.allDayOpen = segment.open === 0 && segment.close === 0
            segment.open = minutesToHHMM(segment.open)
            segment.close = minutesToHHMM(segment.close)
        })
    })

    return openingHours
})

/* 
shopSchema.virtual('isOpen').get(function () {
    const date = new Date()
    const day = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][date.getDay()]
    const minutes = (date.getHours() * 60) + date.getMinutes()

    if (this.openingHours[day].length === 0) return false // all day closed
    if (this.openingHours[day][0].open === 0 && this.openingHours[day][0].close === 0) return true // all day open

    return this.openingHours[day].findIndex((segment) => segment.open <= minutes && minutes <= segment.close) !== -1
}) 
*/

shopSchema.methods = {
    modelProjection,
    removeUsers
}

shopSchema.index({'$**': 'text'})

export default mongoose.model('Shop', shopSchema)