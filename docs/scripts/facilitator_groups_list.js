import { api_url } from "./utils/configs.js"
import { logout }  from "./utils/logout.js";

globalThis.logout = logout;

(function() {

    axios.get(`${api_url}/group/facilitator`, {
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
            }
        })
        .then(resp => {
            const map = {
                'Monday': 1,'Tuesday': 2,'Wednesday': 3,'Thursday': 4,'Friday': 5,'Saturday': 6,
                'Sunday': 7
            };
            resp.data.Responses.group.sort((a, b) => {
                let result = map[a.dayOfWeek] - map[b.dayOfWeek];
                if (result === 0)
                  result = getTimeAsNumberOfMinutes(a.time) - getTimeAsNumberOfMinutes(b.time);
                return  result;
            });
            if (document.querySelector("#groupTemplate")) {
                var template = Handlebars.compile(document.querySelector("#groupTemplate").innerHTML);
                document.querySelector("#groupsList").innerHTML = template({ groups: resp.data.Responses.group });
            }
            return resp;
        });
})();

function getTimeAsNumberOfMinutes(time) {
    var timeParts = time.split(":");
    var timeInMinutes = (timeParts[0] * 60) + timeParts[1];
    return timeInMinutes;
}