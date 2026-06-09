import { Outlet } from "react-router-dom";
import Navbar from "../Navbar/Navbar";


const Main = () => {
    return (
        <>
        <Navbar/>
      <Outlet />
      <h1>Footer</h1>
            
        </>
    );
};

export default Main;
