const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema(
	{
		email: {
			type: String,
			required: true,
			unique: true,
		},
		password: { 
			type: String,
			required: true 
		},
		firstName: {
			type: String,
			required: true
		},
		lastName: {
			type: String,
			required: true
		},
		joinedRooms: [
			{
				_id: String,
			} //room1
		],
	},
	{ collection: 'users' }
)

userModel = mongoose.model('UserSchema', UserSchema)

module.exports = userModel