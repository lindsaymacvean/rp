import { api_url, frontend_url } from "./utils/configs.js";
import { IsLeadFacilitator, Logout } from "./utils/utils.js";
import { IsLoggedIn } from "./utils/isLoggedIn.js";
import { getSemester, getSemesterGroupList, getStats } from "./utils/api.js";
import { copyTable } from "./utils/copyTable.js";
import { exportSemester } from "./utils/exportSemester.js";
import { deleteSemester } from "./utils/deleteSemester.js";

let flattenedGroups;
globalThis.logout = Logout;
globalThis.filterGroups = filterGroups;
globalThis.copyTable = copyTable;
globalThis.exportSemester = exportSemester;
globalThis.deleteSemester = deleteSemester;

(function () {
  IsLoggedIn();

  if (!IsLeadFacilitator())
    window.location.href = `${frontend_url}/facilitator_groups.html`;

  const urlParams = new URLSearchParams(window.location.search);
  const semesterId = urlParams.get('semesterId');

  let deleteSemesterPopup = Handlebars.compile(document.querySelector("#deleteConfirmation").innerHTML);
  document.querySelector("#deleteConfirmation").innerHTML = deleteSemesterPopup({semesterId});

  console.log(semesterId);
  let groupsbtn = Handlebars.compile(document.querySelector("#groups-btn").innerHTML);
  document.querySelector("#groups-btn").innerHTML = groupsbtn({ semesterId });

  let exportbtn = Handlebars.compile(document.querySelector("#export-btn").innerHTML);
  document.querySelector("#export-btn").innerHTML = exportbtn({ semesterId });

  function getFirstLetters(str) {
    const firstLetters = str
      .split(' ')
      .map(word => word[0])
      .join('');

    return firstLetters;
  }

  getSemesterGroupList(semesterId)
    .then(resp => {
      flattenedGroups = flattenGroups(resp.data.groups);

      for (let group of resp.data.groups) {
        let initials = getFirstLetters(group.facilitatorname);
        group.initials = initials;
      }
      if (document.querySelector("#groupTemplate")) {
        const map = {
          'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6,
          'Sunday': 7
        };
        resp.data.groups.sort((a, b) => {
          let result = map[a.dayOfWeek] - map[b.dayOfWeek];
          if (result === 0)
            result = getTimeAsNumberOfMinutes(a.time) - getTimeAsNumberOfMinutes(b.time);
          return result;
        });
        let groupTemplate = Handlebars.compile(document.querySelector("#groupTemplate").innerHTML);
        document.querySelector("#groupsList").innerHTML = groupTemplate({ groups: resp.data.groups });

      }
      return resp;
    })

  getSemester(semesterId)
    .then(resp => {
      if (document.querySelector('#semesterBreadcrumb')) {
        let semesterBreadcrumb = Handlebars.compile(document.querySelector("#semesterBreadcrumb").innerHTML);
        document.querySelector("#semesterBreadcrumb").innerHTML = semesterBreadcrumb({ semesterId: resp.data.id, semesterName: resp.data.name });
      }
      return resp;
    });

  if (document.querySelector("#stats")) {
    let stats = Handlebars.compile(document.querySelector("#stats").innerHTML);
    document.querySelector("#statsReplace").outerHTML = stats({
      IsLeadFacilitator
    });
  }

  async function processCounties(stats) {
    var data = [['County', 'Number of Participants']];
    for (const [key, value] of Object.entries(stats.data.counties)) {
      data = data.concat([[key, value]]);
    }
    // This is not needed if we append a total table below
    //data = data.concat([['Total', stats.data.count]]);
    data.sort((a, b) => a[1] - b[1])
    return data;
  }

  async function processAttendance(stats) {
    var data = [['Week', 'Attendance']];
    console.log(stats.data);
    for (const [key, value] of Object.entries(stats.data.attendance)) {
      var percentage = (value / stats.data.count) * 100;
      //var percentage = (Math.round(percentage*100)/100).toFixed(2);
      data = data.concat([[key, percentage]]);
      data.sort();
    }
    return data;
  }

  async function processAbsence(stats) {

    var data = [['Week', ...stats.data.absenceReasons, { role: 'annotation' }]];

    for (const [week, value] of Object.entries(stats.data.absence)) {

      var absences = [];

      for (const reason of stats.data.absenceReasons) {

        var absenceStats = value[reason] ?? 0;
        absences.push(absenceStats);

      }

      data = data.concat([[week, ...absences, '']]);

      data.sort();

    }

    return data;
  }

  google.charts.load('current', { 'packages': ['corechart', 'bar', 'table'] });
  google.charts.setOnLoadCallback(drawChart);


  async function drawChart() {
    var raw = await getStats(semesterId);
    // Display counties table
    var counties = await processCounties(raw);
    var data = google.visualization.arrayToDataTable(counties);

    var options = {
      title: 'Participants by County',
      showRowNumber: true,
      width: '100%',
      height: '100%',
      sort: 'disable',
      //sortColumn: 2,
      //sortAscending: false
    };

    var countiesChart = new google.visualization.Table(document.getElementById('countiesChart'));
    function insertAfter(newNode, existingNode) {
      existingNode.parentNode.insertBefore(newNode, existingNode.nextSibling);
    }
    google.visualization.events.addListener(countiesChart, 'ready', () => {
      copyTable(countiesChart.VS);
      var a = document.createElement('div');
      console.log(raw.data)
      var total = Object.values(raw.data.counties).reduce((a, b) => a + b);
      a.innerHTML = `
        <table cellspacing="0" class="google-visualization-table-table" style="width: 100%; height: 100%;">
          <tbody>
            <tr class="google-visualization-table-tr-even ">
              <td class="google-visualization-table-td google-visualization-table-seq"></td>
              <td colspan="1" class="google-visualization-table-td"><strong>Total</strong></td>
              <td colspan="1" class="google-visualization-table-type-number google-visualization-table-td"><strong>${total}</strong></td>
            </tr>
          </tbody>
        </table>
        <button class="btn btn-primary w-50 mt-3 ms-5" onClick="alert(\'Counties have been copied and are ready to paste into a spreadsheet.\')">Copy Counties</button>
      `;
      insertAfter(a, countiesChart.container);
    });
    countiesChart.draw(data, options);


    // Display attendance chart
    var attendance = await processAttendance(raw);
    data = google.visualization.arrayToDataTable(attendance);

    options = {
      legend: { position: 'none' },
      width: 600,
      chart: {
        title: 'Weekly Attendance'
      },
      vAxis: {
        minValue: 0,
        maxValue: 100,
        ticks: [0, 20, 40, 60, 80]
      },
      axes: {
        x: {
          0: { side: 'bottom', label: "" }
        }
      }
    };

    var attendanceChart = new google.charts.Bar(document.getElementById('attendanceChart'));
    google.visualization.events.addListener(attendanceChart, 'ready', () => {
      var a = document.createElement('div');
      a.innerHTML = `<div class="small ms-5">* Data excludes ${raw.data.noshows} participants who did not show up to a single session.</div>`;
      insertAfter(a, attendanceChart.container);
    });
    attendanceChart.draw(data, options);
    document.getElementById('attendanceChart').style.visibility = "visible";

    var attendanceArray = Object.keys(raw.data.attendance)
      .map(function (key) {
        return Math.round((raw.data.attendance[key] / raw.data.count) * 100);
      });
    let average = attendanceArray.reduce((a, b) => a + b, 0) / attendanceArray.length;
    average = (Math.round(average * 100) / 100).toFixed(2);
    document.getElementById('averageattendance').innerHTML = "Average attendance is " + average + "%";
    document.getElementById('statsRing').outerHTML = "";


    // Display absence chart
    var absence = await processAbsence(raw);
    data = google.visualization.arrayToDataTable(absence);
    var options2 = {
      chart: {
        title: 'Reasons for Absence'
      },
      width: 600,
      height: 250,
      isStacked: 'absolute',
    };

    var absenceChart = new google.charts.Bar(document.getElementById('absenceChart'));
    absenceChart.draw(data, options2);
    document.getElementById('absenceChart').style.visibility = "visible";
  }

})();

function getTimeAsNumberOfMinutes(time) {
  var timeParts = time.split(":");
  var timeInMinutes = (timeParts[0] * 60) + timeParts[1];
  return timeInMinutes;
}

function filterGroups() {
  let groups = flattenedGroups;
  let input = document.getElementById('search_input');
  let toSearch = input.value.toUpperCase();
  let results = [];

  // Search through each the groups and then each of the individual groups properties
  for (let group in groups) {
      for (let field in groups[group]) {
      let txtValue = groups[group][field].toString().toUpperCase();
      if (txtValue.indexOf(toSearch) != -1) {
          results.push(groups[group].eventId);
      }
      }
  }

  // Loop through all list items, and hide those who don't match the search query
  let searchGroups = document.getElementById("groupsList");
  let items = searchGroups.getElementsByClassName('searchItems');
  for (let i = 0; i < items.length; i++) {
      if (results.includes(items[i].id)) {
      items[i].style.display = "";
      } else {
      items[i].style.display = "none";
      }
  }
};

function flattenGroups(groups) {
  for (let group in groups) {
    groups[group].flatParticipants = "";
    for (let participant in groups[group].participants) {
      for (let field in groups[group].participants[participant]) {
        groups[group].flatParticipants = groups[group].flatParticipants + groups[group].participants[participant][field];
      }
    }
  }
  return groups;
}