export const displayCountiesChart = async(raw) => {
    // Display counties table
    const counties = await processCounties(raw);
    const data = google.visualization.arrayToDataTable(counties);

    const options = {
      title: 'Participants by County',
      showRowNumber: true,
      width: '100%',
      height: '100%',
      sort: 'disable',
      //sortColumn: 2,
      //sortAscending: false
    };

    const countiesChart = new google.visualization.Table(document.getElementById('countiesChart'));
    google.visualization.events.addListener(countiesChart, 'ready', () => {
      copyTable(countiesChart.VS);
      var a = document.createElement('div');
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
}

const processCounties = async function(stats) {
  var data = [['County', 'Number of Participants']];
  for (const [key, value] of Object.entries(stats.data.counties)) {
    data = data.concat([[key, value]]);
  }
  // This is not needed if we append a total table below
  //data = data.concat([['Total', stats.data.count]]);
  data.sort((a, b) => a[1] - b[1])
  return data;
}

export const displayAttendanceChart = async (raw) => {
    const attendance = await processAttendance(raw);
    const data = google.visualization.arrayToDataTable(attendance);
    const options = {
      legend: { position: 'none' },
      width: 600,
      height: 250,
      bars: 'vertical',
      chart: {
        title: 'Weekly Attendance'
      },
      vAxis: {
        minValue: 0,
        maxValue: 100
      }
    };
    const attendanceChartDiv = document.getElementById('attendanceChart');
    attendanceChartDiv.style.visibility = "visible";
    const attendanceChart = new google.charts.Bar(attendanceChartDiv);
    google.visualization.events.addListener(attendanceChart, 'ready', () => {
      var a = document.createElement('div');
      a.innerHTML = `<div class="small ms-5">* Data excludes ${raw.data.noshows} participants who did not show up to a single session.</div>`;
      insertAfter(a, attendanceChart.container);
    });
    attendanceChart.draw(data, options);
}

const processAttendance = async function (stats) {
  const attendanceArray = [];
  let attendance = stats.data.attendance;
  let absence = stats.data.absence;
  let count = stats.data.count;
  let data = [['Week', 'Attendance']];
  for (let week in attendance) {
    // Dont count notApplicable in the total possible attendees each week
    let notApplicable = absence[week]['Not Applicable'] || 0;
    let percentage = (attendance[week] / (count-notApplicable)) * 100;
    data = data.concat([[week, percentage]]);
    data.sort();
  }
  return data;
}

export const displayAttendanceAverage = async (raw) => {
    document.getElementById('attendanceChart').style.visibility = "visible";
    let attendanceArray = getAttendanceArray(raw);
    let average = attendanceArray.reduce((a, b) => a + b, 0) / attendanceArray.length;
    average = (Math.round(average * 100) / 100).toFixed(2);
    document.getElementById('averageattendance').innerHTML = "Average attendance is " + average + "%";
    document.getElementById('statsRing').outerHTML = "";
}

function getAttendanceArray(raw) {
  const attendanceArray = [];
  let attendance = raw.data.attendance;
  let absence = raw.data.absence;
  let count = raw.data.count;
  for (let week in attendance) {
    let thisWeeksAttendance = attendance[week];
    // Dont count notApplicable in the total possible attendees each week
    let notApplicable = absence[week]['Not Applicable'] || 0;
    let floatAverage = (thisWeeksAttendance / (count - notApplicable)) * 100;
    attendanceArray.push(Math.round(floatAverage));
  }
  return attendanceArray;
}

export const displayAbsenceChart = async (raw) => {
    // Display absence chart
    let absence = await processAbsence(raw);
    const data = google.visualization.arrayToDataTable(absence);
    const options2 = {
      chart: {
        title: 'Reasons for Absence'
      },
      width: 600,
      height: 250,
      isStacked: 'absolute',
    };

    const absenceChartDiv = document.getElementById('absenceChart');
    absenceChartDiv.style.visibility = "visible";

    const absenceChart = new google.charts.Bar(absenceChartDiv);
    absenceChart.draw(data, options2);
}

const processAbsence = async function (stats) {
  let absenceReasons = stats.data.absenceReasons;
  // Remove Not Applicable as a category
  absenceReasons.splice(absenceReasons.indexOf('Not Applicable'), 1);
  var data = [['Week', ...absenceReasons, { role: 'annotation' }]];
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

function insertAfter(newNode, existingNode) {
    existingNode.parentNode.insertBefore(newNode, existingNode.nextSibling);
}