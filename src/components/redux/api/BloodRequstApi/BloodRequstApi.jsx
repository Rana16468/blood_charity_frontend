import { baseApi } from "../baseApi";

const BloodRequestApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    findMyNearestBloodRequest: builder.query({
      query: ({ selectedBlood, searchRadius, coords }) => ({
        url: "/api/v1/blood_request/find_my_location_nearest_blood_request",
        method: "GET",
        headers:{
          Authorization: localStorage.getItem(`${import.meta.env.VITE_TOKEN_NAME}`)
    
        },
        params:{
            blood: selectedBlood,
            radius: searchRadius,
            lat: coords.lat,
            lng: coords.lng,
          }
      }),
      providesTags:["blood_request"]
    }),

    findMyBloodRequstHistory: builder.query({
      query:(data)=>{
        return {
          url:"/api/v1/blood_request/find_my_blood_requst_history",
           method: "GET",
           params:data
        }
      },
       providesTags:["blood_request"]

    }),
    isDonorFind: builder.mutation({
      query:(data)=>{
        

          return{
            url:`/api/v1/blood_request/is_donor_find/${data.id}`,
            method:"PATCH",
            body:{
              isDonorFind: data.isDonorFind
            }
          }
      }, 
      invalidatesTags:["blood_request"]

    }),
    deleteBloodRequest: builder.mutation({
      query:(data)=>{
         return {
          url:`/api/v1/blood_request/delete_blood_request/${data.id}`,
           method: "DELETE",
         }
      },
      invalidatesTags:["blood_request"]
    })
    
  }),
});

export const { useFindMyNearestBloodRequestQuery,
  useFindMyBloodRequstHistoryQuery, useIsDonorFindMutation,
 useDeleteBloodRequestMutation } = BloodRequestApi;

export default BloodRequestApi;