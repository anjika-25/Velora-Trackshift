import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

interface PitStopConfigProps {
  pitStops: number[][];
  setPitStops: (pitStops: number[][]) => void;
  drivers: string[];
}

const PitStopConfig = ({ pitStops, setPitStops, drivers }: PitStopConfigProps) => {
  const [lapInputs, setLapInputs] = useState<string[]>(Array(drivers.length).fill(""));

  // Initialize pit stops array if needed
  if (pitStops.length !== drivers.length) {
    setPitStops(Array(drivers.length).fill([]));
  }

  const addPitStop = (driverIndex: number) => {
    const lap = parseInt(lapInputs[driverIndex]);
    if (!lap || lap < 1) {
      toast.error("Please enter a valid lap number");
      return;
    }
    if (pitStops[driverIndex]?.includes(lap)) {
      toast.error("Pit stop already scheduled for this lap");
      return;
    }

    const newPitStops = [...pitStops];
    newPitStops[driverIndex] = [...(newPitStops[driverIndex] || []), lap].sort(
      (a, b) => a - b
    );
    setPitStops(newPitStops);

    const newInputs = [...lapInputs];
    newInputs[driverIndex] = "";
    setLapInputs(newInputs);

    toast.success(`Pit stop added for lap ${lap}`);
  };

  const removePitStop = (driverIndex: number, lap: number) => {
    const newPitStops = [...pitStops];
    newPitStops[driverIndex] = newPitStops[driverIndex].filter((l) => l !== lap);
    setPitStops(newPitStops);
    toast.success(`Pit stop removed from lap ${lap}`);
  };

  const updateLapInput = (index: number, value: string) => {
    const newInputs = [...lapInputs];
    newInputs[index] = value;
    setLapInputs(newInputs);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Pit Stop Strategy</h2>
        <p className="text-muted-foreground">
          Schedule pit stops for each driver (optional)
        </p>
      </div>

      <div className="space-y-4">
        {drivers.map((driver, index) => (
          <Card
            key={index}
            className="p-6 bg-carbon border-border hover:border-primary/50 transition-all duration-200"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gradient-racing flex items-center justify-center font-bold shadow-racing">
                    {index + 1}
                  </div>
                  <span className="text-lg font-medium">{driver}</span>
                </div>
                <Badge variant="secondary">
                  {pitStops[index]?.length || 0} pit stops
                </Badge>
              </div>

              <div className="flex gap-2">
                <Input
                  type="number"
                  min="1"
                  placeholder="Lap number..."
                  value={lapInputs[index]}
                  onChange={(e) => updateLapInput(index, e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addPitStop(index)}
                  className="bg-background border-border"
                />
                <Button
                  onClick={() => addPitStop(index)}
                  variant="secondary"
                  className="whitespace-nowrap"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Pit
                </Button>
              </div>

              {pitStops[index]?.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {pitStops[index].map((lap) => (
                    <Badge
                      key={lap}
                      variant="outline"
                      className="border-speed text-speed hover:bg-speed/10 cursor-pointer"
                      onClick={() => removePitStop(index, lap)}
                    >
                      Lap {lap}
                      <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      <div className="bg-carbon/50 border border-border rounded-lg p-4">
        <p className="text-sm text-muted-foreground">
          <span className="text-speed font-semibold">Strategy Tip:</span> Pit
          stops add time but are essential for tire changes. Plan them wisely!
        </p>
      </div>
    </div>
  );
};

export default PitStopConfig;
