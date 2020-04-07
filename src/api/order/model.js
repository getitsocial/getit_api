import mongoose, { Schema } from 'mongoose'

const orderSchema = new Schema({
    shop: { 
        type: Schema.Types.ObjectId, 
        ref: 'Shop',
        required: true
    },
    user: { 
        type: Schema.Types.ObjectId, 
        ref: 'User',
        required: true
    },
    items: [{ 
        type: Schema.Types.ObjectId, 
        ref: 'Article',
        required: true
    }],
    status: { 
        type: String, 
        required: true, 
        enum: ['canceled', 'done', 'open', 'shipped', 'pending'],
        default: 'pending'
    },
    note: { type: String, required: false }
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

export default mongoose.model('Order', orderSchema)