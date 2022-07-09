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
            {
				_id: String,
			
			} //user1
        ],
		messages: [
			{
				createdAt: {
					type: Date,
					default: Date.now
				},
				content: String,
				sender: {
					type: String,
				}
			}
		],
		books: [
			{
				createdAt: {
					type: Date,
					default: Date.now
				},
				sender: {
					type: String,
				},
				bookImageLink: String,
				bookThumbnail: String,
				bookTitle: String,
				bookAuthors: [String],
				bookPreviewLink: String
			}
		],
		videos: [
			{
				createdAt: {
					type: Date,
					default: Date.now
				},
				sender: {
					type: String,
				},
				videoId: String,
				videoTitle: String,
				videoKind: String
			}
		]
	},
	{ collection: 'chatrooms' }
)

const chatroomModel = mongoose.model('ChatroomSchema', ChatroomSchema)

module.exports = chatroomModel