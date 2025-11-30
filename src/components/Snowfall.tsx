import { CSSProperties } from "react";

const NUM_FLAKES = 80;

export default function Snowfall() {
  const flakes = Array.from({ length: NUM_FLAKES }, (_, i) => {
    const size = Math.random() * 4 + 2; // 2px - 6px
    const left = Math.random() * 100; // %
    const duration = Math.random() * 12 + 10; // 10s - 22s
    const delay = Math.random() * -20; // start mid animation
    const opacity = Math.random() * 0.6 + 0.2;
    const style: CSSProperties = {
      left: `${left}%`,
      width: `${size}px`,
      height: `${size}px`,
      animationDuration: `${duration}s, ${duration / 3 + 3}s`,
      animationDelay: `${delay}s, ${delay / 2}s`,
      opacity,
    };
    return <span key={i} className="x-snowflake" style={style} />;
  });

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-40">
      {flakes}
    </div>
  );
}


