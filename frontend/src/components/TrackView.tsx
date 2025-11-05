import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Track, Car } from '../types/models';
import { Point, Point2D } from '../types/d3';
import '../styles/dashboard.css';


interface TrackViewProps {
  track?: Track;
  cars?: Car[];
  onCarClick?: (carId: string) => void;
}

export function TrackView({ track, cars, onCarClick }: TrackViewProps) {
  const ref = useRef<SVGSVGElement | null>(null);
  const animationRef = useRef<number>();

  if (!track) {
    return (
      <div className="trackView">
        <div className="loadingMessage">Loading track...</div>
      </div>
    );
  }

  useEffect(() => {
    if (!ref.current) return;

    const svg = d3.select(ref.current);
    const width = 900;
    const height = 600;

    // Clear existing content
    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${width} ${height}`);

    // Define gradient for track surface
    const defs = svg.append('defs');
    
    // Track surface gradient
    const trackGradient = defs.append('linearGradient')
      .attr('id', 'trackSurface')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    trackGradient.append('stop')
      .attr('offset', '0%')
      .attr('style', 'stop-color:#4a4a4a;stop-opacity:1');
    trackGradient.append('stop')
      .attr('offset', '100%')
      .attr('style', 'stop-color:#2a2a2a;stop-opacity:1');

    // Create 3D-like track from checkpoints
    const trackPoints = track.checkpoints;
    const line = d3.line<Point>()
      .x((d: Point) => d[0] * (width * 0.8) + width * 0.1)
      .y((d: Point) => d[1] * (height * 0.8) + height * 0.1)
      .curve(d3.curveCatmullRomClosed);

    // Draw track outline (shadow)
    svg.append('path')
      .datum(trackPoints)
      .attr('d', line)
      .attr('transform', 'translate(4, 4)')
      .attr('stroke', '#000')
      .attr('stroke-width', 44)
      .attr('fill', 'none')
      .attr('filter', 'blur(4px)')
      .attr('opacity', 0.3);

    // Draw track base
    svg.append('path')
      .datum(trackPoints)
      .attr('d', line)
      .attr('stroke', 'url(#trackSurface)')
      .attr('stroke-width', 40)
      .attr('fill', 'none');

    // Draw track edges
    svg.append('path')
      .datum(trackPoints)
      .attr('d', line)
      .attr('stroke', '#555')
      .attr('stroke-width', 42)
      .attr('stroke-opacity', 0.5)
      .attr('fill', 'none');

    // Draw pit lane
    if (track.pitLane) {
      const pitEntry: Point2D = [
        track.pitLane.entry[0] * (width * 0.8) + width * 0.1,
        track.pitLane.entry[1] * (height * 0.8) + height * 0.1
      ];
      const pitExit: Point2D = [
        track.pitLane.exit[0] * (width * 0.8) + width * 0.1,
        track.pitLane.exit[1] * (height * 0.8) + height * 0.1
      ];

      svg.append('line')
        .attr('x1', pitEntry[0])
        .attr('y1', pitEntry[1])
        .attr('x2', pitExit[0])
        .attr('y2', pitExit[1])
        .attr('stroke', '#6b7280')
        .attr('stroke-width', 20)
        .attr('stroke-dasharray', '4 4');
    }

    // Create car elements
    const carGroups = svg.selectAll<SVGGElement, Car>('g.car')
      .data(cars)
      .join('g')
      .attr('class', 'car')
      .style('cursor', 'pointer')
      .on('click', (_: Event, d: Car) => onCarClick?.(d.id));

    // Car shadows
    carGroups.append('circle')
      .attr('r', 8)
      .attr('fill', '#000')
      .attr('opacity', 0.3)
      .attr('filter', 'blur(2px)');

    // Car bodies
    carGroups.append('path')
      .attr('d', 'M-6,-3 L6,-3 L8,0 L6,3 L-6,3 L-8,0 Z')
      .attr('fill', (_: Car, i: number) => d3.schemeTableau10[i % 10])
      .attr('stroke', '#000')
      .attr('stroke-width', 1);

    // Update car positions
    const updateCars = () => {
      cars && carGroups
        .attr('transform', (d: Car) => {
          const x = d.position[0] * (width * 0.8) + width * 0.1;
          const y = d.position[1] * (height * 0.8) + height * 0.1;
          const angle = Math.atan2(d.velocity[1], d.velocity[0]) * (180 / Math.PI);
          return `translate(${x},${y}) rotate(${angle})`;
        });

      animationRef.current = requestAnimationFrame(updateCars);
    };

    updateCars();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [track, cars, onCarClick]);

  return <svg ref={ref} className="trackCanvas" />
 }



