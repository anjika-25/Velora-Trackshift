import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { LoadingIntro } from './components/LoadingIntro';
import { TrackSelection } from './components/TrackSelection';
import { TrackName } from './types/models';
import { Socket } from 'socket.io-client';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import VeloraDashboard from './components/VeloraDashboard.jsx';

// Backend URL configuration
const backend = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export function App(): JSX.Element {
  // Connection state
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // App flow state
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    let socket: Socket | null = null;
    let connectionTimeout: NodeJS.Timeout | null = null;
    let isConnected = false;
    
    const connectSocket = () => {
      try {
        socket = io(backend, {
          reconnectionAttempts: 5,
          reconnectionDelay: 2000,
          reconnectionDelayMax: 5000,
          timeout: 5000,
          transports: ['polling', 'websocket'], // Try polling first, then websocket
          path: '/socket.io/',
          forceNew: true,
          autoConnect: true
        });
        
        // Set a timeout to allow proceeding without connection after 8 seconds
        connectionTimeout = setTimeout(() => {
          if (!isConnected) {
            console.warn('Backend not available, proceeding in limited mode');
            setConnected(true); // Allow app to proceed
            setError('Backend server not available - running in limited mode');
          }
        }, 8000);
        
        socket.on('connect', () => {
          console.log('Socket connected');
          isConnected = true;
          if (connectionTimeout) {
            clearTimeout(connectionTimeout);
            connectionTimeout = null;
          }
          setConnected(true);
          setError(null);
        });

        socket.on('connect_error', (err) => {
          console.error('Socket connection error:', err);
          // Don't block the app, just log the error
          // The timeout will allow proceeding if connection fails
        });

        socket.on('disconnect', (reason) => {
          console.log('Socket disconnected:', reason);
          isConnected = false;
          if (reason === 'io server disconnect') {
            socket?.connect();
          }
        });
      } catch (err) {
        console.error('Socket initialization error:', err);
        setError('Backend server not available - running in limited mode');
        setConnected(true); // Allow app to proceed
      }
    };
    
    connectSocket();
    
    return () => { 
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
      }
      if (socket) {
        socket.disconnect(); 
      }
    };
  }, []);

  const handleIntroComplete = () => {
    setShowIntro(false);
  };

  const handleTrackSelect = (trackName: TrackName) => {
    // Track selected - stay on track selection to allow selecting another track
    console.log('Selected track:', trackName);
  };

  if (!connected) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0b1020]">
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-4">
            VELORA Race Simulator
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            {error ? (
              <>
                {error}
                <br />
                <span className="text-sm text-gray-500 mt-2 block">
                  Make sure the backend server is running on port 8000
                </span>
              </>
            ) : (
              'Connecting to race server...'
            )}
          </p>
          <div className="w-16 h-16 border-4 border-t-red-600 border-r-red-600 border-b-transparent border-l-transparent rounded-full animate-spin mx-auto"></div>
          {error && (
            <button
              className="mt-8 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              onClick={() => {
                setError(null);
                window.location.reload();
              }}
            >
              Retry Connection
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen text-white bg-[#0b1020]">
        {showIntro && <LoadingIntro onComplete={handleIntroComplete} />}
        
        {!showIntro && (
          <Routes>
            <Route path="/" element={<TrackSelection onSelectTrack={handleTrackSelect} />} />
            <Route path="/dashboard/:trackName" element={<VeloraDashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </div>
    </Router>
  );
}