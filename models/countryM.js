const mongoose = require('mongoose')
const { getCollectionID } = require('../config/database_helper')

const saveSchema = mongoose.Schema({
    _id:{
        type:Number
    },
    sortname: {
        type:String
    },
    country_code: {
        type:String
    },
    country_name: {
        type:String
    },
    currency_code: {
        type:String
    }
})


saveSchema.pre('save', async function (next) 
    {
        if (!this._id) 
        {
          const value = await getCollectionID('cln_countries')
          this._id = value
        }
        next()
    })
module.exports = mongoose.model('cln_countries', saveSchema)