import React, { useState } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { getLocalStorage } from './utils';
import Headers from './comom/Header';
import Siderbar from './comom/Siderbar';
import PageContent from './comom/Content';
import LoginPage from './pages/Login';
import F1History from './pages/F1History';
import ContentFarm from './pages/ContentFarm';
import NewsList from './pages/NewsList';


function App() {
  const location = useLocation();
  const token = getLocalStorage('token');

  if (location.pathname === "/login") {
    if (token) {
      return <Navigate to="/" replace />;
    }
    return <LoginPage />;
  }

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }


  return (
    <div className="App">
      <Headers />
      <Siderbar />
      <PageContent>
        <Routes>
          <Route path="/" element={<ContentFarm />} />
          <Route path="/contentFarm" element={<ContentFarm />} />
          <Route path="/newsList" element={<NewsList />} />
          <Route path="/f1History" element={<F1History />} />
        </Routes>
      </PageContent>
    </div>
  );
}

export default App; 