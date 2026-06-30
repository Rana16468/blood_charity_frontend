import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getBaseUrl } from "../config/envConfig";

export const baseApi = createApi({
  reducerPath: "baseApi",
  baseQuery: fetchBaseQuery({
    baseUrl: getBaseUrl(),
    headers: {
      Authorization: localStorage.getItem(`${import.meta.env.VITE_TOKEN_NAME}`),
    },
  }),
  endpoints: () => ({}),
  tagTypes: ["user", "blood_request", "blood_donor", "notification"],
});
