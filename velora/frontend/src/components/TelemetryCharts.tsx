 import React, { useEffect, useRef } from 'react'
 import {
   Chart,
   LineController,
   LineElement,
   PointElement,
   LinearScale,
   Title,
 } from 'chart.js'

 Chart.register(LineController, LineElement, PointElement, LinearScale, Title)

 type Props = { backend: string }

 export function TelemetryCharts({ backend }: Props) {
   const canvasRef = useRef<HTMLCanvasElement | null>(null)
   const chartRef = useRef<Chart | null>(null)

   useEffect(() => {
     let mounted = true
     const loop = async () => {
       try {
         const snap = await fetch(`${backend}/api/telemetry/snapshot`).then(r => r.json())
         if (!mounted) return
         // Recreate chart on every snapshot to avoid stale state after what-if events
         if (chartRef.current) {
           chartRef.current.destroy()
           chartRef.current = null
         }
         const ctx = canvasRef.current?.getContext('2d')!
         chartRef.current = new Chart(ctx, {
           type: 'line',
           data: {
             labels: snap.cars.map((c: any) => c.car_id.toString()),
             datasets: [{ label: 'Velocity', data: snap.cars.map((c: any) => c.velocity), borderColor: '#22d3ee' }]
           },
           options: { responsive: true, animation: false }
         })
       } catch {}
       setTimeout(loop, 1000)
     }
     loop()
     return () => {
       mounted = false
       if (chartRef.current) {
         chartRef.current.destroy()
       }
     }
   }, [backend])

   return <canvas ref={canvasRef} width={400} height={200} />
 }



