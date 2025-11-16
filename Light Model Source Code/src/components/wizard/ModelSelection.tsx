import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ModelType } from "../RaceWizard";
import { Gauge, Zap, Trophy } from "lucide-react";

interface ModelSelectionProps {
  model: ModelType | null;
  setModel: (model: ModelType) => void;
}

const models = [
  {
    type: "lightweight" as ModelType,
    title: "Lightweight Model",
    icon: Zap,
    description: "Basic independent parameters",
    features: [
      "Top Speed",
      "Vehicle Mass",
      "Drag Coefficient",
      "Quick simulation",
    ],
    paramCount: 3,
  },
  {
    type: "medium" as ModelType,
    title: "Medium Model",
    icon: Gauge,
    description: "Intermediate calculations with interactions",
    features: [
      "Top Speed & Mass",
      "Engine Torque",
      "Downforce & Drag",
      "Tire Radius",
      "Balanced complexity",
    ],
    paramCount: 6,
  },
  {
    type: "heavy" as ModelType,
    title: "Heavy Model",
    icon: Trophy,
    description: "Full interdependencies with advanced physics",
    features: [
      "Complete aerodynamics",
      "Drive train ratios",
      "Rolling resistance",
      "Air density effects",
      "Maximum realism",
    ],
    paramCount: 10,
  },
];

const ModelSelection = ({ model, setModel }: ModelSelectionProps) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Choose Your Model</h2>
        <p className="text-muted-foreground">
          Select the complexity level for your race simulation
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {models.map((m) => {
          const Icon = m.icon;
          return (
            <Card
              key={m.type}
              className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                model === m.type
                  ? "border-primary shadow-racing bg-carbon"
                  : "border-border hover:border-primary/50"
              }`}
              onClick={() => setModel(m.type)}
            >
              <CardHeader>
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all duration-300 ${
                    model === m.type
                      ? "gradient-racing shadow-racing"
                      : "bg-secondary"
                  }`}
                >
                  <Icon className="w-8 h-8" />
                </div>
                <CardTitle className="text-xl">{m.title}</CardTitle>
                <CardDescription>{m.description}</CardDescription>
                <div className="mt-2 text-xs text-muted-foreground">
                  {m.paramCount} configurable parameters
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {m.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ModelSelection;
