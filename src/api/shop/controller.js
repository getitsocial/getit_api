import { BadRequestError } from 'restify-errors'
import Shop from './model'

export const deleteAll = async(req, res) => {
    await Shop.deleteMany()
    res.json('success')
}


export const activeShop = async(req, res, next) => {
    try {
        const { shop } = req.user
        const response = await Shop.findById(shop)
        res.json(response)
    } catch (error) {
        return next(new BadRequestError(error))

    }
}
