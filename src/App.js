import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import SplashScreen from './Screens/SplashScreen';
import LoginScreen from './Screens/LoginScreen';
import ProfileCreationScreen from './Screens/ProfileCreationScreen';
import HomeScreen from './Screens/HomeScreen';
import GameDetailsScreen from './Screens/GameDetailsScreen';
import ProfileScreen from './Screens/ProfileScreen';
import RatingScreen from './Screens/RatingScreen';
import ProtectedRoute from './components/ProtectedRoute';

const router = createBrowserRouter([
  { path: '/', element: <SplashScreen /> },
  { path: '/LoginScreen', element: <LoginScreen /> },
  { path: '/ProfileCreationScreen', element: <ProfileCreationScreen /> },
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
  {
    path: '/ProfileScreen',
    element: (
      <ProtectedRoute>
        <ProfileScreen />
      </ProtectedRoute>
    ),
  },
  {
    path: '/RatingScreen',
    element: (
      <ProtectedRoute>
        <RatingScreen />
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
