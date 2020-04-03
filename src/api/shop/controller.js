// import { BadRequestError } from 'restify-errors'
import Shop from './model'

export const deleteAll = async(req, res) => {
    await Shop.deleteMany()
    res.json('success')
}
