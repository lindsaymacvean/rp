import { downloadFile } from "./downloadFile.js";

export const exportSemester = (el) => {
    el.preventDefault();
    downloadFile(api_url + '/semester/export?semesterid=' + semesterId, 'semester_export.csv');
}