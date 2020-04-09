import mongoose, { Schema } from 'mongoose'

const categorySchema = new Schema({
    name: { type: String, required: true },
    shop: { 
        type: Schema.Types.ObjectId,
        ref: 'Shop'
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

categorySchema.pre('remove', function(callback) {
    // Remove all the docs that refers
    this.model('Article').remove({ category: this._id }, callback)
})

export const modelProjection = function(req, item, cb) {
    let view = {}
    let fields = ['id', 'name', 'author']

    /*
    if (req.user) {
        fields = [...fields, 'createdAt']
    }
    */

    fields.forEach((field) => { view[field] = item[field] })

    cb(null, view)
}

categorySchema.index({'$**': 'text'})

export default mongoose.model('Category', categorySchema)