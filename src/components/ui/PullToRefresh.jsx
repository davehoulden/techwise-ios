import React, { useRef, useState } from 'react';

const THRESHOLD = 70;

export default function PullToRefresh({ onRefresh, children }) {
  const startY = useRef(null);
  const [pulling, setPulling] = useState(0); // px pulled
  const [refreshing, setRefreshing] = useState(false);

  const onTouchStart = (e) => {
    if (window.scrollY === 0) startY.current = e.touches[0].clientY;
  };

  const onTouchMove = (e) => {
    if (startY.current === null) return;
    const delta = Math.max(0, e.touches[0].clientY - startY.current);
    if (delta > 0 && window.scrollY === 0) {
      setPulling(Math.min(delta * 0.4, THRESHOLD + 20));
    }
  };

  const onTouchEnd = async () => {
    if (pulling >= THRESHOLD) {
      setRefreshing(true);
      setPulling(0);
      await onRefresh();
      setRefreshing(false);
    } else {
      setPulling(0);
    }
    startY.current = null;
  };

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ position: 'relative' }}
    >
      {/* Indicator */}
      <div
        style={{
          height: refreshing ? 44 : pulling,
          overflow: 'hidden',
          transition: pulling === 0 ? 'height 0.25s ease' : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            border: '2px solid #1a7cff',
            borderTopColor: 'transparent',
            animation: refreshing ? 'spin 0.7s linear infinite' : 'none',
            opacity: Math.min(pulling / THRESHOLD, 1),
            transform: `rotate(${(pulling / THRESHOLD) * 180}deg)`,
            transition: refreshing ? 'none' : 'opacity 0.1s',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
      {children}
    </div>
  );
}