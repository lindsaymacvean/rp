export const processCounties = async function(stats) {
    var data = [['County', 'Number of Participants']];
    for (const [key, value] of Object.entries(stats.data.counties)) {
      data = data.concat([[key, value]]);
    }
    // This is not needed if we append a total table below
    //data = data.concat([['Total', stats.data.count]]);
    data.sort((a, b) => a[1] - b[1])
    return data;
}

export const processAttendance = async function (stats) {
    let data = [['Week', 'Attendance']];
    for (const [key, value] of Object.entries(stats.data.attendance)) {
      let percentage = (value / stats.data.count) * 100;
      //var percentage = (Math.round(percentage*100)/100).toFixed(2);
      data = data.concat([[key, percentage]]);
      data.sort();
    }
    return data;
}

export const processAbsence = async function (stats) {
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

export const displayAttendanceAverage = async (raw) => {
    document.getElementById('attendanceChart').style.visibility = "visible";
    const attendanceArray = Object.keys(raw.data.attendance)
      .map(function (key) {
        return Math.round((raw.data.attendance[key] / raw.data.count) * 100);
      });
    let average = attendanceArray.reduce((a, b) => a + b, 0) / attendanceArray.length;
    average = (Math.round(average * 100) / 100).toFixed(2);
    document.getElementById('averageattendance').innerHTML = "Average attendance is " + average + "%";
    document.getElementById('statsRing').outerHTML = "";
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

function insertAfter(newNode, existingNode) {
    existingNode.parentNode.insertBefore(newNode, existingNode.nextSibling);
}