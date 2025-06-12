import React from 'react';

// Professional Climbing-Specific Icons
export const ClimbingGradeIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L8 6v4l4-4 4 4V6l-4-4z"/>
    <path d="M8 10v4l2 2h4l2-2v-4l-4 4-4-4z"/>
    <path d="M10 16v4h4v-4l-2 2-2-2z"/>
  </svg>
);

export const FingerStrengthIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 4h2v8H6V4zm3 0h2v10H9V4zm3 0h2v12h-2V4zm3 0h2v10h-2V4zm3 0h2v8h-2V4z"/>
    <rect x="5" y="14" width="14" height="2" rx="1"/>
    <path d="M7 18v2a1 1 0 001 1h8a1 1 0 001-1v-2"/>
  </svg>
);

export const PowerTrainingIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L9 5v3l3-3 3 3V5l-3-3z"/>
    <circle cx="12" cy="12" r="3" fill="currentColor"/>
    <path d="M12 17l-3 3v2l3-3 3 3v-2l-3-3z"/>
    <path d="M5 9l3 3h-3l-3-3v2l3 3h3l-3-3z"/>
    <path d="M19 9l-3 3h3l3-3v2l-3 3h-3l3-3z"/>
  </svg>
);

export const AssessmentIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="12" cy="12" r="2" fill="currentColor"/>
    <path d="M8 4l1 2M16 4l-1 2M4 8l2 1M4 16l2-1M20 8l-2 1M20 16l-2-1M8 20l1-2M16 20l-1-2"/>
  </svg>
);

export const ProgressChartIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 20h18v2H3v-2z"/>
    <path d="M5 18V8h2v10H5zm4-12v12h2V6H9zm4 4v8h2v-8h-2zm4-2v10h2V8h-2z"/>
    <path d="M6 6l3 3 3-3 3 3 3-3" stroke="currentColor" strokeWidth="2" fill="none"/>
  </svg>
);

export const TrainingPlanIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M7 8h10M7 12h8M7 16h6"/>
    <circle cx="5" cy="8" r="1" fill="currentColor"/>
    <circle cx="5" cy="12" r="1" fill="currentColor"/>
    <circle cx="5" cy="16" r="1" fill="currentColor"/>
  </svg>
);

export const ScheduleIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M16 2v4M8 2v4M3 10h18"/>
    <circle cx="8" cy="14" r="1" fill="currentColor"/>
    <circle cx="12" cy="14" r="1" fill="currentColor"/>
    <circle cx="16" cy="14" r="1" fill="currentColor"/>
    <circle cx="8" cy="17" r="1" fill="currentColor"/>
    <circle cx="12" cy="17" r="1" fill="currentColor"/>
  </svg>
);

export const AICoachIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M12 14c-4 0-7 2-7 5v1h14v-1c0-3-3-5-7-5z" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M10 6l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="18" cy="6" r="3" fill="currentColor"/>
    <path d="M17 5h2M18 4v2" stroke="white" strokeWidth="1"/>
  </svg>
);

export const ClimbingMountainIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 20h18l-4-8-3 4-2-6-4 6-5-4z"/>
    <path d="M8 4l2 3 2-3 2 3 2-3" stroke="currentColor" strokeWidth="2" fill="none"/>
    <circle cx="16" cy="6" r="1" fill="currentColor"/>
    <path d="M14 8l1-1 1 1" stroke="currentColor" strokeWidth="1" fill="none"/>
  </svg>
);

export const StrengthMeterIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M8 8l8 8M16 8l-8 8" stroke="currentColor" strokeWidth="1" opacity="0.3"/>
    <circle cx="12" cy="12" r="1" fill="currentColor"/>
  </svg>
);

export const WorkoutSessionIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 4v16l6-4 6 4V4z" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M9 8h6M9 11h6M9 14h4"/>
    <circle cx="7" cy="6" r="1" fill="currentColor"/>
  </svg>
);

export const FlashTrainingIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
    <circle cx="8" cy="10" r="1" fill="white"/>
    <circle cx="16" cy="14" r="1" fill="white"/>
  </svg>
);

export const EnduranceIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M8 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 2v2M12 20v2M2 12h2M20 12h2" stroke="currentColor" strokeWidth="1"/>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1" fill="none"/>
  </svg>
);

export const ProjectClimbIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L8 6l4 4 4-4-4-4z"/>
    <path d="M8 10l4 4 4-4-2-2h-4l-2 2z"/>
    <path d="M10 14l2 2 2-2v4l-2 2-2-2v-4z"/>
    <circle cx="12" cy="8" r="1" fill="white"/>
    <circle cx="12" cy="16" r="1" fill="white"/>
  </svg>
);

export const RestDayIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M9 9h6v6H9z" rx="1"/>
    <path d="M12 6v3M12 15v3M6 12h3M15 12h3" stroke="currentColor" strokeWidth="1"/>
  </svg>
);

export const ClimbingPillLogo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none">
    {/* Pink rounded rectangle */}
    <path d="M20 20 C20 10, 30 0, 40 0 L60 0 C70 0, 80 10, 80 20 L80 40 C80 50, 70 60, 60 60 L40 60 C30 60, 20 50, 20 40 Z" fill="#ff4d6d"/>
    
    {/* Lime green circle */}
    <circle cx="65" cy="35" r="25" fill="#a3d977"/>
    
    {/* Teal rounded rectangle */}
    <path d="M30 40 C20 40, 10 50, 10 60 L10 70 C10 80, 20 90, 30 90 L60 90 C70 90, 80 80, 80 70 L80 60 C80 50, 70 40, 60 40 Z" fill="#2d9596"/>
  </svg>
); 