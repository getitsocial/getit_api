import restifyMongoose from '~/services/apiDriver'
import { Router } from 'restify-router'
import { restConfig } from '~/config'
import { doorman } from '~/services/guard'
import { addAuthor, addShop } from '~/services/modelModifier'
import model, { modelProjection } from './model'

const config = {
    populate: [{ path: 'author', select: 'name picture' }, { path: 'category', select: 'name' }],
    sort: 'name',
    pageSize: 50,
    listProjection: modelProjection,
    detailProjection: modelProjection
}

const router = new Router()
const endpoint = restifyMongoose(model, Object.assign(config, restConfig))

// TODO: Implement controller && secure endpoints 

/**
 * Serve resources with fine grained mapping control
 */

/**
 * @api {get} /articles Retrieve articles
 * @apiName RetrieveArticles
 * @apiGroup Article
 * @apiUse listParams
 * @apiHeader {Number} x-total-count Articles count.
 * @apiSuccess {Object[]} articles List of articles.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 */
router.get('',  
    doorman(['user', 'admin']), 
    endpoint.query({ filter: ((req) => new Object({ category: req.query.categoryId }))}))

/**
 * @api {get} /articles/:id Retrieve article
 * @apiName RetrieveArticle
 * @apiGroup Article
 * @apiSuccess {Object} article Article's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Article not found.
 */
router.get('/:id', 
    doorman(['user', 'admin']), 
    endpoint.detail())

/**
 * @api {post} /articles Create article
 * @apiName CreateArticle
 * @apiGroup Article
 * @apiPermission user
 * @apiParam content Article's content.
 * @apiSuccess {Object} article Article's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Article not found.
 */
router.post('', 
    [doorman(['user', 'admin']), addAuthor(), addShop()], 
    endpoint.insert())

/**
 * @api {patch} /articles/:id Update article
 * @apiName UpdateArticle
 * @apiGroup Article
 * @apiParam content Article's content.
 * @apiSuccess {Object} article Article's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Article not found.
 */  
router.patch('/:id', 
    doorman(['user', 'admin']), 
    endpoint.update())

/**
 * @api {delete} /articles/:id Delete article
 * @apiName Article
 * @apiGroup Article
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Article not found.
 */
router.del('/:id', 
    doorman(['user', 'admin']), 
    endpoint.remove())


/**
 * Export this function
 * @returns {Function} the Router of article
 */
export default router

