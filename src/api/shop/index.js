import restifyMongoose from '~/services/apiDriver'
import { Router } from 'restify-router'
import { restConfig } from '~/config'
import { doorman } from '~/services/guard'
import { checkName, deleteShop, createShop, updateShop } from './controller'
import { addAuthor } from '~/services/modelModifier'
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
 * @api {get} /shops Retrieve shops
 * @apiName RetrieveShops
 * @apiGroup Shop
 * @apiUse listParams
 * @apiHeader {Number} x-total-count Shops count.
 * @apiSuccess {Object[]} shops List of shops.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 */
router.get('', 
    endpoint.query())


/**
 * TODO: Document this
 */
router.post('/checkName', 
    [doorman(['user', 'admin'])], 
    checkName)

/**
 * @api {get} /shops/:id Retrieve shop
 * @apiName RetrieveShop
 * @apiGroup Shop
 * @apiSuccess {Object} shop Shop's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Shop not found.
 */
router.get('/:id', 
    endpoint.detail())

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
router.post('', 
    [doorman(['user', 'admin']), 
        addAuthor()], 
    createShop)

/**
 * @api {patch} /shops/:id Update shop
 * @apiName UpdateShop
 * @apiGroup Shop
 * @apiParam content Shop's content.
 * @apiSuccess {Object} shop Shop's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Shop not found.
 */  

// TODO: Bug, cannot update if doorman active
router.patch('/:id', 
    doorman(['user', 'admin']), 
    updateShop)

/**
 * @api {delete} /shops/:id Delete shop
 * @apiName Shop
 * @apiGroup Shop
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Shop not found.
 */
router.del('/:id', 
    doorman(['user', 'admin']), 
    deleteShop)


/**
 * Export this function
 * @returns {Function} the Router of shop
 */
export default router

