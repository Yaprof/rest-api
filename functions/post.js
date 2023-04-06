const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

exports.createPost = async function createPost(user, pointer, content, date) {
    if (!pointer || !content || !user || !date) return { error: 'Arguments manquants' }
    pointer = JSON.parse(pointer)
    if (!pointer.name || !pointer.subject) return { error: 'Arguments manquants' }

    let colors = ['#FF2D00', '#FF9500', '#FFCC00', '#4CD964', '#5AC8FA', '#007AFF', '#5856D6', '#FF2D55', '#8E8E93']
    if (date == 'today') date = moment()
    if (date == 'tomorrow') date = moment().add(1, 'days');
    if (date == 'next_tomorrow') date = moment().add(2, 'days');
    if (date == 'next_next_tomorrow') date = moment().add(3, 'days');

    let findProfPost = await prisma.prof.findUnique({
        where: {
            name: pointer.name,
        },
        include: {
           posts: true
       }
    })

    if (findProfPost) {
        let profPosts = findProfPost?.posts?.filter(post => moment(post.createdAt).date() == moment(date).date())
        if (profPosts.length > 0) return { error: 'Prof déjà signalé ce jour' }
    }

    const post = await prisma.post.create({
        data: {
            content: content,
            published: true,
            author: { connect: { id: parseInt(user.id) } },
            establishment: user.establishment,
            createdAt: date.toISOString(),
            pointer: {
                connectOrCreate: {
                    where: {
                        name: pointer.name
                    },
                    create: {
                        name: pointer?.name,
                        subject: pointer?.subject,
                        color: colors[Math.floor(Math.random() * colors.length)]
                    }
                }
            },
        },
    }).catch(e => { return { error: "Impossible de créer le post" } })

    return post
}

exports.deletePost =  async function deletePost(user, id) {
    if (!id || !user || isNaN(id)) return { error: 'Arguments manquants' }
    const post = await prisma.post.delete({
        where: {
            id: parseInt(id)
        },
    })
    if (!post) return { error: 'Post introuvable' }
    return post
}

exports.likePost = async function likePost(user, id) {
    if (!id || !user || isNaN(id)) return { error: 'Arguments manquants' }
    let post = await prisma.post.findUnique({
        where: { id: parseInt(id) },
        include: {
            likedBy: true,
            dislikedBy: true
        },
    })
    if (!post) return { error: 'Post not found' }
    let data = {
        likedBy: { connect: { id: parseInt(user.id) } },
        dislikedBy: { disconnect: { id: parseInt(user.id) } },
    }
    if (post.likedBy.find(user => user.id == user.id)) {
        data = {
            likedBy: { disconnect: { id: parseInt(user.id) } },
            dislikedBy: { disconnect: { id: parseInt(user.id) } },
        }
    }

    post = await prisma.post.update({
        where: { id: parseInt(id) },
        data,
        include: {
            likedBy: true,
            dislikedBy: true
        },
    })
    return post
}

exports.dislikePost = async function dislikePost(user, id) {
    if (!id || !user || isNaN(id)) return { error: 'Arguments manquants' }
    let post = await prisma.post.findUnique({
        where: { id: parseInt(id) },
        include: {
            likedBy: true,
            dislikedBy: true
        },
    })
    if (!post) return { error: 'Post not found' }
    let data = {
        likedBy: { disconnect: { id: parseInt(user.id) } },
        dislikedBy: { connect: { id: parseInt(user.id) } },
    }
    if (post.dislikedBy.find(user => user.id == user.id)) {
        data = {
            likedBy: { disconnect: { id: parseInt(user.id) } },
            dislikedBy: { disconnect: { id: parseInt(user.id) } },
        }
    }

    post = await prisma.post.update({
        where: { id: parseInt(id) },
        data,
        include: {
            likedBy: true,
            dislikedBy: true
        },
    })
    return post
}