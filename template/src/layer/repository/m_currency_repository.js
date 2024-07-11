const db = require('db').helper

const getAllCurrency = () => {
  return db('m_currency').select('id', 'name')
}

module.exports = {
  getAllCurrency,
}
