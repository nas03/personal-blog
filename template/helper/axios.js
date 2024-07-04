const axios = require('axios')

axios.interceptors.response.use((response) => {
  return response.data
}, function(error) {
  const { config } = error
  if (config?.raxConfig?.currentRetryAttempt === Number(process.env.RETRY_COUNT)) {
    console.error(error)
    if (config.raxConfig?.currentRetryAttempt) {
      console.error(`retry url ${config.url}: ${config.raxConfig.currentRetryAttempt}`)
    }
  } else {
    console.warn(error)
    if (config?.raxConfig?.currentRetryAttempt) {
      console.warn(`retry url ${config.url}: ${config.raxConfig.currentRetryAttempt}`)
    }
  }
  return Promise.reject(error)
})

module.exports = axios
