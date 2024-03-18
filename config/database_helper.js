
const countersM = require('../models/countersM')

async function getCollectionID(counterName) 
{
    const result = await countersM.findOneAndUpdate(
      { model: counterName },
      { $inc: { count: 1 } },
      { upsert: true, new: true }
    )
    return result.count
}

  module.exports = {getCollectionID}