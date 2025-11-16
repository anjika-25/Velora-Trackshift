import React, { useRef, useEffect, useCallback } from 'react';
import * as d3 from 'd3';
import { Track, Car } from '../types/models';

interface TrackViewProps {
  track: Track;
  cars?: Car[];
  onCarClick?: (carId: string) => void;
}

// Simple 2D Point type for D3
type Point = [number, number];

export const TrackView: React.FC<TrackViewProps> = ({ track, cars = [], onCarClick }) => {
  const ref = useRef<SVGSVGElement | null>(null);
  const animationRef = useRef<number>();
  const trackPathRef = useRef<d3.Path | null>(null);
  const trackLengthRef = useRef<number>(0);

  const width = 900;
  const height = 600;

  // Generate smooth track path from checkpoints (like Python's spline)
  const generateTrackPath = (checkpoints: [number, number, number][]): Point[] => {
    if (checkpoints.length < 3) return checkpoints.map(([x, y]) => [x, y] as Point);
    
    // Convert to 2D points
    const points = checkpoints.map(([x, y]) => [x, y] as Point);
    
    // Use Catmull-Rom spline to create smooth closed track (like Python)
    const line = d3.line<Point>()
      .x((d: Point) => d[0] * (width * 0.8) + width * 0.1)
      .y((d: Point) => d[1] * (height * 0.8) + height * 0.1)
      .curve(d3.curveCatmullRomClosed);
    
    return points;
  };

  // Get point along track path at normalized position (0-1)
  const getPointOnTrack = (normalizedPosition: number): Point => {
    const checkpoints = track.checkpoints;
    if (checkpoints.length === 0) return [0.5, 0.5] as Point;
    
    // Wrap position to 0-1
    let pos = normalizedPosition % 1;
    if (pos < 0) pos += 1;
    
    // Calculate which segment and position within segment
    const totalSegments = checkpoints.length;
    const segmentIndex = Math.floor(pos * totalSegments) % totalSegments;
    const nextIndex = (segmentIndex + 1) % totalSegments;
    const segmentPos = (pos * totalSegments) % 1;
    
    // Interpolate between checkpoints
    const [x1, y1] = checkpoints[segmentIndex];
    const [x2, y2] = checkpoints[nextIndex];
    
    const x = x1 + (x2 - x1) * segmentPos;
    const y = y1 + (y2 - y1) * segmentPos;
    
    return [x, y] as Point;
  };

  // D3 Setup Effect - Render track like Python (single track with glow)
  useEffect(() => {
    if (!ref.current) return;

    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const defs = svg.append('defs');
    
    // Convert checkpoints to 2D points
    const points2D = track.checkpoints.map(([x, y]) => [x, y] as Point);
    
    // Create smooth closed path (like Python's Catmull-Rom spline)
    const line = d3.line<Point>()
      .x((d: Point) => d[0] * (width * 0.8) + width * 0.1)
      .y((d: Point) => d[1] * (height * 0.8) + height * 0.1)
      .curve(d3.curveCatmullRomClosed);

    // Store path for car positioning
    const pathData = line(points2D);
    if (pathData) {
      const path = d3.path();
      pathData.split(' ').forEach((cmd: string) => {
        // Simple path parsing - for smooth curves
      });
      trackPathRef.current = path;
    }

    // Calculate track length
    trackLengthRef.current = track.checkpoints.length;

    // Background - black like Python
    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', '#000000');

    // Multi-layer track glow (like Python: white with different opacities and widths)
    // Layer 1: Outer glow (thick, low opacity)
    svg.append('path')
      .datum(points2D)
      .attr('d', line)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 12)
      .attr('fill', 'none')
      .attr('opacity', 0.08);

    // Layer 2: Mid glow
    svg.append('path')
      .datum(points2D)
      .attr('d', line)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 8)
      .attr('fill', 'none')
      .attr('opacity', 0.25);

    // Layer 3: Main track
    svg.append('path')
      .datum(points2D)
      .attr('d', line)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 5)
      .attr('fill', 'none')
      .attr('opacity', 0.6);

    // Layer 4: Yellow dashed center line (like Python)
    svg.append('path')
      .datum(points2D)
      .attr('d', line)
      .attr('stroke', '#ffff00')
      .attr('stroke-width', 1)
      .attr('fill', 'none')
      .attr('opacity', 0.4)
      .attr('stroke-dasharray', '4,4');

  }, [track]);

  // Car Drawing and Animation Effect
  useEffect(() => {
    if (!ref.current) return;

    let animationFrameId: number;
    const svg = d3.select(ref.current);
    let carGroups: d3.Selection<SVGGElement, Car, SVGElement, unknown>;

    try {
      // Join data for car groups
      carGroups = svg.selectAll<SVGGElement, Car>('g.car')
        .data(cars || [], (d: Car) => d.id)
        .join(
          (enter: d3.Selection<d3.EnterElement, Car, SVGElement, unknown>) => {
            const group = enter.append('g')
              .attr('class', 'car')
              .style('cursor', 'pointer')
              .on('click', (_event: MouseEvent, d: Car) => {
                if (onCarClick) onCarClick(d.id);
              });

            // Car dot (like Python: circular with white border)
            group.append('circle')
              .attr('r', 9)
              .attr('fill', (d: Car) => d.color || '#ff0000')
              .attr('stroke', '#ffffff')
              .attr('stroke-width', 2);

            return group;
          },
          (update: d3.Selection<SVGGElement, Car, SVGElement, unknown>) => update,
          (exit: d3.Selection<SVGGElement, Car, SVGElement, unknown>) => exit.remove()
        );

      const updateCars = () => {
        if (carGroups) {
          carGroups.attr('transform', (d: Car & { trackPosition?: number }) => {
            // Use trackPosition if available (from RaceDashboard), otherwise calculate from position
            let trackPosition: number;
            if (d.trackPosition !== undefined) {
              trackPosition = d.trackPosition;
            } else if (d.position && Array.isArray(d.position) && d.position.length >= 2) {
              // Find closest checkpoint to current position
              let minDist = Infinity;
              let closestIndex = 0;
              track.checkpoints.forEach((checkpoint, idx) => {
                const [cx, cy] = checkpoint;
                const dist = Math.sqrt(
                  Math.pow(cx - d.position[0], 2) + Math.pow(cy - d.position[1], 2)
                );
                if (dist < minDist) {
                  minDist = dist;
                  closestIndex = idx;
                }
              });
              trackPosition = closestIndex / track.checkpoints.length;
            } else {
              trackPosition = 0;
            }
            
            // Get point on track at this position
            const point = getPointOnTrack(trackPosition);
            const x = point[0] * (width * 0.8) + width * 0.1;
            const y = point[1] * (height * 0.8) + height * 0.1;
            
            return `translate(${x},${y})`;
          });

          if (cars && cars.length > 0) {
            animationFrameId = requestAnimationFrame(updateCars);
          }
        }
      };

      updateCars();
    } catch (error) {
      console.error('Error rendering cars:', error);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [cars, track]);

  const memoizedOnCarClick = useCallback((carId: string) => {
    if (onCarClick) {
      onCarClick(carId);
    }
  }, [onCarClick]);

  return (
    <div className="w-full h-full relative">
      <svg 
        ref={ref} 
        className="track-canvas w-full h-full"
        style={{ background: 'transparent' }}
        aria-label="Race track visualization"
      />
    </div>
  );
};
