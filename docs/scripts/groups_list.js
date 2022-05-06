import { getSemester } from "./utils/api.js";
import { api_url } from "./utils/configs.js"

(function() {

    const urlParams = new URLSearchParams(window.location.search);
    const semesterId = urlParams.get('semesterId');

    var template = Handlebars.compile(document.querySelector("#groups-btn").innerHTML);
    document.querySelector("#groups-btn").innerHTML = template({ semesterId });

    axios.get(`${api_url}/group/semester?semesterId=${semesterId}`, {
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
            }
        })
        .then(resp => {
            if (document.querySelector("#groupTemplate")) {
                var template = Handlebars.compile(document.querySelector("#groupTemplate").innerHTML);
                document.querySelector("#groupsList").innerHTML = template({ groups: resp.data });
            }
            return resp;
        });

        getSemester(semesterId)
            .then(resp => {
                if (document.querySelector('#semesterBreadcrumb')) {
                    var template = Handlebars.compile(document.querySelector("#semesterBreadcrumb").innerHTML);
                    document.querySelector("#semesterBreadcrumb").innerHTML = template({ semesterId: resp.data.id, semesterName: resp.data.name });
                }
                return resp;
            });
})();