import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Loader from './Loader';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated) return;

    // 1. Get current landing page preference (or system default)
    const landingTheme = localStorage.getItem('trackom-theme') || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

    // 2. Set dashboard theme (default to dark if not set)
    let dashboardTheme = localStorage.getItem('trackom-dashboard-theme');
    if (!dashboardTheme) {
      dashboardTheme = 'dark';
      localStorage.setItem('trackom-dashboard-theme', 'dark');
    }

    // Apply dashboard theme
    const html = document.documentElement;
    if (dashboardTheme === 'dark') {
      html.classList.add('dark');
      html.classList.remove('light');
      html.style.colorScheme = 'dark';
    } else {
      html.classList.remove('dark');
      html.classList.add('light');
      html.style.colorScheme = 'light';
    }

    return () => {
      // Restore landing page theme when leaving protected routes
      const currentLandingTheme = localStorage.getItem('trackom-theme') || landingTheme;
      if (currentLandingTheme === 'dark') {
        html.classList.add('dark');
        html.classList.remove('light');
        html.style.colorScheme = 'dark';
      } else {
        html.classList.remove('dark');
        html.classList.add('light');
        html.style.colorScheme = 'light';
      }
    };
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F3F4FD] dark:bg-surface-dark">
        <Loader size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}
