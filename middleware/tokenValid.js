const { getInfos, generateToken, getRecipients } = require("../functions/auth")
const { getUser } = require("../functions/user")
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

exports.default = async function isTokenValid(req, res, next) {

    let authHeader = req.headers['authorization']
    if (!authHeader) authHeader = req.body.headers?.Authorization
    const token = authHeader?.replaceAll('Bearer ', '') || authHeader.split(' ')[1]
    if (!token || token == "undefined") return res.status(401).send('Access denied')
    try {
        let verified = jwt.verify(token, process.env.JSON_WEB_TOKEN)
        if (!verified) return res.status(400).send('Invalid token')
        let userInfos = req.query.userInfos
        if (!userInfos) return res.status(400).send('Invalid token')

        const infos = jwt.verify(userInfos, process.env.JSON_WEB_TOKEN)
        let recipients = await getRecipients(verified?.token || verified)
        if (!recipients || recipients.error) {
            let new_token = await generateToken(infos.url, infos.username, infos.password, infos.ent)
            if (!new_token) return res.status(400).send('Invalid token')
            verified = {token:new_token}
        }

        req.headers['authorization'] = jwt.sign({ token: verified.token }, process.env.JSON_WEB_TOKEN)
        req.body['userInfos'] = jwt.sign({
            url: infos.url,
            name: infos.name,
            username: infos.username,
            password: infos.password,
            ent: infos.ent,
        }, process.env.JSON_WEB_TOKEN)
        req.body['token'] = jwt.sign(verified, process.env.JSON_WEB_TOKEN)
        next()
    } catch (err) {
        res.status(400).send('Invalid token')
    }
}