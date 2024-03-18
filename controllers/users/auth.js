require('dotenv').config()
var express = require('express')
var bcrypt = require('bcrypt')
var randomstring = require("randomstring")

var router = express.Router()
const { check, validationResult } = require('express-validator')

const { arrangeValidation, presentDateTime, generateRandomUsername} = require('../../config/helper')
const { generatetoken, verifyToken} = require('../../config/authorization')
const { email } = require('../../config/emails')

const usersM = require('../../models/users/usersM')
const countryM = require('../../models/countryM')
const verify_emailsM = require('../../models/users/verify_emailsM')

router.post('/register',[
    // check('user_name')
    // .trim().not().isEmpty().withMessage('The User name field is required')
    // .isLength({ min: 4 ,max:10}).withMessage('The User name field must be at least 4 and maximum 10 characters in length.'),
    check('full_name')
    .trim().not().isEmpty().withMessage('The full name field is required')
    .isLength({ min: 4 ,max:50}).withMessage('The full name field must be at least 4 and maximum 10 characters in length.'),
    check('email_id')
    .trim().not().isEmpty().withMessage('The email id field is required')
    .isEmail().withMessage('The email id field must be valid email.'),
    check('password')
    .trim().not().isEmpty().withMessage('The password field is required')
    .isLength({ min: 7, max:10 }).withMessage('The password should have atleast 7 and maximum 10 characters in length'),
    check('confirm_password')
    .trim().not().isEmpty().withMessage('The confirm password field is required')
    .isLength({ min: 7, max:10 }).withMessage('The confirm password should have atleast 7 and maximum 10 characters in length'),
    check('gender')
    .trim().not().isEmpty().withMessage('The gender field is required')
    .isInt({min:1, max:3}).withMessage('The gender field must contain only integers.')
], async(req, res) =>  {
    const errors = validationResult(req)
    const errObj = arrangeValidation(errors)

    var email_id = (req.body.email_id).toLowerCase()
    if(email_id)
    {
        const check_email = await usersM.findOne({email_id:email_id})
        if(check_email)
        {
            errObj['email_id'] = 'This email already exists.'
        }
        const check_space = /\s/.test(email_id)
        if(check_space)
        {
            errObj['email_id'] = 'Email id should not contain white spaces.'

        }
    }

    if(req.body.full_name)
    {
        const valid_string =  /^[^\d!@#$%^&*()_+{}\[\]:;<>,?~\\/-]*$/.test(req.body.full_name)
        if(!valid_string)
        {
            errObj['full_name'] = 'Full name cannot contain numbers and special characters.'
        }

    }

    if(req.body.password)
    {
        var password = req.body.password
        const check_space = /\s/.test(password)
        const valid_string =  /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@£$!%*?&#^_\-[\]{},.<>;:'"`+=|\\()])[A-Za-z\d@£$!%*?&#^_\-[\]{},.<>;:'"`+=|\\()]+$/.test(password)
        if(!valid_string)
        {
            errObj['password'] = 'Password should be combination of alphabets, numbers and speacial character.'
        }
        if(check_space)
        {
            errObj['password'] = 'Password should not contain white spaces.'
        }
    }

    if(req.body.password !== req.body.confirm_password)
    {
        errObj['confirm_password'] = 'Password and confirm password fields donot match.'
    }

    if(req.body.country_row_id)
    {
        if(isNaN(req.body.country_row_id))
        {
            errObj['country_row_id'] = 'Country id should contain numbers only.'
        }
        else
        {
            const check_country = await countryM.findOne({_id:parseInt(req.body.country_row_id)})
            if(!check_country)
            {
                errObj['country'] = 'Invalid country row id.'
            }

        }
    }

    if(req.body.contact_number)
    {
        const contact_number= String(req.body.contact_number)
        if(isNaN(req.body.contact_number))
        {
            errObj['contact_number'] = 'Contact number should contain numbers only.'
        }
        if(contact_number.length < 5 )
        {
            errObj['contact_number'] = 'Contact number should contain minimum 5 digits.'
        }
        if(contact_number.length > 15)
        {
            errObj['contact_number'] = 'Contact number should contain maximum 15 digits.'
 
        }
    }

    if(Object.keys(errObj).length > 0)
    {
        res.json({status:false, message:errObj})
    }
    else
    {
        try
        {
            var insertArray = []
            const hashedPassword = await bcrypt.hash(req.body.password,10)

            insertArray['full_name'] = req.body.full_name
            insertArray['user_name'] = await generateRandomUsername()
            insertArray['password'] = hashedPassword
            insertArray['email_id'] = email_id
            insertArray['gender'] = req.body.gender ? parseInt(req.body.gender) : 0
            insertArray['contact_number'] = req.body.contact_number ? parseInt(req.body.contact_number) : 0
            insertArray['country_row_id'] = req.body.country_row_id ? parseInt(req.body.country_row_id) : 0
            insertArray['date_n_time'] = presentDateTime()
    
            const insert_query = await usersM(insertArray).save()
    
            const token = generatetoken(insert_query._id)
    
            res.json({ status:true, message:{alert_message:'User created successfully.'}, token:token})

        }
        catch(err)
        {
            res.json({ status:false, message:err.message})
        }
    }
})

router.post('/login',[
    check('login_id')
    .trim().not().isEmpty().withMessage('The login id field is required'),
    check('password')
    .trim().not().isEmpty().withMessage('The password field is required')
    .isLength({ min: 7, max:10 }).withMessage('The password should have atleast 7 and maximum 10 characters in length')
], async(req, res)=>{
    const errors = validationResult(req)
    const errObj = arrangeValidation(errors)

    if(Object.keys(errObj).length > 0)
    {
        res.json({status:false, message:errObj})
    }
    else
    {
        try
        {
            const check_user = await usersM.findOne({ $or:[{email_id: req.body.login_id}, {user_name: req.body.login_id}]})
            if(check_user)
            {
                const check_password = await bcrypt.compare(req.body.password, check_user.password)
                if(check_password)
                {
                    if(check_user.login_status == 1)
                    {
                        
                        var result = {}
                        result['alert_message'] = 'User logged in successfully.'
                        result['token'] = generatetoken(check_user._id)
                        result['full_name'] = check_user.full_name
                        result['user_name'] = check_user.user_name
                        result['email_id'] = check_user.email_id
                        result['gender'] = check_user.gender
                        result['country_row_id'] = check_user.country_row_id
                        result['contact_number'] = check_user.contact_number
                        
                        if(result.country_row_id)
                        {
                            const check_country = await countryM.findOne({_id:result.country_row_id})
                            if(check_country)
                            {
                                result['country_name'] = check_country.country_name
                            }

                        }

                        res.json({ status : true, message:result })
                    }
                    else
                    {
                        res.json({ status : false, message:'This user do not have permission to login.'})
                    }
                }
                else
                {
                    res.json({ status : false, message:'Invalid Password'})
                }
            }
            else
            {
                res.json({ status : false, message:'User doesnot exists'})
            }

        }
        catch(err)
        {
            res.json({ status:false, message:err.message})
        }
    }
})

router.post('/update_user_details',[
     check('user_name')
    .trim().not().isEmpty().withMessage('The User name field is required')
    .isLength({ min: 7 ,max:10}).withMessage('The User name field must be at least 7 and maximum 10 characters in length.'),
    check('full_name')
    .trim().not().isEmpty().withMessage('The full name field is required')
    .isLength({ min: 4 ,max:50}).withMessage('The full name field must be at least 4  maximum 50 characters in length.'),
    check('email_id')
    .trim().not().isEmpty().withMessage('The email id field is required')
    .isEmail().withMessage('The email id field must be valid email.'),
    check('gender')
    .trim().not().isEmpty().withMessage('The gender field is required')
    .isInt({min:1, max:3}).withMessage('The gender field must contain only integers.')
], async(req, res)=>{
    const errors = validationResult(req)
    const errObj = arrangeValidation(errors)

    var user_row_id = 0
    const checkToken = verifyToken(req.headers)
    if(!checkToken.status)
    {
        res.json(checkToken)
    }
    else
    {
        user_row_id = checkToken.message.user_row_id

        var email_id = (req.body.email_id).toLowerCase()
        if(email_id)
        {
            const check_email = await usersM.findOne({_id:{$ne:user_row_id},email_id:email_id})
            if(check_email)
            {
                errObj['email_id'] = 'This email already exists.'
            }
            const check_space = /\s/.test(email_id)
            if(check_space)
            {
                errObj['email_id'] = 'Email id should not contain white spaces.'

            }
        }

        if(req.body.full_name)
        {
            const valid_string =  /^[^\d!@#$%^&*()_+{}\[\]:;<>,?~\\/-]*$/.test(req.body.full_name)
            if(!valid_string)
            {
                errObj['full_name'] = 'Full name cannot contain numbers and special characters.'
            }

        }
        if(req.body.user_name)
        {
            var user_name = req.body.user_name
            const check_username = await usersM.findOne({_id:{$ne:user_row_id}, user_name: user_name})
            if(check_username)
            {
                errObj['user_name'] = 'This User Name already exists.'
            }
            const check_string = /[^\w_]/.test(user_name)
            if(check_string)
            {
                errObj['user_name'] = 'User Name should not contain speacial characters.'
            }
            const check_space = /\s/.test(user_name)
            if(check_space)
            {
                errObj['user_name'] = 'Username cannot contain white spaces.'

            }
        }

        if(req.body.country_row_id)
        {
            if(isNaN(req.body.country_row_id))
            {
                errObj['country_row_id'] = 'Country id should contain numbers only.'
            }
            else
            {
                const check_country = await countryM.findOne({_id:parseInt(req.body.country_row_id)})
                if(!check_country)
                {
                    errObj['country'] = 'Invalid country row id.'
                }

            }
        }


        if(req.body.contact_number)
        {
            const contact_number= String(req.body.contact_number)
            if(isNaN(req.body.contact_number))
            {
                errObj['contact_number'] = 'Contact number should contain numbers only.'
            }
            if(contact_number.length < 5 )
            {
                errObj['contact_number'] = 'Contact number should contain minimum 5 digits.'
            }
            if(contact_number.length > 15)
            {
                errObj['contact_number'] = 'Contact number should contain maximum 15 digits.'
            
            }
        }

        if(Object.keys(errObj).length > 0)
        {
            res.json({status:false, message:errObj})
        }
        else
        {
            try
            {
            
                const check_user = await usersM.findOne({_id:user_row_id, login_status:1})
                if(check_user)
                {

                    var update_array = {}
                    update_array['full_name'] = req.body.full_name
                    update_array['user_name'] = user_name
                    update_array['email_id'] = req.body.email_id
                    update_array['gender'] = req.body.gender ? parseInt(req.body.gender) : 0
                    update_array['contact_number'] = req.body.contact_number ? parseInt(req.body.contact_number) : 0
                    update_array['country_row_id'] = req.body.country_row_id ? parseInt(req.body.country_row_id) : 0

                    await usersM.updateOne({_id:check_user._id}, { $set:update_array})

                    res.json({ status:true, message:'User details updated successfully.'})
                }
                else
                {
                    res.json({ status:false, message:'Invalid User'})
                }
            }
            catch(err)
            {
                res.json({ status:false, message:err.message})
            }
        }
    }
})

router.get('/individual_details', async(req,res)=>{
    const checkToken = verifyToken(req.headers)
    if(!checkToken.status)
    {
        res.json(checkToken)
    }
    else
    {
        var user_row_id = checkToken.message.user_row_id
        const check_user = await usersM.findOne({_id:user_row_id, login_status:1})
        if(check_user)
        {
            if(check_user.login_status == 1)
            {
                var result = {}
                result['_id'] = check_user._id
                result['full_name'] = check_user.full_name
                result['user_name'] = check_user.user_name
                result['email_id'] = check_user.email_id
                result['gender'] = check_user.gender
                result['login_status'] = check_user.login_status
                result['country_row_id'] = check_user.country_row_id
                result['contact_number'] = check_user.contact_number
               
                if(result.country_row_id)
                {
                    const check_country = await countryM.findOne({_id:result.country_row_id})
                    if(check_country)
                    {
                        result['country_name'] = check_country.country_name
                    }
    
                }
    
                res.json({ status:true, message:result})

            }
            else
            {
                res.json({ status:false, message:'User has been disabled.'})
            }
        }
        else
        {
            res.json({ status:false, message:'Invalid User'})
        }
    }
})


router.post('/forgot_password',[
    check('login_id')
    .trim().not().isEmpty().withMessage('The login id field is required')
], async(req, res)=>{
    const errors = validationResult(req)
    const errObj = arrangeValidation(errors)

    if(Object.keys(errObj).length > 0)
    {
        res.json({status:false, message:errObj})
    }
    else
    {
        try
        {
            const check_user = await usersM.findOne({ $and:[{ $or: [{ email_id: req.body.login_id }, { user_name: req.body.login_id }]}, {login_status: 1} ]})
            if(check_user)
            {
                const token = generatetoken(check_user._id)
                
                const otp = randomstring.generate({length: 6, charset: '123456789'})
                var insert_array = {
                    user_row_id:check_user._id,
                    otp_number:otp
                }
                const query = await verify_emailsM.findOne({user_row_id:check_user._id})
                if(query)
                {
                    await verify_emailsM.updateOne({user_row_id:check_user._id},{ $set: insert_array})
                }
                else
                {
                    await verify_emailsM(insert_array).save()
                }


                // const pass_email_id = check_user.email_id
                // const pass_subject = 'Forgot password OTP details'
                // const pass_message = `
                // <p style="font-size:22px">Hello ${check_user.full_name}</p>
                // <p style="font-size:18px">${otp} is your OTP to reset your password</p>

                // `
                // email(pass_email_id, pass_subject, pass_message)

                res.json({ status:true, message:'OTP has been sent to your email to reset password.', token: token})
            }
            else
            {
                res.json({ status : false, message:'User doesnot exists'})
            }
        }
        catch(err)
        {
            res.json({ status:false, message:err.message})
        }
    }
})


router.post('/verify_otp',[
    check('otp')
    .trim().not().isEmpty().withMessage('The otp field is required')
    .isNumeric().isLength({ min: 6, max:6}).withMessage('The otp should have 6 digits in length'),
    check('password')
    .trim().not().isEmpty().withMessage('The password field is required')
    .isLength({ min: 7, max:10 }).withMessage('The password should have atleast 7 and maximum 10 characters in length'),
    check('confirm_password')
    .trim().not().isEmpty().withMessage('The confirm password field is required')
    .isLength({ min: 7, max:10 }).withMessage('The confirm password should have atleast 7 and maximum 10 characters in length')
], async(req, res)=>{
    const errors = validationResult(req)
    const errObj = arrangeValidation(errors)

    const checkToken = verifyToken(req.headers)
    if(!checkToken.status)
    {
        res.json(checkToken)
    }
    else
    {
        if(req.body.password)
        {
            var password = req.body.password
            const check_space = /\s/.test(password)
            const valid_string =  /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@£$!%*?&#^_\-[\]{},.<>;:'"`+=|\\()])[A-Za-z\d@£$!%*?&#^_\-[\]{},.<>;:'"`+=|\\()]+$/.test(password)
            if(!valid_string)
            {
                errObj['password'] = 'Password should be combination of alphabets, numbers and speacial character.'
            }
            if(check_space)
            {
                errObj['password'] = 'Password should not contain white spaces.'
            }
        }
    
        if(req.body.password !== req.body.confirm_password)
        {
            errObj['confirm_password'] = 'Password and confirm password fields donot match.'
        }
    
    
        if(Object.keys(errObj).length > 0)
        {
            res.json({status:false, message:errObj})
        }
        else
        {
            try
            {
                const user_row_id = checkToken.message.user_row_id
                const check_user = await verify_emailsM.findOne({user_row_id:user_row_id},{otp_number:1})
                if(check_user)
                {
                    if(check_user.otp_number)
                    {
                        if(check_user.otp_number === parseInt(req.body.otp))
                        {
                            const hashedPassword = await bcrypt.hash(req.body.password,10)
                            await usersM.updateOne({_id:user_row_id},{ $set:{ password:hashedPassword}})
    
                            res.json({ status:true, message:'Password has been successfully changed.'})
                        }
                        else
                        {
                            res.json({ status:false, message:'Soory, Invalid OTP'})
                        }
                    }
                    else
                    {
                        res.json({ status:false, message:'Sorry you have not requested to reset password'})
                    }
                }
                else
                {
                    res.json({ status:false, message:'Invalid User'})
                }
            }
            catch(err)
            {
                res.json({ status:false, message:err.message})
            }
        }

    }

})

router.post('/change_password',[
    check('current_password')
    .trim().not().isEmpty().withMessage('The current password field is required'),
    check('password')
    .trim().not().isEmpty().withMessage('The password field is required')
    .isLength({ min: 7, max:10 }).withMessage('The password should have atleast 7 and maximum 10 characters in length'),
    check('confirm_password')
    .trim().not().isEmpty().withMessage('The confirm password field is required')
    .isLength({ min: 7, max:10 }).withMessage('The confirm password should have atleast 7 and maximum 10 characters in length')
], async(req, res)=>{
    const errors = validationResult(req)
    const errObj = arrangeValidation(errors)

    const checkToken = verifyToken(req.headers)
    if(!checkToken.status)
    {
        res.json(checkToken)
    }
    else
    {
        const user_row_id = checkToken.message.user_row_id
        const check_user = await usersM.findOne({ _id:user_row_id, login_status:1})
        if(check_user)
        {
            if(req.body.current_password)
            {
                const check_password = await bcrypt.compare(req.body.current_password, check_user.password)
                if(!check_password)
                {
                    errObj['current_password'] = 'Invalid current password.'
                }
            }
        }
    
        if(req.body.password)
        {
            var password = req.body.password
            const check_space = /\s/.test(password)
            const valid_string =  /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@£$!%*?&#^_\-[\]{},.<>;:'"`+=|\\()])[A-Za-z\d@£$!%*?&#^_\-[\]{},.<>;:'"`+=|\\()]+$/.test(password)
            if(check_space)
            {
                errObj['password'] = 'Password should not contain white spaces.'
            }
            else if(!valid_string)
            {
                errObj['password'] = 'Password should be combination of alphabets, numbers and speacial character.'
            }
    
            if(req.body.password === req.body.current_password)
            {
                errObj['password'] = 'New Password and current password should not be same.'
            }
    
            if(req.body.confirm_password && (req.body.password !== req.body.confirm_password))
            {
                errObj['confirm_password'] = 'Password and confirm password fields donot match.'
            }
        }
    
        if(Object.keys(errObj).length > 0)
        {
            res.json({status:false, message:errObj})
        }
        else
        {
            try
            {
                const hashedPassword = await bcrypt.hash(req.body.password,10)
                await usersM.updateOne({_id:user_row_id},{ $set:{password:hashedPassword}})
    
                res.json({ status:true, message:'Password updated successfully.'})
            }
            catch(err)
            {
                res.json({ status:false, message:err.message})
            }
        }

    }

})


module.exports = router