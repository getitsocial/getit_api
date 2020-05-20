import { BadRequestError } from 'restify-errors'
import { sendDynamicMail } from '~/services/sendgrid'
import { serverConfig } from '~/config'
import PasswordResetModel from './model'
import userModel from '~/api/user/model'
const { emailTemplates } = serverConfig

export const create = async ({ body }, res, next) => {
    // Pass values
    const { email, link } = body

    try {
        // Find user
        const user = await userModel.findOne({ email })

        // Create reset token
        const data = await PasswordResetModel.create({ user: user._id })

        const forgotURI = `${link.replace(/\/$/, '')}/${data.token}`

        await sendDynamicMail({
            toEmail: email,
            templateId: emailTemplates.forgot,
            dynamic_template_data: {
                username: data.user.name, link: forgotURI
            }
        })

        res.send(201)

    } catch(error) {
        next(new BadRequestError('No user found with this email.'))
    }
}

export const show = async ({ params }, res, next) => {
    // Pass values
    const { token } = params

    try {
        // Find token
        const { user: { picture, name }} = await PasswordResetModel.findOne({ token }).populate('user')

        res.send(200, { picture, name })

    } catch(error) {
        next(new BadRequestError('No user found with this email.'))
    }
}

export const update = async ({ params, body }, res, next) => {
    // Pass values
    const { token } = params
    const { password } = body

    try {

        // Find token
        const { user } = await PasswordResetModel.findOne({ token }).populate('user')

        // Validate password
        await userModel.validate({ password, email: user.email }) // stupid hack but ok

        // Set new password
        await user.set({ password }).save()

        // Verifi user
        if(!user.verified) {
            await user.set({ verified: true }).save()
        }

        // Remove reset token
        await PasswordResetModel.remove({ user })

        // Send response
        res.send(204)

    } catch(error) {
        next(new BadRequestError(error))
    }
}
