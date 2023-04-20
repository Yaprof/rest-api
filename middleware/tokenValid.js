const { getInfos, generateToken, getRecipients } = require("../functions/auth")
const { getUser } = require("../functions/user")
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

// Rate limit settings
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; //100 requests per IP address per minute
const rateLimitMap = new Map();

exports.default = async function isTokenValid(req, res, next) {

    // Rate limit system
    const ipAddress = req.ip;

    if (rateLimitMap.has(ipAddress)) {
        const requestCount = rateLimitMap.get(ipAddress);
        if (requestCount >= RATE_LIMIT_MAX_REQUESTS) {
            return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
        }
        rateLimitMap.set(ipAddress, requestCount + 1);
    } else {
        rateLimitMap.set(ipAddress, 1);
    }

    setTimeout(() => {
        rateLimitMap.delete(ipAddress);
    }, RATE_LIMIT_WINDOW_MS);


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
        let recipients = await getRecipients(verified.token)
        if (!recipients || recipients.error) {
            console.log('try to generate new token', req.path)
            let new_token = await generateToken(infos.url, infos.username, infos.password, infos.ent)
            if (!new_token) return res.status(400).send('Invalid token')
            verified = { token: new_token }
        }

        req.headers['authorization'] = jwt.sign({ token: verified.token }, process.env.JSON_WEB_TOKEN)
        req.body['userInfos'] = jwt.sign({
            url: infos.url,
            name: infos.name,
            username: infos.username,
            password: infos.password,
            ent: infos.ent,
        }, process.env.JSON_WEB_TOKEN)
        req.body['token'] = jwt.sign({token:verified.token}, process.env.JSON_WEB_TOKEN)
        next()
    } catch (err) {
        console.log(err)
        res.status(400).send('Invalid token')
    }
}