const mongoose = require('mongoose')
const { getCollectionID } = require('../../config/database_helper')

const saveSchema = mongoose.Schema({
    _id:{
        type: Number
    },
    full_name:{
        type: String
    },
    user_name:{
        type: String
    },
    password:{
        type: String
    },
    email_id:{
        type: String
    },
    gender:{
        type: Number
    },
    country_row_id:{
        type: Number
    },
    contact_number:{
        type: Number
    },
    login_status:{
        type: Number,
        default: 1
    }, //1. Enabled , 0. Disabled
    date_n_time:{
        type : Date
    },
    work_position:{
        type: String
    }
})

saveSchema.pre('save', async function (next) 
    {
        if (!this._id) 
        {
          const value = await getCollectionID('cln_users')
          this._id = value
        }
        next()
    })

module.exports = mongoose.model('cln_users', saveSchema)