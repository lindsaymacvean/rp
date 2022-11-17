import { api_url } from "./configs.js";

export const deleteSemester = (el) => {
    el.preventDefault();
    console.log(el.target.dataset.name);
    let semesterId = el.target.dataset.name;
    // Load Spinner
    let myModal = new bootstrap.Modal(document.getElementById("deleteConfirmation"), {});
    myModal.hide();
    document.getElementById('overlay').style.display = 'block';
    
    axios.get(`${api_url}/semester/delete?id=${semesterId}`, {
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
      }
    })
    .then((response) => {
      //remove spinner
      document.getElementById('overlay').style.display = 'none';
      // Load success or failure modal
      
      alert('Group has been deleted');
    });
}