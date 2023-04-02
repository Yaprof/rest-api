const express = require('express')
const { PrismaClient } = require('@prisma/client')
var bodyParser = require('body-parser')
var cors = require('cors')

const prisma = new PrismaClient()
const app = express()

var jsonParser = bodyParser.json()

app.use(cors({origin:true,credentials: true}));

app.get('/feed', jsonParser, async (req, res) => {
    const posts = await prisma.post.findMany({
        orderBy: {
            createdAt: 'desc'
        },
        include: {
            author: {
                include: { profile: true },
            },
            pointer: true,
            likedBy: true,
            dislikedBy: true
        },
  })
  res.json(posts)
})

app.post('/post', jsonParser, async (req, res) => {
    const { pointer, content, authorId } = req.body
    if (!pointer || !content || !authorId) return res.json({ error: 'Missing parameters' })
    let colors = ['#FF2D00', '#FF9500', '#FFCC00', '#4CD964', '#5AC8FA', '#007AFF', '#5856D6', '#FF2D55', '#8E8E93']
    const post = await prisma.post.create({
        data: {
            content: content,
            published: true,
            author: { connect: { id: parseInt(authorId) } },
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
    })
    res.json(post)
})

app.post('/post/:id/like', jsonParser, async (req, res) => {
    let post = await prisma.post.findUnique({
        where: { id: parseInt(req.params.id) },
        include: {
            likedBy: true,
            dislikedBy: true
        },
    })
    if (!post) return res.json({ error: 'Post not found' })
    let data = {
        likedBy: { connect: { id: parseInt(req.query.userId) } },
        dislikedBy: { disconnect: { id: parseInt(req.query.userId) } },
    }
    if (post.likedBy.find(user => user.id == req.query.userId)) {
        data = {
            likedBy: { disconnect: { id: parseInt(req.query.userId) } },
            dislikedBy: { disconnect: { id: parseInt(req.query.userId) } },
        }
    }

    post = await prisma.post.update({
        where: { id: parseInt(req.params.id) },
        data,
        include: {
            likedBy: true,
            dislikedBy: true
        },
    })
    res.json(post)
})

app.post('/post/:id/dislike', jsonParser, async (req, res) => {
    let post = await prisma.post.findUnique({
        where: { id: parseInt(req.params.id) },
        include: {
            likedBy: true,
            dislikedBy: true
        },
    })
    if (!post) return res.json({ error: 'Post not found' })

    let data = {
        likedBy: { disconnect: { id: parseInt(req.query.userId) } },
        dislikedBy: { connect: { id: parseInt(req.query.userId) } },
    }
    if (post.dislikedBy.find(user => user.id == req.query.userId)) {
        data = {
            likedBy: { disconnect: { id: parseInt(req.query.userId) } },
            dislikedBy: { disconnect: { id: parseInt(req.query.userId) } },
        }
    }

    post = await prisma.post.update({
        where: { id: parseInt(req.params.id) },
        data,
        include: {
            likedBy: true,
            dislikedBy: true
        },
    })
    res.json(post)
})

app.put('/publish/:id', jsonParser, async (req, res) => {
  const { id } = req.params
  const post = await prisma.post.update({
    where: { id },
    data: { published: true },
  })
  res.json(post)
})

app.delete('/user/:id', async (req, res) => {
  const { id } = req.params
  const user = await prisma.user.delete({
    where: {
      id,
    },
  })
  res.json(user)
})

app.post('/user/create', jsonParser, async (req, res) => {
    let user = await prisma.user.findMany({
        where: {
            name: req.body.name
        },
        include: {
            profile: true,
        },
    })
    if (user.length == 0) {
        user = await prisma.user.create({
            data: {
                name: req.body.name,
                class: req.body.class,
                establishment: req.body.etab,
                profile: {
                    create: {
                        pp: req.body.pp,
                    },
                }
            }
        })
    } else {
        await prisma.user.update({
            where: {
                name: req.body.name
            },
            data: {
                name: req.body.name,
                class: req.body.class,
                establishment: req.body.etab,
                profile: {
                    update: {
                        pp: req.body.pp,
                    },
                }
            },
            include: {
                profile: true,
            },
        })
        user = await prisma.user.findMany({
            where: {
                name: req.body.name
            },
            include: {
                profile: true,
            },
        })
    }
    res.json(user)
})

app.get('/user/:id', jsonParser, async (req, res) => {
    if (req.params?.id == 'undefined') return
    const user = await prisma.user.findMany({
        where: {
            id: parseInt(req.params.id),
        },
        include: {
            profile: true,
        },
    })
    console.log(user)
    res.json(user)
})

app.get('/prof', jsonParser, async (req, res) => {
    const prof = await prisma.prof.findMany()
    res.json(prof)
})


const server = app.listen(8080)
console.log('Server is running on http://localhost:8080')