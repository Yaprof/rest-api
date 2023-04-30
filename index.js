const express = require('express')
const { PrismaClient } = require('@prisma/client')
var bodyParser = require('body-parser')
var cors = require('cors')
const moment = require('moment')
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const webpush = require('web-push');

const { getUser, createUser, getUserFeed, updateUser, getUserByName, getUsers } = require('./functions/user')
const { getPost, createPost, deletePost, likePost, dislikePost } = require('./functions/post')
const { generateToken, getInfos, getRecipients, getEntUrl } = require('./functions/auth')
const { getAllBadges, buyBadge, updatebadges } = require('./functions/badges')
const { getSubscription, registerSubscription } = require('./functions/notifications')

const isTokenValid = require('./middleware/tokenValid').default
const isAdmin = require('./middleware/isAdmin').default

const cloudinary = require('cloudinary').v2;

// Configuration
cloudinary.config({
  cloud_name: "dzg9awmm8",
  api_key: "735232399657949",
  api_secret: "gTftni7_kDNTj2i8gzU9wNtQRO4"
});

webpush.setVapidDetails(
    'mailto:yaprof.app@gmail.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

moment.locale('fr')
dotenv.config();

const prisma = new PrismaClient()
const app = express()

var jsonParser = bodyParser.json({ limit: '50mb', type: 'application/json', extended: true  })
var urlencodedParser = bodyParser.urlencoded({ limit: '50mb', extended: true })

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({limit: '50mb'}))
app.use(express.urlencoded({limit: '50mb'}))

app.get('/feed/:userId', isTokenValid, async (req, res) => {
    console.log(req.body)
    if (!req.params.userId) return res.json({ error: 'Arguments manquants' })
    let JWTUser = jwt.verify(req.query.userInfos, process.env.JSON_WEB_TOKEN)
    if (!JWTUser) return res.json({ error: 'User introuvable' })
    let user = await getUserByName(JWTUser.name)
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
    res.json(post)
})

app.post('/post/:id/dislike', isTokenValid, async (req, res) => {
    if (!req.params.id) return res.json({ error: 'Arguments manquants' })
    let user = await getUserByName(jwt.verify(req.query.userInfos, process.env.JSON_WEB_TOKEN).name)
    if (!user) return res.json({ error: 'User introuvable' })
    let post = await dislikePost(user, req.params.id)
    res.json(post)
})

app.post('/user/create', isTokenValid, async (req, res) => {
    if (!req.body.body.name || !req.body.body.class || !req.body.body.etab || !req.body.body.pp) return res.json({ error: 'Arguments manquants' })
    let user = await createUser(req.body.body.name, req.body.body.class, req.body.body.etab, req.body.body.pp, req.body.body.role)
    res.json(user)
})

app.post('/user/update', isTokenValid, async (req, res) => {
    let userName = await getUserByName(jwt.verify(req.query.userInfos, process.env.JSON_WEB_TOKEN).name)
    let user = await updateUser(userName, userName.id, req.body.body.name, req.body.body.pp, req.body.body.class, req.body.body.etab, req.body.body.role)
    res.json(user)
})

app.get('/user', isTokenValid, async (req, res) => {
    if (!req.query?.userInfos) return res.json({ error: 'Userinfos invalide' })
    let userbyName = await getUserByName(jwt.verify(req.query.userInfos, process.env.JSON_WEB_TOKEN).name)
    if (!userbyName) return res.json({ error: 'User introuvable' })
    let user = await getUser(userbyName.id)
    res.json({...user, token: req.headers['authorization']})
})

app.get('/user/:id', isTokenValid, async (req, res) => {
    if (!req.params.id) return res.json({ error: 'Arguments invalides' })
    let user = await getUser(req.params.id)
    if (!user) return res.json({ error: 'User introuvable' })
    res.json({...user, token: req.headers['authorization']})
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
    console.log(url, username, password, ent)
    if (!ent) return res.json({ error: 'Impossible de récupérer l\'url de l\'ENT' })
    let token = await generateToken(url, username, password, ent)
    if (!token) return res.json({ error: 'Impossible de générer le token' })
    console.log('login token', token)
    let userInfos = await getInfos(token)
    if (!userInfos) return res.json({ error: 'Impossible de récupérer les informations' })
    let user = await createUser(userInfos.name, userInfos.class, userInfos.etab, userInfos.pp, userInfos.role)
    console.log(user)
    if (!user || user.error) return res.json(user.error || { error: 'Impossible de créer l\'utilisateur' })
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
    
    let token = jwt.verify(req.headers['authorization'], process.env.JSON_WEB_TOKEN)
    if (!token || !token.token) return res.json({ error: 'Token invalide' })
    let infos = await getInfos(token.token)
    if (!infos) return res.json({ error: 'Impossible de récupérer les informations' })
    console.log('getInfos', infos)
    res.json(infos)
})

app.get('/recipients', isTokenValid, async (req, res) => {
    let token = jwt.verify(req.headers['authorization'], process.env.JSON_WEB_TOKEN)
    if (!token || !token.token) return res.json({ error: 'Token invalide' })
    let recipients = await getRecipients(token.token)
    if (!recipients) return res.json({ error: 'Impossible de récupérer les profs' })
    res.json({ profs: recipients, token: req.body?.token, userInfos: req.body?.userInfos })
})

app.get('/admin/users', isAdmin, async (req, res) => {
    let users = await getUsers()
    if (!users) return res.json({ error: 'Impossible de récupérer les utilisateurs' })
    res.json(users)
})

app.get('/badges', isTokenValid, async (req, res) => {
    let token = jwt.verify(req.headers['authorization'], process.env.JSON_WEB_TOKEN)
    if (!token || !token.token) return res.json({ error: 'Token invalide' })
    let badges = await getAllBadges()
    if (!badges) return res.json({ error: 'Impossible de récupérer les badges' })
    res.json(badges)
})

app.post('/badges/:id', isTokenValid, async (req, res) => {
    let token = jwt.verify(req.headers['authorization'], process.env.JSON_WEB_TOKEN)
    if (!token || !token.token) return res.json({ error: 'Token invalide' })
    let user = jwt.verify(req.query.userInfos, process.env.JSON_WEB_TOKEN)
    if (!user || !req.body.body.new_badges || !req.params.id) return res.json({ error: 'Arguments manquants' })
    let fetchedUser = await getUser(req.params.id)
    if (!fetchedUser) return res.json({ error: 'Impossible de récupérer l\'utilisateur' })
    if (user.role < 50 && fetchedUser.id !== user.id) return res.json({ error: 'Vous n\'avez pas les droits pour modifier cet utilisateur' })
    let new_badges = await updatebadges(fetchedUser, req.body.body.new_badges)
    if (!new_badges) return res.json({ error: 'Impossible de mettre à jour les badges' })
    res.json(new_badges)
})


app.put('/badge/:id', isTokenValid, async (req, res) => {
    let token = jwt.verify(req.headers['authorization'], process.env.JSON_WEB_TOKEN)
    if (!token || !token.token) return res.json({ error: 'Token invalide' })
    let user = jwt.verify(req.query.userInfos, process.env.JSON_WEB_TOKEN)
    if (!user || !req.params.id) return res.json({ error: 'Arguments manquants' })
    let badge = await buyBadge(user, req.params.id)
    if (!badge) return res.json({ error: 'Impossible de modifier le badge' })
    res.json(badge)
})


/// NOTIFICATIONS

app.get('/push/key', isTokenValid, async (req, res) => {
    let token = jwt.verify(req.headers['authorization'], process.env.JSON_WEB_TOKEN)
    if (!token || !token.token) return res.json({ error: 'Token invalide' })
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY
    console.log(vapidPublicKey)
    if (!vapidPublicKey) return res.json({ error: 'Impossible de récupérer la clé' })
    res.json(vapidPublicKey)
})

app.post('/push/register', isTokenValid, async (req, res) => {
    let token = jwt.verify(req.headers['authorization'], process.env.JSON_WEB_TOKEN)
    if (!token || !token.token || !req.body.body.endpoint) return res.json({ error: 'Token invalide' })
    let user = jwt.verify(req.query.userInfos, process.env.JSON_WEB_TOKEN)
    if (!user) return res.json({ error: 'Token invalide' })
    user = await getUserByName(user.name)
    if (!user) return res.json({ error: 'Impossible de récupérer l\'utilisateur' })
    let subscription = req.body.body
    console.log('register notif', req.body.body)
    if (!subscription.endpoint) return res.json({ error: 'Arguments manquants' })
    let currentSubscription = await getSubscription(subscription)
    if (currentSubscription) return res.json({ error: 'Vous êtes déjà inscrit aux notifications' })
    let newSubscription = await registerSubscription(user, subscription)
    if (!newSubscription) return res.json({ error: 'Impossible de mettre à jour la souscription' })
    res.json(newSubscription)
})


const server = app.listen(8080)
console.log('Server is running on ' + server.address().port)

module.exports = { prisma }