import { api_url } from "./configs.js";

export const deleteSemester = async(el) => {
    el.preventDefault();
    let semesterId = el.target.dataset.name;
    // Load Spinner
    document.getElementById('overlay').style.display = 'block';
    
    axios.delete(`${api_url}/semester`, {
      data: {
        semesterId
      },
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
      }
    })
    .then((response) => {
      //remove spinner
      document.getElementById('overlay').style.display = 'none';
      // Load success or failure modal
      let deletedConfirmation = new bootstrap.Modal(document.getElementById("deletedConfirmation"), {});
      deletedConfirmation.show();
      
    })
    .catch((response) => {
      //remove spinner
      document.getElementById('overlay').style.display = 'none';
      alert('There was an error and the semester has not been deleted. Please try again or contact support.');
    })
}