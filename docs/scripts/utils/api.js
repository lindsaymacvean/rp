import { api_url } from "./configs.js"

export const getSemester = async (semesterId) => {
   if (typeof semesterId === 'undefined' || semesterId === null ) return;
   let response = Promise.resolve();
   try {
    response = await axios.get(`${api_url}/semester?id=${semesterId}`, {
      headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
      }
    });
   } catch(e) {
    console.log(e);
   }
   return response;
}

export const deleteSemester = async (semesterId) => {
  if (typeof semesterId === 'undefined' || semesterId === null ) return;
   let response = Promise.resolve();
   try {
      response = await axios.delete(`${api_url}/semester`, {
        data: {
          semesterId
        },
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
        }
      })
    } catch(e) {
      console.log(e);
     }
     return response;
}

export const getGroup = async (groupId) => {
    if (typeof groupId === 'undefined' || groupId === null) return new Error('There is no groupId key.');
    let response = Promise.resolve();
    try {
      response = await axios.get(`${api_url}/group?id=${groupId}`, {
        headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
        }
      })
    } catch(e) {
      console.log(e);
    }
    return response;
}

export const postGroup = async (groupData) => {
  if (typeof groupData === 'undefined' || groupData === null) return new Error('There is no groupData key.');
  let response = Promise.resolve();
  try { 
    response = axios.post(`${api_url}/group/create`, groupData, {
      headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
      }
    })
  } catch(e) {
    console.log(e);
  }
  return response;
}

export const saveFolderIdToGroup = (folderId, groupData) => {
  if (typeof folderId === 'undefined' || groupData === null) return new Error('There is no folderId key.');
  if (typeof groupData === 'undefined' || groupData === null) return new Error('There is no groupData key.');
  let response = Promise.resolve();

  const data = {
    id: groupData.id,
    folderId
  };

  try {
    response = axios.put(`${api_url}/group`, data, {
      headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
      }
    });
  } catch(e) {
    console(e);
  }

  return response;

}

export const getParticipants = async (groupId) => {
    if (typeof groupId === 'undefined' || groupId === null) return new Error('There is no groupId key.');
    let response = Promise.resolve();
    try {
      response = await axios.get(`${api_url}/participants?id=${groupId}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
        }
      });
    } catch(e) {
      console.log(e);
    }
    return response;
}

export const getSemesterGroupList = async (semesterId) => {
    if (typeof semesterId === 'undefined' || semesterId === null) return {};
    let response = Promise.resolve();
    try {
      response = await axios.get(`${api_url}/group/semester?semesterId=${semesterId}`, {
        headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
        }
      });
    } catch(e) {
      console.log(e);
    }
    return response;
}


export const getFacilitator = async (facilitatorId) => {
    if (typeof facilitatorId === 'undefined' || facilitatorId === null) return;
    let response = Promise.resolve();
    try {
      response = await axios.get(`${api_url}/facilitator?id=${facilitatorId}`, {
        headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
        }
      })
    } catch(e) {
      console.log(e);
    }
    return response;
 }

export const getFacilitators = async () => {
  let response = Promise.resolve();
  try {
    response = await axios.get(`${api_url}/facilitator/list`, {
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
      }
    })
  } catch(e) {
    console.log(e);
  }
  return response.data.Items;
}

export async function getStats(semesterId) {
  let response = Promise.resolve();
  try {
    response = await axios.get(`${api_url}/stats?semesterid=${semesterId}`, {
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
      }
    });
  } catch(e) {
    console.log(e);
  }
  return response;
}

export const getFacilitatorList = async () => {

  let response = Promise.resolve();
  try {
    response = await axios.get(`${api_url}/facilitator/list`, {
      headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
      }
    })
  } catch(e) {
    console.log(e);
  }
  return response;
}

