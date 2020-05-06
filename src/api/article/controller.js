import { BadRequestError, UnauthorizedError, NotFoundError } from 'restify-errors'
import { mergeWith, isArray } from 'lodash' 
import Article from './model'


export const updateArticle = async({ body, params, user }, res, next) => {
    const { id } = params
    const { name, articleNumber, stock, price, size, currency, description, picture, category, author, shop, published, tax, } = body

    try {

        // find object
        const article = await Article.findById(id)

        if (!article) {
            return next(new NotFoundError('article not found'))
        } 

        // Check user role
        if (user.role !== 'admin' && !article.author.equals(user._id)) {
            return next(new UnauthorizedError('you are not the author of this article'))
        }

        // Check if picture not defined and set default picture
        if (picture && !Object.keys(picture).length) {
            picture.url = '/api/static/placeholder.png'
            picture.id = 'placeholder'
        }
        
        // merge and save
        const data = mergeWith(article, { name, articleNumber, stock, price, size, currency, description, picture, category, author, shop, published, tax, }, (obj, src) => {
            if (isArray(obj)) return src
        })
        
        await data.save()
        
        // Send response 
        res.send(200, data.modelProjection())
    } catch(error) {
        return next(new BadRequestError(error))
    }
}
