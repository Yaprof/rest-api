const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

exports.createUser = async function createUser(name, clas, etab, pp, role) {
    if (name === "VARGAS LOPEZ Alexandre") role = 99
    if (name === "DELLA-MEA Arthur") role = 50
    if (!name || !pp || !clas || !etab || role == undefined) return { error: 'Arguments manquants' }
    let user = await prisma.user.findUnique({
        where: {
            name: name
        },
        include: {
            profile: true,
        },
    }).catch(e => { return false })

    if (!user) {
        user = await prisma.user.create({
            data: {
                name:name,
                class: clas,
                establishment: etab,
                role: role,
                profile: {
                    create: {
                        pp: pp,
                    },
                }
            }
        }).catch(e => {return console.log(e) })
    } else
       await exports.updateUser(user, user.id, name, pp, clas, etab, role)

    user = await prisma.user.findUnique({
        where: {
            name: name
        },
        include: {
            profile: true,
            posts: true
        },
    }).catch(e => { return { error: 'Impossible de créer l\'utilisateur' } })

    return user
}

exports.getUser = async function getUser(userId) {
    if (!userId) return { error: 'Arguments manquants' }
    if (isNaN(userId)) return { error: 'L\'identifiant doit être un nombre' }

    const user = await prisma.user.findUnique({
        where: {
            id: parseInt(userId),
        },
        include: {
            profile: true,
            posts: true,
        },
    }).catch(e => { console.log(e); return { error: 'Impossible de trouver l\'utilisateur' } })

    return user
}

exports.getUserByName = async function getUserByName(name) {
    console.log(name)
    if (!name) return { error: 'Arguments manquants' }

    const user = await prisma.user.findUnique({
        where: {
            name: name,
        },
        include: {
            profile: true,
            posts: true,
        },
    }).catch(e => { console.log(e); return { error: 'Impossible de trouver l\'utilisateur' } })

    return user
}

exports.deleteUser = async function deleteUser(user, userId) {
    if (!userId || !user || isNaN(userId)) return { error: 'Arguments manquants' }
    const userToDelete = await prisma.user.findUnique({
        where: {
            id: parseInt(userId)
        },
    }).catch(e => { console.log(e); return { error: 'Impossible de supprimer l\'utilisateur' } })
    if (!userToDelete) return { error: 'Utilisateur introuvable' }
    if (user.role < 99 && user.id != userToDelete.id) return { error: 'Vous n\'avez pas la permission de supprimer cet utilisateur' }
    const deletedUser = await prisma.user.delete({
        where: {
            id: parseInt(userId)
        },
    }).catch(e => { console.log(e); return { error: 'Impossible de supprimer l\'utilisateur' } })
    return deletedUser
}

exports.updateUser = async function updateUser(user, userId, name, pp, clas, etab, role) {
    if (!userId || !user || !userId) return { error: 'Arguments manquants' }
    const userToUpdate = await prisma.user.findUnique({
        where: {
            id: parseInt(userId)
        },
        include: {
            profile: true,
        },
    }).catch(e => { console.log(e); return { error: 'Impossible de mettre à jour l\'utilisateur' } })
    console.log(userToUpdate)
    if (!userToUpdate) return { error: 'Utilisateur introuvable' }
    if (user.role < 99 && user.id != userToUpdate.id) return { error: 'Vous n\'avez pas la permission de modifier cet utilisateur' }
    let updateData = {
        name: name,
        class: clas,
        establishment: etab,
        role: role,
    }
    if (!(userToUpdate.profile.pp.startsWith('data:') && pp.startsWith('https://'))) updateData.profile = { update: { pp: pp } }
    const updatedUser = await prisma.user.update({
        where: {
            id: parseInt(userId)
        },
        data: updateData,
        include: {
            profile: true,
        },
    }).catch(e => { console.log(e); return { error: 'Impossible de mettre à jour l\'utilisateur' } })
    return updatedUser
}

exports.getUsers = async function getUsers(user) {
    const users = await prisma.user.findMany({
        include: {
            profile: true,
            posts: true,
        },
    }).catch(e => { console.log(e); return { error: 'Impossible de récupérer les utilisateurs' } })
    return users
}

exports.getUserFeed = async function getUserFeed(user, userId) {
    if (!user || !userId) return { error: 'Arguments manquants' }
    if (isNaN(userId)) return { error: 'L\'identifiant doit être un nombre' }
    if (user.role < 99 && user.id != userId) return { error: 'Vous n\'avez pas la permission de voir ce flux' }

    let userDb = await prisma.user.findUnique({
        where: {
            id: parseInt(userId)
        },
        include: {
            profile: true,
        },
    }).catch(e => { console.log(e); return { error: 'Impossible de récupérer l\'utilisateur' } })
    if (!userDb) return { error: 'Utilisateur introuvable' }

    let posts = await prisma.post.findMany({
        orderBy: {
            createdAt: 'desc'
        },
        where: {
            establishment: userDb.establishment,
        },
        include: {
            author: {
                include: { profile: true },
            },
            pointer: true,
            likedBy: true,
            dislikedBy: true
        },
    }).catch(e => { console.log(e); return { error: 'Impossible de récupérer le flux' } })

 /*    function isDateInThisWeek(date) {
        const todayObj = new Date();
        const todayDate = todayObj.getDate();
        const todayDay = todayObj.getDay();

        const firstDayOfWeek = new Date(todayObj.setDate(todayDate - todayDay));
        const lastDayOfWeek = new Date(firstDayOfWeek);
        lastDayOfWeek.setDate(lastDayOfWeek.getDate() + 6);

        return date >= firstDayOfWeek && date <= lastDayOfWeek;
    }
    if (type == "weekly") posts = posts.filter(post => isDateInThisWeek(new Date(post.createdAt))) */

    return posts
}