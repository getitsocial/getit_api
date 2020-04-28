import { Router } from 'restify-router'
import { search } from './controller'
import { doorman } from '~/services/guard'

const router = new Router()

/**
 * @api {get} /geocode Places suggestions
 * @apiName RetrievePlaceSuggestions
 * @apiGroup Maps
 * @apiUse listParams
 * @apiError {Object} 400 Some parameters may contain invalid values.
 */

router.get('/geocode', 
    doorman(['user', 'admin']),
    search)

/**
 * Export this function
 * @returns {Function} the Router of article
 */
export default router

