require('dotenv').config()
var express = require('express')
var bodyParser = require('body-parser')
const http = require('http')
var cors = require('cors')
require('./config/database')
const route = require('./config/route/index')
const port = process.env.PORT || 8010
const {checkApiKey} = require('./config/authorization')
var app = express()

const verify_emailsM = require('./models/users/verify_emailsM')

app.use(bodyParser.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 }))
app.use(bodyParser.json({ limit: "50mb" }))
app.use(cors())
app.get('/', async(req,res)=>
{
    const query = await verify_emailsM.find()
    res.json({ status: true, message: query})
})

app.use(checkApiKey)
app.use(route)
const server = http.createServer(app)


server.listen(port)