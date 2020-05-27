import { Router } from 'restify-router'
import {
    getNearShops,
    getShop,
} from './controller'

const router = new Router()

/**
 * @api {get} /shops/:shopId Retrieve shop
 * @apiName RetrieveShop
 * @apiGroup Shop
 * @apiSuccess {Object} shop Shop's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Shop not found.
 */
router.get('/:shopId', getShop)

/**
 * @api {get} /shops/near/:geohash get shops in range
 * @apiName RetrieveNearShops
 * @apiGroup Shop
 * @apiSuccess  {Object[]} shops List of shops.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 missing permissions.
 */
router.get('/near/:geohash', getNearShops)

/**
 * Export this function
 * @returns {Function} the Router of shop
 */
export default router
