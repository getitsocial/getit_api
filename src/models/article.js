import mongoose, { Schema } from 'mongoose'
import shortid from 'shortid'
import paginate from 'mongoose-paginate-v2'

const articleSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            maxlength: 100,
        },
        articleNumber: {
            type: String,
            maxlength: 25,
            unique: true,
            default: shortid.generate,
        },
        stock: {
            type: Number,
            required: true,
            min: -1,
        },
        price: {
            type: Number,
            required: true,
            min: 0,
            max: 5000,
        },
        size: {
            type: String,
            required: false,
        },
        currency: {
            type: String,
            required: false,
            enum: ['Euro', '€'],
        },
        description: {
            type: String,
            required: false,
            maxlength: 2000,
        },
        picture: {
            url: {
                type: String,
                default: '/api/static/placeholder.png',
            },
            id: {
                type: String,
                default: 'placeholder',
            },
        },
        category: {
            type: Schema.Types.ObjectId,
            ref: 'Category',
            required: true,
        },
        author: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        shop: {
            type: Schema.Types.ObjectId,
            ref: 'Shop',
            required: true,
        },
        published: {
            type: Boolean,
            default: true,
        },
        tax: {
            type: Number,
            default: 19,
        },
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
        },
    }
)

export const modelProjection = function (item = this) {
    const view = {}
    const fields = [
        'id',
        'author',
        'name',
        'size',
        'stock',
        'articleNumber',
        'description',
        'picture',
        'price',
        'category',
        'published',
        'haveStock',
        'tax',
        'currency',
        'articlePicture',
    ]

    fields.forEach((field) => {
        view[field] = item[field]
    })

    return view
}

articleSchema.virtual('haveStock').get(function () {
    return !(this.stock === -1)
})

articleSchema.virtual('articlePicture').get(function () {
    const { id } = this.picture
    return id !== 'placeholder'
})

articleSchema.methods = {
    modelProjection,
}

articleSchema.plugin(paginate)

articleSchema.index({ '$**': 'text' })

export default mongoose.model('Article', articleSchema)
