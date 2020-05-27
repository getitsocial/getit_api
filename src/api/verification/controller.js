import { BadRequestError } from 'restify-errors'
import Verification from '!/verification'

export const verify = async ({ params }, res, next) => {
    // Pass values
    const { token } = params

    try {
        // Find token
        const { user } = await Verification.findOneAndDelete({ token }).populate('user')

        await user.set({ verified: true }).save()

        res.send(204)

    } catch(error) {
        next(new BadRequestError('token invalid'))
    }
}

