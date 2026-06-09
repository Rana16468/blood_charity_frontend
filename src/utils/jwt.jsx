import { jwtDecode } from "jwt-decode";

export const decodedToken=(token)=>{

    const decoded = jwtDecode(token);
    return decoded
}