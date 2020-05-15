import { Router } from 'restify-router'
import { doorman } from '~/services/guard'
import { addAuthor, addShop } from '~/services/modelModifier'
import { updateArticle, deleteArticle, getArticle, getArticles, createArticle } from './controller'

const router = new Router()

/**
 * @api {get} /articles Retrieve articles
 * @apiName RetrieveArticles
 * @apiGroup Article
 * @apiUse listParams
 * @apiHeader {Number} x-total-count Articles count.
 * @apiSuccess {Object[]} articles List of articles.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError {Object} 401 Missing permissions.
 */
router.get('',  
    [doorman(['user', 'admin'])],
    getArticles)

/**
 * @api {get} /articles/:id Retrieve article
 * @apiName RetrieveArticle
 * @apiGroup Article
 * @apiSuccess {Object} article Article's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Article not found.
 * @apiError {Object} 401 Missing permissions.
 */
router.get('/:id', 
    doorman(['user', 'admin']), 
    getArticle)

/**
 * @api {post} /articles Create article
 * @apiName CreateArticle
 * @apiGroup Article
 * @apiPermission user
 * @apiParam content Article's content.
 * @apiSuccess {Object} article Article's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Article not found.
 * @apiError {Object} 401 Missing permissions.
 */
router.post('', 
    [doorman(['user', 'admin']), addAuthor(), addShop()], 
    createArticle)

/**
 * @api {patch} /articles/:id Update article
 * @apiName UpdateArticle
 * @apiGroup Article
 * @apiParam content Article's content.
 * @apiSuccess {Object} article Article's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Article not found.
 * @apiError {Object} 401 Missing permissions.
 */  
router.patch('/:id', 
    doorman(['user', 'admin']), 
    updateArticle)

/**
 * @api {delete} /articles/:id Delete article
 * @apiName Article
 * @apiGroup Article
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Article not found.
 * @apiError 401 Missing permissions.
 */
router.del('/:id', 
    doorman(['user', 'admin']), 
    deleteArticle)


/**
 * Export this function
 * @returns {Function} the Router of article
 */
export default router

