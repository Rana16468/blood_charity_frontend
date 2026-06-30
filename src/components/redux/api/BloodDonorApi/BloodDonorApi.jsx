import { baseApi } from "../baseApi";

const BloodDonorApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    findMyNearestBloodDonor: builder.query({
      query: ({ lat, lng, blood, radius, page, limit } = {}) => {
       

        return {
          url: "/api/v1/blood_donor/find_my_nearest_blood_donor",
          method: "GET",
          params: {
            ...(blood   && { blood }),
            ...(radius  && { radius }),
            ...(lat     && { lat }),
            ...(lng     && { lng }),
            ...(page    && { page }),
            ...(limit   && { limit }),
          },
           
        };
      },
      providesTags:["blood_donor"]
    }),
    change_location: builder.mutation({
      query:(data)=>{

        return {
           url:"/api/v1/blood_donor/change_location",
        method: "PATCH",
        body: data
        }
      },
      invalidatesTags:["blood_donor"]

    }),
    find_my_current_location:builder.query({

      query:()=>{

        return {
          url:"/api/v1/blood_donor/find_my_current_location",
          method:"GET"
        }
      },
      providesTags:["blood_donor"]

    }),
    is_blood_donated: builder.mutation({
      query:(data)=>{

         return {
          url:`/api/v1/blood_donor/is_blood_donated/${data.id}`,
          method:"PATCH",
          body: data
         }
      },
      invalidatesTags:['blood_donor']


    }),
    findByTotalOverView:builder.query({
      query:()=>{
        return{
          url:"/api/v1/blood_donor/find_by_total_overview",
          method:"GET"
        }
      },
      providesTags:["blood_donor"]
    }),
    

  }),
});

export const { useFindMyNearestBloodDonorQuery, 
  useChange_locationMutation ,
   useFind_my_current_locationQuery,
  useIs_blood_donatedMutation,
useFindByTotalOverViewQuery} = BloodDonorApi;
export default BloodDonorApi;