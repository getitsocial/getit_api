import Article from './model'

export const deleteAll = async(req, res) => {
    await Article.deleteMany()
    res.json('success')
}
