import mongoose, { Schema } from 'mongoose'
import { uid } from 'rand-token'

const verificationSchema = new Schema({
    user: {
        type: Schema.ObjectId,
        ref: 'User',
        index: true,
        required: true
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

export default mongoose.model('Verification', verificationSchema)

