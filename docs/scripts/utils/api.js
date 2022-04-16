import { api_url } from "./configs.js"

export const getSemester = (semesterId) => {
   return axios.get(`${api_url}/semester?id=${semesterId}`, {
        headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
        }
    })
}

