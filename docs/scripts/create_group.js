import { getTicketTailorEvents } from "./utils/ticketTailor.js";
import { frontend_url } from "./utils/configs.js"
import { createGroupFolder, initDrive, shareFileWithDomain, transferOwnership } from "./utils/drive.js"
import { Logout }  from "./utils/utils.js";
import { IsLoggedIn } from "./utils/isLoggedIn.js";
import { getSemester, saveFolderIdToGroup, postGroup, getFacilitatorList } from "./utils/api.js";

globalThis.logout = Logout;

(function () {
    IsLoggedIn();

    var facilitators = [];
    var ticketTailorEvents = [];

    getFacilitatorList()
    .then(resp => {
        facilitators = resp.data.Items.filter(facilitator => facilitator.facilitatorEnabled !== false);
        var template = Handlebars.compile(document.querySelector("#facilitatorId").outerHTML);
        document.querySelector("#facilitatorId").outerHTML = template({ facilitators });
    })

    getTicketTailorEvents()
        .then(resp => {
            var pattern = /^readable.*/i;
            for (var key in resp.data) {
                if (pattern.test(resp.data[key].name)) {
                    ticketTailorEvents.push(resp.data[key]);
                }
            }
            // Fill list of events
            var template = Handlebars.compile(document.querySelector("#eventId").outerHTML);
            document.querySelector("#eventId").outerHTML = template({ ticketTailorEvents });

            // Name
            document.getElementById("name").value = ticketTailorEvents[0].name; 

            // Themes
            var theme_pattern = /.*- (.*)/g;
            var theme_name = theme_pattern.exec(ticketTailorEvents[0].name);
            document.getElementById("themes").value = theme_name[1];

            // Student Year
            var class_pattern = /.*\((.*)\).*/g;
            var class_name = class_pattern.exec(ticketTailorEvents[0].name);
            document.getElementById("studentYear").value = class_name[1];

            // Time
            document.getElementById("time").value = ticketTailorEvents[0].start.time;

            // Day of the Week
            var weekday = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
            var dateObj = new Date(ticketTailorEvents[0].start.iso);
            var day_of_the_week = weekday[dateObj.getDay()];
            document.getElementById("dayOfWeek").value = day_of_the_week;


            // Start Date
            document.getElementById("dateOfFirstSession").value = ticketTailorEvents[0].start.date;

        })

    globalThis.onTicketTailorEventChange = (ev, el) => {
        // Name should look like: 'Readable (1st & 2nd Year) - JUNIOR CERT NOVELS'

        // Name
        document.getElementById("name").value = ticketTailorEvents[ev.selectedIndex].name; 

        // Themes
        var theme_pattern = /.*- (.*)/g;
        var theme_name = theme_pattern.exec(ticketTailorEvents[ev.selectedIndex].name);
        document.getElementById("themes").value = theme_name[1];

        // Student Year
        var class_pattern = /.*\((.*)\).*/g;
        var class_name = class_pattern.exec(ticketTailorEvents[ev.selectedIndex].name);
        document.getElementById("studentYear").value = class_name[1];

        // Time
        document.getElementById("time").value = ticketTailorEvents[ev.selectedIndex].start.time;

        // Day of the Week
        var weekday = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
        var dateObj = new Date(ticketTailorEvents[ev.selectedIndex].start.iso);
        var day_of_the_week = weekday[dateObj.getDay()];
        document.getElementById("dayOfWeek").value = day_of_the_week;


        // Start Date
        document.getElementById("dateOfFirstSession").value = ticketTailorEvents[ev.selectedIndex].start.date;
    }

    globalThis.createNewGroup = function (e) {
        var form = document.forms.namedItem("newGroup");

        if (form.checkValidity())
            e.preventDefault();
        else
            return true;

        const urlParams = new URLSearchParams(window.location.search);
        const semesterId = urlParams.get('semesterId');

        form.checkValidity();

        var formData = new FormData(form);

        var groupData = Object.fromEntries(formData);

        groupData.semesterId = semesterId;

        const facilitatorEmailSelect = document.getElementById("facilitatorId");
        var facilitatorEmail= facilitatorEmailSelect.options[facilitatorEmailSelect.selectedIndex].text;

        var spinner = '<div style="text-align:center;"><div class="lds-dual-ring"></div><br /><strong>Importing Participants from Ticket Tailor</strong></div>';
        document.getElementsByTagName('body')[0].innerHTML = spinner; 


        postGroup(groupData)
        .then((groupResponse) => {
            initDrive()
                .then(() => getSemester(groupData.semesterId))
                .then((semesterResponse) => createGroupFolder(semesterResponse.data.name, groupData.name, groupData.themes, groupData.studentYear, groupData.facilitatorId, groupData.year, facilitatorEmail))
                .then((parentFolderId) => {
                    saveFolderIdToGroup(parentFolderId, groupResponse.data);
                    return parentFolderId;
                } )
                .then((parentFolderId) => shareFileWithDomain(parentFolderId))
                .then((parentFolderId) => transferOwnership(parentFolderId, 'readableproject@dyslexia.ie'))
                .then(() => window.location.href = `${frontend_url}/semester.html?semesterId=${semesterId}`);
        });
    }
})();