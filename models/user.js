import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
    },
    email: {
        type: String,
        required: true,
        unique: true, 
        trim: true,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    }
}, { timestamps: true });

const User = mongoose.model('User', userSchema)

export default User;