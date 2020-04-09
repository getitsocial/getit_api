import mongoose, { Schema } from 'mongoose'

const articleSchema = new Schema({
    name: { type: String, required: true, maxlength: 100 },
    stock: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true, min: 0, max: 5000 },
    size: { type: String, required: false },
    currency: { type: String, required: false, enum: ['Euro', '€'] },
    description: { type: String, required: false, maxlength: 2000 },
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
    let fields = ['id', 'author', 'name', 'size', 'stock', 'description', 'picture', 'price', 'category']

    /*
    if (req.user) {
        fields = [...fields, 'createdAt']
    }
    */

    fields.forEach((field) => { view[field] = item[field] })

    cb(null, view)
}

articleSchema.index({'$**': 'text'})

export default mongoose.model('Article', articleSchema)