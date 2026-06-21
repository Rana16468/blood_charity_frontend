import { baseApi } from "../baseApi";

const BloodDonorApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    findMyNearestBloodDonor: builder.query({
      query: ({ lat, lng, blood, radius } = {}) => {
        console.log("blood request", { lat, lng, blood, radius });

        return {
          url: "/api/v1/blood_donor/find_my_nearest_blood_donor",
          method: "GET",
          params: {
            ...(blood   && { blood }),
            ...(radius  && { radius }),
            ...(lat     && { lat }),
            ...(lng     && { lng }),
          },
        };
      },
    }),
  }),
});

export const { useFindMyNearestBloodDonorQuery } = BloodDonorApi;
export default BloodDonorApi;