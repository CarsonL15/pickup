import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LandingPage from './Screens/LandingPage';
import LoginScreen from './Screens/LoginScreen';
import ProfileCreationScreen from './Screens/ProfileCreationScreen';
import HomeScreen from './Screens/HomeScreen';
import FindingGameScreen from './Screens/FindingGameScreen';
import GameDetailsScreen from './Screens/GameDetailsScreen';
import ProfileScreen from './Screens/ProfileScreen';
import RatingScreen from './Screens/RatingScreen';
import ProtectedRoute from './components/ProtectedRoute';
import PartyInviteListener from './components/PartyInviteListener';

// Root layout: renders the active route plus the app-wide party-invite popup,
// so an incoming party invite can appear on any screen.
function RootLayout() {
  return (
    <>
      <PartyInviteListener />
      <Outlet />
    </>
  );
}

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
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
        path: '/FindingGameScreen',
        element: (
          <ProtectedRoute>
            <FindingGameScreen />
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
    ],
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
