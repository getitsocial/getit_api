import mongoose, { Schema } from 'mongoose'

const articleSchema = new Schema({
    name: { 
        type: String,
        required: true,
        maxlength: 100
    },
    articleNumber: {
        type: String,
        required: false,
        maxlength: 25
    },
    stock: { 
        type: Number,
        required: true,
        min: -1 
    },
    price: { 
        type: Number, 
        required: true, 
        min: 0, 
        max: 5000
    },
    size: { 
        type: String,
        required: false
    },
    currency: { 
        type: String, 
        required: false, 
        enum: ['Euro', '€'] 
    },
    description: { 
        type: String, required: false, maxlength: 2000 },
    picture: {},
    category: { 
        type: Schema.Types.ObjectId, 
        ref: 'Category',
        required: true
    },
    author: { 
        type: Schema.Types.ObjectId, 
        ref: 'User',
        required: true
    },
    shop: { 
        type: Schema.Types.ObjectId, 
        ref: 'Shop',
        required: true,
    },
    published: {
        type: Boolean,
        default: true
    },
    tax: { type: Number, default: 19 },
}, {
    timestamps: true,
    toJSON: {
        virtuals: true
    }
})

export const modelProjection = function(req, item = this, cb) {
    
    const view = {}
    const fields = ['id', 'author', 'name', 'size', 'stock', 'articleNumber', 'description', 'picture', 'price', 'category', 'published', 'haveStock', 'tax']

    fields.forEach((field) => { view[field] = item[field] })
    
    if(!cb)
        return view
    
    cb(null, view)
}

articleSchema.virtual('haveStock').
    get(function() { 
        return !(this.stock === -1)
    })

articleSchema.methods = {
    modelProjection
}


articleSchema.index({'$**': 'text'})

export default mongoose.model('Article', articleSchema)