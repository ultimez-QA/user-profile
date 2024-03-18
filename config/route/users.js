var express = require('express')
var router = express.Router()

const auth = require('../../controllers/users/auth')

router.use('/auth', auth)

module.exports = router