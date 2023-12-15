import 'bootstrap/dist/css/bootstrap.css';
// Put any other imports below so that CSS from your
// components takes precedence over default styles.

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';  
import App from './App.tsx'
import UploadApp from './UploadApp.tsx';  
import './index.css'
import axios from 'axios';  
  
// Replace with your API base URL
// 
axios.defaults.baseURL = 'http://localhost:8080'; 

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>  
      <Routes>  
        <Route path="/upload/:prefix" element={<UploadApp />} />  
        <Route path="*" element={<App />} />  
      </Routes>  
    </Router>    
  </React.StrictMode>,
)
