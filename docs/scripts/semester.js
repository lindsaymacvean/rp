import { frontend_url } from "./utils/configs.js";
import { IsLeadFacilitator, Logout } from "./utils/utils.js";
import { IsLoggedIn } from "./utils/isLoggedIn.js";
import { getSemester, getSemesterGroupList, getStats } from "./utils/api.js";
import { copyTable } from "./utils/copyTable.js";
import { exportSemester } from "./utils/exportSemester.js";
import { deleteSemesterMethod } from "./utils/deleteSemester.js";
import { displayCountiesChart, displayAttendanceChart, displayAbsenceChart, displayAttendanceAverage } from "./utils/gcharts.js";

let flattenedGroups;
globalThis.logout = Logout;
globalThis.filterGroups = filterGroups;
globalThis.copyTable = copyTable;
globalThis.exportSemester = exportSemester;
globalThis.deleteSemester = deleteSemesterMethod;

(function () {
  IsLoggedIn();

  if (!IsLeadFacilitator())
    window.location.href = `${frontend_url}/facilitator_groups.html`;

  const urlParams = new URLSearchParams(window.location.search);
  const semesterId = urlParams.get('semesterId');

  let deleteSemesterPopup = Handlebars.compile(document.querySelector("#deleteConfirmation").innerHTML);
  document.querySelector("#deleteConfirmation").innerHTML = deleteSemesterPopup({semesterId});

  let groupsbtn = Handlebars.compile(document.querySelector("#groups-btn").innerHTML);
  document.querySelector("#groups-btn").innerHTML = groupsbtn({ semesterId });

  let exportbtn = Handlebars.compile(document.querySelector("#export-btn").innerHTML);
  document.querySelector("#export-btn").innerHTML = exportbtn({ semesterId });

  let deletesemesterbtn = Handlebars.compile(document.querySelector("#delete-semester-btn").innerHTML);
  document.querySelector("#delete-semester-btn").innerHTML = deletesemesterbtn({ semesterId });

  getSemesterGroupList(semesterId)
  .then(resp => {
    if (!resp) {
      let groupTemplate = Handlebars.compile(document.querySelector("#groupTemplate").innerHTML);
      document.querySelector("#groupsList").innerHTML = groupTemplate(resp);
      return;
    };
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
  });

  getSemester(semesterId)
  .then(resp => {
    if (!resp) {
      let semesterBreadcrumb = Handlebars.compile(document.querySelector("#semesterBreadcrumb").innerHTML);
      document.querySelector("#semesterBreadcrumb").innerHTML = semesterBreadcrumb(resp);
      return;
    };
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

  google.charts.load('current', { 'packages': ['corechart', 'bar', 'table'] });
  google.charts.setOnLoadCallback(drawChart.bind(null, semesterId));
})();

async function drawChart(semesterId) {
  var raw = await getStats(semesterId);
  displayCountiesChart(raw);
  displayAttendanceChart(raw);
  displayAttendanceAverage(raw);
  displayAbsenceChart(raw);
}

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

function getFirstLetters(str) {
  const firstLetters = str
    .split(' ')
    .map(word => word[0])
    .join('');
  return firstLetters;
}