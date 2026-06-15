import { createBrowserRouter } from "react-router-dom";
import Main from "../components/layout/Main";
import BloodCharity from "../components/Location/BloodCharity";
import Location from "../components/Location/Location";
import Login from "../components/Login/Login";
import MyProfile from "../components/pages/MyProfile";
import PrivateRoute from "./PrivateRoute";



const router = createBrowserRouter([
  {
    path: "/",
    element: <Main />,
    children: [
      {
        path: "/",
        element: <PrivateRoute>
          <BloodCharity/>,
        </PrivateRoute>   
      },
      {
        path:"/donate_blood",
        element:<Location/>
      },
      {
        path:"/login",
        element:<Login/>
      },
      {
        path:"/my_profile",
        element: <MyProfile/>
      }
 
    ],
  },
]);

export default router;