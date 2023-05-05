const { createUser } = require("./user")
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

const axios = require('axios').default;

dotenv.config();

exports.generateToken = async function generateToken(url, username, password, etab) {
    console.log('generateToken', url, username, password, etab)
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
    }).catch(error => { console.log('error generateToken', error); return { error: "Impossible de générer le token" } })
    if (!response.data) return { error: "Impossible de générer le token" }
    console.log(response.data)
    return response.data.token
}

exports.generateTokenQrCode = async function generateTokenQrCode(qr_code, verif_code) {
    console.log('generateTokenQrCode', qr_code, verif_code)
    qr_code = JSON.parse(qr_code)
    if (!qr_code || !qr_code.jeton || !qr_code.login || !qr_code.url) return { error: "QR Code invalide" }

    let response = await axios.post(process.env.PRONOTE_API + '/generatetoken', {
        method: "qrcode",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: {
            url: qr_code.url,
            qrToken: qr_code.jeton,
            login: qr_code.login,
            checkCode: verif_code
        }
    }).catch(error => { console.log('error generateTokenQrCode', error); return { error: "Impossible de générer le token" } })
    if (!response.data) return { error: "Impossible de générer le token" }
    return response.data.token
}

exports.getInfos = async function getInfos(token) {
    console.log('getInfos', token)
    let response = await axios.get(process.env.PRONOTE_API + "/user?token="+token, {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
    }).catch(async e => { console.log('error getInfos'); return { error: "Impossible de récupérer les informations" } })
    if (!response.data || response.data == "notfound" || response.data == "expired") return { error: "Impossible de récupérer les informations" }
    return { name: response.data.name, pp: response.data.profile_picture, class: response.data.class, etab: response.data.establishment, role: (response.data.delegue.length < 1 ? 0 : 20)}
}

exports.getEntUrl = async function getEntUrl(ent_url) {
    let response = await axios.get(`https://api.androne.dev/papillon-v4/redirect.php?url=${encodeURIComponent(ent_url)}`)
    if (!response || !response.data || response.data.error) return { error: "Impossible de récupérer l'url de l'ent" }
    if (!response.data?.url || !response.data?.url.includes('.')) return { error: "Établissement incorrect" }
    let ent = response.data.url.split(".")[1].replace('-', '_')
    let url = ent_url + (ent_url.includes('eleve.html') ? '' : '/eleve.html')
    return {url, ent}
}

exports.getRecipients = async function getRecipients(token) {
    let response = await axios.get(process.env.PRONOTE_API + "/recipients?token="+token, {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
    }).catch(async e => { console.log('error get recipients'); return { error: "Impossible de récupérer les informations" } })
    if (!response.data || response.data == "notfound" || response.data == "expired") return { error: "Impossible de récupérer les informations" }
    return response.data
}