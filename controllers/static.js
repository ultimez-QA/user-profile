require('dotenv').config()
var express = require('express')
var router = express.Router()

const countryM = require('../models/countryM')


router.get('/countries_list', async(req,res)=>{
    const get_query = await countryM.find()
    res.json({ status: true, message:get_query})
})



module.exports = router