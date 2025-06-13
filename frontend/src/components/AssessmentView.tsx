import React, { memo } from 'react';
import { AICoachIcon } from './icons';

interface AssessmentData {
  bodyWeight: string;
  height: string;
  addedWeight: string;
  hangTime: string;
  pullUpsMax: string;
  pushUpsMax: string;
  toeToBarMax: string;
  legSpread: string;
  currentGrade: string;
  targetGrade: string;
  eightyPercentGrade: string;
  experience: string;
  weaknesses: string[];
  // Training Preferences
  availableDays: string; // JSON string of array
  sessionDuration: string;
  equipmentAvailable: string; // JSON string of array
  trainingFocus: string; // JSON string of array
  primaryWeakness: string;
}

interface AssessmentProps {
  assessmentStep: number;
  assessmentData: AssessmentData;
  updateAssessmentData: (field: string, value: string) => void;
  nextAssessmentStep: () => void;
  prevAssessmentStep: () => void;
  isGeneratingProgram: boolean;
  setChatOpen: (open: boolean) => void;
}

const AssessmentView: React.FC<AssessmentProps> = memo(({ 
  assessmentStep, 
  assessmentData, 
  updateAssessmentData, 
  nextAssessmentStep, 
  prevAssessmentStep, 
  isGeneratingProgram,
  setChatOpen 
}) => {
  const progressPercentage = (assessmentStep / 8) * 100;
  
  const renderAssessmentStep = () => {
    switch (assessmentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Body Weight (kg)
              </label>
              <input 
                type="number" 
                step="0.1"
                placeholder="70.0"
                value={assessmentData.bodyWeight}
                onChange={(e) => updateAssessmentData('bodyWeight', e.target.value)}
                className="w-full px-4 py-3 surface-tertiary border border-contrast rounded-lg focus:ring-2 focus:ring-white focus:border-white text-white placeholder-gray-400"
              />
              <p className="text-xs text-gray-400 mt-1">💡 AI Tip: Weigh yourself in the morning for accuracy</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Height (cm)
              </label>
              <input 
                type="number" 
                placeholder="175"
                value={assessmentData.height}
                onChange={(e) => updateAssessmentData('height', e.target.value)}
                className="w-full px-4 py-3 surface-tertiary border border-contrast rounded-lg focus:ring-2 focus:ring-white focus:border-white text-white placeholder-gray-400"
              />
              <p className="text-xs text-gray-400 mt-1">💬 Ask AI: "How does height affect climbing performance?"</p>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-white mb-2">🎯 Finger Strength Test Protocol</h4>
              <p className="text-sm text-gray-300 mb-2">Find the maximum weight you can add for a 10-second hang on a 20mm edge.</p>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• Warm up thoroughly before testing</li>
                <li>• Use full crimp grip on 20mm edge</li>
                <li>• Add weight in 2.5kg increments</li>
                <li>• Rest 3-5 minutes between attempts</li>
              </ul>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Added Weight for 10-second Hang (kg)
              </label>
              <input 
                type="number" 
                step="0.5"
                placeholder="20.0"
                value={assessmentData.addedWeight}
                onChange={(e) => updateAssessmentData('addedWeight', e.target.value)}
                className="w-full px-4 py-3 surface-tertiary border border-contrast rounded-lg focus:ring-2 focus:ring-white focus:border-white text-white placeholder-gray-400"
              />
              <p className="text-xs text-gray-400 mt-1">💡 AI Tip: This is the most important metric for grade prediction</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Maximum Dead Hang Time (seconds) - Optional
              </label>
              <input 
                type="number" 
                placeholder="45"
                value={assessmentData.hangTime}
                onChange={(e) => updateAssessmentData('hangTime', e.target.value)}
                className="w-full px-4 py-3 surface-tertiary border border-contrast rounded-lg focus:ring-2 focus:ring-white focus:border-white text-white placeholder-gray-400"
              />
              <p className="text-xs text-gray-400 mt-1">💬 Ask AI: "What's the difference between max hang and added weight?"</p>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Maximum Pull-Ups
              </label>
              <input 
                type="number" 
                placeholder="15"
                value={assessmentData.pullUpsMax}
                onChange={(e) => updateAssessmentData('pullUpsMax', e.target.value)}
                className="w-full px-4 py-3 surface-tertiary border border-contrast rounded-lg focus:ring-2 focus:ring-white focus:border-white text-white placeholder-gray-400"
              />
              <p className="text-xs text-gray-400 mt-1">💡 AI Tip: Full range of motion, chin over bar</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Maximum Push-Ups
              </label>
              <input 
                type="number" 
                placeholder="30"
                value={assessmentData.pushUpsMax}
                onChange={(e) => updateAssessmentData('pushUpsMax', e.target.value)}
                className="w-full px-4 py-3 surface-tertiary border border-contrast rounded-lg focus:ring-2 focus:ring-white focus:border-white text-white placeholder-gray-400"
              />
              <p className="text-xs text-gray-400 mt-1">💡 AI Tip: Chest to ground, full extension</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Maximum Toe-to-Bar
              </label>
              <input 
                type="number" 
                placeholder="10"
                value={assessmentData.toeToBarMax}
                onChange={(e) => updateAssessmentData('toeToBarMax', e.target.value)}
                className="w-full px-4 py-3 surface-tertiary border border-contrast rounded-lg focus:ring-2 focus:ring-white focus:border-white text-white placeholder-gray-400"
              />
              <p className="text-xs text-gray-400 mt-1">💡 AI Tip: Toes must touch the bar, return to dead hang</p>
            </div>
          </div>
        );
      
      case 4:
        return (
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-white mb-2">🤸 Flexibility Test Protocol</h4>
              <p className="text-sm text-gray-300 mb-2">Measure your maximum leg spread distance.</p>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• Face a wall and slide into side splits</li>
                <li>• Keep hips square to the wall</li>
                <li>• Measure distance from crotch to ground</li>
                <li>• Warm up with light stretching first</li>
              </ul>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Leg Spread Distance (cm)
              </label>
              <input 
                type="number" 
                placeholder="140"
                value={assessmentData.legSpread}
                onChange={(e) => updateAssessmentData('legSpread', e.target.value)}
                className="w-full px-4 py-3 surface-tertiary border border-contrast rounded-lg focus:ring-2 focus:ring-white focus:border-white text-white placeholder-gray-400"
              />
              <p className="text-xs text-gray-400 mt-1">💡 AI Tip: Flexibility helps with high steps and mantles</p>
            </div>
          </div>
        );
      
      case 5:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Current Climbing Grade
              </label>
              <select 
                value={assessmentData.currentGrade}
                onChange={(e) => updateAssessmentData('currentGrade', e.target.value)}
                className="w-full px-4 py-3 surface-tertiary border border-contrast rounded-lg focus:ring-2 focus:ring-white focus:border-white text-white"
              >
                <option value="">Select your grade</option>
                <option value="V4">V4</option>
                <option value="V5">V5</option>
                <option value="V6">V6</option>
                <option value="V7">V7</option>
                <option value="V8">V8</option>
                <option value="V9">V9</option>
                <option value="V10">V10</option>
                <option value="V11">V11</option>
                <option value="V12">V12</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Target Grade
              </label>
              <select 
                value={assessmentData.targetGrade}
                onChange={(e) => updateAssessmentData('targetGrade', e.target.value)}
                className="w-full px-4 py-3 surface-tertiary border border-contrast rounded-lg focus:ring-2 focus:ring-white focus:border-white text-white"
              >
                <option value="">Select target grade</option>
                <option value="V5">V5</option>
                <option value="V6">V6</option>
                <option value="V7">V7</option>
                <option value="V8">V8</option>
                <option value="V9">V9</option>
                <option value="V10">V10</option>
                <option value="V11">V11</option>
                <option value="V12">V12</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                80% Success Rate Grade
              </label>
              <select 
                value={assessmentData.eightyPercentGrade}
                onChange={(e) => updateAssessmentData('eightyPercentGrade', e.target.value)}
                className="w-full px-4 py-3 surface-tertiary border border-contrast rounded-lg focus:ring-2 focus:ring-white focus:border-white text-white"
              >
                <option value="">Select 80% grade</option>
                <option value="V3">V3</option>
                <option value="V4">V4</option>
                <option value="V5">V5</option>
                <option value="V6">V6</option>
                <option value="V7">V7</option>
                <option value="V8">V8</option>
                <option value="V9">V9</option>
                <option value="V10">V10</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">💡 AI Tip: Grade you can complete 8 out of 10 attempts</p>
            </div>
          </div>
        );
      
      case 6:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Climbing Experience
              </label>
              <select 
                value={assessmentData.experience}
                onChange={(e) => updateAssessmentData('experience', e.target.value)}
                className="w-full px-4 py-3 surface-tertiary border border-contrast rounded-lg focus:ring-2 focus:ring-white focus:border-white text-white"
              >
                <option value="">Select experience level</option>
                <option value="beginner">Beginner (0-1 years)</option>
                <option value="intermediate">Intermediate (1-3 years)</option>
                <option value="advanced">Advanced (3-5 years)</option>
                <option value="expert">Expert (5+ years)</option>
              </select>
            </div>
          </div>
        );
      
      case 7:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Available Training Days
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                  <label key={day} className="flex items-center space-x-2 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={JSON.parse(assessmentData.availableDays || '[]').includes(day)}
                      onChange={(e) => {
                        const currentDays = JSON.parse(assessmentData.availableDays || '[]');
                        const newDays = e.target.checked 
                          ? [...currentDays, day]
                          : currentDays.filter((d: string) => d !== day);
                        updateAssessmentData('availableDays', JSON.stringify(newDays));
                      }}
                      className="rounded border-gray-600 bg-gray-800 text-white focus:ring-white"
                    />
                    <span>{day}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">💡 AI Tip: 3-4 days per week is optimal for strength gains</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Session Duration
              </label>
              <select 
                value={assessmentData.sessionDuration}
                onChange={(e) => updateAssessmentData('sessionDuration', e.target.value)}
                className="w-full px-4 py-3 surface-tertiary border border-contrast rounded-lg focus:ring-2 focus:ring-white focus:border-white text-white"
              >
                <option value="">Select session length</option>
                <option value="60">60 minutes</option>
                <option value="90">90 minutes</option>
                <option value="120">120 minutes</option>
                <option value="150">150+ minutes</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Equipment Available
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['Home Fingerboard', 'Gym Access', 'Pull-up Bar', 'Resistance Bands', 'Weights/Dumbbells', 'Campus Board'].map((equipment) => (
                  <label key={equipment} className="flex items-center space-x-2 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={JSON.parse(assessmentData.equipmentAvailable || '[]').includes(equipment)}
                      onChange={(e) => {
                        const currentEquipment = JSON.parse(assessmentData.equipmentAvailable || '[]');
                        const newEquipment = e.target.checked 
                          ? [...currentEquipment, equipment]
                          : currentEquipment.filter((eq: string) => eq !== equipment);
                        updateAssessmentData('equipmentAvailable', JSON.stringify(newEquipment));
                      }}
                      className="rounded border-gray-600 bg-gray-800 text-white focus:ring-white"
                    />
                    <span>{equipment}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Primary Training Focus
              </label>
              <select 
                value={assessmentData.primaryWeakness}
                onChange={(e) => updateAssessmentData('primaryWeakness', e.target.value)}
                className="w-full px-4 py-3 surface-tertiary border border-contrast rounded-lg focus:ring-2 focus:ring-white focus:border-white text-white"
              >
                <option value="">Select primary focus</option>
                <option value="finger_strength">Finger Strength</option>
                <option value="power">Power & Explosiveness</option>
                <option value="endurance">Endurance</option>
                <option value="core_strength">Core Strength</option>
                <option value="flexibility">Flexibility & Mobility</option>
                <option value="technique">Technique & Movement</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">💡 AI Tip: Focus on your biggest weakness for fastest improvement</p>
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-4">Assessment Complete!</h3>
              <p className="text-gray-300 mb-6">
                Ready to calculate your composite score and generate your personalized training program.
              </p>
              <div className="bg-gray-800 rounded-lg p-4 text-left">
                <h4 className="font-medium text-white mb-2">Your Assessment Data:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-300">
                  <div>• Body Weight: {assessmentData.bodyWeight}kg</div>
                  <div>• Height: {assessmentData.height}cm</div>
                  <div>• Added Weight: {assessmentData.addedWeight}kg</div>
                  <div>• Pull-ups: {assessmentData.pullUpsMax}</div>
                  <div>• Push-ups: {assessmentData.pushUpsMax}</div>
                  <div>• Toe-to-Bar: {assessmentData.toeToBarMax}</div>
                  <div>• Leg Spread: {assessmentData.legSpread}cm</div>
                  <div>• Current Grade: {assessmentData.currentGrade}</div>
                  <div>• Target Grade: {assessmentData.targetGrade}</div>
                  <div>• 80% Grade: {assessmentData.eightyPercentGrade}</div>
                  <div>• Available Days: {JSON.parse(assessmentData.availableDays || '[]').join(', ')}</div>
                  <div>• Session Length: {assessmentData.sessionDuration} min</div>
                </div>
              </div>
              <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mt-4">
                <p className="text-sm text-blue-200">
                  🧮 The AI will calculate your composite score using the ClimbingPill methodology and predict your optimal grade based on your physical metrics.
                </p>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (assessmentStep) {
      case 1: return "Physical Measurements";
      case 2: return "Finger Strength";
      case 3: return "Strength Metrics";
      case 4: return "Flexibility";
      case 5: return "Climbing Grades";
      case 6: return "Experience Level";
      case 7: return "Training Preferences";
      case 8: return "Review & Generate";
      default: return "Assessment";
    }
  };

  const getStepDescription = () => {
    switch (assessmentStep) {
      case 1: return "Let's start with your basic physical measurements";
      case 2: return "Test your finger strength with added weight on a 20mm edge";
      case 3: return "Measure your maximum strength in key climbing movements";
      case 4: return "Test your flexibility for climbing movement efficiency";
      case 5: return "Tell us about your current and target climbing grades";
      case 6: return "Share your climbing background and experience";
      case 7: return "Tell us about your training schedule and equipment";
      case 8: return "Review your data and generate your personalized program";
      default: return "Complete your climbing assessment";
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-mastra-2xl font-semibold mb-2 text-white">Physical Assessment</h1>
        <p className="text-gray-400">Get your personalized training program based on scientific analysis</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Assessment Form */}
        <div className="lg:col-span-2">
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-mastra-xl font-semibold text-white">Assessment Progress</h2>
              <span className="text-sm text-gray-400">Step {assessmentStep} of 8</span>
            </div>
            
            <div className="w-full bg-gray-800 rounded-full h-2 mb-6">
              <div 
                className="bg-white h-2 rounded-full transition-all duration-300" 
                style={{width: `${progressPercentage}%`}}
              ></div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-2">{getStepTitle()}</h3>
              <p className="text-gray-400 text-sm">{getStepDescription()}</p>
            </div>

            {renderAssessmentStep()}

            <div className="flex justify-between mt-6">
              <button 
                onClick={prevAssessmentStep}
                disabled={assessmentStep === 1}
                className="px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-white border border-gray-600 hover:bg-gray-800"
              >
                Previous
              </button>
              <button 
                onClick={nextAssessmentStep}
                disabled={isGeneratingProgram}
                className="px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isGeneratingProgram && (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                )}
                <span>
                  {assessmentStep === 8 ? (isGeneratingProgram ? 'Generating...' : 'Generate Program') : 'Continue Assessment'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* AI Assessment Assistant */}
        <div className="lg:col-span-1">
          <div className="glass-strong rounded-xl p-6">
            <div className="flex items-center mb-4">
              <AICoachIcon className="w-6 h-6 text-white mr-2" />
              <h3 className="font-semibold text-white">AI Assessment Guide</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="surface-tertiary p-3 rounded-lg border border-contrast">
                <p className="font-medium text-white">Current Test: {getStepTitle()}</p>
                <p className="text-gray-300">{getStepDescription()}</p>
              </div>
              <div className="surface-tertiary p-3 rounded-lg border border-contrast">
                <p className="font-medium text-white">Pro Tip:</p>
                <p className="text-gray-300">
                  {assessmentStep === 1 && "Accurate measurements are crucial for proper normalization"}
                  {assessmentStep === 2 && "This is the most important metric - warm up thoroughly"}
                  {assessmentStep === 3 && "Test when fresh, use proper form throughout"}
                  {assessmentStep === 4 && "Flexibility affects your ability to reach holds"}
                  {assessmentStep === 5 && "Be honest about your current abilities"}
                  {assessmentStep === 6 && "Experience helps calibrate training intensity"}
                  {assessmentStep === 7 && "Your program will be tailored to your results"}
                </p>
              </div>
              <button 
                onClick={() => setChatOpen(true)}
                className="w-full bg-white text-black py-2 rounded-lg text-sm hover:bg-gray-200 transition-colors"
              >
                💬 Ask about this test
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default AssessmentView;
