import { UnauthorizedError, BadRequestError } from 'restify-errors'
import User from '~/api/user/model'
import Shop from '~/api/shop/model'


export const addAuthor = () => (({ user, body }, res, next) => {
    
    if (!user) return next(new UnauthorizedError())

    if (!body) return next(new BadRequestError())
    
    
    body.author = user
    
    next()
})

export const addShop = () => ( async({ user, body }, res, next) => {

    if (!user) return next(new UnauthorizedError())

    if (!body) return next(new BadRequestError())
    
    const { activeShop }  = await User.findById(user)
    if(!activeShop) return next()

    body.shop = activeShop
    
    next()
})

export const showShop = () => (async(req, res, next) => {
    const { user } = req

    if (!user) return next() 
    
    const { activeShop } = await User.findById(user)
    if(!activeShop) return next()
    
    const shop = await Shop.findById(activeShop)
    req.shop = shop

    next()

})

