import { api_url, frontend_url } from "./utils/configs.js"
import { logout }  from "./utils/logout.js";

globalThis.logout = logout;

(function() {

    globalThis.createNewSemester = function(e) {
        e.preventDefault();
        var form = document.forms.namedItem("newSemester");
        var formData = new FormData(form);

        var data = JSON.stringify(Object.fromEntries(formData));
        axios.post(`${api_url}/semester/create`, data, {
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
                }
            })
            .then(resp => {
                window.location.href = `${frontend_url}/home.html`;
            })

    }

})();