import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

interface GridSetupProps {
  drivers: string[];
  setDrivers: (drivers: string[]) => void;
}

const GridSetup = ({ drivers, setDrivers }: GridSetupProps) => {
  const [driverName, setDriverName] = useState("");

  const addDriver = () => {
    if (!driverName.trim()) {
      toast.error("Please enter a driver name");
      return;
    }
    if (drivers.includes(driverName.trim())) {
      toast.error("Driver already exists");
      return;
    }
    setDrivers([...drivers, driverName.trim()]);
    setDriverName("");
    toast.success(`${driverName} added to grid`);
  };

  const removeDriver = (index: number) => {
    const removed = drivers[index];
    setDrivers(drivers.filter((_, i) => i !== index));
    toast.success(`${removed} removed from grid`);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Starting Grid</h2>
        <p className="text-muted-foreground">
          Add drivers in the order they'll start the race
        </p>
      </div>

      <div className="flex gap-2 mb-6">
        <Input
          placeholder="Enter driver name..."
          value={driverName}
          onChange={(e) => setDriverName(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && addDriver()}
          className="flex-1 bg-carbon border-border"
        />
        <Button onClick={addDriver} className="gradient-racing shadow-racing">
          <Plus className="w-4 h-4 mr-2" />
          Add Driver
        </Button>
      </div>

      {drivers.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold mb-3">Current Grid</h3>
          {drivers.map((driver, index) => (
            <Card
              key={index}
              className="p-4 flex items-center justify-between bg-carbon border-border hover:border-primary/50 transition-all duration-200"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full gradient-racing flex items-center justify-center font-bold shadow-racing">
                  {index + 1}
                </div>
                <span className="text-lg font-medium">{driver}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeDriver(index)}
                className="hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}

      {drivers.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No drivers added yet. Add your first driver to get started!</p>
        </div>
      )}
    </div>
  );
};

export default GridSetup;
