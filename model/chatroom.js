const mongoose = require('mongoose')

const ChatroomSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: true,
		},
		createdAt: { 
			type: Date,
            default: Date.now
		},
		description: {
			type: String,
			required: true
		},
        creator: {
            type: String,
            required: true
        },
        joinedUsers: [
            {_id: String}
        ]
	},
	{ collection: 'chatrooms' }
)

const userModel = mongoose.model('ChatroomSchema', ChatroomSchema)

module.exports = userModel