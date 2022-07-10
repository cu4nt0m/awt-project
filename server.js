const express = require('express')
const path = require('path')
require('dotenv').config();
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const User = require('./model/user')
const Chatroom = require('./model/chatroom')
const moment = require('moment');
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const cors = require('cors')
const app = express()
const http = require('http')
app.use(bodyParser.json())
// app.listen(9999, () => {
// 	console.log('Server up at 9999')
// })
// app.listen(4000) = () => console.log('runs')
app.use('/', express.static(path.join(__dirname, 'static')))

app.use(cors({
	origin: '*'
}));

const PORT = process.env.PORT || 9999
const server = http.createServer(app).listen(PORT, () => console.log('server is running 9999'))

const io = require('socket.io')(server, {
	cors: {
	  origin: "*",
	  methods: ["GET", "POST"]
	}
  })

//testing purpose secret (has to be in a safer place in HEROKU ENV!)
const JWT_SECRET = process.env.JWT_SECRET

//username and password has to be in .env in HEROKU
// mongoose.connect('mongodb://localhost:27017/login-app-db', {
mongoose.connect(`mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.k2dxyt2.mongodb.net/?retryWrites=true&w=majority`, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	useCreateIndex: true
}).then(
	console.log('Database is connected')
).catch(error => console.log('There is an error connecting to database'))


// io.on('connection', socket => {
app.get('/', async (req, res) => {
	return res.json({
		message: 'hi'
	})
})

app.put('/api/change-password', async (req, res) => {
	const { token, newpassword: plainTextPassword } = req.body
	// console.log('headers',req.headers)
	if (!plainTextPassword || typeof plainTextPassword !== 'string') {
		return res.json({ status: 'error', error: 'Invalid password' })
	}

	if (plainTextPassword.length < 5) {
		return res.json({
			status: 'error',
			error: 'Password too small. Should be atleast 6 characters'
		})
	}

	try {
		const user = jwt.verify(token, JWT_SECRET)
		// console.log('jwt verify:', user)
		const _id = user.id

		const password = await bcrypt.hash(plainTextPassword, 10)

		await User.updateOne(
			{ _id },
			{
				$set: { password }
			}
		)
		res.json({ status: 'ok' })
	} catch (error) {
		console.log(error)
		res.json({ status: 'error', error: ';))' })
	}
})

app.post('/api/register', async (req, res) => {
	const { email, password: plainTextPassword, firstName, lastName } = req.body
	// console.log(req.body)
	if (!email || typeof email !== 'string') {
		return res.status(401).json({ status: 'error', error: 'Invalid email' })
	}
	
	if (!plainTextPassword || typeof plainTextPassword !== 'string') {
		return res.json({ status: 'error', error: 'Invalid password' })
	}
	
	if (plainTextPassword.length < 5) {
		return res.json({
			status: 'error',
			error: 'Password too small. Should be atleast 6 characters'
		})
	}
	
	if (!email.match(/^([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)) {
		return res.json({
			status: 'error',
			error: 'email is not valid'
		})
	}
	
	const password = await bcrypt.hash(plainTextPassword, 10)
	
	try {
		// console.log('hi')
		const response = await User.create({
			email,
			password,
			firstName,
			lastName
		})
		console.log('User created successfully: ', response)
	} catch (error) {
		if (error.code === 11000) {
			// duplicate key
			return res.json({ status: 11000, error: 'Username already in use' })
		}
		throw error
	}

	res.json({ status: 'ok' })
})


app.post('/api/login', async (req, res) => {
	const { email, password } = req.body
	const user = await User.findOne({ email }).lean()
	console.log(user);
	// console.log(user)
	if (!user) {
		return res.json({ status: 'error', error: 'Invalid email/password' })
	}

	if (await bcrypt.compare(password, user.password)) {
		// the email, password combination is successful

		const token = jwt.sign(
			{
				id: user._id,
				email: user.email,
			},
			JWT_SECRET
		)

		return res.json({ status: 'ok', token, _id: user._id, firstName: user.firstName, lastName: user.lastName })
	}

	res.json({ status: 'error', error: 'Invalid username/password' })
})

app.get('/api/getUserInfo', async (req, res) => {
	const { authorization } = req.headers
	const token = authorization.split('Bearer ')[1]

	try {
		const {email} = jwt.verify(token, JWT_SECRET)
		const user = await User.findOne({ email })
		console.log(user)
	
		res.json({status: 201, message: 'got the info', user})
		
	} catch (error) {
		console.log(error);
		res.json({status: 401, error: 'there is something wrong'})
	}

})

app.get('/api/getRooms', async (req, res) => {
	const {authorization} = req.headers

	
	try {
		const token = authorization.split('Bearer ')[1]
		const verified = jwt.verify(token, JWT_SECRET)
		if (verified) {
			const rooms = await Chatroom.find()
			console.log('rooms', rooms)
			return res.status(201).json({message: 'success', rooms})
		}
	} catch (error) {
		return res.status(401).json({error: 'something went wrong getting the rooms'})
	}
	res.status(200).json({message: 'success'})
})

app.get('/api/getUsers', async (req, res) => {
	const {authorization} = req.headers
	const filteredUsers = [];
	try {
		const token = authorization.split('Bearer ')[1]
		const verified = jwt.verify(token, JWT_SECRET)

		if (verified) {
			const users = await User.find()
			users.forEach(user => filteredUsers.push({
				firstName: user.firstName,
				lastName: user.lastName,
				_id: user._id
			}
			))
			return res.json({status: 'success', data: filteredUsers})
		}
	} catch (error) {
		console.log(error);
		res.json({status: 'error', error: 'something wrong'})
	}

	return res.json({message: 'getUsersApi'})
})

app.delete('/api/deleteRoom', async (req, res) => {
	// const { roomId }  = req.body
	const { authorization } = req.headers
	const { roomId } = req.query
	try {
		const token = authorization.split('Bearer ')[1]
		const { id } = jwt.verify(token, JWT_SECRET)

		if ( id ) {
			const room = await Chatroom.findOne({ _id: mongoose.Types.ObjectId(roomId)})
			if (room === null) {
				return res.json({status: 'error', error: 'invalid room'})
			}

			if (room.creator === id) {
				await Chatroom.deleteOne({ _id: roomId })
				await User.updateOne({ _id: mongoose.Types.ObjectId(id)}, {
					$pull: { joinedRooms: {_id: roomId}}
				})
				return res.json({status: 'success', message: 'room deleted successfully'})
			} else {
				return res.json({status: 'fail', error: 'User may not be the owner'})
			}

		}
	} catch (error) {
		console.log(error)
		return res.json({status: 'error', error: 'something is wrong'})
	}

	res.json({message: 'deleteRoom api'})
})

app.put('/api/leaveRoom', async (req, res) => {
	const { roomId } = req.body
	const { authorization } = req.headers
	try {
		const token = authorization.split('Bearer ')[1]
		const {id} = jwt.verify(token, JWT_SECRET)

		if (id) {
			const room = await Chatroom.findOne({ _id: mongoose.Types.ObjectId(roomId)})
			if (room === null) {
				return res.json({status: 'error', error: 'invalid room'})
			}
			if (room.joinedUsers.some(user => user._id === id)) {
				await User.updateOne({ _id: mongoose.Types.ObjectId(id)}, {
					$pull: { joinedRooms: {_id: roomId}}
				})
				await Chatroom.updateOne({ _id: mongoose.Types.ObjectId(roomId)}, {
					$pull: { joinedUsers: {_id: id}}
				})
				return res.json({status: 'success', message: 'left the room'})

			}
		}
	} catch (error) {
		return res.json({status: 'error', error: 'something happened'})
	}
})

app.put('/api/joinRoom', async (req, res) => {
	const { roomId }  = req.body
	const { authorization } = req.headers

	try {
		const token = authorization.split('Bearer ')[1]
		const {id} = jwt.verify(token, JWT_SECRET)
		
		if (id) {
			const user = await User.findOne({_id: id}).lean()
			// console.log(user);
			//add user id to room's joinedUsers array..
			await Chatroom.updateOne(
				{_id: mongoose.Types.ObjectId(roomId)},
				{
					$addToSet: {
						joinedUsers: {
							_id: id,
							firstName: user.firstName,
							lastName: user.lastName,
						}
					}
				}
			)
			await User.updateOne(
				{_id: mongoose.Types.ObjectId(id)},
				{
					$addToSet: {
						joinedRooms: {_id: roomId}
					}
				}
			)

		}
	} catch (error) {
		console.log(error);
		res.json({status: 401, error: 'Something is wrong'})
	}
	return res.json({ status: 201, message: 'Joined room successfully' })
})

app.post('/api/createRoom', async (req, res) => {
	const {title, description} = req.body
	const { authorization } = req.headers

	const token = authorization.split('Bearer ')[1]
	// const user = await User.findOne({ username }).lean()
	
	//create chatroom
	try {
		const {email, id} = jwt.verify(token, JWT_SECRET)
		const user = await User.findOne({_id: id}).lean()
		const response = await Chatroom.create({
			title,
			description,
			creator: id,
		})

		await Chatroom.updateOne({ _id: response._id}, {
			$addToSet: {
				joinedUsers: {
					_id: user._id,
					firstName: user.firstName,
					lastName: user.lastName,
				}
			}
		})


		await User.updateOne(
			{_id: mongoose.Types.ObjectId(id)},
			{
				$push: {
					joinedRooms: {_id: response._id.toString()}
				}
			}
		)
	} catch (error) {
		console.log(error);
		res.json({status: 401, error: 'Something is wrong'})
		throw error
	}

	res.json({ status: 201, message: 'Room succesfully created' })
})

app.post('/api/shareVideo', async (req, res) => {
	const { authorization } = req.headers
	const {roomId, videoId, videoTitle, videoKind, videoThumbnail} = req.body

	if (!authorization) return res.json({status: 'Unauthorized', error: 'User has not authorized yet.'})

	try {
		const token = authorization.split('Bearer ')[1]
		const {id} = jwt.verify(token, JWT_SECRET)
		const user = await User.findOne({ _id: id }).lean()

		if(id) {
			// return res.json({status: 'success'})
			const response = await Chatroom.updateOne(
				{_id: mongoose.Types.ObjectId(roomId)},
				{
					$push: {
						videos: {
							videoId,
							videoTitle,
							videoKind,
							videoThumbnail,
							sender: { 
								_id: id,
								firstName: user.firstName,
								lastName: user.lastName,
							}
						}
					}
				}
			)
			if (response.nModified === 0) {
				return res.json({ status: 'error', error: 'share failed'})
			}
			return res.json({ status: 'success', message: 'Video is successfully shared'})
		}


	} catch (error) {
		return res.json({...error})
	}
})

app.post('/api/shareBook', async (req, res) => {
	const { authorization } = req.headers
	const {roomId, bookImageLink, bookThumbnail, bookTitle, bookAuthors, bookPreviewLink} = req.body

	if (!authorization) return res.json({status: 'Unauthorized', error: 'User has not authorized yet.'})

	try {
		const token = authorization.split('Bearer ')[1]
		const {id} = jwt.verify(token, JWT_SECRET)
		const user = await User.findOne({ _id: id }).lean()


		if(id) {
			
			// return res.json({status: 'success'})
			const response = await Chatroom.updateOne(
				{_id: mongoose.Types.ObjectId(roomId)},
				{
					$push: {
						books: {
							bookImageLink,
							bookThumbnail,
							bookTitle,
							bookAuthors: [...bookAuthors],
							bookPreviewLink,
							sender: { 
								_id: id,
								firstName: user.firstName,
								lastName: user.lastName,
							}
						}
					}
				}
			)
			if (response.nModified === 0) {
				return res.json({ status: 'error', error: 'share failed'})
			}
			return res.json({ status: 'success', message: 'Book is successfully shared'})
			
		}


	} catch (error) {
		return res.json({...error})
	}
})

app.post('/api/sendMessage', async (req, res) => {
const { authorization } = req.headers
const {content, roomId} = req.body
try {
	const token = authorization.split('Bearer ')[1]
	const {id} = jwt.verify(token, JWT_SECRET)
	const user = await User.findOne({ _id: id }).lean()

	if (!id) return res.json({message: 'invalid user Id'})
	
	if (id) {
		const response = await Chatroom.updateOne({ _id: roomId }, {
			$push: {
				messages: {
					content: content,
					sender: {
						_id: id,
						firstName: user.firstName,
						lastName: user.lastName
					}
				}
			}
		})

		return res.json({status: 'success', message: 'message posted successfully'})
	}
	
} catch (error) {
	console.log(error);
	return res.json({status: 'error', error: 'error posting the message'})
}
})

// app.get('/api/getMessages', async (req, res) => {
// 	const { authorization } = req.headers

// 	try {
// 		const {id} = jwt.verify(token, JWT_SECRET)
// 		const user = await User.fineOne({ _id: id }).lean()
	
// 	} catch (error) {
		
// 	}

// })

io.on('connection', socket => {
	socket.on('accessChannel', async ({_id, roomId}) => {
		const user = await User.findOne({_id}).lean()
		const room = await Chatroom.findOne({ _id: roomId})
		const testUser = {
			_id,
			firstName: user.firstName,
			lastName: user.lastName,
			roomId,
		}
		socket.join(testUser.roomId)

		//this socket is for receiving all the messages from all users from that room
		socket.emit('joinConfirm', room.messages)
		// socket.broadcast.to(roomId).emit('sendText', 'some string for broadcasting')
                //  renderMessage(announcer, `${newUser.username}  ` + notify));
			
	})
	
	socket.on('leaveChannel', (roomId) => {
		console.log('user has left');
		socket.leave(roomId)
	})

	socket.on('sendMessage', async ({roomId, _id, content}) => {
		const user = await User.findOne({_id}).lean()

		const message = {
			content: content,
			sender: `${user.firstName} ${user.lastName}`,
			time: moment().format('h:mm a')
		}
		console.log('sendMessage event is working: ', message)
		io.to(roomId).emit('message', message)
	})
})

// })