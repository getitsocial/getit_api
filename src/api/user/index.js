import restifyMongoose from '~/services/apiDriver'
import { Router } from 'restify-router'
import { restConfig } from '~/config'
import { doorman, masterman } from '~/services/guard'
import { validateUserBeforeCreate } from '~/utils'
import model, { modelProjection } from './model'
import {
    getAllUsers,
    getMe,
    create,
    update,
    updatePassword,
    deleteUser,
    getActiveShop,
    setActiveShop,
} from './controller'

const config = {
    populate: 'shop',
    listProjection: modelProjection,
    detailProjection: modelProjection,
}

const router = new Router()
const endpoint = restifyMongoose(model, Object.assign(config, restConfig))

// TODO: Implement controller && secure endpoints

/*
 * Serve resources with fine grained mapping control
 *
 */

/**
 * @api {get} /users Retrieve users
 * @apiName RetrieveUsers
 * @apiGroup User
 * @apiPermission admin
 * @apiParam {String} token User token.
 * @apiUse listParams
 * @apiSuccess {Object[]} users List of users.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 Admin access only.
 */
router.get('', doorman(['admin']), getAllUsers)

/**
 * @api {get} /users/me Retrieve current user
 * @apiName RetrieveCurrentUser
 * @apiGroup User
 * @apiPermission user
 * @apiParam {String} token User token.
 * @apiParam {String} admintoken Admin token.
 * @apiSuccess {Object} user User's data.
 */
router.get('/me', doorman(['user', 'admin']), getMe)

/**
 * @api {get} /users/:id Retrieve user
 * @apiName RetrieveUser
 * @apiGroup User
 * @apiPermission public
 * @apiSuccess {Object} user User's data.
 * @apiError 404 User not found.
 */
router.get('/:id', endpoint.detail())

/**
 * @api {get} /users/:id/shops/active Retrieve active shop
 * @apiName RetrieveShop
 * @apiGroup User
 * @apiPermission user
 * @apiSuccess {Object} user User's active shop.
 * @apiError 404 User not found.
 */
router.get('/:id/shops/active', doorman(['user', 'admin']), getActiveShop)

/**
 * @api {patch} /users/:id Update users active shop
 * @apiName UpdateUserActiveShop
 * @apiGroup User
 * @apiPermission user
 * @apiParam {String} token User token.
 * @apiParam {String} admintoken User token.
 * @apiParam {String} [name] User's new active shop.
 * @apiSuccess {Object} 204
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 Current user or admin access only.
 * @apiError 404 User not found.
 */
router.patch('/:id/shops/active', doorman(['user', 'admin']), setActiveShop)

/**
 * @api {post} /users Create user
 * @apiName CreateUser
 * @apiGroup User
 * @apiPermission master
 * @apiParam {String} token Master token.
 * @apiParam {String} email User's email.
 * @apiParam {String{6..}} password User's password.
 * @apiParam {String} [name] User's name.
 * @apiParam {String} [picture] User's picture.
 * @apiParam {String=user,admin} [role=user] User's role.
 * @apiSuccess (Sucess 201) {Object} user User's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 Master access only.
 * @apiError 409 Email already registered.
 */
router.post('', masterman(), validateUserBeforeCreate(), create)

/**
 * @api {patch} /users/:id Update user
 * @apiName UpdateUser
 * @apiGroup User
 * @apiPermission user
 * @apiParam {String} token User token.
 * @apiParam {String} admintoken User token.
 * @apiParam {String} [name] User's name.
 * @apiParam {String} [picture] User's picture.
 * @apiParam {Object} [userSettings] some usersettings values.
 * @apiSuccess {Object} user User's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 Current user or admin access only.
 * @apiError 404 User not found.
 */
router.patch('/:id', doorman(['user', 'admin']), update)

/**
 * @api {patch} /users/:id/password Update password
 * @apiName UpdatePassword
 * @apiGroup User
 * @apiParam {String} token User token.
 * @apiParam {String} admintoken Admin token.
 * @apiParam {String{6..}} password User's new password.
 * @apiSuccess (Success 201) {Object} user User's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 Current user access only.
 * @apiError 404 User not found.
 */
router.patch('/:id/password', doorman(['user', 'admin']), updatePassword)

/**
 * @api {delete} /users/:id Delete user
 * @apiName DeleteMessage
 * @apiGroup User
 * @apiSuccess (Success 204) 204 No Content.
 * @apiError 404 User not found.
 */
router.del('/:id', doorman(['user', 'admin']), deleteUser)

export default router
