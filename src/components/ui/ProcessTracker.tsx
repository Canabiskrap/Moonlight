import React from 'react';
import { motion } from 'motion/react';
import { Check, Loader2 } from 'lucide-react';

interface Step {
  id: number;
  label: string;
}

interface ProcessTrackerProps {
  steps: Step[];
  currentStep: number;
}

export const ProcessTracker: React.FC<ProcessTrackerProps> = ({ steps, currentStep }) => {
  return (
    <div className="flex items-center justify-between w-full max-w-lg mx-auto mb-8">
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;

        return (
          <div key={step.id} className="flex flex-col items-center gap-2">
            <motion.div
              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                ${isCompleted ? 'bg-green-500 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 
                  isActive ? 'bg-yellow-500/20 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]' : 
                  'bg-purple-500/20 border-purple-500/50 shadow-[0_0_15px_rgba(139,92,246,0.3)]'}`}
              initial={false}
              animate={{ scale: isActive ? 1.1 : 1 }}
            >
              {isCompleted ? (
                <Check size={20} className="text-white" />
              ) : isActive ? (
                <Loader2 size={20} className="text-yellow-500 animate-spin" />
              ) : (
                <span className="text-xs font-bold text-gray-500">{step.id}</span>
              )}
            </motion.div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-yellow-500' : 'text-gray-500'}`}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};
