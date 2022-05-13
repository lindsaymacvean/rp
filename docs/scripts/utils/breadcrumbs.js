import { IsLeadFacilitator } from "./utils.js";


/**
 * 
 * @param {*} response - the response from /group?id=x
 * @returns response
 */

export const fillBreadcrumbs = function(response) {
    var template;

    // Fill in the semester breadcrumb
    if (document.querySelector('#semesterBreadcrumb')) {
      template = Handlebars.compile(document.querySelector("#semesterBreadcrumb").innerHTML);
      document.querySelector("#semesterBreadcrumb").outerHTML = template({ 
          semesterId: response.data.semester.id, semesterName: response.data.semester.name, IsLeadFacilitator
        });
    }
  
    // Fill in the Group breadcrumb
    if (document.querySelector("#groupBreadcrumb")) {
        template = Handlebars.compile(document.querySelector("#groupBreadcrumb").innerHTML);
        document.querySelector("#groupBreadcrumb").innerHTML = template({ groupId, groupName: response.data.name, IsLeadFacilitator });
    }

    // Special Case for the Group page if a facilitator
    if (document.querySelector("#homeButtonBreadcrumb")) {
        template = Handlebars.compile(document.querySelector("#homeButtonBreadcrumb").innerHTML);
        document.querySelector("#HomeButtonBreadcrumbReplace").outerHTML = template({
            IsLeadFacilitator
        });
    }
    return response;
}