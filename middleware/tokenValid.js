const { getInfos, generateToken } = require("../functions/auth")
const { getUser } = require("../functions/user")
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();
exports.default = async function isTokenValid(req, res, next) {
    console.log('Token généré')
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (!token) return res.status(401).send('Access denied')
    console.log(jwt.sign({ url: "https://0060020P.index-education.net/pronote/eleve.html", etab: "atrium_sud", username: "zebilamouche", password: "Alexxlebest2007#", name:"VARGAS LOPEZ Alexandre" }, process.env.JSON_WEB_TOKEN))
    try {
        const verified = jwt.verify(token, process.env.JSON_WEB_TOKEN)
        if (!verified || !verified.token) return res.status(400).send('Invalid token')
        let { userInfos } = req.body
        if (!userInfos) return res.status(400).send('Invalid token')

        const infos = jwt.verify(userInfos, process.env.JSON_WEB_TOKEN)
        let userDb = await getInfos(verified.token)
        if (!userDb || userDb.error) {
            verified = await generateToken(infos.url, infos.username, infos.password, infos.etab)
            if (!verified || verified.error) return res.status(400).send('Invalid token')
            verified = jwt.verify(verified, process.env.JSON_WEB_TOKEN)
            userDb = await getInfos(newToken.token)
            userDb = jwt.verify(userDb, process.env.JSON_WEB_TOKEN)
            console.log(userDb)
            req.headers['authorization'] = jwt.sign({ token: newToken.token }, process.env.JSON_WEB_TOKEN)
        }
        if (userDb.name != infos.name) return res.status(400).send('Invalid token')
        res.userInfos = userDb
        res.token = verified.token
        next()
    } catch (err) {
        res.status(400).send('Invalid token')
    }
}