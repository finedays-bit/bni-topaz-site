"use client";

import { useEffect } from "react";
import CardActions from "./CardActions";
import { cardSrc } from "@/lib/media";

// 명함 크게 보기 (바깥을 누르거나 Esc로 닫기)
export default function CardViewer({ p, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="lightbox" onClick={onClose} role="dialog" aria-label={`${p.name} 명함`}>
      <div className="lb-inner">
        <button type="button" className="lb-close" onClick={onClose} aria-label="닫기">×</button>
        <img src={cardSrc(p.card)} alt={`${p.company} ${p.name} 명함`} onClick={(e) => e.stopPropagation()} />
        <CardActions p={p} />
      </div>
    </div>
  );
}
