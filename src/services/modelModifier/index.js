import { UnauthorizedError, BadRequestError } from 'restify-errors'

export const addAuthor = () => 
    (({ user, body }, res, next) => {
        if(!user)
            next(new UnauthorizedError())
        if(!body)
            next(new BadRequestError())
        body.author = user
        body.user = user
        next()
    })
    

export const addShop = () => 
    (({ user, body }, res, next) => {
        const {shop} = user
        console.log(shop)
        if(!user || !user.shop)
            next(new UnauthorizedError())
        if(!body)
            next(new BadRequestError())
        body.shop = shop
        next()
    })