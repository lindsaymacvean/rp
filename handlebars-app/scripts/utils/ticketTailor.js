import { api_url } from "./configs.js"

export const getTicketTailorEvents = () => {
   return axios.get(`${api_url}/tickettailor/events`, {
        headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
        }
    })
}

