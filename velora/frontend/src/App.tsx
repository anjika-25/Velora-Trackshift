 import React, { useEffect, useState } from 'react'
 import io from 'socket.io-client'
 import { RaceDashboard } from './components/RaceDashboard'

 const backend = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

 export function App() {
   const [connected, setConnected] = useState(false)

   useEffect(() => {
     const socket = io(backend)
     socket.on('connect', () => setConnected(true))
     socket.on('disconnect', () => setConnected(false))
     return () => socket.disconnect()
   }, [])

   return (
     <div style={{ color: 'white', background: '#0b1020', minHeight: '100vh' }}>
       <header style={{ padding: '12px 16px', borderBottom: '1px solid #223' }}>
         <h2>Velora Racing Simulator {connected ? '🟢' : '🔴'}</h2>
       </header>
       <RaceDashboard backend={backend} />
     </div>
   )
 }



