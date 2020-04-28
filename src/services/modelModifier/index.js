import { UnauthorizedError, BadRequestError } from 'restify-errors'
import User from '~/api/user/model'

export const addAuthor = () => (({ user, body }, res, next) => {
    
    if(!user)
        next(new UnauthorizedError())

    if(!body)
        next(new BadRequestError())
    
    body.author = user
    
    next()
})


export const addShop = () => ( async({ user, body }, res, next) => {
    const fullUser = await User.findById(user)

    if(!user)
        next(new UnauthorizedError())

    if(!body)
        next(new BadRequestError())
    
    body.shop = fullUser.activeShop

    next()
})

