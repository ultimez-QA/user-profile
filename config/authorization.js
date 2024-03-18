require('dotenv').config()
const jwt = require('jsonwebtoken')
const USER_SECRET_KEY = process.env.USER_SECRET_KEY
const API_KEY = process.env.API_KEY
var generatetoken = function(user_row_id)
{
    var jwtObj = {
        expire_at:  (3.5*60*60*1000)+(new Date().getTime()),
        user_row_id: user_row_id,
        issued_at: new Date().getTime()
    }
    return jwt.sign(jwtObj, USER_SECRET_KEY)
}

var checkApiKey = function(req, res, next){
    if(!req.headers.api_key)
    {
        res.json({ status:false, message:'API key is required.'})
    }
    else if( req.headers.api_key !== API_KEY)
    {
        res.json({ status:false, message:'Invalid API key.'})
    }
    else
    {
        next()
    }
}

var verifyToken = function(headers)
{
    if(!headers.token)
    {
        return { status:false, message:'Token field is required.'}
    }
    else
    {
        try
        {
            const decode_token = jwt.verify(headers.token,USER_SECRET_KEY)
            if(decode_token.expire_at < (new Date().getTime()))
            {
                return { status:false, message:"The token field is expired."}
            }
            else
            {
                return { status:true, message:decode_token}
            }
        }
        catch(err)
        {
            return res.json({ status:false, message:err.message})
        }
       

    }
}

module.exports = { generatetoken, verifyToken, checkApiKey}