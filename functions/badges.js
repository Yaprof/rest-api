const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const badges_list = require('../badges.json')
const { getUserByName } = require('./user')

exports.getAllBadges = async function getAllBadges() {
    return badges_list
}

exports.buyBadge = async function buyBadge(user, id) {
    if (!id || !user) return { error: 'Arguments manquants' }
    user = await getUserByName(user.name)
    if (!user) return { error: 'User not found' }
    let badge = badges_list.find(b => b.id == id)
    if (!badge) return { error: 'Badge not found' }
    if (user.profile.badges.find(b => b == id)) return { error: 'Badge déjà acheté' }
    if (parseInt(user.profile.coins) < parseInt(badge.price)) return { error: 'Pas assez de coins' }
    user.profile.badges.push(badge.id)
    user = await prisma.profile.update({
        where: { id: parseInt(user.id) },
        data: {
            badges: user.profile.badges,
            coins: parseInt(user.profile.coins) - parseInt(badge.price)
        },
    }).catch(e => {
        console.log(e)
        return { error: 'Impossible d\'acheter le badge' }
    })
    console.log(user)
    if (!user) return { error: 'User not found' }
    return badge
},

exports.updatebadges = async function updatebadges(user, new_badges) {
    if (!user || !new_badges) return { error: 'Arguments manquants' }
    if (!user) return { error: 'User not found' }
    user = await prisma.profile.update({
        where: { id: parseInt(user.id) },
        data: {
            badges: new_badges
        },
    }).catch(e => {
        console.log(e)
        return { error: 'Impossible de mettre à jour les badges' }
    })
    console.log(user)
    if (!user) return { error: 'User not found' }
    return user
}