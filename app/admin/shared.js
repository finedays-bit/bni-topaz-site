"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

// 저장 후 사이트 화면을 바로 새로 만든다
export async function refreshSite() {
  try { await fetch("/api/revalidate", { method: "POST" }); } catch {}
}

// 사진을 보관함(cards·faces)에 올리고 주소를 돌려준다 — 파일 이름은 영문으로 새로 붙임
export async function uploadImage(bucket, file, prefix = "img") {
  const sb = supabaseBrowser();
  const ext = (file.name?.match(/\.(jpe?g|png|webp)$/i)?.[1] || file.type.split("/")[1] || "jpg").toLowerCase();
  const path = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
  const { error } = await sb.storage.from(bucket).upload(path, file, { contentType: file.type || `image/${ext}`, upsert: false });
  if (error) throw error;
  return sb.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

// 설정 한 항목(settings 표의 key) 불러오기·저장하기
export function useSetting(key, defaults = {}) {
  const sb = supabaseBrowser();
  const [value, setValue] = useState(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    sb.from("settings").select("value").eq("key", key).maybeSingle()
      .then(({ data, error }) => (error ? setStatus(`불러오지 못했습니다: ${error.message}`) : setValue(data?.value ?? defaults)));
  }, [sb, key]);

  async function save(next = value) {
    setStatus("저장 중…");
    const { error } = await sb.from("settings").upsert({ key, value: next });
    if (error) return setStatus(`저장 실패: ${error.message}`);
    setValue(next);
    await refreshSite();
    setStatus("저장했습니다. 사이트에 바로 반영됩니다.");
  }

  return { value, setValue, save, status };
}

export function SaveBar({ onSave, status }) {
  return (
    <div className="adm-save">
      <button className="btn btn-main" onClick={() => onSave()}>저장</button>
      {status && <span className="adm-msg">{status}</span>}
    </div>
  );
}

// 입력칸 한 줄
export function Field({ label, value, onChange, type = "text", placeholder, hint, rows, onBlur }) {
  return (
    <label className="adm-field">
      <span>{label}</span>
      {rows
        ? <textarea rows={rows} value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} />
        : <input type={type} value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} />}
      {hint && <small>{hint}</small>}
    </label>
  );
}
