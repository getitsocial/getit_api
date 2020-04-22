import { Router } from 'restify-router'
import { search } from './controller'

const router = new Router()

// TODO: Implement controller && secure endpoints 

/**
 * Serve resources with fine grained mapping control
 */

/**
 * @api {get} /search Retrieve s
 * @apiName RetrieveArticles
 * @apiGroup Article
 * @apiUse listParams
 * @apiHeader {Number} x-total-count Articles count.
 * @apiSuccess {Object[]} articles List of articles.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 */
// doorman(['user', 'admin']),
router.get('/geocode', search)

/**
 * Export this function
 * @returns {Function} the Router of article
 */
export default router

