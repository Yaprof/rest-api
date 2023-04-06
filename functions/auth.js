const { createUser } = require("./user")
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

const axios = require('axios').default;

dotenv.config();

exports.generateToken = async function generateToken(url, username, password, etab) {
    console.log('generateToken')
    let response = await axios.post(process.env.PRONOTE_API + '/generatetoken', {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: {
            url: url,
            username: username,
            password: password,
            ent: etab
        }
    }).catch(error => { console.log(error); return { error: "Impossible de générer le token" } })
    if (!response.data || response?.data.token == false) return { error: "Impossible de générer le token" }
    console.log(response.data.token)
    return response.data
}

exports.LoginGenerateToken = async function LoginGenerateToken(url, username, password, etab) {
    let response = await axios.post(process.env.PRONOTE_API + '/generatetoken', {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: {
            url: url,
            username: username,
            password: password,
            ent: etab
        }
    }).catch(error => { console.log(error); return { error: "Impossible de générer le token" } })
    console.log(response.data)
    if (!response.data || response?.data.token == false) return { error: "Impossible de générer le token" }
    console.log(response.data.token)
    return response.data
}

exports.getInfos = async function getInfos(token) {
    console.log(token)
    let response = await axios.get(process.env.PRONOTE_API + "/user?token="+token, {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
    }).catch(async e => { console.log(e); return { error: "Impossible de récupérer les informations" } })
    console.log(response.data)
    if (!response.data || response.data == "notfound" || response.data == "expired") return { error: "Impossible de récupérer les informations" }
    return { name: response.data.name, pp: response.data.profile_picture, class: response.data.class, etab: response.data.establishment, role: (response.data.delegue.length < 1 ? 0 : 20)}
}

exports.getRecipients = async function getRecipients(token) {
    console.log(token)
    let response = await axios.get(process.env.PRONOTE_API + "/recipients?token="+token, {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
    }).catch(async e => { console.log(e); return { error: "Impossible de récupérer les informations" } })
    console.log(response.data)
    if (!response.data || response.data == "notfound" || response.data == "expired") return { error: "Impossible de récupérer les informations" }
    return response.data
}