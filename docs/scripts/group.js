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
  
  // Fill out students in the Group
  getGroup()
  .then(resp => {
    if (document.querySelector("#group_info")) {
      currentFacilitator = resp.data.facilitator;
      groupInfo = { 
        facilitatorName: resp.data.facilitator.name, 
        semesterName: resp.data.semester.name,
        firstSession: resp.data.dateOfFirstSession,
        weekDay: resp.data.dayOfWeek,
        time: resp.data.time,
        themes: resp.data.themes,
        // Not currently using ticketTailorEventId
        ticketTailorEventId: resp.data.eventId
      }
    }
    return resp;            
  })
  // Fill in the semester breadcrumb
  .then(resp => {
    if (document.querySelector('#semesterBreadcrumb')) {
      var template = Handlebars.compile(document.querySelector("#semesterBreadcrumb").innerHTML);
      document.querySelector("#semesterBreadcrumb").innerHTML = template({ semesterId: resp.data.semester.id, semesterName: resp.data.semester.name });
    }
    return resp;
  })
  // Fill in the Group breadcrumb
  .then(resp => {
    if (document.querySelector("#groupBreadcrumb")) {
      var template = Handlebars.compile(document.querySelector("#groupBreadcrumb").innerHTML);
      document.querySelector("#groupBreadcrumb").innerHTML = template({ groupId, groupName: resp.data.name });
    }
    return resp;
  })
  // Fill title on Group page
  .then(resp => {
    if (document.querySelector("#groupName")) {
      var template = Handlebars.compile(document.querySelector("#groupName").innerHTML);
      document.querySelector("#groupName").innerHTML = template({ groupId, groupName: resp.data.name });
    }
    return resp;
  })
  // Fill out students list in the Group
  .then(resp => {
    if (document.querySelector("#studentsListTemplate")) {
      var template = Handlebars.compile(document.querySelector("#studentsListTemplate").innerHTML);
      document.querySelector("#studentsList").outerHTML = template({ participants: resp.data.participants });
    }
    return resp;            
  })
  .then(() => getFacilitators())
  .then(facilitators => {
    if (document.querySelector("#group_info")) {
      groupInfo.facilitators = facilitators;
      groupInfo.currentFacilitator = currentFacilitator
      groupInfo.LeadFacilitator = IsLeadFacilitator();
      var template = Handlebars.compile(document.querySelector("#group_info").innerHTML);
      document.querySelector("#group_info").innerHTML = template(groupInfo);
      document.querySelector("#facilitatorSelect").value = currentFacilitator.id;
    }
  });
  
  if (document.querySelector("#optionsTemplate")) {
    var optionsTemplate = Handlebars.compile(document.querySelector("#optionsTemplate").innerHTML);
    document.querySelector("#getOptions").outerHTML = optionsTemplate({ LeadFacilitator: IsLeadFacilitator() });
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
  
});