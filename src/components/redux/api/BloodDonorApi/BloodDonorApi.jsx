import { baseApi } from "../baseApi";

const BloodDonorApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    findMyNearestBloodDonor: builder.query({
      query: ({ selectedBlood, searchRadius, coords } = {}) => {
        console.log({ selectedBlood, searchRadius, coords });

        return {
          url: "/api/v1/blood_donor/find_my_nearest_blood_donor",
          method: "GET",
          params: {
            blood:  "B+",
            radius: 10,
            lat: 23.780546,
            lng: 90.407469
          },
        };
      },
    }),
  }),
});

export const { useFindMyNearestBloodDonorQuery } = BloodDonorApi;
export default BloodDonorApi;