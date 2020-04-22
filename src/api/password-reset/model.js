import mongoose, { Schema } from 'mongoose'
import { uid } from 'rand-token'

const passwordResetSchema = new Schema({
    user: {
        type: Schema.ObjectId,
        ref: 'User',
        index: true
    },
    token: {
        type: String,
        unique: true,
        index: true,
        default: () => uid(32)
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 3600
    }
})

export const modelProjection = function(req, item = this, cb) {
    
    const view = {}
    const fields = ['user', 'token']


    fields.forEach((field) => { view[field] = item[field] })
    
    if(!cb)
        return view
    
    cb(null, view)

}

passwordResetSchema.methods = {
    modelProjection
}

export default mongoose.model('PasswordReset', passwordResetSchema)

