export const IsLeadFacilitator = () => {
    let token = sessionStorage.getItem('id_token')
    let jsonToken = parseJwt(token);
    return jsonToken["cognito:groups"].includes("LeadFacilitators");
}

export const CurrentUserEmail = () => {
    let token = sessionStorage.getItem('id_token')
    let jsonToken = parseJwt(token);
    console.log(jsonToken["email"]);
    return jsonToken["email"];
}

export const CurrentUserName = () => {
    let token = sessionStorage.getItem('id_token')
    let jsonToken = parseJwt(token);
    console.log(jsonToken["name"]);
    return jsonToken["name"];
}

export const CurrentUserId = () => {
    let token = sessionStorage.getItem('id_token')
    let jsonToken = parseJwt(token);
    console.log(jsonToken["sub"]);
    return jsonToken["sub"];
}

export const parseJwt  = (token) => {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
};