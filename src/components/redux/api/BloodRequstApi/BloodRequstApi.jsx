import { baseApi } from "../baseApi";

const BloodRequestApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    findMyNearestBloodRequest: builder.query({
      query: ({ selectedBlood, searchRadius, coords }) => ({
        url: "/api/v1/blood_request/find_my_location_nearest_blood_request",
        method: "GET",
        params:{
            blood: selectedBlood,
            radius: searchRadius,
            lat: coords.lat,
            lng: coords.lng,
          }
      }),
      providesTags:["blood_request"]
    }),
  }),
});

export const { useFindMyNearestBloodRequestQuery } = BloodRequestApi;

export default BloodRequestApi;