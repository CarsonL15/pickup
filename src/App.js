

import {createBrowserRouter, RouterProvider} from "react-router-dom";
import SplashScreen from "./Screens/SplashScreen";
import LoginScreen from "./Screens/LoginScreen";
import HomeScreen from "./Screens/HomeScreen";

const router = createBrowserRouter([ 
{path: "/", element: <SplashScreen />},
{path: "/LoginScreen", element:<LoginScreen /> },
{path: "/HomeScreen", element:<HomeScreen />}]);

function createSplashScreen(){

return(<RouterProvider router={router}/>);
}

export default createSplashScreen;

