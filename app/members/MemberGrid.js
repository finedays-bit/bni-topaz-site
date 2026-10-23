"use client";

import { useState } from "react";
import CardViewer from "../CardViewer";
import { cardSrc } from "@/lib/media";

export default function MemberGrid({ members, teams }) {
  const [team, setTeam] = useState("all");
  const [open, setOpen] = useState(null);

  const shown = team === "all" ? members : members.filter((m) => m.team === team);
  const current = teams.find((t) => t.id === team);

  return (
    <>
      <div className="filters">
        <button aria-pressed={team === "all"} onClick={() => setTeam("all")}>전체</button>
        {teams.map((t) => (
          <button key={t.id} aria-pressed={team === t.id} onClick={() => setTeam(t.id)}>
            {t.name}
          </button>
        ))}
      </div>
      <p className="team-note">{current ? `고객: ${current.customer}` : ""}</p>

      <div className="grid">
        {shown.map((m) => (
          <button className="card" key={m.name} onClick={() => m.card && setOpen(m)}>
            <div className="frame">
              {m.card ? (
                <img src={cardSrc(m.card)} alt={`${m.company} ${m.name} 명함`} loading="lazy" />
              ) : (
                <div className="placeholder">
                  <span className="ph-name">{m.name}</span>
                  <span>{m.company}</span>
                  <span className="ph-tag">명함 준비 중</span>
                </div>
              )}
            </div>
            <div className="meta">
              <span className="company">{m.company}</span>
              <b>{m.name}</b> · {m.specialty}
            </div>
          </button>
        ))}
      </div>

      {open && <CardViewer p={open} onClose={() => setOpen(null)} />}
    </>
  );
}
