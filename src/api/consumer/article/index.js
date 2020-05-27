import { Router } from 'restify-router'
import {
    getArticle,
    getArticles,
} from './controller'

const router = new Router()

/**
 * @api {get} /articles Retrieve articles
 * @apiName RetrievePublishedArticles
 * @apiGroup Article
 * @apiUse listParams
 * @apiHeader {Number} x-total-count Articles count.
 * @apiSuccess {Object[]} articles List of articles.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError {Object} 401 Missing permissions.
 */
router.get('', getArticles)

/**
 * @api {get} /articles/:id Retrieve article
 * @apiName RetrieveArticle
 * @apiGroup Article
 * @apiSuccess {Object} article Article's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Article not found.
 * @apiError {Object} 401 Missing permissions.
 */
router.get('/:id', getArticle)

/**
 * Export this function
 * @returns {Function} the Router of article
 */
export default router
