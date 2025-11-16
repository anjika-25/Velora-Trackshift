import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Flag, Trophy, Zap } from "lucide-react";
import { ModelType } from "../RaceWizard";
import { toast } from "sonner";
import Track from "./Track";

interface RaceSimulationProps {
  drivers: string[];
  speeds: number[];
  pitStops: number[][];
  model: ModelType;
  isRacing: boolean;
  startRace: () => void;
}

interface CarState {
  driver: string;
  speed: number;
  currentLap: number;
  totalTime: number;
  pitStops: number[];
  isInPit: boolean;
  position: number;
}

const TOTAL_LAPS = 67;
const LAP_BASE_TIME = 90; // seconds
const PIT_STOP_TIME = 25; // seconds

const RaceSimulation = ({
  drivers,
  speeds,
  pitStops,
  model,
  isRacing,
  startRace,
}: RaceSimulationProps) => {
  const [cars, setCars] = useState<CarState[]>([]);
  const [currentLap, setCurrentLap] = useState(0);
  const [raceFinished, setRaceFinished] = useState(false);

  useEffect(() => {
    if (isRacing && !raceFinished) {
      const interval = setInterval(() => {
        simulateLap();
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isRacing, currentLap, raceFinished]);

  const initializeRace = () => {
    const initialCars: CarState[] = drivers.map((driver, index) => ({
      driver,
      speed: speeds[index],
      currentLap: 0,
      totalTime: 0,
      pitStops: pitStops[index] || [],
      isInPit: false,
      position: index + 1,
    }));
    setCars(initialCars);
    setCurrentLap(0);
    setRaceFinished(false);
    startRace();
    toast.success("Race started! 🏁");
  };

  const simulateLap = () => {
    setCars((prevCars) => {
      const updatedCars = prevCars.map((car) => {
        if (car.currentLap >= TOTAL_LAPS) return car;

        const newLap = car.currentLap + 1;
        const lapTime = LAP_BASE_TIME * (350 / car.speed); // Adjust by speed
        const hasPitStop = car.pitStops.includes(newLap);
        const pitTime = hasPitStop ? PIT_STOP_TIME : 0;

        return {
          ...car,
          currentLap: newLap,
          totalTime: car.totalTime + lapTime + pitTime,
          isInPit: hasPitStop,
        };
      });

      // Sort by total time to determine positions
      const sorted = [...updatedCars].sort((a, b) => {
        if (a.currentLap !== b.currentLap) return b.currentLap - a.currentLap;
        return a.totalTime - b.totalTime;
      });

      const withPositions = sorted.map((car, index) => ({
        ...car,
        position: index + 1,
      }));

      // Check if race is finished
      const allFinished = withPositions.every((car) => car.currentLap >= TOTAL_LAPS);
      if (allFinished && !raceFinished) {
        setRaceFinished(true);
        toast.success("🏆 Race finished! Check the final standings!");
      }

      return withPositions;
    });

    setCurrentLap((prev) => prev + 1);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getPositionBadge = (position: number) => {
    if (position === 1)
      return <Badge className="gradient-racing shadow-racing">1st</Badge>;
    if (position === 2)
      return <Badge variant="secondary">2nd</Badge>;
    if (position === 3)
      return <Badge variant="outline">3rd</Badge>;
    return <Badge variant="outline">{position}th</Badge>;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">
          {!isRacing ? "Ready to Race" : raceFinished ? "Race Complete!" : "Race in Progress"}
        </h2>
        <p className="text-muted-foreground">
          {!isRacing
            ? "Click start to begin the simulation"
            : `Lap ${Math.min(currentLap, TOTAL_LAPS)} of ${TOTAL_LAPS}`}
        </p>
      </div>

      {!isRacing && (
        <div className="text-center py-8">
          <Button
            onClick={initializeRace}
            size="lg"
            className="gradient-racing shadow-racing text-xl px-8 py-6"
          >
            <Flag className="w-6 h-6 mr-2" />
            Start Race
          </Button>
        </div>
      )}

      {isRacing && (
        <>
          <Progress value={(currentLap / TOTAL_LAPS) * 100} className="h-3" />

          {/* Track visualization */}
          <Track
            carPositions={cars.map((car) => ({
              driver: car.driver,
              position: car.position,
              progress: (car.currentLap / TOTAL_LAPS) * 100,
              isInPit: car.isInPit,
            }))}
          />

          <div className="space-y-3">
            {cars.map((car, index) => (
              <Card
                key={index}
                className={`p-5 bg-carbon border-border transition-all duration-300 ${
                  car.position === 1 && raceFinished
                    ? "border-racing shadow-racing"
                    : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {getPositionBadge(car.position)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-lg">{car.driver}</span>
                        {car.isInPit && (
                          <Badge variant="destructive" className="animate-pulse">
                            In Pit
                          </Badge>
                        )}
                        {car.position === 1 && !raceFinished && (
                          <Trophy className="w-5 h-5 text-racing animate-speed-pulse" />
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Lap: {car.currentLap}/{TOTAL_LAPS}</span>
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          {car.speed} km/h
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-racing">
                      {formatTime(car.totalTime)}
                    </div>
                    {car.pitStops.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {car.pitStops.length} pit stops
                      </div>
                    )}
                  </div>
                </div>

                {car.currentLap < TOTAL_LAPS && (
                  <Progress
                    value={(car.currentLap / TOTAL_LAPS) * 100}
                    className="h-1 mt-3"
                  />
                )}
              </Card>
            ))}
          </div>

          {raceFinished && (
            <Card className="p-6 bg-gradient-racing shadow-glow text-center">
              <Trophy className="w-16 h-16 mx-auto mb-4 animate-speed-pulse" />
              <h3 className="text-2xl font-bold mb-2">
                🏆 {cars[0]?.driver} Wins! 🏆
              </h3>
              <p className="text-sm opacity-90">
                Final time: {formatTime(cars[0]?.totalTime)}
              </p>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default RaceSimulation;
