

import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Toaster } from "react-hot-toast";
import router from "./router/router";
import { SocketProvider } from "./router/SocketProvider";
import BloodRequestNotifications from "./components/Location/notification/BloodRequestNotifications";

// import { useSocket } from "./hooks/useSocket";



function App() {
 const queryClient = new QueryClient();
//  const { socket, connected } = useSocket();


//   console.log("Socket:", socket);

//   console.log("Connected:", connected);

 

  return (
    <>

    


        <SocketProvider>
      <QueryClientProvider client={queryClient}>
        <BloodRequestNotifications />

        <RouterProvider router={router} />

        <Toaster
          position="top-center"
          toastOptions={{ duration: 1500 }}
        />
      </QueryClientProvider>
    </SocketProvider>


  
   


    
    </>
  )
}

export default App
