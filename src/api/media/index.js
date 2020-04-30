import { Router } from 'restify-router'
import { upload, deleteMedia } from './controller'
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


/**
 * @api {delete} /media/:foldername/:id Media Delete
 * @apiName Delete Media
 * @apiGroup Mediadelete
 * @apiPermission user
 * @apiSuccess {Object} 204
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError {Object} 401 Missing permissions
 */
router.del('/:folder/:id', doorman(['admin', 'user']),  deleteMedia)


export default router