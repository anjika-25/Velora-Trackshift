 import React, { useEffect, useState } from 'react'
 import { TelemetryCharts } from './TelemetryCharts'
 import { TrackView } from './TrackView'

 type Props = { backend: string }

 export function RaceDashboard({ backend }: Props) {
   const [status, setStatus] = useState<any>(null)

   useEffect(() => {
     fetch(`${backend}/api/race/status`).then(r => r.json()).then(setStatus).catch(() => {})
   }, [backend])

   const start = async () => {
     await fetch(`${backend}/api/race/start`, { method: 'POST' })
     const s = await fetch(`${backend}/api/race/status`).then(r => r.json())
     setStatus(s)
   }

   const stop = async () => {
     await fetch(`${backend}/api/race/stop`, { method: 'POST' })
     const s = await fetch(`${backend}/api/race/status`).then(r => r.json())
     setStatus(s)
   }

   return (
     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: 12 }}>
       <div>
         <div style={{ marginBottom: 8 }}>
           <button onClick={start}>Start</button>
           <button onClick={stop} style={{ marginLeft: 8 }}>Stop</button>
         </div>
         <pre style={{ background: '#111827', padding: 8, borderRadius: 6, color: '#cbd5e1' }}>{JSON.stringify(status, null, 2)}</pre>
       </div>
       <div>
         <TelemetryCharts backend={backend} />
       </div>
       <div style={{ gridColumn: '1 / span 2' }}>
         <TrackView />
       </div>
     </div>
   )
 }



