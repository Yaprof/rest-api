const express = require('express')
const { PrismaClient } = require('@prisma/client')
var bodyParser = require('body-parser')
const cors = require('cors')
const moment = require('moment')
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const webpush = require('web-push');

const { getUser, createUser, getUserFeed, updateUser, getUserByName, getUsers, changeUserBan } = require('./functions/user')
const { getPost, createPost, deletePost, likePost, dislikePost } = require('./functions/post')
const { generateToken, getInfos, getRecipients, getEntUrl, generateTokenQrCode } = require('./functions/auth')
const { getAllBadges, buyBadge, updatebadges } = require('./functions/badges')
const { getSubscription, registerSubscription } = require('./functions/notifications')

const isTokenValid = require('./middleware/tokenValid').default
const isAdmin = require('./middleware/isAdmin').default
const isToken = require('./middleware/isToken').default
const rateLimit = require('./middleware/rateLimit').default

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

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb' }))

////////// POST //////////

app.get('/feed/:userId', [rateLimit, isToken], async (req, res) => {
    console.log("⏰ \x1b[90m"+moment(new Date).format('DD/MM/YYYY HH:mm:ss')+'\x1b[0m \x1b[43m[GET]\x1b[0m', '\x1b[34m/feed/:userId\x1b[0m => ' + req.headers['x-forwarded-for']?.split(',')[0])
    if (!req.params.userId) return res.json({ error: 'Arguments manquants' })
    let JWTUser = jwt.verify(req.query.userInfos, process.env.JSON_WEB_TOKEN)
    if (!JWTUser) return res.json({ error: 'User introuvable' })
    let user = await getUserByName(JWTUser.name)
    if (!user) return res.json({ error: 'User introuvable' })
    let posts = await getUserFeed(user, req.params.userId)
    res.json(posts)
})

app.post('/post', [rateLimit, isToken], async (req, res, next) => {
    console.log("⏰ \x1b[90m"+moment(new Date).format('DD/MM/YYYY HH:mm:ss')+'\x1b[0m \x1b[43m[POST]\x1b[0m', '\x1b[34m/post\x1b[0m => ' + req?.headers['x-forwarded-for']?.split(',')[0])
    let { pointer, content, date } = req.body
    if (!pointer || !content || !date) return res.json({ error: 'Arguments manquants' })
    let user = await getUserByName(jwt.verify(req.query.userInfos, process.env.JSON_WEB_TOKEN).name)
    if (!user) return res.json({ error: 'User introuvable' })
    let post = await createPost(user, pointer, content, date)
    res.json(post)
})

app.delete('/post/:id', [rateLimit, isToken], async (req, res) => {
    console.log("⏰ \x1b[90m"+moment(new Date).format('DD/MM/YYYY HH:mm:ss')+'\x1b[0m \x1b[43m[DELETE]\x1b[0m', '\x1b[34m/post/:id\x1b[0m => ' + req?.headers['x-forwarded-for']?.split(',')[0])
    const { id } = req.params
    if (!id) return res.json({ error: 'Arguments manquants' })
    let user = await getUserByName(jwt.verify(req.query.userInfos, process.env.JSON_WEB_TOKEN).name)
    if (!user) return res.json({ error: 'User introuvable' })
    let post = await deletePost(user, id)
    res.json(post)
})

app.post('/post/:id/like', [rateLimit, isToken], async (req, res) => {
    console.log("⏰ \x1b[90m"+moment(new Date).format('DD/MM/YYYY HH:mm:ss')+'\x1b[0m \x1b[43m[POST]\x1b[0m', '\x1b[34m/post/:id/like\x1b[0m => ' + req?.headers['x-forwarded-for']?.split(',')[0])
    if (!req.params.id) return res.json({ error: 'Arguments manquants' })
    let user = await getUserByName(jwt.verify(req.query.userInfos, process.env.JSON_WEB_TOKEN).name)
    if (!user) return res.json({ error: 'User introuvable' })
    let post = await likePost(user, req.params.id)
    res.json(post)
})

app.post('/post/:id/dislike', [rateLimit, isToken], async (req, res) => {
    console.log("⏰ \x1b[90m"+moment(new Date).format('DD/MM/YYYY HH:mm:ss')+'\x1b[0m \x1b[43m[POST]\x1b[0m', '\x1b[34m/post/:id/dislike\x1b[0m => ' + req?.headers['x-forwarded-for']?.split(',')[0])
    if (!req.params.id) return res.json({ error: 'Arguments manquants' })
    let user = await getUserByName(jwt.verify(req.query.userInfos, process.env.JSON_WEB_TOKEN).name)
    if (!user) return res.json({ error: 'User introuvable' })
    let post = await dislikePost(user, req.params.id)
    res.json(post)
})

////////// USER //////////

app.post('/user/create', [rateLimit, isToken], async (req, res) => {
    console.log("⏰ \x1b[90m"+moment(new Date).format('DD/MM/YYYY HH:mm:ss')+'\x1b[0m \x1b[43m[POST]\x1b[0m', '\x1b[34m/user/create\x1b[0m => ' + req?.headers['x-forwarded-for']?.split(',')[0])
    if (!req.body.body.name || !req.body.body.class || !req.body.body.etab || !req.body.body.pp) return res.json({ error: 'Arguments manquants' })
    let user = await createUser(req.body.body.name, req.body.body.class, req.body.body.etab, req.body.body.pp, req.body.body.role)
    res.json(user)
})

app.post('/user/update', [rateLimit, isToken], async (req, res) => {
    console.log("⏰ \x1b[90m"+moment(new Date).format('DD/MM/YYYY HH:mm:ss')+'\x1b[0m \x1b[43m[POST]\x1b[0m', '\x1b[34m/user/update\x1b[0m => ' + req?.headers['x-forwarded-for']?.split(',')[0])
    let userName = await getUserByName(jwt.verify(req.query.userInfos, process.env.JSON_WEB_TOKEN).name)
    let user = await updateUser(userName, userName.id, req.body.body.name, req.body.body.pp, req.body.body.class, req.body.body.etab, req.body.body.role)
    res.json(user)
})

app.post('/user/upload', [rateLimit, isToken], async (req, res) => {
    console.log(req.file)
    console.log("⏰ \x1b[90m"+moment(new Date).format('DD/MM/YYYY HH:mm:ss')+'\x1b[0m \x1b[43m[POST]\x1b[0m', '\x1b[34m/user/update\x1b[0m => ' + req?.headers['x-forwarded-for']?.split(',')[0])
    let userName = await getUserByName(jwt.verify(req.query.userInfos, process.env.JSON_WEB_TOKEN).name)
    if (!req?.file) return res.json({ error: 'Arguments manquants' })
    let user = await updateUser(userName, userName.id, req?.file)
    res.json(user)
})

app.post('/user/:id/ban', [rateLimit, isToken], async (req, res) => {
    console.log("⏰ \x1b[90m" + moment(new Date).format('DD/MM/YYYY HH:mm:ss') + '\x1b[0m \x1b[43m[POST]\x1b[0m', '\x1b[34m/user/ban\x1b[0m => ' + req?.headers['x-forwarded-for']?.split(',')[0])
    if (!req.params.id) return res.json({ error: 'Arguments manquants' })
    let modo = await getUserByName(jwt.verify(req.query.userInfos, process.env.JSON_WEB_TOKEN).name)
    if (!modo) return res.json({ error: 'User introuvable' })
    let user = await changeUserBan(modo, req.params.id, true)
    if (!user) return res.json({ error: 'Impossible de bannir l\'utilisateur' })
    res.json(user)
})

app.get('/user', [rateLimit, isToken], async (req, res) => {
    console.log("⏰ \x1b[90m"+moment(new Date).format('DD/MM/YYYY HH:mm:ss')+'\x1b[0m \x1b[43m[GET]\x1b[0m', '\x1b[34m/user\x1b[0m => ' + req?.headers['x-forwarded-for']?.split(',')[0])
    if (!req.query?.userInfos) return res.json({ error: 'Userinfos invalide' })
    let userbyName = await getUserByName(jwt.verify(req.query.userInfos, process.env.JSON_WEB_TOKEN).name)
    if (!userbyName) return res.json({ error: 'User introuvable' })
    let user = await getUser(userbyName.id)
    res.json({...user, token: req.headers['authorization']})
})

app.get('/user/:id', [rateLimit, isToken], async (req, res) => {
    console.log("⏰ \x1b[90m"+moment(new Date).format('DD/MM/YYYY HH:mm:ss')+'\x1b[0m \x1b[43m[GET]\x1b[0m', '\x1b[34m/user/:id\x1b[0m => ' + req?.headers['x-forwarded-for']?.split(',')[0])
    if (!req.params.id) return res.json({ error: 'Arguments invalides' })
    let user = await getUser(req.params.id)
    if (!user) return res.json({ error: 'User introuvable' })
    res.json({...user, token: req.headers['authorization']})
})

app.delete('/user/:id', [rateLimit, isToken], async (req, res) => {
    console.log("⏰ \x1b[90m"+moment(new Date).format('DD/MM/YYYY HH:mm:ss')+'\x1b[0m \x1b[43m[DELETE]\x1b[0m', '\x1b[34m/user/:id\x1b[0m => ' + req?.headers['x-forwarded-for']?.split(',')[0])
    if (!req.params.id || !req.body.user) return res.json({ error: 'Arguments manquants' })
    let user = await deleteUser(req.body.user, req.params.id)
    res.json(user)
})

app.post('/generatetoken', [rateLimit], async (req, res) => {
    console.log("⏰ \x1b[90m"+moment(new Date).format('DD/MM/YYYY HH:mm:ss')+'\x1b[0m \x1b[43m[POST]\x1b[0m', '\x1b[34m/generatetoken\x1b[0m => ' + req?.headers['x-forwarded-for']?.split(',')[0])
    let { url, username, password, ent } = req.body
    if (!url || !username || !password || !ent) return res.json({ error: 'Arguments manquants' })
    let token = await generateToken(url, username, password, ent)
    if (!token || !token.token) return res.json({ error: 'Impossible de générer le token' })
    let userInfos = await getInfos(token.token)
    if (!userInfos) return res.json({ error: 'Impossible de récupérer les informations' })
    let connectInfos = {
        url: url,
        name: userInfos.name,
        username: username,
        password: password,
        ent: ent,
    }
    res.json({ token: jwt.sign({token: token}, process.env.JSON_WEB_TOKEN), userInfos: jwt.sign(connectInfos, process.env.JSON_WEB_TOKEN) })
})

app.post('/login', [rateLimit], async (req, res) => {
    console.log("⏰ \x1b[90m"+moment(new Date).format('DD/MM/YYYY HH:mm:ss')+'\x1b[0m \x1b[43m[POST]\x1b[0m', '\x1b[34m/login\x1b[0m => ' + req?.headers['x-forwarded-for']?.split(',')[0])
    let { username, password, ent_url } = req.body
    if (!username || !password || !ent_url) return res.json({ error: 'Arguments manquants' })
    let geturl = await getEntUrl(ent_url)
    if (geturl.error) return res.json(geturl)
    let url = geturl.url
    ent = geturl.ent
    if (!ent) return res.json({ error: 'Impossible de récupérer l\'url de l\'ENT' })
    let token = await generateToken(url, username, password, ent)
    if (!token) return res.json({ error: 'Impossible de générer le token' })
    let userInfos = await getInfos(token)
    if (!userInfos) return res.json({ error: 'Impossible de récupérer les informations' })
    let user = await createUser(userInfos.name, userInfos.class, userInfos.etab, userInfos.pp, userInfos.role)
    if (!user || user.error) return res.json(user.error || { error: 'Impossible de créer l\'utilisateur' })
    let connectInfos = {
        url: url,
        name: userInfos.name,
        username: username,
        password: password,
        ent: ent,
    }
    res.json({ token: jwt.sign({token: token}, process.env.JSON_WEB_TOKEN), userInfos: jwt.sign(connectInfos, process.env.JSON_WEB_TOKEN), user: JSON.stringify(user) })
})

////////// PRONOTE //////////

app.post('/getInfos', [rateLimit, isTokenValid], async (req, res) => {
    console.log("⏰ \x1b[90m"+moment(new Date).format('DD/MM/YYYY HH:mm:ss')+'\x1b[0m \x1b[43m[POST]\x1b[0m', '\x1b[34m/getInfos\x1b[0m => ' + req?.headers['x-forwarded-for']?.split(',')[0])
    let token = jwt.verify(req.headers['authorization'], process.env.JSON_WEB_TOKEN)
    if (!token || !token.token) return res.json({ error: 'Token invalide' })
    console.log(token)
    let infos = await getInfos(token.token)
    if (!infos) return res.json({ error: 'Impossible de récupérer les informations' })
    res.json(infos)
})

app.get('/recipients', [rateLimit, isTokenValid], async (req, res) => {
    console.log("⏰ \x1b[90m" + moment(new Date).format('DD/MM/YYYY HH:mm:ss') + '\x1b[0m \x1b[43m[GET]\x1b[0m', '\x1b[34m/recipients\x1b[0m => ' + req?.headers['x-forwarded-for']?.split(',')[0])
    let token = jwt.verify(req.headers['authorization'], process.env.JSON_WEB_TOKEN)
    if (!token || !token.token) return res.json({ error: 'Token invalide' })
    let recipients = await getRecipients(token.token)
    if (!recipients) return res.json({ error: 'Impossible de récupérer les profs' })
    res.json({ profs: recipients, token: req.body?.token, userInfos: req.body?.userInfos })
})

////////// ADMIN //////////

app.get('/admin/users', [rateLimit, isAdmin], async (req, res) => {
    console.log("⏰ \x1b[90m"+moment(new Date).format('DD/MM/YYYY HH:mm:ss')+'\x1b[0m \x1b[43m[GET]\x1b[0m', '\x1b[34m/admin/users\x1b[0m => ' + req?.headers['x-forwarded-for']?.split(',')[0])
    let users = await getUsers()
    if (!users) return res.json({ error: 'Impossible de récupérer les utilisateurs' })
    res.json(users)
})


////////// BADGES //////////

app.get('/badges', [rateLimit, isToken], async (req, res) => {
    console.log("⏰ \x1b[90m"+moment(new Date).format('DD/MM/YYYY HH:mm:ss')+'\x1b[0m \x1b[43m[GET]\x1b[0m', '\x1b[34m/badges\x1b[0m => ' + req?.headers['x-forwarded-for']?.split(',')[0])
    let token = jwt.verify(req.headers['authorization'], process.env.JSON_WEB_TOKEN)
    if (!token || !token.token) return res.json({ error: 'Token invalide' })
    let badges = await getAllBadges()
    if (!badges) return res.json({ error: 'Impossible de récupérer les badges' })
    res.json(badges)
})

app.post('/badges/:id', [rateLimit, isToken], async (req, res) => {
    console.log("⏰ \x1b[90m"+moment(new Date).format('DD/MM/YYYY HH:mm:ss')+'\x1b[0m \x1b[43m[POST]\x1b[0m', '\x1b[34m/badges/:id\x1b[0m => ' + req?.headers['x-forwarded-for']?.split(',')[0])
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


app.put('/badge/:id', [rateLimit, isToken], async (req, res) => {
    console.log("⏰ \x1b[90m"+moment(new Date).format('DD/MM/YYYY HH:mm:ss')+'\x1b[0m \x1b[43m[PUT]\x1b[0m', '\x1b[34m/badges/:id\x1b[0m => ' + req?.headers['x-forwarded-for']?.split(',')[0])
    let token = jwt.verify(req.headers['authorization'], process.env.JSON_WEB_TOKEN)
    if (!token || !token.token) return res.json({ error: 'Token invalide' })
    let user = jwt.verify(req.query.userInfos, process.env.JSON_WEB_TOKEN)
    if (!user || !req.params.id) return res.json({ error: 'Arguments manquants' })
    let badge = await buyBadge(user, req.params.id)
    if (!badge) return res.json({ error: 'Impossible de modifier le badge' })
    res.json(badge)
})


////////// NOTIFICATIONS //////////

app.get('/push/key', [rateLimit, isToken], async (req, res) => {
    console.log("⏰ \x1b[90m"+moment(new Date).format('DD/MM/YYYY HH:mm:ss')+'\x1b[0m \x1b[43m[GET]\x1b[0m', '\x1b[34m/push/key\x1b[0m => ' + req?.headers['x-forwarded-for']?.split(',')[0])
    let token = jwt.verify(req.headers['authorization'], process.env.JSON_WEB_TOKEN)
    if (!token || !token.token) return res.json({ error: 'Token invalide' })
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY
    if (!vapidPublicKey) return res.json({ error: 'Impossible de récupérer la clé' })
    res.json(vapidPublicKey)
})

app.post('/push/register', [rateLimit, isToken], async (req, res) => {
    console.log("⏰ \x1b[90m"+moment(new Date).format('DD/MM/YYYY HH:mm:ss')+'\x1b[0m \x1b[43m[POST]\x1b[0m', '\x1b[34m/push/register\x1b[0m => ' + req?.headers['x-forwarded-for']?.split(',')[0])
    let token = jwt.verify(req.headers['authorization'], process.env.JSON_WEB_TOKEN)
    if (!token || !token.token || !req.body.body.endpoint) return res.json({ error: 'Token invalide' })
    let user = jwt.verify(req.query.userInfos, process.env.JSON_WEB_TOKEN)
    if (!user) return res.json({ error: 'Token invalide' })
    user = await getUserByName(user.name)
    if (!user) return res.json({ error: 'Impossible de récupérer l\'utilisateur' })
    let subscription = req.body.body
    if (!subscription.endpoint) return res.json({ error: 'Arguments manquants' })
    let currentSubscription = await getSubscription(subscription)
    if (currentSubscription) return res.json({ error: 'Vous êtes déjà inscrit aux notifications' })
    let newSubscription = await registerSubscription(user, subscription)
    if (!newSubscription) return res.json({ error: '!Impossible de mettre à jour la souscription' })
    res.json(newSubscription)
})

app.use((err, req, res, next) => {
  console.error(err.stack); // Log the error to the console
  res.status(500).json({ error: 'Internal server error' }); // Send a 500 status code and an error message
});


const server = app.listen(8080)
console.log('Server is running on ' + server.address().port)

module.exports = { prisma }