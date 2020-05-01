import { BadRequestError } from 'restify-errors'
import PasswordResetModel from './model'


export const verify = async ({ params }, res, next) => {
    // Pass values
    const { token } = params

    try {
        // Find token
        const { user } = await PasswordResetModel.findOneAndDelete({ token }).populate('user')
        
        await user.set({ verified: true }).save()

        res.send(201) 

    } catch(error) {
        next(new BadRequestError('token invalid'))
    }
}

