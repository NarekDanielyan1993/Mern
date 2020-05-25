import axios from "axios";

const instance = axios.create({
    baseURL: "https://simpleblogapi.herokuapp.com/posts"
})

export default instance;