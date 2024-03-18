require('dotenv').config()
const sendgrid = require('@sendgrid/mail')
sendgrid.setApiKey("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")
const email = async(email_id, subject, message)=>{
    const msg = {
        to:email_id,
        from:{
            name: 'Login Module',
            email: 'ultimezmadhu.b@gmail.com'
        },
        subject:subject,
        html:message
    }
    await sendgrid.send(msg).then(() => {
        console.log('Email sent successfully!')
      })
      .catch((error) => {
        console.log(error)
      })
}

module.exports = {email}