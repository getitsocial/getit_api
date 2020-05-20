import { Router } from 'restify-router'
import { verify } from './controller'

const router = new Router()

/**
 * @api {get} /password-resets/:token Verify token
 * @apiName VerifyMail
 * @apiGroup VerifyMail
 * @apiSuccess {String} token Password reset token.
 * @apiSuccess 204
 * @apiError 404 Token has expired or doesn't exist.
 */
router.get('/:token', verify)

export default router
