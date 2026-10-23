"use client";

import { useState } from "react";
import CardViewer from "../CardViewer";

// 명함이 있는 리더는 카드를 누르면 명함 크게 보기
export default function LeaderGroups({ groups }) {
  const [open, setOpen] = useState(null);

  return (
    <>
      {groups.map((g) => (
        <div className="lt-group" key={g.title}>
          <h3>{g.title}</h3>
          <div className="lt-grid">
            {g.people.map((p) => {
              const inner = (
                <>
                  {p.face
                    ? <img src={p.face} alt={p.name} loading="lazy" />
                    : <span className="lt-noface">{p.name[0]}</span>}
                  <div>
                    <small>{p.role}</small>
                    <b>{p.name}</b>
                    {p.company && <span>{p.company}</span>}
                  </div>
                </>
              );
              return p.profile?.card
                ? <button type="button" className="lt-card lt-click" key={p.role} onClick={() => setOpen(p.profile)}>{inner}<span className="lt-hint">명함 보기</span></button>
                : <div className="lt-card" key={p.role}>{inner}</div>;
            })}
          </div>
        </div>
      ))}
      {open && <CardViewer p={open} onClose={() => setOpen(null)} />}
    </>
  );
}
