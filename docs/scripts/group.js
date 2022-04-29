import { api_url } from "./utils/configs.js"

(function() {

    const urlParams = new URLSearchParams(window.location.search);
    const groupId = urlParams.get('groupId');

    if (document.querySelector("#adapt_session_button")) {
        var template = Handlebars.compile(document.querySelector("#adapt_session_button").outerHTML);
        document.querySelector("#adapt_session_button").outerHTML = template({ groupId });
    }

    axios.get(`${api_url}/group?id=${groupId}`, {
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
            }
        })
        // Fill out students in the Group
        .then(resp => {
            if (document.querySelector("#p_student_list")) {
                var template = Handlebars.compile(document.querySelector("#p_student_list").outerHTML);
                document.querySelector("#p_student_list").outerHTML = template({ facilitatorName: resp.data.facilitator.name, semesterName: resp.data.semester.name });
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
})();