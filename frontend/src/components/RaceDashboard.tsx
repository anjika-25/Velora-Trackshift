 import React, { useEffect, useState } from 'react'
 import { TelemetryCharts } from './TelemetryCharts'
 import { TrackView } from './TrackView'
import { defaultTrack } from '../utils/defaultData'
import { Track, Car, Race } from '../types/models'

type Props = { 
  backend: string;
}

 export function RaceDashboard({ backend }: Props) {
  const [race, setRace] = useState<Race>({
    id: 'default',
    laps: 10,
    cars: [],
    weather: {
      temperature: 25,
      humidity: 60,
      pressure: 1013,
      condition: 'clear',
      trackGrip: 1.0
    },
    events: [],
    status: 'pending'
  })
  const [track, setTrack] = useState<Track>(defaultTrack)

   useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(`${backend}/api/race/status`)
        const data = await response.json()
        setRace(prev => ({ ...prev, ...data }))
      } catch (error) {
        console.error('Failed to fetch race status:', error)
      }
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 1000)
    return () => clearInterval(interval)
   }, [backend])

   const start = async () => {
     await fetch(`${backend}/api/race/start`, { method: 'POST' })
    const response = await fetch(`${backend}/api/race/status`)
    const data = await response.json()
    setRace(prev => ({ ...prev, ...data }))
   }

   const stop = async () => {
     await fetch(`${backend}/api/race/stop`, { method: 'POST' })
    const response = await fetch(`${backend}/api/race/status`)
    const data = await response.json()
    setRace(prev => ({ ...prev, ...data }))
   }

   return (
    <div className="dashboard">
       <div>
         <div style={{ marginBottom: 8 }}>
           <button onClick={start}>Start</button>
           <button onClick={stop} style={{ marginLeft: 8 }}>Stop</button>
         </div>
        <pre className="statusPanel">{JSON.stringify(race, null, 2)}</pre>
       </div>
       <div>
         <TelemetryCharts backend={backend} />
       </div>
       <div style={{ gridColumn: '1 / span 2' }}>
        <TrackView 
          track={track} 
          cars={race.cars} 
          onCarClick={(carId) => console.log('Car clicked:', carId)} 
        />
       </div>
     </div>
   )
 }



