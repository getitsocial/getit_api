import mongoose, { Schema } from 'mongoose'

const categorySchema = new Schema({
    name: { type: String, required: true },
    shop: { 
        type: Schema.Types.ObjectId,
        ref: 'Shop',
        required: true
    },    
    author: { 
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

categorySchema.pre('remove', function(callback) {
    // Remove all the docs that refers
    this.model('Article').deleteMany({ category: this._id }, callback)
})

// Count articles in categories
categorySchema.virtual('article_count', {
    ref: 'Article',
    localField: '_id',
    foreignField: 'category',
    count: true
})

export const modelProjection = function(req, item = this, cb) {
    
    const view = {}
    const fields = ['_id', 'name', 'author', 'article_count']

    fields.forEach((field) => { view[field] = item[field] })

    if(!cb)
        return view

    cb(null, view)
}

categorySchema.methods = {
    modelProjection
}

categorySchema.index({'$**': 'text'})

export default mongoose.model('Category', categorySchema)