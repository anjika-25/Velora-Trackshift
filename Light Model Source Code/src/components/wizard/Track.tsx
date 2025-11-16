import { Badge } from "@/components/ui/badge";

interface TrackProps {
  carPositions: Array<{
    driver: string;
    position: number;
    progress: number;
    isInPit: boolean;
  }>;
}

const Track = ({ carPositions }: TrackProps) => {
  // Track path coordinates - creates an F1-style circuit
  const trackPath =
    "M 150,50 L 350,50 Q 400,50 400,100 L 400,200 Q 400,250 350,250 L 200,250 Q 150,250 150,300 L 150,400 Q 150,450 200,450 L 400,450 Q 450,450 450,400 L 450,150 Q 450,100 400,100";

  // Calculate position along path based on progress (0-100%)
  const getPositionOnTrack = (progress: number) => {
    // Simplified position calculation for demo
    const pathLength = 1400; // Approximate path length
    const distance = (progress / 100) * pathLength;
    
    // Map distance to x,y coordinates along the circuit
    if (distance < 200) {
      return { x: 150 + distance, y: 50 };
    } else if (distance < 350) {
      const d = distance - 200;
      return { x: 350 + d * 0.3, y: 50 + d * 0.3 };
    } else if (distance < 500) {
      const d = distance - 350;
      return { x: 400, y: 100 + d * 0.66 };
    } else if (distance < 650) {
      const d = distance - 500;
      return { x: 400 - d * 0.3, y: 200 + d * 0.3 };
    } else if (distance < 800) {
      const d = distance - 650;
      return { x: 350 - d, y: 250 };
    } else if (distance < 950) {
      const d = distance - 800;
      return { x: 200 - d * 0.3, y: 250 + d * 0.3 };
    } else if (distance < 1100) {
      const d = distance - 950;
      return { x: 150, y: 300 + d * 0.66 };
    } else if (distance < 1250) {
      const d = distance - 1100;
      return { x: 150 + d * 0.3, y: 400 + d * 0.3 };
    } else {
      const d = distance - 1250;
      return { x: 200 + d * 1.3, y: 450 };
    }
  };

  return (
    <div className="relative w-full h-[500px] bg-gradient-to-br from-background to-muted/20 rounded-lg border border-border p-8">
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 600 500"
        className="absolute inset-0"
      >
        {/* Track outer border */}
        <path
          d={trackPath}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="60"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.3"
        />
        
        {/* Track surface */}
        <path
          d={trackPath}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="50"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Track center line */}
        <path
          d={trackPath}
          fill="none"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="10,10"
          opacity="0.3"
        />
        
        {/* Start/Finish line */}
        <line
          x1="150"
          y1="40"
          x2="150"
          y2="60"
          stroke="hsl(var(--racing))"
          strokeWidth="8"
        />
        
        {/* Pit lane */}
        <rect
          x="140"
          y="350"
          width="40"
          height="80"
          fill="hsl(var(--secondary))"
          opacity="0.3"
          rx="5"
        />
        
        {/* Render cars */}
        {carPositions.map((car, index) => {
          const pos = getPositionOnTrack(car.progress);
          const colors = [
            "hsl(var(--racing))",
            "hsl(var(--primary))",
            "hsl(var(--accent))",
            "hsl(var(--secondary-foreground))",
            "hsl(var(--chart-1))",
          ];
          
          return (
            <g key={index}>
              {/* Car body */}
              <circle
                cx={car.isInPit ? 160 : pos.x}
                cy={car.isInPit ? 390 : pos.y}
                r="12"
                fill={colors[index % colors.length]}
                className={car.position === 1 ? "animate-speed-pulse" : ""}
                filter="url(#glow)"
              />
              
              {/* Position badge */}
              <circle
                cx={car.isInPit ? 160 : pos.x}
                cy={car.isInPit ? 390 : pos.y}
                r="8"
                fill="hsl(var(--background))"
              />
              <text
                x={car.isInPit ? 160 : pos.x}
                y={car.isInPit ? 394 : pos.y + 4}
                textAnchor="middle"
                fontSize="10"
                fontWeight="bold"
                fill={colors[index % colors.length]}
              >
                {car.position}
              </text>
            </g>
          );
        })}
        
        {/* Glow filter */}
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>
      
      {/* Track labels */}
      <div className="absolute top-4 left-4">
        <Badge variant="secondary" className="text-xs">
          🏁 Start/Finish
        </Badge>
      </div>
      <div className="absolute bottom-32 left-4">
        <Badge variant="outline" className="text-xs">
          🔧 Pit Lane
        </Badge>
      </div>
    </div>
  );
};

export default Track;
