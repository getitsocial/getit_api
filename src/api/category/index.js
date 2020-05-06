import restifyMongoose from '~/services/apiDriver'
import { Router } from 'restify-router'
import { restConfig } from '~/config'
import { doorman } from '~/services/guard'
import { addAuthor, showShop } from '~/services/modelModifier'
import { getCategories, createCategory } from './controller'
import model, { modelProjection } from './model'

const config = {
    populate: { path: 'author', select: 'name picture' },
    sort: 'name',
    pageSize: 50,
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
 * @api {get} /categories Retrieve categories
 * @apiName RetrieveCategorys
 * @apiGroup Category
 * @apiUse listParams
 * @apiHeader {Number} x-total-count Categorys count.
 * @apiSuccess {Object[]} categories List of categories.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 */
router.get('', 
    doorman(['user', 'admin']),
    showShop(),
    getCategories)

/**
 * @api {get} /categories/:id Retrieve category
 * @apiName RetrieveCategory
 * @apiGroup Category
 * @apiSuccess {Object} category Category's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Category not found.
 */
router.get('/:id', 
    doorman(['user', 'admin']), 
    endpoint.detail())

/**
 * @api {post} /categories Create category
 * @apiName CreateCategory
 * @apiGroup Category
 * @apiPermission user
 * @apiParam content Category's content.
 * @apiSuccess {Object} category Category's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Category not found.
 */
router.post('', 
    [doorman(['user', 'admin']), addAuthor(), showShop()], 
    createCategory)

/**
 * @api {patch} /categories/:id Update category
 * @apiName UpdateCategory
 * @apiGroup Category
 * @apiParam content Category's content.
 * @apiSuccess {Object} category Category's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Category not found.
 */  
router.patch('/:id', 
    endpoint.update())

/**
 * @api {delete} /categories/:id Delete category
 * @apiName Category
 * @apiGroup Category
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Category not found.
 */
router.del('/:id', 
    endpoint.remove())

/**
 * Export this function
 * @returns {Function} the Router of category
 */
export default router

