const express = require('express')
const { PrismaClient } = require('@prisma/client')
var bodyParser = require('body-parser')
var cors = require('cors')
const moment = require('moment')
moment.locale('fr')

const prisma = new PrismaClient()
const app = express()

var jsonParser = bodyParser.json({limit: '10mb', type: 'application/json'})


app.use(cors({origin:true,credentials: true}));

app.get('/feed/:userId', jsonParser, async (req, res) => {
    let type = req.query.type
    const user = await prisma.user.findUnique({
        where: {id: parseInt(req.params.userId)},
        include: {
            profile: true,
        }
    })
    if (!user) return res.json({ error: 'User not found' })
    let posts = await prisma.post.findMany({
        orderBy: {
            createdAt: 'desc'
        },
        where: {
            establishment: user.establishment,
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
    function isDateInThisWeek(date) {
        const todayObj = new Date();
        const todayDate = todayObj.getDate();
        const todayDay = todayObj.getDay();

        // get first date of week
        const firstDayOfWeek = new Date(todayObj.setDate(todayDate - todayDay));

        // get last date of week
        const lastDayOfWeek = new Date(firstDayOfWeek);
        lastDayOfWeek.setDate(lastDayOfWeek.getDate() + 6);

        // if date is equal or within the first and last dates of the week
        return date >= firstDayOfWeek && date <= lastDayOfWeek;
    }
    if (type == "weekly") posts = posts.filter(post => isDateInThisWeek(new Date(post.createdAt)))
    res.json(posts)
})

app.post('/post', jsonParser, async (req, res) => {
    const { pointer, content, user } = req.body
    if (!pointer || !content || !user) return res.json({ error: 'Missing parameters' })
    let colors = ['#FF2D00', '#FF9500', '#FFCC00', '#4CD964', '#5AC8FA', '#007AFF', '#5856D6', '#FF2D55', '#8E8E93']
    const post = await prisma.post.create({
        data: {
            content: content,
            published: true,
            author: { connect: { id: parseInt(user.id) } },
            establishment: user.establishment,
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

app.delete('/post/:id', async (req, res) => {
    const { id } = req.params
    if (!id) return false
    const post = await prisma.post.delete({
        where: {
        id: parseInt(id)
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
    if (!id) return false
    const user = await prisma.user.delete({
        where: {
            id: id
        },
        rejectOnNotFound: false,
    }).catch(e => {return console.log(e) })
    res.json(user)
})

app.post('/user/create', jsonParser, async (req, res) => {
    if (!req.body.name || !req.body.class || !req.body.etab || !req.body.pp || req.body.role == undefined) return res.json({ error: 'Missing parameters' })
    let user = await prisma.user.findUnique({
        where: {
            name: req.body.name
        },
        include: {
            profile: true,
        },
    }).catch(e => {return console.log(e) })
    if (!user) {
        user = await prisma.user.create({
            data: {
                name: req.body.name,
                class: req.body.class,
                establishment: req.body.etab,
                role: req.body.role,
                profile: {
                    create: {
                        pp: req.body.pp,
                    },
                }
            }
        }).catch(e => {return console.log(e) })
    } else {
        let updateData = {
                name: req.body.name,
                class: req.body.class,
                establishment: req.body.etab,
                role: req.body.role,
        }
        if (!(user.profile.pp.startsWith('data:') && req.body.pp.startsWith('https://'))) updateData.profile = { update: { pp: req.body.pp } }
        console.log(updateData)
        await prisma.user.update({
            where: {
                name: req.body.name
            },
            data: updateData,
            include: {
                profile: true,
            },
        }).catch(e => {return console.log(e) })
    }
    user = await prisma.user.findUnique({
        where: {
            name: req.body.name
        },
        include: {
            profile: true,
        },
    }).catch(e => {return console.log(e) })
    res.json(user)
})

app.get('/user/:id', jsonParser, async (req, res) => {
    if (req.params?.id == 'undefined') return
    const user = await prisma.user.findUnique({
        where: {
            id: parseInt(req.params.id),
        },
        include: {
            profile: true,
            posts: true,
        },
    }).catch(e => {return console.log(e) })
    console.log(user)
    res.json(user)
})

app.get('/prof', jsonParser, async (req, res) => {
    const prof = await prisma.prof.findMany()
    res.json(prof)
})


const server = app.listen(8080)
console.log('Server is running on http://localhost:8080')