import { useState, useRef } from 'react';
import { ArrowDown, RotateCw, Check } from 'lucide-react';

/**
 * PullToRefresh component
 * Adds native-like swipe-down-to-refresh functionality on mobile devices and touchscreens.
 * 
 * @param {Function} onRefresh - Async function called when user pulls down past threshold
 * @param {ReactNode} children - Child content
 * @param {string} className - Optional container class
 * @param {boolean} isDisabled - Disable pull gesture if true
 */
export default function PullToRefresh({
  onRefresh,
  children,
  className = '',
  isDisabled = false,
}) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isTouchActive, setIsTouchActive] = useState(false);

  const containerRef = useRef(null);
  const touchStartRef = useRef(0);
  const isPullingRef = useRef(false);
  const hapticTriggeredRef = useRef(false);

  const THRESHOLD = 65; // Pull threshold in pixels
  const MAX_PULL = 95;   // Maximum visual pull distance

  // Find scrollable parent or window scrollTop
  const getScrollTop = () => {
    if (!containerRef.current) return window.scrollY || 0;
    let parent = containerRef.current.parentElement;
    while (parent) {
      if (parent.scrollTop > 0) return parent.scrollTop;
      parent = parent.parentElement;
    }
    return window.scrollY || document.documentElement.scrollTop || 0;
  };

  const handleTouchStart = (e) => {
    if (isDisabled || isRefreshing) return;
    if (getScrollTop() <= 2) {
      touchStartRef.current = e.touches[0].clientY;
      isPullingRef.current = true;
      setIsTouchActive(true);
      hapticTriggeredRef.current = false;
    } else {
      isPullingRef.current = false;
      setIsTouchActive(false);
    }
  };

  const handleTouchMove = (e) => {
    if (!isPullingRef.current || isDisabled || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartRef.current;

    if (diff > 0 && getScrollTop() <= 2) {
      const damped = Math.min(diff * 0.45, MAX_PULL);
      setPullDistance(damped);

      if (damped >= THRESHOLD && !hapticTriggeredRef.current) {
        hapticTriggeredRef.current = true;
        try {
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(12);
          }
        } catch {
          // ignore
        }
      }

      if (e.cancelable && diff > 10) {
        e.preventDefault();
      }
    } else {
      setPullDistance(0);
      isPullingRef.current = false;
      setIsTouchActive(false);
    }
  };

  const handleTouchEnd = async () => {
    if (!isPullingRef.current || isDisabled || isRefreshing) return;
    isPullingRef.current = false;
    setIsTouchActive(false);

    if (pullDistance >= THRESHOLD) {
      setIsRefreshing(true);
      setPullDistance(52); // Hold position while refreshing

      try {
        if (typeof onRefresh === 'function') {
          await onRefresh();
        }
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          setPullDistance(0);
          setIsRefreshing(false);
        }, 500);
      } catch (err) {
        console.warn('[PullToRefresh] Error refreshing:', err);
        setPullDistance(0);
        setIsRefreshing(false);
      }
    } else {
      setPullDistance(0);
    }
  };

  const isReadyToRelease = pullDistance >= THRESHOLD;
  const progressRatio = Math.min(pullDistance / THRESHOLD, 1);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`relative min-h-full ${className}`}
    >
      {/* Visual Pull Indicator Badge */}
      <div
        className="absolute left-0 right-0 flex items-center justify-center pointer-events-none z-30 transition-transform duration-150 ease-out"
        style={{
          top: 0,
          transform: `translateY(${pullDistance - 48}px)`,
          opacity: pullDistance > 10 ? 1 : 0,
        }}
      >
        <div
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-md border backdrop-blur-md transition-colors ${
            isSuccess
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : isRefreshing
              ? 'bg-white/95 border-blue-200 text-blue-600 shadow-blue-500/10'
              : isReadyToRelease
              ? 'bg-blue-600 border-blue-600 text-white shadow-blue-500/20'
              : 'bg-white/95 border-slate-200 text-slate-600'
          }`}
        >
          {isSuccess ? (
            <>
              <Check className="w-4 h-4 text-emerald-600 animate-scale-in" />
              <span>Diperbarui!</span>
            </>
          ) : isRefreshing ? (
            <>
              <RotateCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
              <span>Memperbarui...</span>
            </>
          ) : (
            <>
              <ArrowDown
                className="w-3.5 h-3.5 transition-transform duration-200"
                style={{
                  transform: `rotate(${isReadyToRelease ? 180 : progressRatio * 180}deg)`,
                }}
              />
              <span>{isReadyToRelease ? 'Lepas untuk segarkan' : 'Tarik ke bawah...'}</span>
            </>
          )}
        </div>
      </div>

      {/* Content Container (shifts down gently when pulled) */}
      <div
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance * 0.3}px)` : 'none',
          transition: isTouchActive ? 'none' : 'transform 200ms ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}
