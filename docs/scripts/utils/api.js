import { api_url } from "./configs.js"

export const getSemester = (semesterId) => {
   if (typeof semesterId === 'undefined' || semesterId === null ) return;
   return axios.get(`${api_url}/semester?id=${semesterId}`, {
        headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
        }
    })
}

export const getGroup = async (groupId) => {
    if (typeof groupId === 'undefined' || groupId === null) return new Error('There is no groupId key.');
    return await axios.get(`${api_url}/group?id=${groupId}`, {
        headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
        }
    })
}

export const getParticipants = async (groupId) => {
    if (typeof groupId === 'undefined' || groupId === null) return new Error('There is no groupId key.');
    return await axios.get(`${api_url}/participants?id=${groupId}`, {
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
      }
    });
}

export const getSemesterGroupList = (semesterId) => {
    if (typeof semesterId === 'undefined' || semesterId === null) return;
    return axios.get(`${api_url}/group/semester?semesterId=${semesterId}`, {
        headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
        }
    });
}


export const getFacilitator = (facilitatorId) => {
    if (typeof facilitatorId === 'undefined' || facilitatorId === null) return;
    return axios.get(`${api_url}/facilitator?id=${facilitatorId}`, {
       headers: {
           'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
       }
   })
 }

export const getFacilitators = async () => {
    const { data } = await axios.get(`${api_url}/facilitator/list`, {
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
      }
    })
    return data.Items;
}

export async function getStats() {
    return axios.get(`${api_url}/stats?semesterid=${semesterId}`, {
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
      }
    });
  }


