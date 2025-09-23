import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import CommunitySection from './components/CommunitySection';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import ErrorBoundary from './components/ErrorBoundary';
import AdminDiagnostics from './components/AdminDiagnostics';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './components/NotificationSystem';
import { useAuth } from './hooks/useAuth';

function App() {
  const { loading: authLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // Show diagnostics in development or when there are auth issues
  const shouldShowDiagnostics = process.env.NODE_ENV === 'development' || showDiagnostics;
  
  if (authLoading) {
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading IHD Deals...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  const handleCloseAuthModal = () => {
    setShowAuthModal(false);
  };

  const handleOpenAuthModal = () => {
    setShowAuthModal(true);
  };

  const handleAuthRequired = () => {
    if (!showAuthModal) {
      setShowAuthModal(true);
      </div>
    );
  }

  return (
    <ThemeProvider>
      <NotificationProvider>
        <ErrorBoundary>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            {/* Development/Debug Tools */}
            {process.env.NODE_ENV === 'development' && (
              <div className="fixed top-4 left-4 z-50">
                <button
                  onClick={() => setShowDiagnostics(!showDiagnostics)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm font-medium"
                >
                  {showDiagnostics ? 'Hide' : 'Show'} Diagnostics
                </button>
              </div>
            )}
            
            {showDiagnostics && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-40 overflow-y-auto">
                <div className="min-h-screen py-8">
                  <div className="max-w-7xl mx-auto px-4">
                    <div className="flex justify-end mb-4">
                      <button
                        onClick={() => setShowDiagnostics(false)}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
                      >
                        Close Diagnostics
                      </button>
                    </div>
                    <AdminDiagnostics />
                  </div>
                </div>
              </div>
            )}
            
            <Header onAuthClick={handleOpenAuthModal} />
            <CommunitySection onAuthRequired={handleAuthRequired} />
            <Footer />
            
            {showAuthModal && (
              <AuthModal onClose={handleCloseAuthModal} />
            )}
          </div>
        </ErrorBoundary>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;