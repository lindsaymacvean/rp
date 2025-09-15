import { readable_cognito_logout_url } from "./configs.js";

export const IsLeadFacilitator = () => {
  try {
    let token = sessionStorage.getItem('id_token')
    if (!token) {
      console.error('No id_token found in sessionStorage for lead facilitator check');
      return false;
    }
    let jsonToken = parseJwt(token);
    if (!jsonToken || !jsonToken["cognito:groups"]) {
      console.error('Invalid token structure for lead facilitator check');
      return false;
    }
    return jsonToken["cognito:groups"].includes("LeadFacilitators");
  } catch (error) {
    console.error('Error checking lead facilitator status:', error);
    return false;
  }
}

export function Logout(e) {
    e.preventDefault();
    sessionStorage.removeItem('id_token');
    window.location.href = readable_cognito_logout_url;
}

export const CurrentUserEmail = () => {
  try {
    let token = sessionStorage.getItem('id_token')
    if (!token) {
      console.error('No id_token found in sessionStorage');
      return null;
    }
    let jsonToken = parseJwt(token);
    return jsonToken["email"];
  } catch (error) {
    console.error('Error parsing JWT token for email:', error);
    return null;
  }
}

export const CurrentUserName = () => {
  let token = sessionStorage.getItem('id_token')
  let jsonToken = parseJwt(token);
  return jsonToken["name"];
}

export const CurrentUserId = () => {
  let token = sessionStorage.getItem('id_token')
  let jsonToken = parseJwt(token);
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

export const registerHandlebarHelpers = () => { 
  
  Handlebars.registerHelper('userId', function (aString) {
    return aString.replace(/it_/, '')
  });
  
  Handlebars.registerHelper('event', function (aString) {
    return aString.replace(/ev_/, '')
  });

  Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
    return (arg1 === arg2) ? options.fn(this) : options.inverse(this);
  });
};