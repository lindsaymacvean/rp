import { api_url } from "./utils/configs.js"

(function() {

    const urlParams = new URLSearchParams(window.location.search);
    const groupId = urlParams.get('groupId');

    var template = Handlebars.compile(document.querySelector("#addapt_session_button").outerHTML);
    document.querySelector("#addapt_session_button").outerHTML = template({ groupId });

    axios.get(`${api_url}/group?id=${groupId}`, {
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
            }
        })
        .then(resp => {
            var data = resp.data;
            var template = Handlebars.compile(document.querySelector("#p_student_list").outerHTML);
            document.querySelector("#p_student_list").outerHTML = template({ facilitatorName: resp.data.facilitator.name, semesterName: resp.data.semester.name });

        })
})();