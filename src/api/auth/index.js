import { Router } from 'restify-router'
import { authenticate, providerAuthenticate, logout } from './controller'
import { masterman, doorman } from '~/services/guard'

/**
 * Serve resources with fine grained mapping control
 */

const router = new Router()

/**
 * @api {post} /auth User Authentication
 * @apiName CreateMessage
 * @apiGroup Authentication
 * @apiPermission user
 * @apiParam {String} email User's username.
 * @apiParam {String} password User's password.
 * @apiParam {String} token admin access token.
 * @apiSuccess {Object} user User's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 User not found.
 * @apiError 401 Master access only.
 */
router.post('', 
    masterman(), 
    authenticate)

/**
 * @api {post} /auth/:provider Authenticate with external provider
 * @apiName AuthenticateFacebook
 * @apiGroup Auth
 * @apiParam {String} access_token Facebook user accessToken.
 * @apiSuccess (Success 201) {String} token User `token` to be passed to other requests.
 * @apiSuccess (Success 201) {Object} user Current user's data.
 * @apiError 401 Invalid credentials.
 */
router.post('/:provider', 
    providerAuthenticate)

/**
 * @api {post} /auth/logout logout current user
 * @apiName LogoutUser
 * @apiGroup Auth
 * @apiError 401 Invalid credentials.
 */
router.post('/logout', 
    doorman(['user', 'admin']), 
    logout)

export default router

