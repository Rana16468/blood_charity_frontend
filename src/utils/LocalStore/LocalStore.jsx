// utils/localStorage.js

export const setLocalStorage = (key, token) => {
  if (!key || typeof window === "undefined") {
    return "";
  }

  localStorage.setItem(key, token);
  window.dispatchEvent(new Event("auth_change"));
};

export const getFromLocalStorage = (key) => {
  if (!key || typeof window === "undefined") {
    return "";
  }

  return localStorage.getItem(key);
};

export const removeFromLocalStorage = (key) => {
  if (!key || typeof window === "undefined") {
    return "";
  }

  localStorage.removeItem(key);
  window.dispatchEvent(new Event("auth_change"));
};

export const  isLoginDonor=()=>{
return localStorage.getItem(import.meta.env.VITE_TOKEN_NAME)?true: false;

}