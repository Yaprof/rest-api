const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const { getUserByName } = require('./user')
const { removeCoin, addCoin } = require('./economy')
const cloudinary = require('cloudinary').v2;

exports.getMenu = async function getMenu(user) {
    if (!user) return { error: 'Arguments manquants' }
    user = await getUserByName(user.name)
    if (!user) return { error: 'User not found' }
    let menu = await prisma.cantine.findUnique({ where: { establishment: user.establishment } }).catch(e => { console.log(e); return { error: 'Impossible de trouver le menu' } })
    if (!menu) return { error: 'Menu introuvable' }
    if (!isSameWeek(new Date(menu?.createdAt), new Date())) return { error: 'Le menu date de la semaine dernière' }
    return menu
}

function getWeek(date) {
    date = new Date(date);
    const janFirst = new Date(date.getFullYear(), 0, 1);
    return Math.ceil((((date.getTime() - janFirst.getTime()) / 86400000) + janFirst.getDay() + 1) / 7);
}
function isSameWeek(dateA, dateB) {
    return getWeek(dateA) === getWeek(dateB);
}

exports.updateMenu = async function updateMenu(menu, user) {
    if (!user || !menu) return { error: 'Arguments manquants' }
    user = await getUserByName(user.name)
    if (!user) return { error: 'User not found' }
    console.log(user.establishment, menu.path)
    const options = {
        resource_type: 'image', public_id: user.establishment.trimStart().trimEnd(), folder: 'user/icons', overwrite: true, use_filename: true, unique_filename: false, format: 'webp',
    };
    let res = await cloudinary.uploader.upload(menu?.path, options).catch(e => { console.log(e); return { error: 'Impossible d\'upload la pp' } })
    if (!res) return { error: 'Impossible d\'upload la pp' }
    console.log(res)
    let menuCantine = await prisma.cantine.findUnique({
        where: { establishment: user.establishment },
    }).catch(e => {
        console.log(e)
        return { error: 'Impossible de mettre à jour le menu' }
    })

    if (menuCantine)
        menuCantine = await prisma.cantine.update({
            where: { establishment: user.establishment },
            data: {
                url: res?.secure_url,
                userId: user.id
            },
        }).catch(e => {
            console.log(e)
            return { error: 'Impossible de mettre à jour le menu' }
        })
    else {
        menuCantine = await prisma.cantine.create({
            data: {
                url: res?.secure_url,
                establishment: user.establishment,
                userId: user.id
            },
        }).catch(e => {
            console.log(e)
            return { error: 'Impossible de mettre à jour le menu' }
        })
    }
    if (!menuCantine) return { error: 'Menu not found' }
    return menuCantine
}
