require('dotenv').config()
var express = require('express')
var datetime = require('node-datetime')
const usersM = require('../models/users/usersM')
var randomstring = require("randomstring")

var app = express()

var arrangeValidation = function(errors) 
{   
    var errObj = {}
    if(!errors.isEmpty())
    {   
        var errors_array = errors.array()
        for(var key in errors_array) 
        {   
            obj = errors_array[key]
            var msg = obj.msg
            var param = obj.path
            
            if (typeof  errObj[param] == 'undefined' )
            {
                errObj[param] = msg
            }

        }
    }

    return errObj 
}


var presentDateTime = function ()
{
    var ndate = new Date().toLocaleString('en-US',{ timeZone : 'Africa/Bamako'})
    var newdate = datetime.create(ndate)
    return newdate.format('Y-m-dTH:M:SZ')
}

async function generateRandomUsername() {
    // const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    // const length = 8
    // let username = ''
  
    // for (let i = 0; i < length; i++) 
    // {
    //   const randomIndex = Math.floor(Math.random() * characters.length);
    //   username += characters.charAt(randomIndex)
    // }
    var username = randomstring.generate({
        length: 8,
        charset: 'alphanumeric'
      })
    if(username)
    {
        const check_username = await usersM.findOne({user_name:username})
        if(check_username)
        {
            return generateRandomUsername()
        }
        else
        {
            return username
        }
    }
  }

module.exports = { arrangeValidation, presentDateTime, generateRandomUsername}