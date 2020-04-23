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
    this.model('Article').remove({ category: this._id }, callback)
})

export const modelProjection = function(req, item = this, cb) {
    
    const view = {}
    const fields = ['id', 'name', 'author']

    fields.forEach((field) => { view[field] = item[field] })

    if(!cb)
        return view

    cb(null, view)
}

categorySchema.index({'$**': 'text'})

export default mongoose.model('Category', categorySchema)