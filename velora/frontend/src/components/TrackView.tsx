 import React, { useEffect, useRef } from 'react'
 import * as d3 from 'd3'

 export function TrackView() {
   const ref = useRef<SVGSVGElement | null>(null)

   useEffect(() => {
     const svg = d3.select(ref.current!)
     svg.selectAll('*').remove()

     const width = 900
     const height = 300
     svg.attr('viewBox', `0 0 ${width} ${height}`)

     // Simple oval track fallback
     const cx = width / 2
     const cy = height / 2
     svg.append('ellipse')
       .attr('cx', cx)
       .attr('cy', cy)
       .attr('rx', width / 2 - 40)
       .attr('ry', height / 2 - 20)
       .attr('fill', 'none')
       .attr('stroke', '#334155')
       .attr('stroke-width', 12)

     // Placeholder cars
     const cars = Array.from({ length: 6 }).map((_, i) => i)
     svg.selectAll('circle.car')
       .data(cars)
       .enter()
       .append('circle')
       .attr('class', 'car')
       .attr('r', 6)
       .attr('fill', (d, i) => d3.schemeTableau10[i % 10])
       .attr('cx', (d, i) => cx + (width / 2 - 40) * Math.cos((i / cars.length) * 2 * Math.PI))
       .attr('cy', (d, i) => cy + (height / 2 - 20) * Math.sin((i / cars.length) * 2 * Math.PI))
   }, [])

   return <svg ref={ref} style={{ width: '100%', height: 360 }} />
 }



