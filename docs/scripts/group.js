import { api_url, frontend_url} from "./utils/configs.js";
import { IsLeadFacilitator, registerHandlebarHelpers, Logout, CurrentUserEmail } from "./utils/utils.js";
import { fillBreadcrumbs } from "./utils/breadcrumbs.js";
import { IsLoggedIn } from "./utils/isLoggedIn.js";
import { google_client_id } from "./utils/configs.js";
import { getFacilitators, getGroup, getParticipants } from "./utils/api.js";

Date.prototype.addHours = function(h) {
  this.setTime(this.getTime() + (h*60*60*1000));
  return this;
}

globalThis.logout = Logout;

window.addEventListener('load', function() {
  IsLoggedIn();
  registerHandlebarHelpers();
  
  const urlParams = new URLSearchParams(window.location.search);
  const groupId = urlParams.get('groupId');
  let groupInfo;
  let currentFacilitator;
  let semesterId;
  let participants;
  let emails;
  let group;
  
  if (document.querySelector("#adapt_session_button")) {
    var adaptTemplate = Handlebars.compile(document.querySelector("#adapt_session_button").outerHTML);
    document.querySelector("#adapt_session_button").outerHTML = adaptTemplate({ groupId });
  }

  // Fill out students in the Group
  getGroup(groupId)
  .then(group => {
    if (group instanceof Error) {
        return group;
    };
    currentFacilitator = group.data.facilitator;
    semesterId = group.data.semester.id;
    if (document.querySelector("#group_info")) {
      groupInfo = { 
        facilitatorName: group.data.facilitator.name, 
        semesterName: group.data.semester.name,
        studentYear: group.data.studentYear,
        firstSession: group.data.dateOfFirstSession,
        weekDay: group.data.dayOfWeek,
        time: group.data.time,
        themes: group.data.themes,
        // Not currently using ticketTailorEventId
        ticketTailorEventId: group.data.eventId
      }
    }
    return group;            
  })
  .then((group) => {
    if (group instanceof Error) {
      return group;
    };
    return fillBreadcrumbs(group);
  })
  // Fill title on Group page
  .then(group => {
    if (group instanceof Error) {
      console.log(group);
      return group;
    };
    if (document.querySelector("#groupName")) {
      var template = Handlebars.compile(document.querySelector("#groupName").innerHTML);
      document.querySelector("#groupName").innerHTML = template({ groupId, groupName: group.data.name });
    }
    return group;
  })
  // Fill out students list in the Group
  .then(() => getParticipants(groupId))
  .then(resp => {
    if (resp instanceof Error) {
      console.log(resp);
      return resp;
    };
    if (document.querySelector("#studentsListTemplate")) {
      participants = resp.data.Items.map(r => {
        if (r.attend)
          r.attend = r.attend[r.groupId];
        return r;
      })
      emails = participants.map(function(value) {
        return {'email': value.email};
      });
      var template = Handlebars.compile(document.querySelector("#studentsListTemplate").innerHTML);
      document.querySelector("#studentsList").innerHTML = template({ participants });
    }
  })
  .then(() => getFacilitators())
  .then(facilitators => {
    if (facilitators instanceof Error) {
      console.log(facilitators);
      return facilitators;
    };
    if (document.querySelector("#group_info")) {
      groupInfo.facilitators = facilitators;
      groupInfo.currentFacilitator = currentFacilitator;
      groupInfo.LeadFacilitator = IsLeadFacilitator();
      var template = Handlebars.compile(document.querySelector("#group_info").innerHTML);
      document.querySelector("#group_info_replace").outerHTML = template(groupInfo);
      var time = new Date(groupInfo.firstSession+'T'+groupInfo.time+':00');
    }
  })
  .then(() => {
    if (typeof currentFacilitator === 'undefined' || currentFacilitator === null) return;
    if (IsLeadFacilitator() && document.querySelector("#facilitatorSelect")) document.querySelector("#facilitatorSelect").value = currentFacilitator.id;
  });
  
  if (document.querySelector("#optionsTemplate")) {
    var optionsTemplate = Handlebars.compile(document.querySelector("#optionsTemplate").innerHTML);
    document.querySelector("#getOptions").outerHTML = optionsTemplate({ LeadFacilitator: IsLeadFacilitator() });
  }

  if (document.querySelector("#issue_calendar_invites")) {
    var calendarTemplate = Handlebars.compile(document.querySelector("#issue_calendar_invites").outerHTML);
    document.querySelector("#issue_calendar_invites").outerHTML = calendarTemplate({ LeadFacilitator: IsLeadFacilitator() });
  }
  
  globalThis.synchronise = function(e) {
    e.preventDefault();
    // Load Spinner
    var spinner = '<div style="text-align:center;"><div class="lds-dual-ring"></div><br /><strong>Importing Participants from Ticket Tailor</strong></div>';
    document.getElementsByTagName('body')[0].innerHTML = spinner;
    
    axios.get(`${api_url}/group/synchronise?id=${groupId}`, {
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
      }
    })
    .then((response) => {
      //remove spinner
      window.location.reload();
    });
  }

  globalThis.changeFacilitator = function(ev, el) {
    var data = {};
    data.id = groupId;
    data.facilitatorId = ev.value;
    // Update facilitator on the Backend
    axios.put(`${api_url}/group/facilitator`, data, {
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
      }
    })
    .then((response) => {
          var myModal = new bootstrap.Modal(document.getElementById("updatedConfirmation"), {});
          myModal.show();
    })
    .catch(function(error) {
          alert('Facilitator was not updated, possibly because of a network connection error.')
    });
  }

  function changeColor(e, participantId, weekId) {
    var target = e.target || e.srcElement;
    var reason = document.getElementById(`${weekId}_${participantId}_reason`);
    if (target.id === `${weekId}_${participantId}_tick`) {
      var cross = document.getElementById(`${weekId}_${participantId}_cross`);
      if (target.style.color === "grey") {
        target.style.color = 'green';
        cross.style.color = 'grey';
        reason.style.display = 'none';
      } else {
        target.style.color = 'grey';
      }
    } 
    else if (target.id === `${weekId}_${participantId}_cross`) {
      var tick = document.getElementById(`${weekId}_${participantId}_tick`);
      if (target.style.color === "grey") {
        target.style.color = 'red';
        tick.style.color = 'grey';
        reason.style.display = '';
      } else {
        target.style.color = 'grey';
      }
    }
  }

  globalThis.checkAttendee = function(e, participantId, groupId, weekId) {
    // Event is either triggered by tick, cross, or reason dropdown
    e.preventDefault();
    e = e || window.event;
    changeColor(e, participantId, weekId);
    var target = e.target || e.srcElement;
    var tick = `${weekId}_${participantId}_tick`;
    var cross = `${weekId}_${participantId}_cross`;
    var reason = `${weekId}_${participantId}_reason`;
    var present;

    // If event id is tick then present = true, if cross then present = false
    if (target.id === tick) {
      present = true;
    } 
    else if (target.id === cross) {
      present = false;
    }
    else if (target.id === reason) {
      present = false;
    } else {
      return;
    }

    // If present = false then get reason else reason = "";
    if (!present) {
      reason = document.getElementById(reason).value;
    } else {
      reason = "";
    }

    var data = {participantId, groupId, weekId, present, reason};

    axios.post(`${api_url}/participant/attend`, data, {
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
      }
    })
    .then((response) => {
    })
    .catch(error => {
      alert('The Attendance was not updated, possibly because of a network connection issue. Try exiting and reopening this window and see if it helps.')
    });
  }

  globalThis.copyColumn = function(event, index, tableId) {
    event.preventDefault();
    var columnText = '';
    var rows = document.querySelector('#' + tableId + ' tbody').rows;
    for (var i = 0; i < rows.length; i++) {
      columnText = columnText.concat(' ' + rows[i].cells[index-1].innerHTML);
    }

    copyTextToClipboard(columnText);
    alert('Successfully copied. Try opening an email and paste into the BCC.');
  }

  function fallbackCopyTextToClipboard(text) {
    var textArea = document.createElement("textarea");
    textArea.value = text;
    
    // Avoid scrolling to bottom
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
  
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
  
    try {
      var successful = document.execCommand('copy');
      var msg = successful ? 'successful' : 'unsuccessful';
    } catch (err) {
    }
  
    document.body.removeChild(textArea);
  }

  function copyTextToClipboard(text) {
    if (!navigator.clipboard) {
      fallbackCopyTextToClipboard(text);
      return;
    }
    navigator.clipboard.writeText(text).then(function() {
    }, function(err) {
    });
  }

  globalThis.deleteGroup = () => {
    document.getElementById('overlay').style.display = 'block';
    axios.delete(`${api_url}/group`, {
      data: {
        groupId
      },
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
      }
    })
    .then((response) => {
      console.log(response);
      // Load success or failure modal
      document.getElementById('overlay').style.display = 'none';
      alert('Group has been deleted');
    })
    .then(() => {
      // Load semester page
      window.location.replace(`${frontend_url}/semester.html?semesterId=${semesterId}`)
    })
    .catch((error)=> {
      console.log(error);
      document.getElementById('overlay').style.display = 'none';
      alert(error)
    })
  }
});
