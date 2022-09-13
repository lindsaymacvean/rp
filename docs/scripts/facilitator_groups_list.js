import { api_url } from "./utils/configs.js"
import { logout }  from "./utils/logout.js";
import { IsLoggedIn } from "./utils/isLoggedIn.js";

globalThis.logout = logout;

(function() {
    IsLoggedIn();

    axios.get(`${api_url}/group/facilitator`, {
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
            }
        })
        .then(resp => {
            console.log(resp);
            const map = {
                'Monday': 1,'Tuesday': 2,'Wednesday': 3,'Thursday': 4,'Friday': 5,'Saturday': 6,
                'Sunday': 7
            };
            resp.data.sort((a, b) => {
                let result = map[a.dayOfWeek] - map[b.dayOfWeek];
                if (result === 0)
                  result = getTimeAsNumberOfMinutes(a.time) - getTimeAsNumberOfMinutes(b.time);
                return  result;
            });
            // Do not display groups older than a 3 months
            resp.data = resp.data.filter((a) => {
                var dateOfSession = new Date(a.dateOfFirstSession);
                var todaysDate = new Date();
                var difference = todaysDate - dateOfSession;
                if (difference > 3 * 30 * 24 * 60 * 60 * 100) {
                    return false;
                } else {
                    return true;
                }
            });
            if (document.querySelector("#groupTemplate")) {
                var template = Handlebars.compile(document.querySelector("#groupTemplate").innerHTML);
                document.querySelector("#groupsList").innerHTML = template({ groups: resp.data });
            }
            return resp;
        });
})();

function getTimeAsNumberOfMinutes(time) {
    var timeParts = time.split(":");
    var timeInMinutes = (timeParts[0] * 60) + timeParts[1];
    return timeInMinutes;
}