import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Pause, Square, Activity, Wifi, WifiOff, ArrowUp, ArrowDown } from 'lucide-react';
import * as d3 from 'd3';

const VeloraDashboard = () => {
  const { trackName } = useParams();
  const navigate = useNavigate();
  
  // Enhanced car definitions with much more speed variation
  const baseDefs = [
    { id: 1, name: 'Lightning', color: '#ff4444', skill: 0.97, baseSpeed: 450, aggression: 0.9, speedVariation: 1.4 },
    { id: 2, name: 'Thunder',  color: '#00ffff', skill: 0.95, baseSpeed: 380, aggression: 0.85, speedVariation: 1.1 },
    { id: 3, name: 'Blaze',    color: '#ffff00', skill: 0.96, baseSpeed: 420, aggression: 0.88, speedVariation: 1.3 },
    { id: 4, name: 'Storm',    color: '#ff8800', skill: 0.94, baseSpeed: 360, aggression: 0.82, speedVariation: 0.9 },
    { id: 5, name: 'Flash',    color: '#00ff00', skill: 0.98, baseSpeed: 470, aggression: 0.92, speedVariation: 1.5 },
    { id: 6, name: 'Rocket',   color: '#ff00ff', skill: 0.93, baseSpeed: 340, aggression: 0.80, speedVariation: 0.8 },
    { id: 7, name: 'Turbo',    color: '#ff69b4', skill: 0.95, baseSpeed: 400, aggression: 0.86, speedVariation: 1.2 },                          
    { id: 8, name: 'Nitro',    color: '#00bfff', skill: 0.96, baseSpeed: 430, aggression: 0.89, speedVariation: 1.35 }
  ];

  const svgRef = useRef(null);
  const chartRef = useRef(null);
  const [activeTab, setActiveTab] = useState('race');
  const [isRunning, setIsRunning] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentLap, setCurrentLap] = useState(1);
  const [totalLaps] = useState(11);
  const [simTime, setSimTime] = useState(0);
  const simTimeRef = useRef(0);
  const [hoveredCar, setHoveredCar] = useState(null);
  const [showAccidentMenu, setShowAccidentMenu] = useState(false);
  const [speedHistory, setSpeedHistory] = useState([]);
  const [weather, setWeather] = useState('sunny');
  const [carPositions, setCarPositions] = useState(new Map());
  const [pitstopCars, setPitstopCars] = useState(new Map());
  const [dnfCars, setDnfCars] = useState(new Set());
  const [accidentReasons] = useState([
    'Engine Failure', 'Tire Blowout', 'Collision', 'Brake Failure',
    'Gearbox Issue', 'Electrical Problem', 'Suspension Damage', 'Fuel System Failure'
  ]);
  const [selectedAccidentReason, setSelectedAccidentReason] = useState('Engine Failure');
  const [boostingCars, setBoostingCars] = useState(new Map());
  const pitstopCarsRef = useRef(new Map());
  const wsRef = useRef(null);
  
  const [cars, setCars] = useState([]);
  const [trackData, setTrackData] = useState({ points: [], curvatures: [], startlineIndex: 0 });

  // Track position changes for longer arrow display
  const [positionChanges, setPositionChanges] = useState(new Map());

  useEffect(() => {
    pitstopCarsRef.current = pitstopCars;
    simTimeRef.current = simTime;
  }, [pitstopCars, simTime]);

  useEffect(() => {
    const connectWebSocket = () => {
      setTimeout(() => {
        setIsConnected(true);
        initializeRace();
      }, 500);

      return () => {
        if (wsRef.current) {
          wsRef.current.close();
        }
      };
    };

    connectWebSocket();
  }, []);

  const initializeRace = async () => {
    try {
      const res = await fetch('/track1Data.json');
      if (!res.ok) {
        console.log('Failed to load track1Data.json');
        return;
      }
      const json = await res.json();

      const SCALE = 2.2;
      const rawPoints = (json.points || []).map(p => ({ x: p.x, y: p.y }));
      const cx = d3.mean(rawPoints, d => d.x) || 0;
      const cy = d3.mean(rawPoints, d => d.y) || 0;
      const scaledPoints = rawPoints.map(p => ({ x: (p.x - cx) * SCALE + cx, y: (p.y - cy) * SCALE + cy }));

      const SVG_WIDTH = 1000;
      const SVG_HEIGHT = 500;
      let points;
      if (scaledPoints.length > 0) {
        const xs = scaledPoints.map(p => p.x);
        const ys = scaledPoints.map(p => p.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        const trackW = maxX - minX || 1;
        const trackH = maxY - minY || 1;

        const offsetX = (SVG_WIDTH - trackW) / 2 - minX;
        const offsetY = (SVG_HEIGHT - trackH) / 2 - minY;

        points = scaledPoints.map(p => ({ x: p.x + offsetX, y: p.y + offsetY }));
      } else {
        points = scaledPoints;
      }

      const curvatures = json.curvatures || new Array(points.length).fill(0);
      const startlineIndex = json.startlineIndex || 0;

      setTrackData({ points, curvatures, startlineIndex });

      const totalPoints = points.length || 1000;
      const carSpacing = 20;
      const initialCars = baseDefs.map((d, i) => ({
        id: d.id,
        name: d.name,
        color: d.color,
        position: (startlineIndex - 200) + ((baseDefs.length - 1 - i) * carSpacing), 
        lastPosition: (startlineIndex - 200) + ((baseDefs.length - 1 - i) * carSpacing),
        lap: 0,
        speed: 0,
        tireHealth: 100,
        status: 'ok',
        skill: d.skill,
        baseSpeed: d.baseSpeed,
        aggression: d.aggression,
        speedVariation: d.speedVariation,
        crossedStart: false,
        hasFinished: false,
        finishTime: null,
        dnfReason: null,
        positionChange: null
      }));

      setCars(initialCars);
      
      // Initialize positions
      const initialPositions = new Map();
      initialCars.forEach((car, index) => {
        initialPositions.set(car.id, index + 1);
      });
      setCarPositions(initialPositions);
      
    } catch (err) {
      console.error('initializeRace error', err);
    }
  };

  useEffect(() => {
    if (!svgRef.current || trackData.points.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 1100;
    const height = 800;

    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', '#2a2a2a');

    const lineGenerator = d3.line()
      .x(d => d.x)
      .y(d => d.y)
      .curve(d3.curveCardinalClosed);

    svg.append('path')
      .datum(trackData.points)
      .attr('d', lineGenerator)
      .attr('stroke', 'white')
      .attr('stroke-width', 12)
      .attr('opacity', 0.08)
      .attr('fill', 'none');

    svg.append('path')
      .datum(trackData.points)
      .attr('d', lineGenerator)
      .attr('stroke', 'white')
      .attr('stroke-width', 8)
      .attr('opacity', 0.25)
      .attr('fill', 'none');

    svg.append('path')
      .datum(trackData.points)
      .attr('d', lineGenerator)
      .attr('stroke', 'white')
      .attr('stroke-width', 5)
      .attr('opacity', 0.6)
      .attr('fill', 'none');

    svg.append('path')
      .datum(trackData.points)
      .attr('d', lineGenerator)
      .attr('stroke', 'yellow')
      .attr('stroke-width', 1)
      .attr('opacity', 0.4)
      .attr('stroke-dasharray', '5,5')
      .attr('fill', 'none');

    svg.selectAll('.marker')
      .data(trackData.points.filter((_, i) => i % 50 === 0))
      .enter()
      .append('circle')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', 3)
      .attr('fill', (d, i) => trackData.curvatures[i * 50] < 0.0003 ? 'green' : 'red')
      .attr('opacity', 0.25);

    if (trackData.points.length > 0 && trackData.startlineIndex !== undefined) {
      const startlinePoint = trackData.points[trackData.startlineIndex];
      const nextPoint = trackData.points[(trackData.startlineIndex + 1) % trackData.points.length];
      
      const dx = nextPoint.x - startlinePoint.x;
      const dy = nextPoint.y - startlinePoint.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      const perpX = -dy / len * 30;
      const perpY = dx / len * 30;
      
      svg.append('line')
        .attr('x1', startlinePoint.x - perpX)
        .attr('y1', startlinePoint.y - perpY)
        .attr('x2', startlinePoint.x + perpX)
        .attr('y2', startlinePoint.y + perpY)
        .attr('stroke', 'white')
        .attr('stroke-width', 4)
        .attr('opacity', 0.9);
      
      svg.append('line')
        .attr('x1', startlinePoint.x - perpX)
        .attr('y1', startlinePoint.y - perpY)
        .attr('x2', startlinePoint.x + perpX)
        .attr('y2', startlinePoint.y + perpY)
        .attr('stroke', 'black')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '8,8')
        .attr('opacity', 0.7);
    }

  }, [trackData]);

  useEffect(() => {
    if (!svgRef.current || cars.length === 0 || trackData.points.length === 0) return;

    const svg = d3.select(svgRef.current);
    
    svg.selectAll('.car-group').remove();
    svg.selectAll('.tooltip').remove();

    const visibleCars = cars.filter(car => !dnfCars.has(car.id));

    const carGroups = svg.selectAll('.car-group')
      .data(visibleCars, d => d.id)
      .enter()
      .append('g')
      .attr('class', 'car-group')
      .attr('transform', d => {
        try {
          const safePosition = Math.max(0, Math.floor(d.position || 0));
          const idx = safePosition % trackData.points.length;
          const pos = trackData.points[idx];
          if (!pos || typeof pos.x === 'undefined' || typeof pos.y === 'undefined') {
            return 'translate(0, 0)';
          }
          return `translate(${pos.x}, ${pos.y})`;
        } catch (err) {
          return 'translate(0, 0)';
        }
      })
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => setHoveredCar(d))
      .on('mouseout', () => {
        setHoveredCar(null);
      });

    carGroups.append('circle')
      .attr('r', 12)
      .attr('fill', d => d.color)
      .attr('stroke', 'white')
      .attr('stroke-width', 2);

    carGroups.filter(d => d.status === 'damaged' || d.status === 'accident' || d.status === 'stopped').each(function(d) {
      const carGroup = d3.select(this);
      const currentTime = Date.now() % 3000;
      const time = currentTime / 1000;
      
      const sparkGroup = carGroup.append('g').attr('class', 'sparks');
      const smokeGroup = carGroup.append('g').attr('class', 'smoke');
      
      for (let j = 0; j < 12; j++) {
        const angle = (Math.PI * 2 * j) / 12 + time * 2;
        const distance = 10 + Math.sin(time * 4 + j * 0.5) * 8;
        sparkGroup.append('circle')
          .attr('r', 2 + Math.sin(time * 6 + j) * 1)
          .attr('fill', j % 3 === 0 ? '#ffaa00' : j % 3 === 1 ? '#ff6600' : '#ff3300')
          .attr('cx', Math.cos(angle) * distance)
          .attr('cy', Math.sin(angle) * distance)
          .attr('opacity', 0.8 + Math.sin(time * 8 + j) * 0.2);
      }
      
      for (let k = 0; k < 6; k++) {
        const smokeAngle = (Math.PI * 2 * k) / 6 + time;
        const smokeDistance = 15 + time * 5 + Math.sin(time * 2 + k) * 3;
        smokeGroup.append('circle')
          .attr('r', 3 + time * 2 + Math.sin(time * 3 + k) * 1)
          .attr('fill', '#666666')
          .attr('cx', Math.cos(smokeAngle) * smokeDistance)
          .attr('cy', Math.sin(smokeAngle) * smokeDistance)
          .attr('opacity', 0.4 - time * 0.1);
      }
    });

    if (hoveredCar) {
      let tooltipPos;
      try {
        const safePosition = Math.max(0, Math.floor(hoveredCar.position || 0));
        const idx = safePosition % trackData.points.length;
        tooltipPos = trackData.points[idx];
        if (!tooltipPos || typeof tooltipPos.x === 'undefined' || typeof tooltipPos.y === 'undefined') {
          return;
        }
      } catch (err) {
        return;
      }

      const isInPit = pitstopCars.has(hoveredCar.id);
      const isDnf = dnfCars.has(hoveredCar.id);
      
      const tooltip = svg.append('g')
        .attr('class', 'tooltip')
        .attr('transform', `translate(${tooltipPos.x + 20}, ${tooltipPos.y - 60})`);

      const tooltipHeight = isDnf ? 80 : (isInPit ? 140 : 120);
      tooltip.append('rect')
        .attr('width', 200)
        .attr('height', tooltipHeight)
        .attr('fill', 'rgba(0, 0, 0, 0.95)')
        .attr('stroke', hoveredCar.color)
        .attr('stroke-width', 2)
        .attr('rx', 4);

      // Update tooltip code to remove pitstop button
      const lines = [
        `Name: ${hoveredCar.name}`,
        `Lap: ${hoveredCar.lap}`,
        `Tire: ${hoveredCar.tireHealth.toFixed(1)}%`,
        `Speed: ${Math.round(hoveredCar.speed)} km/h`,
        `Status: ${isInPit ? 'IN PIT' : hoveredCar.status}`
      ];

      lines.forEach((line, i) => {
        tooltip.append('text')
          .attr('x', 10)
          .attr('y', 20 + i * 15)
          .attr('fill', isInPit && i === 4 ? '#ffaa00' : 'white')
          .attr('font-size', 12)
          .attr('font-family', 'monospace')
          .text(line);
      });

    }

  }, [cars, hoveredCar, trackData, pitstopCars, dnfCars]);

  useEffect(() => {
    if (!chartRef.current || speedHistory.length === 0) return;

    const svg = d3.select(chartRef.current);
    svg.selectAll('*').remove();

    const width = 1100;
    const height = 120;
    const margin = { top: 10, right: 30, bottom: 30, left: 50 };

    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', '#1a1a1a');

    const timeDomain = speedHistory.length > 0 ? [
      speedHistory[0].time || 0,
      speedHistory[speedHistory.length - 1].time || speedHistory.length * 0.05
    ] : [0, 10];
    
    const xScale = d3.scaleLinear()
      .domain(timeDomain)
      .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
      .domain([0, 700])
      .range([height - margin.bottom, margin.top]);

    svg.append('g')
      .attr('class', 'grid')
      .selectAll('line')
      .data(yScale.ticks(5))
      .enter()
      .append('line')
      .attr('x1', margin.left)
      .attr('x2', width - margin.right)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d))
      .attr('stroke', '#333')
      .attr('stroke-width', 1);

    if (speedHistory.length > 0 && speedHistory[0].cars) {
      const carIds = speedHistory[0].cars.map(c => c.id);
      
      carIds.forEach(carId => {
        const carColor = cars.find(c => c.id === carId)?.color || 'white';
        const lineData = speedHistory.map((snapshot) => ({
          x: snapshot.time || 0,
          y: snapshot.cars.find(c => c.id === carId)?.speed || 0
        })).filter(d => d.y > 0);

        const line = d3.line()
          .x(d => xScale(d.x))
          .y(d => yScale(d.y))
          .curve(d3.curveMonotoneX);

        svg.append('path')
          .datum(lineData)
          .attr('d', line)
          .attr('stroke', carColor)
          .attr('stroke-width', 2)
          .attr('fill', 'none')
          .attr('opacity', 0.7);
      });
    }

    const xAxis = d3.axisBottom(xScale).ticks(10);
    const yAxis = d3.axisLeft(yScale).ticks(5);

    svg.append('g')
      .attr('transform', `translate(0, ${height - margin.bottom})`)
      .call(xAxis)
      .attr('color', '#666');

    svg.append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(yAxis)
      .attr('color', '#666');

    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height - 5)
      .attr('text-anchor', 'middle')
      .attr('fill', '#999')
      .attr('font-size', 10)
      .text('TIME (s)');

    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', 15)
      .attr('text-anchor', 'middle')
      .attr('fill', '#999')
      .attr('font-size', 10)
      .text('SPEED (km/h)');

  }, [speedHistory, cars]);

  const updateSpeedHistory = (currentCars, currentTime) => {
    setSpeedHistory(prev => {
      const newHistory = [...prev, { time: currentTime, cars: currentCars.map(c => ({ id: c.id, speed: c.speed })) }];
      return newHistory.slice(-100);
    });
  };

  const calculateDistance = (pos1, pos2, trackLen) => {
    let dist = pos2 - pos1;
    if (dist < 0) dist += trackLen;
    return dist * 2;
  };

  // Fixed pitstop function
  const handlePitstop = (carId) => {
    console.log('Pitstop called for car:', carId);
    const car = cars.find(c => c.id === carId);
    if (car && !pitstopCars.has(carId) && !dnfCars.has(carId)) {
      const pitstopData = { 
        startTime: simTimeRef.current, 
        duration: 7
      };
      
      setPitstopCars(prev => {
        const updated = new Map(prev);
        updated.set(carId, pitstopData);
        return updated;
      });
      
      // Immediately update the car to be in pitstop
      setCars(prevCars => prevCars.map(c => 
        c.id === carId 
          ? { 
              ...c, 
              speed: 0, 
              status: 'pit'
            } 
          : c
      ));
      
      console.log(`${car.name} entered pit lane`);
    }
  };

  // Improved car simulation with much more speed variation
  useEffect(() => {
    if (!isRunning || !isConnected) return;

    let currentTime = simTimeRef.current;
    const interval = setInterval(() => {
      currentTime += 0.05;
      simTimeRef.current = currentTime;
      setSimTime(currentTime);
      
      // Handle pitstop completion
      setPitstopCars(prevPit => {
        const updated = new Map(prevPit);
        const carsToUpdate = [];
        
        prevPit.forEach((pitData, carId) => {
          if (currentTime - pitData.startTime >= pitData.duration) {
            updated.delete(carId);
            carsToUpdate.push(carId);
          }
        });
        
        if (carsToUpdate.length > 0) {
          setCars(prevCars => {
            return prevCars.map(c => {
              if (carsToUpdate.includes(c.id)) {
                console.log(`${c.name} exits pit lane`);
                setBoostingCars(prev => {
                  const next = new Map(prev);
                  next.set(c.id, { startTime: currentTime });
                  return next;
                });
                return { 
                  ...c, 
                  status: 'ok',
                  tireHealth: 100 
                };
              }
              return c;
            });
          });
        }
        
        return updated;
      });
      
      setCars(prevCars => {
        const trackLen = trackData.points.length;
        const currentPitstopCars = pitstopCarsRef.current;
        
        let updatedCars = prevCars.map(car => {
          if (dnfCars.has(car.id)) {
            return car;
          }
          
          const isInPit = currentPitstopCars.has(car.id);
          
          if (isInPit) {
            // Car is in pitstop - maintain zero speed and current position
            return {
              ...car,
              speed: 0,
              status: 'pit',
              lastPosition: car.position // Keep position static during pitstop
            };
          }

          const isBoostPhase = boostingCars.has(car.id);
          let boostFactor = 1.0;
          if (isBoostPhase) {
            const boostData = boostingCars.get(car.id);
            const boostAge = currentTime - boostData.startTime;
            
            if (boostAge < 10) {
              boostFactor = 1.3;
            } else {
              setBoostingCars(prev => {
                const next = new Map(prev);
                next.delete(car.id);
                return next;
              });
            }
          }

          const idx = Math.floor(car.position) % trackLen;
          const curvature = trackData.curvatures[idx] || 0;
          const prevPosition = car.lastPosition !== undefined ? car.lastPosition : car.position;
          
          let weatherFactor = 1.0;
          if (weather === 'rainy') {
            weatherFactor = 0.75;
          } else if (weather === 'cloudy') {
            weatherFactor = 0.9;
          }
          
          const tireFactor = 0.8 + (car.tireHealth / 100) * 0.2; // Wider tire factor range
          
          // Much more varied speed calculation
          let baseTargetSpeed = car.baseSpeed || 370;
          const variationFactor = car.speedVariation || 1.0;
          
          // Add random performance fluctuations for much more variation
          const performanceFluctuation = 0.85 + (Math.random() * 0.3); // Wider fluctuation range
          
          if (curvature < 0.001) {
            // Straight sections - cars can reach much higher speeds with more variation
            baseTargetSpeed = Math.min(baseTargetSpeed * 1.2 * variationFactor * performanceFluctuation, 500);
          } else {
            // Curved sections - much more variation in cornering speeds
            const turnSpeedReduction = 0.4 + (0.6 * (1 - Math.min(curvature / 0.002, 1)));
            baseTargetSpeed *= turnSpeedReduction * variationFactor * performanceFluctuation;
          }
          
          let targetSpeed = baseTargetSpeed * car.skill * tireFactor * weatherFactor * boostFactor;
          
          // Add additional random speed variations
          const randomSpeedVariation = 0.9 + (Math.random() * 0.2);
          targetSpeed *= randomSpeedVariation;
          
          if (car.status === 'damaged' || car.status === 'accident') {
            targetSpeed *= 0.3; // More severe penalty for damaged cars
          } else if (car.status === 'stopped') {
            targetSpeed = 0;
          }
          
          // Much wider aggression factor range
          const aggressionFactor = 0.7 + (car.aggression * 0.6);
          targetSpeed *= aggressionFactor;
          
          // More varied acceleration
          const speedDiff = targetSpeed - car.speed;
          const maxAccel = car.aggression > 0.85 ? 220 : 180;
          const accelerationRandomness = 0.8 + (Math.random() * 0.4);
          const accel = Math.sign(speedDiff) * Math.min(Math.abs(speedDiff) / 0.3, maxAccel) * accelerationRandomness;
          const newSpeed = Math.max(0, Math.min(car.speed + accel * 0.05, 700));
          
          const speedMs = newSpeed / 3.6;
          const trackLengthMeters = trackLen * 2;
          const ds = (speedMs * 0.05 * trackLen) / trackLengthMeters;
          let newPosition = car.position + ds;
          
          let newLap = car.lap;
          let crossedStart = car.crossedStart;
          
          if (newPosition < prevPosition) {
            const startlineZone = 100;
            if (prevPosition > trackLen - startlineZone && newPosition < startlineZone) {
              crossedStart = true;
              newLap = car.lap + 1;
            }
          }
          
          newPosition = newPosition % trackLen;
          
          // More varied tire degradation
          const baseDegRate = curvature > 0.001 ? 0.025 * (1 + curvature * 600) : 0.012;
          const aggressionDegRate = baseDegRate * (1 + car.aggression * 0.5);
          const degradationRandomness = 0.8 + (Math.random() * 0.4);
          const newTireHealth = Math.max(0, car.tireHealth - aggressionDegRate * 0.05 * (newSpeed / 250) * degradationRandomness);

          return {
            ...car,
            position: newPosition,
            lastPosition: car.position,
            speed: newSpeed,
            lap: newLap,
            crossedStart,
            tireHealth: newTireHealth
          };
        });

        const maxLap = Math.max(...updatedCars.map(c => c.lap));
        if (maxLap !== currentLap) {
          setCurrentLap(maxLap);
        }

        // Improved ranking logic that properly handles DNF cars and pit stops
        const sortedCars = [...updatedCars].sort((a, b) => {
          // DNF cars always go to the bottom
          if (dnfCars.has(a.id) && !dnfCars.has(b.id)) return 1;
          if (!dnfCars.has(a.id) && dnfCars.has(b.id)) return -1;
          if (dnfCars.has(a.id) && dnfCars.has(b.id)) {
            // Sort DNF cars by their final lap and position
            if (b.lap !== a.lap) return b.lap - a.lap;
            return b.position - a.position;
          }
          
          // Active cars sorted by lap then position
          if (b.lap !== a.lap) return b.lap - a.lap;
          return b.position - a.position;
        });
        
        setCarPositions(prev => {
          const newPositions = new Map();
          const newPositionChanges = new Map(positionChanges);
          
          sortedCars.forEach((car, idx) => {
            const rank = idx + 1;
            const oldPos = prev.get(car.id);
            
            if (oldPos !== undefined && oldPos !== rank) {
              const changeType = oldPos > rank ? 'up' : 'down';
              newPositionChanges.set(car.id, { 
                type: changeType, 
                timestamp: currentTime 
              });
            }
            newPositions.set(car.id, rank);
          });
          
          // Clean up old position changes after 5 seconds (longer duration)
          newPositionChanges.forEach((change, carId) => {
            if (currentTime - change.timestamp > 5) {
              newPositionChanges.delete(carId);
            }
          });
          
          setPositionChanges(newPositionChanges);
          return newPositions;
        });
        
        updateSpeedHistory(sortedCars, currentTime);
        return sortedCars;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isRunning, isConnected, trackData, weather, boostingCars, dnfCars, positionChanges]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showAccidentMenu && !event.target.closest('.accident-menu')) {
        setShowAccidentMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAccidentMenu]);

  const sendCommand = async (command, data = {}) => {
    switch (command) {
      case 'start':
        setIsRunning(true);
        break;
      case 'pause':
        setIsRunning(false);
        setCars(cars.map(car => ({
          ...car,
          speed: 0
        })));
        break;
      case 'stop':
        setIsRunning(false);
        setSimTime(0);
        setCurrentLap(1);
        setSpeedHistory([]);
        setPitstopCars(new Map());
        setDnfCars(new Set());
        setBoostingCars(new Map());
        setPositionChanges(new Map());
        setCars(cars.map((car, i) => {
          const startlineIndex = trackData.startlineIndex || 0;
          const carSpacing = 20;
          const startPos = (startlineIndex - 200) + ((baseDefs.length - 1 - i) * carSpacing);
          return {
            ...car,
            position: startPos,
            lastPosition: startPos,
            lap: 0,
            speed: 0,
            tireHealth: 100,
            status: 'ok',
            crossedStart: false,
            hasFinished: false,
            finishTime: null,
            dnfReason: null,
            positionChange: null
          };
        }));
        break;
      case 'weather':
        if (data.weather) {
          setWeather(data.weather);
        }
        break;
      case 'accident':
        if (data.carId) {
          const reason = data.reason || selectedAccidentReason;
          setCars(cars.map(car => {
            if (car.id === data.carId) {
              return {
                ...car,
                tireHealth: Math.max(0, car.tireHealth - 40),
                speed: 0,
                status: 'stopped'
              };
            }
            return car;
          }));
          
          setTimeout(() => {
            setDnfCars(prev => new Set([...prev, data.carId]));
            setCars(prevCars => prevCars.map(car => 
              car.id === data.carId 
                ? { ...car, status: 'dnf', dnfReason: reason }
                : car
            ));
          }, 3000);
        }
        break;
    }
  };

  // Improved car sorting for display with proper DNF handling
  const sortedCarsBase = [...cars].sort((a, b) => {
    // DNF cars always at the bottom
    if (dnfCars.has(a.id) && !dnfCars.has(b.id)) return 1;
    if (!dnfCars.has(a.id) && dnfCars.has(b.id)) return -1;
    if (dnfCars.has(a.id) && dnfCars.has(b.id)) {
      // Sort DNF cars by their final lap and position
      if (b.lap !== a.lap) return b.lap - a.lap;
      return b.position - a.position;
    }
    
    // Active cars sorted by lap then position
    if (b.lap !== a.lap) return b.lap - a.lap;
    return b.position - a.position;
  });

  const sortedCarsDisplay = sortedCarsBase.map((car, index) => {
    let distanceFromAhead = '-';
    if (index > 0) {
      const aheadCar = sortedCarsBase[index - 1];
      if (aheadCar.lap === car.lap && !dnfCars.has(aheadCar.id)) {
        const dist = calculateDistance(car.position, aheadCar.position, trackData.points.length);
        distanceFromAhead = `${dist.toFixed(0)}m`;
      } else if (aheadCar.lap > car.lap && !dnfCars.has(aheadCar.id)) {
        distanceFromAhead = `+${aheadCar.lap - car.lap}L`;
      }
    }
    
    // Get position change from our tracking system
    const positionChange = positionChanges.get(car.id);
    
    return { 
      ...car, 
      distanceFromAhead,
      displayPosition: index + 1,
      positionChange: positionChange ? positionChange.type : null
    };
  });

  return (
    <div className="w-full h-screen bg-black text-white font-mono flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-700 flex-shrink-0">
        <div>
          <div className="text-2xl font-bold text-red-500">
            VELORA
          </div>
          <div className="text-xs text-gray-400">Competitive Mobility Systems Simulator</div>
          <div className="text-xs mt-1">Track: <span className="text-blue-400">{trackName}</span></div>
        </div>
        <div className="flex gap-6">
          <button 
            onClick={() => navigate('/')}
            className="px-4 py-2 text-gray-400 hover:text-white transition"
          >
            ← Back to Tracks
          </button>
          <button 
            onClick={() => setActiveTab('setup')}
            className={`px-4 py-2 ${activeTab === 'setup' ? 'text-white border-b-2 border-blue-500' : 'text-gray-400'}`}
          >
            Setup
          </button>
          <button 
            onClick={() => setActiveTab('race')}
            className={`px-4 py-2 ${activeTab === 'race' ? 'text-white border-b-2 border-blue-500' : 'text-gray-400'}`}
          >
            Live Race
          </button>
          <button 
            onClick={() => setActiveTab('analysis')}
            className={`px-4 py-2 ${activeTab === 'analysis' ? 'text-white border-b-2 border-blue-500' : 'text-gray-400'}`}
          >
            Analysis
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 p-3 flex flex-col overflow-hidden">
          <div className="bg-gray-800 rounded-lg p-3 relative flex-shrink-0">
            <div className="absolute top-4 right-4 bg-black/80 px-4 py-2 rounded border border-gray-600 z-10 flex items-center gap-2">
              <div className="text-sm font-bold">LAP {Math.max(...cars.map(c => c.lap), 0)}/{totalLaps}</div>
              {isConnected ? (
                <Wifi size={12} className="text-green-400" />
              ) : (
                <WifiOff size={12} className="text-red-400" />
              )}
            </div>
            <svg ref={svgRef} width="1000" height="500" className="mx-auto" />
          </div>
          
          <div className="mt-3 bg-gray-800 rounded-lg p-3 flex-shrink-0">
            <div className="text-xs font-bold mb-2 flex items-center gap-2">
              <Activity size={14} />
              CAR SPEEDS OVER TIME
            </div>
            <svg ref={chartRef} width="900" height="100" />
          </div>
        </div>

        <div className="w-96 bg-gray-900 border-l border-gray-700 flex flex-col h-full">
          <div className="p-4 border-b border-gray-700">
            <div className="text-lg font-bold mb-3">LIVE STANDINGS</div>
            <div className="space-y-1 max-h-[300px] overflow-y-auto">
            <div className="grid grid-cols-12 text-xs text-gray-400 mb-2 gap-x-1">
              <div className="col-span-2">RANK</div>
              <div className="col-span-4">NAME</div>
              <div className="col-span-3">LAP</div>
              <div className="col-span-3">GAP</div>
            </div>
            {sortedCarsDisplay.slice(0, 8).map((car) => {
              const position = car.displayPosition;
              const positionChange = car.positionChange;
              const ArrowIcon = positionChange === 'up' ? ArrowUp : positionChange === 'down' ? ArrowDown : null;
              const arrowColor = positionChange === 'up' ? 'text-green-400' : positionChange === 'down' ? 'text-red-400' : '';
              const isDnf = dnfCars.has(car.id);
              const isInPit = pitstopCars.has(car.id);
              
              return (
                <div key={car.id} className={`grid grid-cols-12 text-sm py-1 px-1 hover:bg-gray-800 rounded items-center gap-x-1 ${
                  isDnf ? 'opacity-60 bg-red-900/20' : isInPit ? 'bg-orange-900/20' : ''
                }`}>
                  <div className="col-span-2 font-bold flex items-center gap-1">
                    {position}
                    {/* Always show arrow if there's a position change */}
                    {ArrowIcon && <ArrowIcon size={12} className={arrowColor} />}
                  </div>
                  <div className="col-span-4 flex items-center gap-1" style={{ color: car.color }}>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: car.color }}></div>
                    <span className="truncate text-xs">{car.name}</span>
                    {isDnf && <span className="text-red-400 text-xs">DNF</span>}
                    {isInPit && <span className="text-orange-400 text-xs">PIT</span>}
                  </div>
                  <div className="col-span-3 text-xs">{car.lap}</div>
                  <div className="col-span-3 text-gray-400 text-xs">{car.distanceFromAhead}</div>
                </div>
              );
            })}
            </div>
          </div>

          <div className="p-4 border-b border-gray-700">
            <div className="text-lg font-bold mb-3">CONTROLS</div>
            <div className="flex gap-2 mb-3">
              <button 
                onClick={() => sendCommand('start')}
                disabled={isRunning || !isConnected}
                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed py-2 rounded font-bold flex items-center justify-center gap-2 transition"
              >
                <Play size={16} /> START
              </button>
              <button 
                onClick={() => sendCommand('pause')}
                disabled={!isRunning}
                className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed py-2 rounded font-bold flex items-center justify-center gap-2 transition"
              >
                <Pause size={16} /> PAUSE
              </button>
              <button 
                onClick={() => sendCommand('stop')}
                className="flex-1 bg-green-500 hover:bg-green-600 py-2 rounded font-bold flex items-center justify-center gap-2 transition"
              >
                <Square size={16} /> STOP
              </button>
            </div>

            {/* Add pitstop dropdown */}
            <div className="mb-3">
              <label className="block text-xs text-gray-400 mb-1">Pitstop Control</label>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handlePitstop(parseInt(e.target.value));
                    e.target.value = ''; // Reset selection after use
                  }
                }}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded text-sm border border-gray-600 focus:outline-none focus:border-blue-500"
                value=""
              >
                <option value="">Select car for pitstop...</option>
                {cars.filter(car => !dnfCars.has(car.id) && !pitstopCars.has(car.id)).map(car => (
                  <option key={car.id} value={car.id}>
                    {car.name} (Tire: {car.tireHealth.toFixed(1)}%)
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="block text-xs text-gray-400 mb-1">Accident Reason:</label>
              <select 
                value={selectedAccidentReason}
                onChange={(e) => setSelectedAccidentReason(e.target.value)}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded text-sm border border-gray-600 focus:outline-none focus:border-blue-500"
              >
                {accidentReasons.map(reason => (
                  <option key={reason} value={reason}>{reason}</option>
                ))}
              </select>
            </div>
            <div className="mb-2">
              <label className="block text-xs text-gray-400 mb-1">Weather</label>
              <select 
                value={weather}
                onChange={(e) => sendCommand('weather', { weather: e.target.value })}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded text-sm border border-gray-600 focus:outline-none focus:border-blue-500"
              >
                <option value="sunny">Sunny</option>
                <option value="cloudy">Cloudy</option>
                <option value="rainy">Rainy</option>
              </select>
            </div>
          </div>

          <div className="flex-1 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-bold">RACE INFORMATION</div>
              <div className="relative">
                <button 
                  onClick={() => setShowAccidentMenu(!showAccidentMenu)}
                  className="text-sm text-red-400 hover:text-red-300 transition"
                >
                  ⚠ Cause Accident
                </button>
                {showAccidentMenu && (
                  <div className="accident-menu absolute right-0 mt-2 bg-gray-800 border border-gray-600 rounded shadow-lg z-10 w-48 max-h-60 overflow-y-auto">
                    {cars.filter(car => !dnfCars.has(car.id)).map(car => (
                      <button
                        key={car.id}
                        onClick={() => {
                          sendCommand('accident', { carId: car.id });
                          setShowAccidentMenu(false);
                        }}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-700 text-sm transition"
                      >
                        <span style={{ color: car.color }}>●</span> {car.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto text-xs font-mono bg-black/30 rounded p-2">
              <div className="text-gray-300 mb-2">
                <span className="text-blue-400">Race Status:</span> {isRunning ? 'Running' : 'Stopped'}
              </div>
              <div className="text-gray-300 mb-2">
                <span className="text-blue-400">Weather:</span> {weather.charAt(0).toUpperCase() + weather.slice(1)}
              </div>
              <div className="text-gray-300 mb-2">
                <span className="text-blue-400">Active Cars:</span> {cars.filter(c => !dnfCars.has(c.id)).length}
              </div>
              <div className="text-gray-300">
                <span className="text-blue-400">DNF Cars:</span> {dnfCars.size}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-700 px-6 py-2 text-xs text-gray-500 flex justify-between">
        {/* <div>React + D3.js + WebSocket Frontend</div> */}
        {/* <div>FastAPI + Python + PostgreSQL Backend</div> */}
      </div>
    </div>
  );
};

export default VeloraDashboard;