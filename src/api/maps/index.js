import { Router } from 'restify-router'
import { search } from './controller'

const router = new Router()

// TODO: Implement controller && secure endpoints 

/**
 * Serve resources with fine grained mapping control
 */

/**
 * @api {get} /geocode Places suggestions
 * @apiName RetrievePlaceSuggestions
 * @apiGroup Maps
 * @apiUse listParams
 * @apiError {Object} 400 Some parameters may contain invalid values.
 */
// doorman(['user', 'admin']),
router.get('/geocode', 
    search)

/**
 * Export this function
 * @returns {Function} the Router of article
 */
export default router

