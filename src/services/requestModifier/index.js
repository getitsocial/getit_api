import { BadRequestError, InternalServerError } from 'restify-errors'
import User from '~/api/user/model'

export const addAuthor = () => ((req, res, next) => {

    const { user } = req

    if (!user) {
        return next(new InternalServerError())
    }

    req.author = user._id

    next()
})



export const addShop = (options) => ( async(req, res, next) => {

    const { required = true } = options ?? {}

    const { user } = req

    if (!user && required) {
        return next(new BadRequestError())
    } else if (!user) {
        return next()
    }

    const { activeShop }  = await User.findById(user).populate('activeShop')

    if (!activeShop && required) {
        return next(new BadRequestError())
    }

    req.shop = activeShop

    return next()
})
