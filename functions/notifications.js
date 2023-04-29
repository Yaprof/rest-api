const webpush = require('web-push');
const { PrismaClient } = require('@prisma/client');
const { getUserByName } = require('./user');
const prisma = new PrismaClient()

exports.registerSubscription = async function registerSubscription(user, subscription) {
    console.log(user, subscription)
    if (!user || !subscription) return { error: 'Arguments manquants' }
    user = await getUserByName(user.name)
    if (user?.notification) return { error: 'Vous êtes déjà abonné aux notifications' }
    let data = {
        endpoint: subscription.endpoint,
        expire_date: subscription.expirationTime,
        public_key: subscription.keys.p256dh,
        auth_token: subscription.keys.auth,
        userId: parseInt(user.id)
    }

    notification = await prisma.notification.create({
        data,
    }).catch(e => {
        console.log(e)
        return { error: 'Impossible de d\'abonner aux notifs' }
    })
    if (!notification) return { error: 'Impossible de d\'abonner aux notifs' }
    webpush.sendNotification(subscription, JSON.stringify(
        {
            title: 'Abonnement aux notifications',
            body: 'Vous êtes maintenant abonné aux notifications',
            icon: './assets/icon_512x512.png',
            badge: './assets/icon_512x512.png',
            image: './assets/icon_512x512.png',
            vibrate: [100, 50, 100],
            actions: [
                {
                    action: 'explore', title: 'Aller sur le site',
                    icon: './assets/icon_512x512.png'
                },
            ]

        }
    ))
    console.log('Notification sent')
    return notification
}

exports.getSubscription = async function getSubscription(user) {
    if (!user) return { error: 'Arguments manquants' }
    user = await getUserByName(user.name)
    if (!user?.notification) return false
    let subscription = await prisma.notification.findUnique({
        where: {
            userId: parseInt(user.id)
        }
    }).catch(e => {
        console.log(e)
        return false
    })
    if (!subscription) return false
    return subscription
}