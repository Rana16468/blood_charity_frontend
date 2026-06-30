import { createBrowserRouter } from "react-router-dom";
import Main from "../components/layout/Main";
import BloodCharity from "../components/Location/BloodCharity";
import Location from "../components/Location/Location";
import Login from "../components/Login/Login";
import MyProfile from "../components/pages/MyProfile";
import PrivateRoute from "./PrivateRoute";
import MyLocation from "../components/Location/my_location/MyLocation";
import DonationHistory from "../components/Location/donation_history/DonationHistory";
import About from "../components/About/About";



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
        element:<PrivateRoute>
          <Location/>
        </PrivateRoute>
      },
      {
        path:"/login",
        element:<Login/>
      },
      {
        path:"/my_profile",
        element: <PrivateRoute>
          <MyProfile/>
        </PrivateRoute>
      },
      {
        path:"/my_location",
        element:<PrivateRoute>
          <MyLocation/>
        </PrivateRoute>

      },
      {
        path:"/donation_history",
        element:<PrivateRoute>
          <DonationHistory/>
        </PrivateRoute>
      },
      {
        path:"/about",
        element:<About/>
      }
 
    ],
  },
]);

export default router;