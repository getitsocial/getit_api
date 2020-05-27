import { Router } from 'restify-router'
import { search, detail } from './controller'

const router = new Router()

/**
 * @api {get} /geocode Places suggestions
 * @apiName RetrievePlaceSuggestions
 * @apiGroup Maps
 * @apiUse listParams
 * @apiError {Object} 400 Some parameters may contain invalid values.
 */
router.get('/geocode', search)


/**
 * @api {get} /detail Places suggestions
 * @apiName RetrievePlaceSuggestions
 * @apiGroup Maps
 * @apiUse listParams
 * @apiError {Object} 400 Some parameters may contain invalid values.
 */
router.get('/detail', detail)

/**
 * Export this function
 * @returns {Function} the Router of article
 */
export default router

