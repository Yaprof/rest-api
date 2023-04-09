const express = require('express')
const { PrismaClient } = require('@prisma/client')
var bodyParser = require('body-parser')
var cors = require('cors')
const moment = require('moment')
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

const { getUser, createUser, getUserFeed, updateUser, getUserByName } = require('./functions/user')
const { getPost, createPost, deletePost, likePost, dislikePost } = require('./functions/post')
const { generateToken, getInfos, getRecipients, getEntUrl } = require('./functions/auth')

const isTokenValid = require('./middleware/tokenValid').default

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
    if (!req.params.userId) return res.json({ error: 'Arguments manquants' })
    let user = await getUser(req.body.userId)
    if (!user) return res.json({ error: 'User introuvable' })
    let posts = await getUserFeed(user, req.params.userId)
    res.json(posts)
})

app.post('/post', isTokenValid, async (req, res, next) => {
    let { pointer, content, date } = req.body
    console.log(pointer, content, date)
    if (!pointer || !content || !date) return res.json({ error: 'Arguments manquants' })
    let user = await getUserByName(jwt.verify(req.query.userInfos, process.env.JSON_WEB_TOKEN).name)
    if (!user) return res.json({ error: 'User introuvable' })
    let post = await createPost(user, pointer, content, date)
    res.json(post)
})

app.delete('/post/:id', isTokenValid, async (req, res) => {
    const { id } = req.params
    if (!id) return res.json({ error: 'Arguments manquants' })
    let user = await getUserByName(jwt.verify(req.query.userInfos, process.env.JSON_WEB_TOKEN).name)
    if (!user) return res.json({ error: 'User introuvable' })
    let post = await deletePost(user, id)
    res.json(post)
})

app.post('/post/:id/like', isTokenValid, async (req, res) => {
    if (!req.params.id) return res.json({ error: 'Arguments manquants' })
    let user = await getUserByName(jwt.verify(req.query.userInfos, process.env.JSON_WEB_TOKEN).name)
    if (!user) return res.json({ error: 'User introuvable' })
    let post = await likePost(user, req.params.id)
    console.log(post.id, user.name)
    res.json(post)
})

app.post('/post/:id/dislike', isTokenValid, async (req, res) => {
    if (!req.params.id) return res.json({ error: 'Arguments manquants' })
     let user = await getUserByName(jwt.verify(req.query.userInfos, process.env.JSON_WEB_TOKEN).name)
    if (!user) return res.json({ error: 'User introuvable' })
    console.log(user.name)
    let post = await dislikePost(user, req.params.id)
    res.json(post)
})

app.post('/user/create', isTokenValid, async (req, res) => {
    if (!req.body.name || !req.body.class || !req.body.etab || !req.body.pp || req.body.role == undefined) return res.json({ error: 'Arguments manquants' })
    let user = await createUser(req.body.name, req.body.class, req.body.etab, req.body.pp, req.body.role)
    res.json(user)
})

app.get('/user', isTokenValid, async (req, res) => {
    if (!req.query?.userInfos) return res.json({ error: 'Userinfos invalide' })
    let userbyName = await getUserByName(jwt.verify(req.query.userInfos, process.env.JSON_WEB_TOKEN).name)
    if (!userbyName) return res.json({ error: 'User introuvable' })
    let user = await getUser(userbyName.id)
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
    let connectInfos = {
        url: url,
        name: userInfos.name,
        username: username,
        password: password,
        ent: ent,
    }
    res.json({ token: jwt.sign(token.token, process.env.JSON_WEB_TOKEN), userInfos: jwt.sign(connectInfos, process.env.JSON_WEB_TOKEN) })
})

app.post('/login', async (req, res) => {
    let { username, password, ent_url } = req.body
    if (!username || !password || !ent_url) return res.json({ error: 'Arguments manquants' })
    let geturl = await getEntUrl(ent_url)
    if (geturl.error) return res.json(geturl)
    let url = geturl.url
    ent = geturl.ent
    console.log(geturl)
    if (!ent) return res.json({ error: 'Impossible de récupérer l\'url de l\'ENT' })
    let token = await generateToken(url, username, password, ent)
    if (!token) return res.json({ error: 'Impossible de générer le token' })
    console.log('login token', token)
    let userInfos = await getInfos(token)
    if (!userInfos) return res.json({ error: 'Impossible de récupérer les informations' })
    let user = await createUser(userInfos.name, userInfos.class, userInfos.etab, userInfos.pp, userInfos.role)
    console.log(user)
    if (!user || user.error) return res.json({ error: 'Impossible de créer l\'utilisateur' })
    console.log(userInfos.name)
    let connectInfos = {
        url: url,
        name: userInfos.name,
        username: username,
        password: password,
        ent: ent,
    }
    res.json({ token: jwt.sign(token, process.env.JSON_WEB_TOKEN), userInfos: jwt.sign(connectInfos, process.env.JSON_WEB_TOKEN), user: JSON.stringify(user) })
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
    res.json({ profs: recipients, token: req.body?.token, userInfos: req.body?.userInfos })
})


const server = app.listen(8080)
console.log('Server is running on ' + server.address().port)

module.exports = { prisma }