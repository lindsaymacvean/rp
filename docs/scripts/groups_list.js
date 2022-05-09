import { getSemester } from "./utils/api.js";
import { api_url } from "./utils/configs.js";
import { IsLeadFacilitator } from "./utils/utils.js";

(function() {
  
  const urlParams = new URLSearchParams(window.location.search);
  const semesterId = urlParams.get('semesterId');
  let facilitatorEmail;
  
  var template = Handlebars.compile(document.querySelector("#groups-btn").innerHTML);
  document.querySelector("#groups-btn").innerHTML = template({ semesterId });

  function getSemesterGroupList() {
    return axios.get(`${api_url}/group/semester?semesterId=${semesterId}`, {
        headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
        }
    });
  }
  
  getSemesterGroupList(semesterId)
    .then(resp => {
      if (document.querySelector("#groupTemplate")) {
        var isLeadFacilitator = IsLeadFacilitator();
        console.log(resp.data);
        var template = Handlebars.compile(document.querySelector("#groupTemplate").innerHTML);
        document.querySelector("#groupsList").innerHTML = template({ groups: resp.data, isLeadFacilitator });
      }
      return resp;
    })
    .then(resp => {
      if (document.querySelector('#semesterBreadcrumb')) {
        var template = Handlebars.compile(document.querySelector("#semesterBreadcrumb").innerHTML);
        document.querySelector("#semesterBreadcrumb").innerHTML = template({ semesterId: resp.data.id, semesterName: resp.data.name });
      }
      return resp;
    });
})();