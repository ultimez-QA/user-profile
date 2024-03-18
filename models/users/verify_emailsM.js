const mongoose = require('mongoose')
const { getCollectionID } = require('../../config/database_helper')

const saveSchema = mongoose.Schema({
    _id:{
        type: Number
    },
    user_row_id:{
        type: Number
    },
    otp_number:{
        type: Number
    },
})
saveSchema.pre('save', async function (next) 
    {
        if (!this._id) 
        {
          const value = await getCollectionID('cln_verify_emails')
          this._id = value
        }
        next()
    })

module.exports = mongoose.model('cln_verify_emails', saveSchema)