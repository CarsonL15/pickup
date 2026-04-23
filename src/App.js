import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import SplashScreen from './Screens/SplashScreen';
import LoginScreen from './Screens/LoginScreen';
import ProfileCreationScreen from './Screens/ProfileCreationScreen';
import HomeScreen from './Screens/HomeScreen';
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
]);

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
