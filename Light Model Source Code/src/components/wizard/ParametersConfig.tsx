import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Zap } from "lucide-react";
import { toast } from "sonner";
import { VehicleParameters, DEFAULT_PARAMETERS, ModelType } from "../RaceWizard";
import { useEffect } from "react";

interface ParametersConfigProps {
  parameters: VehicleParameters[];
  setParameters: (params: VehicleParameters[]) => void;
  driverCount: number;
  model: ModelType;
}

const PARAMETER_CONFIGS = {
  lightweight: [
    { key: "topSpeed", label: "Top Speed", unit: "km/h", min: 150, max: 400 },
    { key: "vehicleMass", label: "Vehicle Mass", unit: "kg", min: 700, max: 900 },
    { key: "dragCoeff", label: "Drag Coefficient", unit: "", min: 0.5, max: 1.0, step: 0.01 },
  ],
  medium: [
    { key: "topSpeed", label: "Top Speed", unit: "km/h", min: 150, max: 400 },
    { key: "vehicleMass", label: "Vehicle Mass", unit: "kg", min: 700, max: 900 },
    { key: "engineTorqueCurve", label: "Engine Torque", unit: "Nm", min: 400, max: 600 },
    { key: "dragCoeff", label: "Drag Coefficient", unit: "", min: 0.5, max: 1.0, step: 0.01 },
    { key: "liftDownforceCoeff", label: "Downforce Coefficient", unit: "", min: -5, max: -2, step: 0.1 },
    { key: "tireRadius", label: "Tire Radius", unit: "m", min: 0.3, max: 0.4, step: 0.01 },
  ],
  heavy: [
    { key: "topSpeed", label: "Top Speed", unit: "km/h", min: 150, max: 400 },
    { key: "vehicleMass", label: "Vehicle Mass", unit: "kg", min: 700, max: 900 },
    { key: "engineTorqueCurve", label: "Engine Torque", unit: "Nm", min: 400, max: 600 },
    { key: "finalDriveRatio", label: "Final Drive Ratio", unit: "", min: 2.5, max: 3.5, step: 0.1 },
    { key: "tireRadius", label: "Tire Radius", unit: "m", min: 0.3, max: 0.4, step: 0.01 },
    { key: "rollingResistanceCoeff", label: "Rolling Resistance", unit: "", min: 0.008, max: 0.02, step: 0.001 },
    { key: "dragCoeff", label: "Drag Coefficient", unit: "", min: 0.5, max: 1.0, step: 0.01 },
    { key: "liftDownforceCoeff", label: "Downforce Coefficient", unit: "", min: -5, max: -2, step: 0.1 },
    { key: "frontalArea", label: "Frontal Area", unit: "m²", min: 1.2, max: 1.8, step: 0.05 },
    { key: "airDensity", label: "Air Density", unit: "kg/m³", min: 1.0, max: 1.3, step: 0.001 },
  ],
};

const ParametersConfig = ({ parameters, setParameters, driverCount, model }: ParametersConfigProps) => {
  // Initialize parameters with default values
  useEffect(() => {
    if (parameters.length !== driverCount) {
      const defaultParams = DEFAULT_PARAMETERS[model];
      const newParams = Array(driverCount).fill(null).map(() => ({ ...defaultParams }));
      setParameters(newParams);
    }
  }, [driverCount, model]);

  const updateParameter = (carIndex: number, key: keyof VehicleParameters, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    const config = PARAMETER_CONFIGS[model].find(c => c.key === key);
    if (config && (numValue < config.min || numValue > config.max)) {
      toast.error(`${config.label} must be between ${config.min}-${config.max}${config.unit}`);
      return;
    }

    const newParams = [...parameters];
    newParams[carIndex] = { ...newParams[carIndex], [key]: numValue };
    setParameters(newParams);
  };

  if (parameters.length === 0) return null;

  const configs = PARAMETER_CONFIGS[model];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Configure Vehicle Parameters</h2>
        <p className="text-muted-foreground">
          Customize each car's performance characteristics
        </p>
      </div>

      <Tabs defaultValue="0" className="w-full">
        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${driverCount}, 1fr)` }}>
          {Array.from({ length: driverCount }).map((_, index) => (
            <TabsTrigger key={index} value={index.toString()}>
              Car {index + 1}
            </TabsTrigger>
          ))}
        </TabsList>

        {Array.from({ length: driverCount }).map((_, carIndex) => (
          <TabsContent key={carIndex} value={carIndex.toString()} className="space-y-4 mt-6">
            <Card className="p-6 bg-carbon border-border">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full gradient-racing flex items-center justify-center font-bold shadow-racing">
                  {carIndex + 1}
                </div>
                <div>
                  <h3 className="text-lg font-bold">Car {carIndex + 1} Parameters</h3>
                  <p className="text-sm text-muted-foreground">
                    {model.charAt(0).toUpperCase() + model.slice(1)} Model Configuration
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {configs.map((config) => (
                  <div key={config.key} className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      {config.key === "topSpeed" ? <Zap className="w-4 h-4 text-speed" /> : <Settings className="w-4 h-4 text-primary" />}
                      {config.label}
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        min={config.min}
                        max={config.max}
                        step={config.step || 1}
                        value={
                          (() => {
                            const val = parameters[carIndex]?.[config.key as keyof VehicleParameters];
                            return typeof val === 'number' ? val : 0;
                          })()
                        }
                        onChange={(e) => updateParameter(carIndex, config.key as keyof VehicleParameters, e.target.value)}
                        className="bg-background border-border pr-16"
                      />
                      {config.unit && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">
                          {config.unit}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <div className="bg-carbon/50 border border-border rounded-lg p-4">
        <p className="text-sm text-muted-foreground">
          <span className="text-primary font-semibold">Tip:</span> All parameters have default values optimized for {model} model. 
          You can proceed to the race without changing anything, or fine-tune parameters for custom performance.
        </p>
      </div>
    </div>
  );
};

export default ParametersConfig;
