import { UnauthorizedError, BadRequestError } from 'restify-errors'

export const addAuthor = () => 
    (({user, body}, res, next) => {
        if(!user)
            next(new UnauthorizedError())
        if(!body)
            next(new BadRequestError())
        body.author = user
        next()
    })
    
