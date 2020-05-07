import { Router } from 'restify-router'
import { doorman } from '~/services/guard'
import { addAuthor, showShop } from '~/services/modelModifier'
import { getCategory, getCategories, createCategory, updateCategory, deleteCategory } from './controller'

const router = new Router()

/**
 * @api {get} /categories Retrieve categories
 * @apiName RetrieveCategorys
 * @apiGroup Category
 * @apiUse listParams
 * @apiSuccess {count, Object[]} categories List of categories.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 Missing permissions.
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
 * @apiError 401 Missing permissions.
 */
router.get('/:id', 
    doorman(['user', 'admin']), 
    getCategory)

/**
 * @api {post} /categories Create category
 * @apiName CreateCategory
 * @apiGroup Category
 * @apiPermission user
 * @apiParam content Category's content.
 * @apiSuccess {Object} category Category's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Category not found.
 * @apiError 401 Missing permissions.
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
 * @apiError 401 Missing permissions.
 */  
router.patch('/:id', 
    doorman(['user', 'admin']),
    updateCategory)

/**
 * @api {delete} /categories/:id Delete category
 * @apiName Category
 * @apiGroup Category
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 Category not found.
 * @apiError 401 Missing permissions.
 */
router.del('/:id', 
    doorman(['user', 'admin']),
    deleteCategory)

/**
 * Export this function
 * @returns {Function} the Router of category
 */
export default router

