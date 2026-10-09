import { useState, useEffect, useRef } from 'react';
import { useData, playBeepSound } from '../context/DataContext';
import { sendNotification } from '../utils/notifications';
import { Play, Pause, RotateCcw, Flame, Hourglass, ShieldAlert } from 'lucide-react';

export default function FocusSession() {
  const { setTimerActive } = useData();
  const [mode, setMode] = useState('pomodoro'); // 'pomodoro' (25m), 'stopwatch' (count up), 'custom'
  const [customMinutes, setCustomMinutes] = useState(45);
  
  const [isActive, setIsActive] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(25 * 60);
  const [isSpeedUp, setIsSpeedUp] = useState(false); // Debug mode: 1s = 1m (60x speed)

  const timerRef = useRef(null);
  
  // Track milestones to prevent multiple alerts in the same second
  const lastMilestoneRef = useRef(0);

  // Sync active timer state to context for cloud sync interval
  useEffect(() => {
    setTimerActive(isActive);
    return () => {
      setTimerActive(false);
    };
  }, [isActive, setTimerActive]);

  // Handle mode switches
  useEffect(() => {
    resetTimer();
  }, [mode, customMinutes]);

  // Main Timer loop
  useEffect(() => {
    if (isActive) {
      const intervalSpeed = isSpeedUp ? 1000 / 60 : 1000;
      
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          const nextElapsed = prev + 1;
          
          // Check 25-minute milestone (25 * 60 = 1500 seconds)
          const milestoneSize = 25 * 60;
          const currentMilestone = Math.floor(nextElapsed / milestoneSize);
          
          if (currentMilestone > 0 && currentMilestone > lastMilestoneRef.current) {
            lastMilestoneRef.current = currentMilestone;
            
            // Beep and notification
            playBeepSound();
            sendNotification(
              "🎯 Focus Milestone Reached!",
              `Excellent work! You have completed a ${currentMilestone * 25}-minute focus milestone.`
            );
          }
          return nextElapsed;
        });

        if (mode !== 'stopwatch') {
          setRemainingSeconds((prev) => {
            if (prev <= 1) {
              // Timer finished
              setIsActive(false);
              playBeepSound();
              sendNotification("🎉 Focus Session Finished!", "Your focus timer has completed. Take a break!");
              return 0;
            }
            return prev - 1;
          });
        }
      }, intervalSpeed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, mode, isSpeedUp]);

  const startTimer = () => {
    setIsActive(true);
  };

  const pauseTimer = () => {
    setIsActive(false);
  };

  const resetTimer = () => {
    setIsActive(false);
    setElapsedSeconds(0);
    lastMilestoneRef.current = 0;
    if (mode === 'pomodoro') {
      setRemainingSeconds(25 * 60);
    } else if (mode === 'custom') {
      setRemainingSeconds(customMinutes * 60);
    } else {
      setRemainingSeconds(0);
    }
  };

  const formatTime = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return [
      hrs > 0 ? String(hrs).padStart(2, '0') : null,
      String(mins).padStart(2, '0'),
      String(secs).padStart(2, '0'),
    ].filter(Boolean).join(':');
  };

  const getProgress = () => {
    if (mode === 'stopwatch') return 100;
    const total = mode === 'pomodoro' ? 25 * 60 : customMinutes * 60;
    return ((total - remainingSeconds) / total) * 100;
  };

  // Check how close we are to next 25-minute milestone
  const nextMilestoneIn = () => {
    const secondsToNext = 1500 - (elapsedSeconds % 1500);
    return formatTime(secondsToNext);
  };

  return (
    <div className="page-container max-w-2xl mx-auto">
      <div className="mb-6 animate-slide-up">
        <h1 className="text-3xl font-extrabold tracking-tight dark:text-white flex items-center gap-2">
          <Flame className="text-primary-500 fill-primary-500/20" size={28} />
          Focus & Productivity
        </h1>
        <p className="text-surface-500 dark:text-surface-400 text-sm mt-1">
          Maintain deep focus sessions. Completing a 25-minute milestone sounds a warning beep & triggers a notification.
        </p>
      </div>

      {/* Mode Selector */}
      <div className="flex gap-2 p-1 bg-surface-100 dark:bg-surface-800/80 rounded-2xl mb-6">
        {[
          { id: 'pomodoro', label: 'Pomodoro (25m)', icon: Flame },
          { id: 'stopwatch', label: 'Stopwatch', icon: Hourglass },
          { id: 'custom', label: 'Custom Timer', icon: ShieldAlert }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setMode(item.id)}
            disabled={isActive}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 ${
              mode === item.id
                ? 'bg-white dark:bg-surface-700 text-primary-600 dark:text-white shadow-md'
                : 'text-surface-500 hover:text-surface-800 dark:hover:text-surface-200'
            }`}
          >
            <item.icon size={14} />
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Custom timer options */}
      {mode === 'custom' && (
        <div className="card p-4 mb-6 space-y-3">
          <label className="text-xs font-bold text-surface-500">Duration (Minutes)</label>
          <div className="flex gap-2">
            {[15, 30, 45, 60, 90].map((mins) => (
              <button
                key={mins}
                onClick={() => setCustomMinutes(mins)}
                disabled={isActive}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  customMinutes === mins
                    ? 'bg-primary-500 text-white border-primary-500 shadow-md shadow-primary-500/10'
                    : 'bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300 border-surface-200 dark:border-surface-700 hover:bg-surface-50'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Timer Dial */}
      <div className="card p-8 text-center flex flex-col items-center justify-center relative overflow-hidden mb-6">
        {/* Progress ring or simple progress indicator */}
        <div className="relative w-56 h-56 rounded-full border-4 border-surface-100 dark:border-surface-700 flex flex-col items-center justify-center bg-surface-50/50 dark:bg-surface-900/10 shadow-inner">
          <span className="text-[10px] text-surface-400 dark:text-surface-500 font-bold uppercase tracking-widest mb-1">
            {isActive ? 'Session Active' : 'Session Paused'}
          </span>
          <span className="text-4xl font-extrabold tabular-nums tracking-tight dark:text-white">
            {mode === 'stopwatch' ? formatTime(elapsedSeconds) : formatTime(remainingSeconds)}
          </span>
          {mode !== 'stopwatch' && (
            <div className="w-24 mt-3 bg-surface-200 dark:bg-surface-700 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-primary-500 h-full transition-all duration-300"
                style={{ width: `${getProgress()}%` }}
              />
            </div>
          )}
        </div>

        {/* Milestone info */}
        <div className="mt-6 space-y-1">
          <p className="text-sm font-semibold dark:text-white">
            Total Focus Time: <span className="text-primary-500">{formatTime(elapsedSeconds)}</span>
          </p>
          <p className="text-xs text-surface-400 dark:text-surface-500">
            Next 25-minute milestone in: <span className="font-mono">{nextMilestoneIn()}</span>
          </p>
        </div>

        {/* Controls */}
        <div className="flex gap-4 mt-8">
          {isActive ? (
            <button
              onClick={pauseTimer}
              className="btn btn-warning w-12 h-12 !p-0 rounded-full flex items-center justify-center shadow-lg shadow-warning-500/10 active:scale-95"
            >
              <Pause size={20} />
            </button>
          ) : (
            <button
              onClick={startTimer}
              className="btn btn-primary w-12 h-12 !p-0 rounded-full flex items-center justify-center shadow-lg shadow-primary-500/25 active:scale-95 animate-pulse-soft"
            >
              <Play size={20} className="ml-1 text-white" />
            </button>
          )}

          <button
            onClick={resetTimer}
            className="btn btn-outline border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 w-12 h-12 !p-0 rounded-full flex items-center justify-center hover:bg-surface-50 dark:hover:bg-surface-700 active:scale-95"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </div>

      {/* Debug Mode section */}
      <div className="card p-4 border border-warning-500/20 bg-warning-500/5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-warning-700 dark:text-warning-400">⏱ Debug Milestone Mode</h3>
            <p className="text-[10px] text-surface-500 dark:text-surface-400 mt-0.5">
              Simulates focus at 60x speed (1 second of real-time = 1 minute of focus time).
            </p>
          </div>
          <button
            onClick={() => setIsSpeedUp(!isSpeedUp)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              isSpeedUp
                ? 'bg-warning-500 text-white border-warning-500 shadow-md'
                : 'bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300 border-surface-200 dark:border-surface-700'
            }`}
          >
            {isSpeedUp ? 'Speed Active' : 'Speed Off'}
          </button>
        </div>
      </div>
    </div>
  );
}
