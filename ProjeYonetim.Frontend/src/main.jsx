import ProjectDetailPage from './pages/ProjectDetailPage.jsx';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App.jsx'; 
import RegisterPage from './pages/RegisterPage.jsx';
import LoginPage from './pages/LoginPage.jsx'; 
import DashboardPage from './pages/DashboardPage.jsx';
import './index.css'; 


const router = createBrowserRouter([
  {
    path: '/', 
    element: <App />, 
    children: [

      { index: true, element: <DashboardPage /> },

 
      {
        path: '/login',
        element: <LoginPage /> 
      },
      {
        path: '/board/:id', 
        element: <ProjectDetailPage />
    },
    
      {
        path: '/register',
        element: <RegisterPage /> 
      }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} /> 
  </React.StrictMode>
);