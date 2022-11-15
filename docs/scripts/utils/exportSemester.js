import { downloadFile } from "./downloadFile.js";
import { api_url } from "./configs.js";

export const exportSemester = (el) => {
    el.preventDefault();
    let semesterId = el.target.dataset.name;
    downloadFile(api_url + '/semester/export?semesterid=' + semesterId, 'semester_export.csv');
}