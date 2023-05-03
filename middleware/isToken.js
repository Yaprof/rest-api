const { getInfos, generateToken, getRecipients } = require("../functions/auth")
const { getUserByName } = require("../functions/user")
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

exports.default = async function isToken(req, res, next) {

    let authHeader = req.headers['authorization']
    if (!authHeader) authHeader = req.body.headers?.Authorization
    const token = authHeader?.replaceAll('Bearer ', '') || authHeader?.split(' ')[1]
    if (!token || token == "undefined") return res.status(401).send('Access denied')
    try {
        let verified = jwt.verify(token, process.env.JSON_WEB_TOKEN)
        if (!verified || !verified?.token) return res.status(400).send('Invalid token')
        let userInfos = req.query.userInfos
        if (!userInfos) return res.status(400).send('No userInfos')

        const infos = jwt.verify(userInfos, process.env.JSON_WEB_TOKEN)
        if (!infos) return res.status(400).send('Invalid userInfos')

        let user = await getUserByName(infos.name)
        if (!user) return res.status(400).send('Invalid user')
        if (user.isBanned) return res.status(403).send('Access denied')

        req.headers['authorization'] = jwt.sign({ token: verified?.token }, process.env.JSON_WEB_TOKEN)
        next()
    } catch (err) {
        res.status(400).send('Invalid token')
    }
   
}