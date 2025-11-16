import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Zap } from "lucide-react";
import { toast } from "sonner";

interface SpeedConfigProps {
  speeds: number[];
  setSpeeds: (speeds: number[]) => void;
  driverCount: number;
}

const SpeedConfig = ({ speeds, setSpeeds, driverCount }: SpeedConfigProps) => {
  const updateSpeed = (index: number, value: string) => {
    const speed = parseInt(value) || 0;
    if (speed < 150 || speed > 400) {
      toast.error("Speed must be between 150-400 km/h");
      return;
    }
    const newSpeeds = [...speeds];
    newSpeeds[index] = speed;
    setSpeeds(newSpeeds);
  };

  // Initialize speeds array if needed
  if (speeds.length !== driverCount) {
    const newSpeeds = Array(driverCount).fill(330);
    setSpeeds(newSpeeds);
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Configure Car Speeds</h2>
        <p className="text-muted-foreground">
          Set the top speed for each car (150-400 km/h)
        </p>
      </div>

      <div className="grid gap-4">
        {Array.from({ length: driverCount }).map((_, index) => (
          <Card
            key={index}
            className="p-6 bg-carbon border-border hover:border-primary/50 transition-all duration-200"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full gradient-racing flex items-center justify-center font-bold shadow-racing">
                {index + 1}
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">
                  Car {index + 1} Top Speed
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    min="150"
                    max="400"
                    value={speeds[index] || 330}
                    onChange={(e) => updateSpeed(index, e.target.value)}
                    className="bg-background border-border pr-16"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                    km/h
                  </span>
                </div>
              </div>
              <Zap className="w-6 h-6 text-speed" />
            </div>
          </Card>
        ))}
      </div>

      <div className="bg-carbon/50 border border-border rounded-lg p-4 mt-6">
        <p className="text-sm text-muted-foreground">
          <span className="text-speed font-semibold">Tip:</span> Higher speeds
          mean faster lap times, but consider balancing with pit stop strategies!
        </p>
      </div>
    </div>
  );
};

export default SpeedConfig;
