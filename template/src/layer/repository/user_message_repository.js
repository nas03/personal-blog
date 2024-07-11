
const db = require('db').helper

const createUserBasicDataMessage = async (payload) => {
  const existed = await db('user_message')
    .where(payload)

  if (!existed.length) {
    return await db('user_message')
      .insert(payload)
  }
  return true
}

const createKycApproveMessage = async (table, payloadUserMessage, payloadPersonalMessage) =>{
  const insertMessagePayload = []
  // CHECK IS EXISTED MESSAGE
  if (payloadUserMessage) {
    const existedUserMessage = await table('user_message')
      .where(payloadUserMessage).first()
    if (!existedUserMessage) insertMessagePayload.push(payloadUserMessage)
  }

  if (payloadPersonalMessage) {
    const existedPersonalMessage = await table('user_message')
      .where(payloadPersonalMessage).first()
    if (!existedPersonalMessage) insertMessagePayload.push(payloadPersonalMessage)
  }

  // INSERT KYC APPROVE MESSAGE
  if (insertMessagePayload.length) {
    return await table('user_message').insert(insertMessagePayload)
  }

  return true
}

module.exports = {
  createUserBasicDataMessage,
  createKycApproveMessage,
}
