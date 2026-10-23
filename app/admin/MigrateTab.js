"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { refreshSite, uploadImage } from "./shared";

// 처음 한 번: 이 PC(public/cards·faces)에 있는 명함·얼굴 사진을 Supabase 보관함으로 옮긴다
// 옮긴 뒤에는 사이트를 인터넷에 올려도(배포) 사진이 그대로 보인다
export default function MigrateTab() {
  const sb = supabaseBrowser();
  const [log, setLog] = useState([]);
  const [busy, setBusy] = useState(false);
  const add = (line) => setLog((l) => [...l, line]);

  async function grab(path) {
    const res = await fetch(path);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new File([blob], path.split("/").pop(), { type: blob.type });
  }

  async function run() {
    setBusy(true);
    setLog([]);
    const { data: rows, error } = await sb.from("members").select("id,name,card,face");
    if (error) { add(`불러오기 실패: ${error.message}`); return setBusy(false); }
    let moved = 0;
    for (const r of rows) {
      const update = {};
      try {
        if (r.card && !/^https?:/.test(r.card)) {
          const file = await grab(`/cards/${encodeURIComponent(r.card)}`);
          if (file) update.card = await uploadImage("cards", file, `card-${r.id}`);
          else add(`${r.name}: 이 PC에 명함 파일이 없어 건너뜀`);
        }
        if (!r.face) {
          const file = await grab(`/faces/${encodeURIComponent(r.name)}.jpg`);
          if (file) update.face = await uploadImage("faces", file, `face-${r.id}`);
        }
        if (Object.keys(update).length) {
          const { error: e } = await sb.from("members").update(update).eq("id", r.id);
          if (e) throw e;
          moved++;
          add(`${r.name}: ${[update.card && "명함", update.face && "얼굴"].filter(Boolean).join("·")} 옮김`);
        }
      } catch (e) {
        add(`${r.name}: 실패 — ${e.message}`);
      }
    }
    await refreshSite();
    add(`끝 — ${moved}명 옮김. 이미 옮긴 사진은 다시 옮기지 않습니다.`);
    setBusy(false);
  }

  return (
    <section className="adm-panel">
      <h2>사진 옮기기 (처음 한 번)</h2>
      <p className="muted">
        지금 명함·얼굴 사진은 이 PC 폴더에만 있습니다. 아래 버튼을 누르면 Supabase 보관함으로 옮겨서,
        사이트를 인터넷에 올렸을 때도 사진이 보이게 합니다. 여러 번 눌러도 이미 옮긴 사진은 건너뜁니다.
      </p>
      <button className="btn btn-main" onClick={run} disabled={busy}>{busy ? "옮기는 중…" : "사진 옮기기 시작"}</button>
      {log.length > 0 && <pre className="adm-log">{log.join("\n")}</pre>}
    </section>
  );
}
