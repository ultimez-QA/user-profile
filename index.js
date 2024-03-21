const express = require('express');
const app = express();
const port = 3000;

// Sample array of objects
const data = [
  { _id: 12 },
  { name: 'coinpedia' },
  { email: 'coinpedia@gmail.com' }
]

// API endpoint to handle requests
app.get('/', async(req,res)=>
{
    res.json({ status: true, message: 'Index'})
})

app.get('/getData/:param', (req, res) => {
  const param = parseInt(req.params.param)
  var errobj = {}

  if (param < 1 || param > 3 || isNaN(param)) 
  {
    errobj['param'] = 'Invalid parameter. Please provide a value between 1 and 3.'
  }

  const index = param - 1

  if (index >= data.length) 
  {
    errobj['param'] = 'Index not found in the array.'
  }
  if(Object.keys(errobj).length)
  {
      res.json({status:false, message:errobj})
  }
  else
  { 
    const result = data[index]
    res.json({status:true, message:result})
  }

  
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`)
})

module.exports =app
