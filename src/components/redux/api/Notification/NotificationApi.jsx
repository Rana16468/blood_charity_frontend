import { baseApi } from "../baseApi";


const NotificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    findMyAllNotification: builder.query({
      query: (data) => ({
        url: "/api/v1/notification/find_by_all_notification",
        method: "GET",
        params: data
        
      }),
      providesTags:["notification"]
    }), 
  }),
});

export const { useFindMyAllNotificationQuery} = NotificationApi;

export default NotificationApi;