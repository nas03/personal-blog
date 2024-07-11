/* eslint-disable no-invalid-this */
const db = require('db').helper

async function createEkycEvaluation(payload) {
  return await db('ekyc_evaluation').insert(payload)
}

async function updateEkycEvaluation(id, payload) {
  return await db('ekyc_evaluation').update(payload).where('id', id)
}

async function updateEkycEvaluationByKycId(id, payload) {
  return await db('ekyc_evaluation').update(payload).where('kyc_transaction_id', id)
}

module.exports = {
  createEkycEvaluation,
  updateEkycEvaluation,
  updateEkycEvaluationByKycId,
}
