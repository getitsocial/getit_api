import { UnauthorizedError } from 'restify-errors'

export const addAuthor = () => 
    (({user, body}, res, next) => {
        if(!user)
            next(new UnauthorizedError())
        body.author = user
        next()
    })
    
