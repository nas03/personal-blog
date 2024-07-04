const axios = require('axios')
const kairosFaceDetection = async (source, target) => {
  try {
    const axiosConfig = {
      headers: {
        'app_id': process.env.KAIROS_APP_ID,
        'app_key': process.env.KAIROS_APP_KEY,
        'Content-Type': 'application/json',
      },
    }
    const res = await axios.post(process.env.KAIROS_ENDPOINT_URL + '/compare', {
      'source_image': source,
      'target_image': target,
    }, axiosConfig)
    if (res.Errors) {
      console.log(res.Errors)
      return 0
    }
    let similarity = 0
    if (res.UnmatchedFaces.length) {
      similarity = res.UnmatchedFaces[0].similarity
    }
    if (res.MatchedFaces.length) {
      similarity = res.MatchedFaces[0].similarity
    }
    return similarity * 100 || 0
  } catch (error) {
    console.log(error)
    return 0
  }
}

module.exports = {
  kairosFaceDetection,
}
