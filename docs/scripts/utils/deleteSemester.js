import { deleteSemester } from "./api.js";

export const deleteSemesterMethod = async(el) => {
    el.preventDefault();
    let semesterId = el.target.dataset.name;
    console.log("semesterId: "+semesterId);
    // Load Spinner
    document.getElementById('overlay').style.display = 'block';
    // TODO: delete all google directories for the groups
    deleteSemester(semesterId)
    .then((response) => {
      //remove spinner
      document.getElementById('overlay').style.display = 'none';
      if (response && response.error) {
        console.log('Delete Semester Error Code: ' + response.code);
        alert('There was an error and the semester has not been deleted. Please try again or contact support.');
      } else {
        console.log('response: ' + response);
        // Load success or failure modal
        let deletedConfirmation = new bootstrap.Modal(document.getElementById("deletedConfirmation"), {});
        deletedConfirmation.show();
      }
    })
    .catch((error) => {
      //remove spinner
      console.log('Delete Semester Error: ' + error);
      document.getElementById('overlay').style.display = 'none';
      alert('There was an error and the semester has not been deleted. Please try again or contact support.');
    });
}