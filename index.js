const express = require('express')
const { PrismaClient } = require('@prisma/client')
var bodyParser = require('body-parser')
var cors = require('cors')
const moment = require('moment')
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

const { getUser, createUser, getUserFeed, updateUser } = require('./functions/user')
const { getPost, createPost, deletePost, likePost, dislikePost } = require('./functions/post')
const { generateToken, getInfos, LoginGenerateToken, getRecipients } = require('./functions/auth')

const isTokenValid = require('./middleware/tokenValid').default
console.log(isTokenValid)

moment.locale('fr')
dotenv.config();

const prisma = new PrismaClient()
const app = express()

var jsonParser = bodyParser.json({ limit: '50mb', type: 'application/json' })
var urlencodedParser = bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 })

app.use(cors({ origin: true, credentials: true }));
app.use(jsonParser)
app.use(urlencodedParser)

app.get('/feed/:userId', isTokenValid, async (req, res) => {
    console.log(req.body)
    let type = req.query.type
    if (!req.params.userId || !type) return res.json({ error: 'Arguments manquants' })
    let user = await getUser(req.body.userId)
    if (!user) return res.json({ error: 'User introuvable' })
    let posts = await getUserFeed(user, req.params.userId, type)
    res.json(posts)
})

app.post('/post', isTokenValid, async (req, res, next) => {
    let { pointer, content, user, date } = req.body
    console.log(req.body)
    if (!pointer || !content || !user || !date) return res.json({ error: 'Arguments manquants' })
    let post = await createPost(user, pointer, content, date)
    res.json(post)
})

app.delete('/post/:id', isTokenValid, async (req, res) => {
    const { id } = req.params
    if (!id) return false
    let post = await deletePost(user, id)
    res.json(post)
})

app.post('/post/:id/like', isTokenValid, async (req, res) => {
    if (!req.params.id || !req.body.user) return res.json({ error: 'Arguments manquants' })
    let post = await likePost(req.body.user, req.params.id)
    res.json(post)
})

app.post('/post/:id/dislike', isTokenValid, async (req, res) => {
    if (!req.params.id || !req.body.user) return res.json({ error: 'Arguments manquants' })
    let post = await dislikePost(req.body.user, req.params.id)
    res.json(post)
})

app.post('/user/create', isTokenValid, async (req, res) => {
    if (!req.body.name || !req.body.class || !req.body.etab || !req.body.pp || req.body.role == undefined) return res.json({ error: 'Arguments manquants' })
    let user = await createUser(req.body.name, req.body.class, req.body.etab, req.body.pp, req.body.role)
    res.json(user)
})

app.get('/user/:id', isTokenValid, async (req, res) => {
    if (req.params?.id == 'undefined') return
    let user = await getUser(req.params.id)
    res.json(user)
})

app.delete('/user/:id', isTokenValid, async (req, res) => {
    if (!req.params.id || !req.body.user) return res.json({ error: 'Arguments manquants' })
    let user = await deleteUser(req.body.user, req.params.id)
    res.json(user)
})

app.post('/generatetoken', async (req, res) => {
    let { url, username, password, ent } = req.body
    console.log(url, username, password, ent)
    if (!url || !username || !password || !ent) return res.json({ error: 'Arguments manquants' })
    let token = await generateToken(url, username, password, ent)
    if (!token) return res.json({ error: 'Impossible de générer le token' })
    let userInfos = await getInfos(token.token)
    if (!userInfos) return res.json({ error: 'Impossible de récupérer les informations' })
    console.log('Token généré')
    console.log(userInfos)
    res.json({ token: jwt.sign(token.token, process.env.JSON_WEB_TOKEN), userInfos: jwt.sign(userInfos, process.env.JSON_WEB_TOKEN) })
})

app.post('/logingeneratetoken', async (req, res) => {
    let { url, username, password, ent } = req.body
    console.log(url, username, password, ent)
    if (!url || !username || !password || !ent) return res.json({ error: 'Arguments manquants' })
    let token = await LoginGenerateToken(url, username, password, ent)
    if (!token) return res.json({ error: 'Impossible de générer le token' })
    let userInfos = await getInfos(token.token)
    if (!userInfos) return res.json({ error: 'Impossible de récupérer les informations' })
    await createUser(userInfos.name, userInfos.class, userInfos.etab, userInfos.pp, userInfos.role)
    res.json({ token: jwt.sign(token.token, process.env.JSON_WEB_TOKEN), userInfos: jwt.sign(userInfos, process.env.JSON_WEB_TOKEN) })
})

app.post('/getInfos', isTokenValid, async (req, res) => {
    console.log('getInfos')
    let token = jwt.verify(req.headers['authorization'], process.env.JSON_WEB_TOKEN)
    if (!token || !token.token) return res.json({ error: 'Token invalide' })
    let infos = await getInfos(token.token)
    if (!infos) return res.json({ error: 'Impossible de récupérer les informations' })
    res.json(infos)
})

app.get('/recipients', isTokenValid, async (req, res) => {
    let token = jwt.verify(req.headers['authorization'], process.env.JSON_WEB_TOKEN)
    if (!token || !token.token) return res.json({ error: 'Token invalide' })
    let recipients = await getRecipients(token.token)
    if (!recipients) return res.json({ error: 'Impossible de récupérer les profs' })
    res.json(recipients)
})


const server = app.listen(8080)
console.log('Server is running on ' + server.address().port)

module.exports = { prisma }