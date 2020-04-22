import Order from './model'

export const deleteAll = async(req, res) => {
    await Order.deleteMany()
    res.json('success')
}
