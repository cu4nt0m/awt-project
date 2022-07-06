const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const User = require('./model/user')
const Chatroom = require('./model/chatroom')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const cors = require('cors')
//testing purpose secret (has to be in a safer place!)
const JWT_SECRET = 'sdjkfh8923yhjdksbfma@#*(&@*!^#&@bhjb2qiuhesdbhjdsfg839ujkdhfjk'

//we replace mongoDB cluster api instead of this..
// mongoose.connect('mongodb://localhost:27017/login-app-db', {
mongoose.connect('mongodb+srv://admin:admin@cluster0.k2dxyt2.mongodb.net/?retryWrites=true&w=majority', {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	useCreateIndex: true
})

const app = express()
app.use('/', express.static(path.join(__dirname, 'static')))
app.use(bodyParser.json())

app.use(cors({
    origin: '*'
}));

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


app.post('/api/login', async (req, res) => {
	const { email, password } = req.body
	const user = await User.findOne({ email }).lean()
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
			return res.status(201).json({message: 'success', data: rooms})
		}
	} catch (error) {
		return res.status(401).json({error: 'something went wrong getting the rooms'})
	}

})

app.put('/api/joinRoom', async (req, res) => {
	const { roomId } = req.body
	const { authorization } = req.headers

	try { 
		const token = authorization.split('Bearer ')[1]
		const {id} = jwt.verify(token, JWT_SECRET)
		
		if (id) {
			// console.log(user);
			//add user id to room's joinedUsers array..
			await Chatroom.updateOne(
				{_id: mongoose.Types.ObjectId(roomId)},
				{
					$addToSet: {
						joinedUsers: {_id: id}
					}
				}
			)

		}
	} catch (error) {
		console.log(error);
		res.json({status: 401, error: 'Something is wrong'})
	}
	res.json({ status: 201, message: 'Joined the room successfully' })
})

app.post('/api/createRoom', async (req, res) => {
	const {title, description} = req.body
	const { authorization } = req.headers

	const token = authorization.split('Bearer ')[1]
	// const user = await User.findOne({ username }).lean()
	
	//create chatroom
	try {
		const {email, id} = jwt.verify(token, JWT_SECRET)
		console.log('hi')
		const response = await Chatroom.create({
			title,
			description,
			creator: id,
		})

		await User.update(
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

app.listen(9999, () => {
	console.log('Server up at 9999')
})