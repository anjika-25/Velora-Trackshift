import React from 'react';
import ReactDOM from 'react-dom/client';
import VeloraDashboard from './VeloraDashboard';
import './index.css';

// Create the root element and render VeloraDashboard
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <VeloraDashboard />
  </React.StrictMode>
);
