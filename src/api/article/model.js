import mongoose, { Schema } from 'mongoose'

const articleSchema = new Schema({
    name: { type: String, required: true },
    stock: { type: Number, required: true },
    price: { type: Number, required: true },
    size: { type: String, required: false },
    currency: { type: String, required: false },
    description: { type: String, required: false },
    picture: {},
    category: { 
        type: Schema.Types.ObjectId, 
        ref: 'Category',
        required: true
    },
    author: { 
        type: Schema.Types.ObjectId, 
        ref: 'User'
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

export default mongoose.model('Article', articleSchema)