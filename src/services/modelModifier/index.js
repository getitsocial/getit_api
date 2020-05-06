import { UnauthorizedError, BadRequestError, ResourceNotFoundError } from 'restify-errors'
import User from '~/api/user/model'
import Shop from '~/api/shop/model'


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

export const showShop = () => (async(req, res, next) => {

    const { user } = req

    if (!user) {
        return next(new UnauthorizedError())
    }

    const fullUser = await User.findById(user._id)
    
    const shop = await Shop.findById(fullUser.activeShop)
    
    if (!shop) {
        return next(new ResourceNotFoundError())
    }

    req.shop = shop

    next()

})

