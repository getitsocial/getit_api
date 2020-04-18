import mongoose, { Schema } from 'mongoose'

const shopSchema = new Schema({
    name: { type: String, required: true },
    contact: {
        phone: { type: String, required: true },
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
    logo: { type: Object, required: false },
    picture: { type: Object, required: false },
    size: {
        type: Number,
        required: true
    },
    user: { 
        type: Schema.Types.ObjectId, 
        ref: 'User',
        required: true
    },
    description: { type: String, required: false },
    published: {
        type: Boolean,
        default: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
}, {
    timestamps: true,
    toJSON: {
        virtuals: true
    }
})

export const modelProjection = function(req, item, cb) {
    let view = {}
    let fields = ['id', 'content']

    /*
    if (req.user) {
        fields = [...fields, 'createdAt']
    }
    */

    fields.forEach((field) => { view[field] = item[field] })

    cb(null, view)
}

shopSchema.index({'$**': 'text'})

export default mongoose.model('Shop', shopSchema)