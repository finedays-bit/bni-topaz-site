"use client";

import { useEffect, useRef, useState } from "react";

// 활동 사진 슬라이드 — 저절로 넘어가고(움직임 줄이기 설정이면 멈춤), 손가락으로 밀거나 점·화살표로 넘긴다
export default function PhotoSlider({ photos, alt = "", interval = 3500, compact = false }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const touch = useRef(null);
  const n = photos?.length ?? 0;

  useEffect(() => {
    if (n < 2 || paused) return;
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), interval);
    return () => clearInterval(t);
  }, [n, paused, interval]);

  if (!n) return null;
  const go = (d) => setI((x) => (x + d + n) % n);

  return (
    <div className={`slider${compact ? " slider-compact" : ""}`}
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => { touch.current = e.touches[0].clientX; setPaused(true); }}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0].clientX - (touch.current ?? 0);
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        touch.current = null; setPaused(false);
      }}
      aria-roledescription="사진 슬라이드">
      <div className="slider-track" style={{ transform: `translateX(-${i * 100}%)` }}>
        {photos.map((p, j) => (
          <figure className="slide" key={p.url + j} aria-hidden={j !== i}>
            <img src={p.url} alt={p.caption || `${alt} 사진 ${j + 1}`} loading={j === 0 ? "eager" : "lazy"} />
            {!compact && p.caption && <figcaption>{p.caption}</figcaption>}
          </figure>
        ))}
      </div>
      {n > 1 && (
        <>
          {!compact && <button type="button" className="slider-nav prev" onClick={() => go(-1)} aria-label="이전 사진">‹</button>}
          {!compact && <button type="button" className="slider-nav next" onClick={() => go(1)} aria-label="다음 사진">›</button>}
          <div className="slider-dots">
            {photos.map((_, j) => <button type="button" key={j} aria-label={`${j + 1}번째 사진`} aria-pressed={j === i} onClick={(e) => { e.preventDefault(); setI(j); }} />)}
          </div>
          <span className="slider-count">{i + 1} / {n}</span>
        </>
      )}
    </div>
  );
}
