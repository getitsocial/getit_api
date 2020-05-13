import mongoose, { Schema } from 'mongoose'
import paginate from 'mongoose-paginate-v2'
import Article from '~/api/article/model'

const categorySchema = new Schema(
    {
        name: { type: String, required: true },
        shop: {
            type: Schema.Types.ObjectId,
            ref: 'Shop',
            required: true,
        },
        author: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
        },
    }
)

export const removeArticles = async function (item = this) {
    const { _id } = item
    await Article.deleteMany({ category: _id })
}

// Count articles in categories
categorySchema.virtual('article_count', {
    ref: 'Article',
    localField: '_id',
    foreignField: 'category',
    count: true,
})

export const modelProjection = function (item = this) {
    const view = {}
    const fields = ['_id', 'name', 'author', 'article_count']

    fields.forEach((field) => {
        view[field] = item[field]
    })

    return view
}

categorySchema.methods = {
    modelProjection,
    removeArticles,
}

categorySchema.plugin(paginate)
categorySchema.index({ '$**': 'text' })

export default mongoose.model('Category', categorySchema)
