import { api_url } from "./utils/configs.js";
import { IsLeadFacilitator } from "./utils/utils.js";

Handlebars.registerHelper('userId', function (aString) {
  return aString.replace(/it_/, '')
});

Handlebars.registerHelper('event', function (aString) {
  return aString.replace(/ev_/, '')
});

window.addEventListener('load', function() {
  
  const urlParams = new URLSearchParams(window.location.search);
  const groupId = urlParams.get('groupId');
  var groupInfo;
  var currentFacilitator;
  
  if (document.querySelector("#adapt_session_button")) {
    var adaptTemplate = Handlebars.compile(document.querySelector("#adapt_session_button").outerHTML);
    document.querySelector("#adapt_session_button").outerHTML = adaptTemplate({ groupId });
  }

  const getFacilitators = async () => {
    const { data } = await axios.get(`${api_url}/facilitator/list`, {
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
      }
    })
    return data.Items;
  }

  const getGroup = async () => {
    const data = await axios.get(`${api_url}/group?id=${groupId}`, {
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
      }
    })
    return data;
  }

  const getParticipants = async () => {
    const data = await axios.get(`${api_url}/participants?id=${groupId}`, {
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
      }
    })
    return data;
  }
  
  // Fill out students in the Group
  getGroup()
  .then(group => {
    if (document.querySelector("#group_info")) {
      if (IsLeadFacilitator()) currentFacilitator = group.data.facilitator;
      groupInfo = { 
        facilitatorName: group.data.facilitator.name, 
        semesterName: group.data.semester.name,
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
  // Fill in the semester breadcrumb
  .then(group => {
    if (document.querySelector('#semesterBreadcrumb')) {
      var template = Handlebars.compile(document.querySelector("#semesterBreadcrumb").innerHTML);
      document.querySelector("#semesterBreadcrumb").innerHTML = template({ semesterId: group.data.semester.id, semesterName: group.data.semester.name });
    }
    return group;
  })
  // Fill in the Group breadcrumb
  .then(group => {
    if (document.querySelector("#groupBreadcrumb")) {
      var template = Handlebars.compile(document.querySelector("#groupBreadcrumb").innerHTML);
      document.querySelector("#groupBreadcrumb").innerHTML = template({ groupId, groupName: group.data.name });
    }
    return group;
  })
  // Fill title on Group page
  .then(group => {
    if (document.querySelector("#groupName")) {
      var template = Handlebars.compile(document.querySelector("#groupName").innerHTML);
      document.querySelector("#groupName").innerHTML = template({ groupId, groupName: group.data.name });
    }
    return group;
  })
  // Fill out students list in the Group
  .then(() => getParticipants())
  .then(resp => {
    if (document.querySelector("#studentsListTemplate")) {
      var template = Handlebars.compile(document.querySelector("#studentsListTemplate").innerHTML);
      document.querySelector("#studentsList").innerHTML = template({ participants: resp.data.Items });
      
    }
  })
  .then(() => getFacilitators())
  .then(facilitators => {
    if (document.querySelector("#group_info")) {
      groupInfo.facilitators = facilitators;
      groupInfo.currentFacilitator = currentFacilitator
      groupInfo.LeadFacilitator = IsLeadFacilitator();
      var template = Handlebars.compile(document.querySelector("#group_info").innerHTML);
      document.querySelector("#group_info").innerHTML = template(groupInfo);
      if (IsLeadFacilitator()) document.querySelector("#facilitatorSelect").value = currentFacilitator.id;
    }
  });
  
  if (document.querySelector("#optionsTemplate")) {
    var optionsTemplate = Handlebars.compile(document.querySelector("#optionsTemplate").innerHTML);
    document.querySelector("#getOptions").outerHTML = optionsTemplate({ LeadFacilitator: IsLeadFacilitator() });
  }

  if (document.querySelector("#issue_calendar_invites")) {
    var optionsTemplate = Handlebars.compile(document.querySelector("#issue_calendar_invites").outerHTML);
    document.querySelector("#issue_calendar_invites").outerHTML = optionsTemplate({ LeadFacilitator: IsLeadFacilitator() });
  }
  
  globalThis.synchronise = function(e) {
    e.preventDefault();
    // Load Spinner
    
    axios.get(`${api_url}/group/synchronise?id=${groupId}`, {
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
      }
    })
    .then((response) => {
      console.log(response);
      //remove spinner
    });
  }

  globalThis.copyColumn = function(event, index, tableId) {
    event.preventDefault();
    var columnText = '';
    var rows = document.querySelector('#' + tableId + ' tbody').rows;
    for (var i = 0; i < rows.length; i++) {
      console.log(rows[i].cells[index-1].innerHTML);
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
      console.log('Fallback: Copying text command was ' + msg);
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
    }
  
    document.body.removeChild(textArea);
  }

  function copyTextToClipboard(text) {
    if (!navigator.clipboard) {
      fallbackCopyTextToClipboard(text);
      return;
    }
    navigator.clipboard.writeText(text).then(function() {
      console.log('Async: Copying to clipboard was successful!');
    }, function(err) {
      console.error('Async: Could not copy text: ', err);
    });
  }
  
});
