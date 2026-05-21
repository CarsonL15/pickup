import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import SplashScreen from './Screens/SplashScreen';
import LoginScreen from './Screens/LoginScreen';
import SignUpScreen from './Screens/SignUpScreen';
import HomeScreen from './Screens/HomeScreen';
import GameDetailsScreen from './Screens/GameDetailsScreen';
import ProtectedRoute from './components/ProtectedRoute';

const router = createBrowserRouter([
  { path: '/', element: <SplashScreen /> },
  { path: '/LoginScreen', element: <LoginScreen /> },
  { path: '/SignUpScreen', element: <SignUpScreen /> },
  {
    path: '/HomeScreen',
    element: (
      <ProtectedRoute>
        <HomeScreen />
      </ProtectedRoute>
    ),
  },
  {
    path: '/GameDetailsScreen',
    element: (
      <ProtectedRoute>
        <GameDetailsScreen />
      </ProtectedRoute>
    ),
  },
]);

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
