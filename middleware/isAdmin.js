const { getInfos, generateToken } = require("../functions/auth")
const { getUser, getUserByName } = require("../functions/user")
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();
exports.default = async function isTokenValid(req, res, next) {
    let authHeader = req.headers['authorization']
    if (!authHeader) authHeader = req.body.headers?.Authorization
    const token = authHeader && authHeader.split(' ')[1]
    if (!token || token == "undefined") return res.status(401).send('Access denied')
    try {
        let verified = jwt.verify(token, process.env.JSON_WEB_TOKEN)
        if (!verified) return res.status(400).send('Invalid token')
        let userInfos = req.query.userInfos
        if (!userInfos) return res.status(400).send('Invalid token')
        const infos = jwt.verify(userInfos, process.env.JSON_WEB_TOKEN)
        if (!infos) return res.status(400).send('Invalid token')
        let user = await getUserByName(infos.name)
        if (!user) return res.status(400).send('Invalid token')
        if (![50, 99].includes(user.role)) return res.status(403).send('Access denied')
        next()
    } catch (err) {
        console.log(err)
        res.status(400).send('Invalid token')
    }
}