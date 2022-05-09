import { api_url, frontend_url } from "./utils/configs.js";
import { IsLeadFacilitator } from "./utils/utils.js";
import { logout }  from "./utils/logout.js";

globalThis.logout = logout;

(function() {
  if (!IsLeadFacilitator())
        window.location.href = `${frontend_url}/facilitator_groups.html`;
  
  const urlParams = new URLSearchParams(window.location.search);
  const semesterId = urlParams.get('semesterId');
  
  var template = Handlebars.compile(document.querySelector("#groups-btn").innerHTML);
  document.querySelector("#groups-btn").innerHTML = template({ semesterId });

  function getSemesterGroupList() {
    return axios.get(`${api_url}/group/semester?semesterId=${semesterId}`, {
        headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
        }
    });
  }

  function getSemester() {
    return axios.get(`${api_url}/semester?id=${semesterId}`, {
        headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
        }
    });
  }
  
  getSemesterGroupList()
    .then(resp => {
      if (document.querySelector("#groupTemplate")) {
        console.log(resp);
        const map = {
          'Monday': 1,'Tuesday': 2,'Wednesday': 3,'Thursday': 4,'Friday': 5,'Saturday': 6,
          'Sunday': 7
        };
        resp.data.sort((a, b) => {
          let result = map[a.dayOfWeek] - map[b.dayOfWeek];
          if (result === 0)
            result = getTimeAsNumberOfMinutes(a.time) - getTimeAsNumberOfMinutes(b.time);
          return  result;
        });
        var template = Handlebars.compile(document.querySelector("#groupTemplate").innerHTML);
        document.querySelector("#groupsList").innerHTML = template({ groups: resp.data });
      }
      return resp;
    })

  getSemester()
    .then(resp => {
      if (document.querySelector('#semesterBreadcrumb')) {
        var template = Handlebars.compile(document.querySelector("#semesterBreadcrumb").innerHTML);
        document.querySelector("#semesterBreadcrumb").innerHTML = template({ semesterId: resp.data.id, semesterName: resp.data.name });
      }
      return resp;
    });
})();

function getTimeAsNumberOfMinutes(time) {
    var timeParts = time.split(":");
    var timeInMinutes = (timeParts[0] * 60) + timeParts[1];
    return timeInMinutes;
}