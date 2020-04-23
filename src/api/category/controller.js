import Category from './model'

export const deleteAll = async(req, res) => {
    await Category.deleteMany()
    res.json('success')
}
