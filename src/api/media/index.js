import { Router } from 'restify-router'
import { upload } from './controller'
import { doorman } from '~/services/guard'

/**
 * Serve resources with fine grained mapping control
 */

const router = new Router()

/**
 * @api {post} /media/:foldername Media Upload
 * @apiName Upload Media
 * @apiGroup Mediaupload
 * @apiPermission user
 * @apiSuccess {Object} media data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 */
router.post('/:folder', doorman(['user', 'admin']),  upload)

export default router