import mongoose, { Schema } from 'mongoose'
import { isEmail } from 'validator'

const shopSchema = new Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    contact: {
        tel: { type: Number, required: true },
        email: { type: String, required: true, validate: isEmail },
        address: {
            city: { type: String, required: true },
            street: { type: String, required: true },
            zip: { type: Number, required: true },
            number: { type: String, required: true },
        }
    },
    user: { 
        type: Schema.Types.ObjectId, 
        ref: 'User',
        required: true
    }
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