import { Router } from 'restify-router'
import {
    getCategories,
} from './controller'

const router = new Router()

/**
 * @api {get} /categories/public Retrieve categories
 * @apiName RetrievePublicCategorys
 * @apiGroup Category
 * @apiUse listParams
 * @apiSuccess {count, Object[]} categories List of categories.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 Missing permissions.
 */
router.get('', getCategories)

/**
 * Export this function
 * @returns {Function} the Router of category
 */
export default router
