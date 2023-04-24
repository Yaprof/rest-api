const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

exports.setCoin = async function setCoin(user, coin) {
    if (!user || !coin) return { error: 'Arguments manquants' }
    let data = {
        coins: parseInt(coin)
    }

    user = await prisma.profile.update({
        where: { userId: parseInt(user.id) },
        data,
    }).catch(e => {
        return { error: 'Impossible de modifier les coins' }
    })
    if (!user) return { error: 'User not found' }
    return user
}

exports.addCoin = async function addCoin(user, coin) {
    if (!user || coin == undefined) return { error: 'Arguments manquants' }
    let data = {
        coins: {
            increment: parseInt(coin)
        }
    }
    if ((user.profile.coins + parseInt(coin)) < 0) user = await removeCoin(user, user.profile.coins)
    user = await prisma.profile.update({
        where: { userId: parseInt(user.id) },
        data,
    }).catch(e => {
        return { error: 'Impossible d\'ajouter des coins' }
    })
    console.log(user)
    if (!user) return { error: 'User not found' }
    return user
}

exports.removeCoin = async function removeCoin(user, coin) {
    if (!user || coin == undefined) return { error: 'Arguments manquants' }
    console.log("first user", user)
    if (!user) return { error: 'User not found' }
    if (user.profile.coins < coin) coin = user.profile.coins
    let data = {
        coins: {
            decrement: parseInt(coin)
        }
    }
    console.log(data)

    user = await prisma.profile.update({
        where: { userId: parseInt(user.id) },
        data,
    }).catch(e => {
        console.log(e)
        return { error: 'Impossible de retirer des coins' }
    })
    console.log(user, coin)
    if (!user) return { error: 'User not found' }
    return user
}
