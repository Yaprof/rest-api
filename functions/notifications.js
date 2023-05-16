const webpush = require('web-push');
const { PrismaClient } = require('@prisma/client');
const { getUserByName } = require('./user');
const prisma = new PrismaClient()

exports.registerSubscription = async function registerSubscription(user, subscription) {
    if (!user || !subscription) return { error: 'Arguments manquants' }

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
    try {
        webpush.sendNotification(subscription, JSON.stringify(
            {
                title: 'Abonnement aux notifications',
                body: 'Vous êtes maintenant abonné aux notifications 🎉',
                icon: '../assets/icon_512x512.png',
                vibrate: [100, 50, 100],
                actions: [
                    {
                        action: 'explore', title: 'Aller sur l\'app',
                        icon: '../assets/icon_512x512.png'
                    },
                ]

            }
        )).catch(e => {
            return console.log(e)
        })
    } catch (e) {
        console.log(e)
        return { error: 'Impossible d\'envoyer la notification' }
    }
    return notification
}

exports.getSubscription = async function getSubscription(subscription) {
    if (!subscription) return { error: 'Arguments manquants' }
    subscription = await prisma.notification.findUnique({
        where: {
            auth_token: subscription.keys.auth
        }
    }).catch(e => {
        console.log(e)
        return false
    })
    if (!subscription) return false
    return subscription
}