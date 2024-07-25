import Axios from "axios";

const axios = Axios.create({
  baseURL: "http://localhost:5500/api/v1",
});

export default axios;
