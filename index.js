const express = require('express')
const { PrismaClient } = require('@prisma/client')
var cors = require('cors')

const prisma = new PrismaClient()
const app = express()

app.use(cors())

app.get('/feed', async (req, res) => {
    const posts = await prisma.post.findMany({
        where: { published: true },
        include: {
            author: {
                include: { profile: true },
            },
            pointer: true
        },
  })
  res.json(posts)
})

app.post('/post', async (req, res) => {
  const { title, content, authorEmail } = req.body
  const post = await prisma.post.create({
    data: {
      title,
      content,
      published: false,
      author: { connect: { email: authorEmail } },
    },
  })
  res.json(post)
})

app.put('/publish/:id', async (req, res) => {
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

app.post('/user/create', async (req, res) => {
    let user = await prisma.user.findMany({
        where: {
            name: req.query.name
        },
        include: {
            profile: true,
        },
    })
    if (user.length == 0) {
        user = await prisma.user.create({
            data: {
                name: req.query.name,
                profile: {
                    create: {
                        pp: req.query.pp,
                    },
                }
            }
        })
    } else {
        await prisma.user.update({
            where: {
                name: req.query.name
            },
            data: {
                profile: {
                    update: {
                        pp: req.query.pp,
                    },
                }
            },
            include: {
                profile: true,
            },
        })
        user = await prisma.user.findMany({
            where: {
                name: req.query.name
            },
            include: {
                profile: true,
            },
        })
    }
    res.json(user)
})

app.get('/user/:id', async (req, res) => {
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


const server = app.listen(8080)