import restifyMongoose from '~/services/apiDriver'
import { Router } from 'restify-router'
import { restConfig } from '~/config'
import { doorman } from '~/services/guard'
import { deleteAll } from './controller'
import model, { modelProjection } from './model'

const config = {
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
 * @api {get} /orders Retrieve orders
 * @apiName RetrieveOrders
 * @apiGroup Order
 * @apiUse listParams
 * @apiHeader {Number} x-total-count Orders count.
 * @apiSuccess {Object[]} orders List of orders.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 */
router.get('', endpoint.query())

/**
 * @api {get} /orders/:id Retrieve order
 * @apiName RetrieveOrder
 * @apiGroup Order
 * @apiSuccess {Object} order Order's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Order not found.
 */
router.get('/:id', endpoint.detail())

/**
 * @api {post} /orders Create order
 * @apiName CreateOrder
 * @apiGroup Order
 * @apiPermission user
 * @apiParam content Order's content.
 * @apiSuccess {Object} order Order's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Order not found.
 */
router.post('', endpoint.insert())

/**
 * @api {patch} /orders/:id Update order
 * @apiName UpdateOrder
 * @apiGroup Order
 * @apiParam content Order's content.
 * @apiSuccess {Object} order Order's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Order not found.
 */  
router.patch('/:id', endpoint.update())

/**
 * @api {delete} /orders/:id Delete order
 * @apiName Order
 * @apiGroup Order
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Order not found.
 */
router.del('/:id', endpoint.remove())

/**
 * @api {delete} /orders/all Delete all orders
 * @apiName DeleteAllOrders
 * @apiGroup Order
 * @apiPermission admin
 * @apiParam {String} admintoken admin access token.
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 401 admin access only.
 */
router.del('/all', doorman(['admin']), deleteAll)


/**
 * Export this function
 * @returns {Function} the Router of order
 */
export default router

