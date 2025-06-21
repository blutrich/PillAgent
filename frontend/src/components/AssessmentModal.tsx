import React, { useState } from 'react'
import { useAuth } from '../lib/auth-context'
import { climbingPillAPI } from '../lib/mastra-client-v2'
import { X, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react'

interface AssessmentModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (assessmentData: any) => void
}

const AssessmentModal: React.FC<AssessmentModalProps> = ({ isOpen, onClose, onComplete }) => {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [assessmentData, setAssessmentData] = useState({
    bodyWeight: '',
    height: '',
    addedWeight: '',
    pullUpsMax: '',
    pushUpsMax: '',
    toeToBarMax: '',
    legSpread: '',
    currentGrade: '',
    targetGrade: '',
    experience: '',
    availableDays: [] as string[],
    sessionDuration: '',
    equipmentAvailable: [] as string[],
    trainingFocus: [] as string[]
  })

  const grades = ['V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10', 'V11', 'V12']
  const experiences = ['Beginner (0-1 year)', 'Intermediate (1-3 years)', 'Advanced (3-5 years)', 'Expert (5+ years)']
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const durations = ['30', '45', '60', '90', '120']
  const equipment = ['Fingerboard', 'Gym Access', 'Home Setup', 'Rings', 'Pull-up Bar']
  const focuses = ['Strength', 'Endurance', 'Technique', 'Power', 'Flexibility']

  const updateData = (field: string, value: any) => {
    setAssessmentData(prev => ({ ...prev, [field]: value }))
  }

  const toggleArrayItem = (field: string, item: string) => {
    setAssessmentData(prev => ({
      ...prev,
      [field]: prev[field as keyof typeof prev].includes(item)
        ? (prev[field as keyof typeof prev] as string[]).filter(i => i !== item)
        : [...(prev[field as keyof typeof prev] as string[]), item]
    }))
  }

  // ❌ REMOVED: Frontend calculations removed - all scoring handled by backend only
  // The backend climbing-assessment-tool.ts handles all composite score calculations
  // using the correct ClimbingPill methodology

  const handleSubmit = async () => {
    if (!user) return

    setIsSubmitting(true)
    try {
      // ✅ FIXED: No frontend calculations - backend handles all scoring
      const assessmentPayload = {
        userId: user.id,
        bodyWeight: parseFloat(assessmentData.bodyWeight),
        height: parseFloat(assessmentData.height),
        addedWeight: parseFloat(assessmentData.addedWeight),
        pullUpsMax: parseInt(assessmentData.pullUpsMax),
        pushUpsMax: parseInt(assessmentData.pushUpsMax),
        toeToBarMax: parseInt(assessmentData.toeToBarMax),
        legSpread: parseFloat(assessmentData.legSpread),
        currentGrade: assessmentData.currentGrade,
        targetGrade: assessmentData.targetGrade,
        experience: assessmentData.experience,
        availableDays: assessmentData.availableDays,
        sessionDuration: parseInt(assessmentData.sessionDuration),
        equipmentAvailable: assessmentData.equipmentAvailable,
        trainingFocus: assessmentData.trainingFocus
        // ❌ REMOVED: compositeScore and predictedGrade - calculated by backend only
      }

      const result = await climbingPillAPI.conductAssessment(assessmentPayload)
      onComplete(result) // Pass backend result instead of frontend calculation
      onClose()
    } catch (error) {
      console.error('Assessment submission error:', error)
      alert('Failed to submit assessment. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return assessmentData.bodyWeight && assessmentData.height
      case 2:
        return assessmentData.addedWeight && assessmentData.pullUpsMax && assessmentData.pushUpsMax && assessmentData.toeToBarMax
      case 3:
        return assessmentData.legSpread && assessmentData.currentGrade && assessmentData.targetGrade
      case 4:
        return assessmentData.experience && assessmentData.availableDays.length > 0 && assessmentData.sessionDuration
      default:
        return true
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Physical Measurements</h3>
            <div>
              <label className="block text-sm font-medium text-white mb-2">Body Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={assessmentData.bodyWeight}
                onChange={(e) => updateData('bodyWeight', e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="70.0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">Height (cm)</label>
              <input
                type="number"
                value={assessmentData.height}
                onChange={(e) => updateData('height', e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="175"
              />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Strength Assessment</h3>
            <div>
              <label className="block text-sm font-medium text-white mb-2">Added Weight for 10s Hang (kg)</label>
              <input
                type="number"
                step="0.5"
                value={assessmentData.addedWeight}
                onChange={(e) => updateData('addedWeight', e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="20.0"
              />
              <p className="text-xs text-gray-400 mt-1">Maximum weight you can add for a 10-second hang on 20mm edge</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Max Pull-ups</label>
                <input
                  type="number"
                  value={assessmentData.pullUpsMax}
                  onChange={(e) => updateData('pullUpsMax', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="15"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Max Push-ups</label>
                <input
                  type="number"
                  value={assessmentData.pushUpsMax}
                  onChange={(e) => updateData('pushUpsMax', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Max Toe-to-Bar</label>
                <input
                  type="number"
                  value={assessmentData.toeToBarMax}
                  onChange={(e) => updateData('toeToBarMax', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="10"
                />
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Climbing & Flexibility</h3>
            <div>
              <label className="block text-sm font-medium text-white mb-2">Leg Spread Distance (cm)</label>
              <input
                type="number"
                value={assessmentData.legSpread}
                onChange={(e) => updateData('legSpread', e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="140"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Current Grade</label>
                <select
                  value={assessmentData.currentGrade}
                  onChange={(e) => updateData('currentGrade', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="">Select grade</option>
                  {grades.map(grade => (
                    <option key={grade} value={grade}>{grade}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Target Grade</label>
                <select
                  value={assessmentData.targetGrade}
                  onChange={(e) => updateData('targetGrade', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="">Select target</option>
                  {grades.map(grade => (
                    <option key={grade} value={grade}>{grade}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Training Preferences</h3>
            <div>
              <label className="block text-sm font-medium text-white mb-2">Experience Level</label>
              <select
                value={assessmentData.experience}
                onChange={(e) => updateData('experience', e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="">Select experience</option>
                {experiences.map(exp => (
                  <option key={exp} value={exp}>{exp}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">Available Days</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {days.map(day => (
                  <button
                    key={day}
                    onClick={() => toggleArrayItem('availableDays', day)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      assessmentData.availableDays.includes(day)
                        ? 'bg-pink-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">Session Duration (minutes)</label>
              <select
                value={assessmentData.sessionDuration}
                onChange={(e) => updateData('sessionDuration', e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="">Select duration</option>
                {durations.map(duration => (
                  <option key={duration} value={duration}>{duration} minutes</option>
                ))}
              </select>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">ClimbingPill Assessment</h2>
              <p className="text-gray-400 text-sm">Step {currentStep} of 4</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-700 rounded-full h-2 mb-6">
            <div
              className="bg-gradient-to-r from-pink-500 to-teal-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>

          {/* Step Content */}
          <div className="mb-8">
            {renderStep()}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>

            {currentStep < 4 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canProceed()}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-teal-500 text-white rounded-lg hover:from-pink-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canProceed() || isSubmitting}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-pink-500 to-teal-500 text-white rounded-lg hover:from-pink-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Complete Assessment
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AssessmentModal 