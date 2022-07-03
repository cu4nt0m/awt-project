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
            type: String, //_id of the creator
            required: true
        },
        joinedUsers: [
            {_id: String} //user1
        ],
		messages: [
			{
				mediaType: String,  //message, video, book
				createdAt: {
					type: Date,
					default: Date.now
				},
				content: String,
				sender: {
					type: String,
					_id: String
				}
			}
		]
	},
	{ collection: 'chatrooms' }
)

const chatroomModel = mongoose.model('ChatroomSchema', ChatroomSchema)

module.exports = chatroomModel