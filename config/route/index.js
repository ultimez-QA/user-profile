var express = require('express')
var router = express.Router()

const users = require('./users')
const static = require('../../controllers/static')

router.use('/users',users)
router.use('/static',static)

module.exports = router