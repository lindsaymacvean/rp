import { api_url, frontend_url } from "./utils/configs.js";
import { IsLeadFacilitator } from "./utils/utils.js";
import { logout }  from "./utils/logout.js";
import { IsLoggedIn } from "./utils/isLoggedIn.js";

globalThis.logout = logout;

(function() {
  IsLoggedIn();
  
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
  
  if (document.querySelector("#stats")) {
    template = Handlebars.compile(document.querySelector("#stats").innerHTML);
    document.querySelector("#statsReplace").outerHTML = template({
        IsLeadFacilitator
    });
  }

  async function getStats() {
    return axios.get(`${api_url}/stats?semesterid=${semesterId}`, {
      headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
      }
    });
  }
  
  async function processCounties(stats) {
    var data = [['County', 'Number of Participants']];
    for (const [key, value] of Object.entries(stats.data.counties)) {
      data = data.concat([[key, value]]);
    }
    return data;
  }

  async function processAttendance(stats) {
    var data = [['Week', 'Attendance']];
    for (const [key, value] of Object.entries(stats.data.attendance)) {
      var percentage = (value / stats.data.count)*100;
      data = data.concat([[key, percentage]]);
      data.sort();
    }
    return data;
  }

  google.charts.load('current', {'packages':['bar', 'table']});
  google.charts.setOnLoadCallback(drawChart);

  async function drawChart() {
    var raw = await getStats();
    // Display counties table
    var counties =  await processCounties(raw);
    var data = google.visualization.arrayToDataTable(counties);

    var options = {
      title: 'Participants by County',
      showRowNumber: true, 
      width: '100%', 
      height: '100%',
      sortColumn: 1,
      sortAscending: false
    };

    var countiesChart = new google.visualization.Table(document.getElementById('countiesChart'));
    countiesChart.draw(data, options);

    // Display attendance chart
    var attendance = await processAttendance(raw);
    data = google.visualization.arrayToDataTable(attendance);

    options = {
      legend: { position: 'none' },
      width: 600,
      chart: {
        title: 'Weekly Attendance'
      }
    };

    var attendanceChart = new google.charts.Bar(document.getElementById('attendanceChart'));
    attendanceChart.draw(data, options);

    
    var attendanceArray = Object.keys(raw.data.attendance)
    .map(function(key) {
        return raw.data.attendance[key];
    });
    const average = attendanceArray.reduce((a, b) => a + b, 0) / attendanceArray.length;
    document.getElementById('averageattendance').innerHTML = Math.round(average) + "%"
    document.getElementById('statsRing').outerHTML = "";
  }
})();

function getTimeAsNumberOfMinutes(time) {
    var timeParts = time.split(":");
    var timeInMinutes = (timeParts[0] * 60) + timeParts[1];
    return timeInMinutes;
}