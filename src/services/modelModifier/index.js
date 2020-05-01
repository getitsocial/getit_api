import { UnauthorizedError, BadRequestError } from 'restify-errors'
import User from '~/api/user/model'

export const addAuthor = () => (({ user, body }, res, next) => {
    
    if (!user) {
        return next(new UnauthorizedError())
    }

    if (!body) {
        return next(new BadRequestError())
    }
    
    body.author = user
    
    next()
})


export const addShop = () => ( async({ user, body }, res, next) => {

    if (!user) {
        return next(new UnauthorizedError())
    }

    if (!body) {
        return next(new BadRequestError())
    }

    const fullUser = await User.findById(user)

    body.shop = fullUser.activeShop

    next()
})

