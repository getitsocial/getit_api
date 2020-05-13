import { Router } from 'restify-router'
import { doorman } from '~/services/guard'
import {
    checkName,
    deleteShop,
    createShop,
    updateShop,
    getNearShops,
    getShop,
    getAllShops,
} from './controller'
import { addAuthor } from '~/services/modelModifier'
const router = new Router()

/**
 * TODO: Document this
 */
router.post('/checkName', [doorman(['user', 'admin'])], checkName)

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
 * @api {get} /shops/ Retrieve all shops
 * @apiName RetrieveAllShops
 * @apiGroup Shop
 * @apiSuccess {Object} shop Shop's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Shop not found.
 */
router.get('', [doorman(['admin'])], getAllShops)

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
 * @api {post} /shops Create shop
 * @apiName CreateShop
 * @apiGroup Shop
 * @apiPermission user
 * @apiParam content Shop's content.
 * @apiSuccess {Object} shop Shop's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Shop not found.
 */
router.post('', [doorman(['user', 'admin']), addAuthor()], createShop)

/**
 * @api {patch} /shops/:id Update shop
 * @apiName UpdateShop
 * @apiGroup Shop
 * @apiParam content Shop's content.
 * @apiSuccess {Object} shop Shop's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Shop not found.
 */

router.patch('/:id', doorman(['user', 'admin']), updateShop)

/**
 * @api {delete} /shops/:id Delete shop
 * @apiName Shop
 * @apiGroup Shop
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Shop not found.
 */
router.del('/:id', doorman(['user', 'admin']), deleteShop)

/**
 * Export this function
 * @returns {Function} the Router of shop
 */
export default router
