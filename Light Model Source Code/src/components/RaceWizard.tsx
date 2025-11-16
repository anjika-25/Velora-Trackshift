import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import ModelSelection from "./wizard/ModelSelection";
import GridSetup from "./wizard/GridSetup";
import ParametersConfig from "./wizard/ParametersConfig";
import PitStopConfig from "./wizard/PitStopConfig";
import RaceSimulation from "./wizard/RaceSimulation";
import { Flag, Zap } from "lucide-react";

export type ModelType = "lightweight" | "medium" | "heavy";

export interface VehicleParameters {
  // Light parameters (all models)
  vehicleMass: number;
  engineTorqueCurve: number;
  gearRatios: number[];
  finalDriveRatio: number;
  tireRadius: number;
  rollingResistanceCoeff: number;
  dragCoeff: number;
  liftDownforceCoeff: number;
  frontalArea: number;
  airDensity: number;
  topSpeed: number;
}

export interface Car {
  driver: string;
  speed: number;
  pitStops: number[];
  currentLap: number;
  totalTime: number;
  isInPit: boolean;
}

export const DEFAULT_PARAMETERS: Record<ModelType, VehicleParameters> = {
  lightweight: {
    vehicleMass: 798,
    engineTorqueCurve: 450,
    gearRatios: [3.5, 2.8, 2.2, 1.8, 1.5, 1.2, 1.0, 0.9],
    finalDriveRatio: 3.2,
    tireRadius: 0.33,
    rollingResistanceCoeff: 0.015,
    dragCoeff: 0.7,
    liftDownforceCoeff: -3.5,
    frontalArea: 1.5,
    airDensity: 1.225,
    topSpeed: 330,
  },
  medium: {
    vehicleMass: 798,
    engineTorqueCurve: 500,
    gearRatios: [3.5, 2.8, 2.2, 1.8, 1.5, 1.2, 1.0, 0.9],
    finalDriveRatio: 3.0,
    tireRadius: 0.33,
    rollingResistanceCoeff: 0.012,
    dragCoeff: 0.65,
    liftDownforceCoeff: -4.0,
    frontalArea: 1.45,
    airDensity: 1.225,
    topSpeed: 340,
  },
  heavy: {
    vehicleMass: 798,
    engineTorqueCurve: 550,
    gearRatios: [3.5, 2.8, 2.2, 1.8, 1.5, 1.2, 1.0, 0.9],
    finalDriveRatio: 2.9,
    tireRadius: 0.33,
    rollingResistanceCoeff: 0.010,
    dragCoeff: 0.6,
    liftDownforceCoeff: -4.5,
    frontalArea: 1.4,
    airDensity: 1.225,
    topSpeed: 350,
  },
};

const RaceWizard = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [model, setModel] = useState<ModelType | null>(null);
  const [drivers, setDrivers] = useState<string[]>([]);
  const [parameters, setParameters] = useState<VehicleParameters[]>([]);
  const [pitStops, setPitStops] = useState<number[][]>([]);
  const [isRacing, setIsRacing] = useState(false);

  const steps = [
    { title: "Model", icon: Zap },
    { title: "Grid", icon: Flag },
    { title: "Parameters", icon: Zap },
    { title: "Pit Stops", icon: Flag },
    { title: "Race", icon: Flag },
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0 && !isRacing) {
      setCurrentStep(currentStep - 1);
    }
  };

  const startRace = () => {
    setIsRacing(true);
  };

  return (
    <div className="min-h-screen bg-gradient-hero p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-racing bg-clip-text text-transparent">
            Velora F1 Simulation
          </h1>
          <p className="text-xl text-muted-foreground">
            Experience the thrill of Formula 1 racing
          </p>
        </div>

        <Card className="bg-card border-border shadow-racing backdrop-blur-sm">
          <div className="p-8">
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between mb-4">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div
                      key={index}
                      className={`flex flex-col items-center transition-all duration-300 ${
                        index <= currentStep
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${
                          index <= currentStep
                            ? "bg-primary shadow-racing"
                            : "bg-secondary"
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-medium">{step.title}</span>
                    </div>
                  );
                })}
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Step Content */}
            <div className="min-h-[400px]">
              {currentStep === 0 && (
                <ModelSelection model={model} setModel={setModel} />
              )}
              {currentStep === 1 && (
                <GridSetup drivers={drivers} setDrivers={setDrivers} />
              )}
              {currentStep === 2 && model && (
                <ParametersConfig
                  parameters={parameters}
                  setParameters={setParameters}
                  driverCount={drivers.length}
                  model={model}
                />
              )}
              {currentStep === 3 && (
                <PitStopConfig
                  pitStops={pitStops}
                  setPitStops={setPitStops}
                  drivers={drivers}
                />
              )}
              {currentStep === 4 && (
                <RaceSimulation
                  drivers={drivers}
                  speeds={parameters.map(p => p.topSpeed)}
                  pitStops={pitStops}
                  model={model!}
                  isRacing={isRacing}
                  startRace={startRace}
                />
              )}
            </div>

            {/* Navigation */}
            {currentStep < 4 && (
              <div className="flex justify-between mt-8">
                <Button
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  variant="secondary"
                  size="lg"
                >
                  Previous
                </Button>
                <Button
                  onClick={nextStep}
                  disabled={
                    (currentStep === 0 && !model) ||
                    (currentStep === 1 && drivers.length === 0) ||
                    (currentStep === 2 && parameters.length !== drivers.length) ||
                    (currentStep === 3 && pitStops.length !== drivers.length)
                  }
                  size="lg"
                  className="gradient-racing shadow-racing"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RaceWizard;
