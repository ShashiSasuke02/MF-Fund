import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import AmcList from './pages/AmcList';
import FundList from './pages/FundList';
import FundDetails from './pages/FundDetails';
import Register from './pages/Register';
import Login from './pages/Login';
import Portfolio from './pages/Portfolio';
import Invest from './pages/Invest';
import Calculator from './pages/Calculator';

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

// Public Only Route (redirect to portfolio if already logged in)
function PublicOnlyRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>;
  }
  
  return !isAuthenticated ? children : <Navigate to="/portfolio" replace />;
}

/**
 * Main App component with routing
 */
function App() {
  return (
    <AuthProvider>
      <Layout>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/browse" element={<AmcList />} />
          <Route path="/amc/:fundHouse" element={<FundList />} />
          <Route path="/fund/:schemeCode" element={<FundDetails />} />
          <Route path="/calculators" element={<Calculator />} />
          
          {/* Auth routes (public only) */}
          <Route path="/register" element={
            <PublicOnlyRoute>
              <Register />
            </PublicOnlyRoute>
          } />
          <Route path="/login" element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          } />
          
          {/* Protected routes */}
          <Route path="/portfolio" element={
            <ProtectedRoute>
              <Portfolio />
            </ProtectedRoute>
          } />
          <Route path="/invest" element={
            <ProtectedRoute>
              <Invest />
            </ProtectedRoute>
          } />
        </Routes>
      </Layout>
    </AuthProvider>
  );
}

export default App;
