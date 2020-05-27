import { Router } from 'restify-router'
import dealer from './dealer'
import consumer from './consumer'
import passwordReset from './password-reset'
import auth from './auth'
import verification from './verification'
import user from './user'
import media from './media'
import maps from './maps'

const router = new Router()

router.add('/dealer', dealer)
router.add('/consumer', consumer)

router.add('/password-resets', passwordReset)
router.add('/users', user)
router.add('/verification', verification)
router.add('/auth', auth)
router.add('/maps', maps)
router.add('/media', media)

export default router