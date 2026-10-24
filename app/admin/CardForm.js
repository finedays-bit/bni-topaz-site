"use client";

import { useEffect, useRef, useState } from "react";
import { Field } from "./shared";
import { NO_ADJ, PHOTO_ADJ, hasTransparentBg, loadImage, renderCard } from "@/lib/cardMaker";
import { removeLogoBg, removePersonBg } from "@/lib/bgRemove";
import { extractLogo, extractPerson } from "@/lib/legacyExtract";

// 이미지 명함 만들기: 명함 글자 입력 + 프로필 사진 + 로고 → 오른쪽 미리보기
// - 프로필 사진은 올리는 즉시 배경을 지워 토파즈 명함 배경 위에 앉힌다 (이미 누끼면 그대로)
// - 로고는 원본을 두고, '배경 지우기' 체크(card.logoClear)에 따라 지운 것/그대로를 쓴다
// 사진·로고는 { file } 또는 { url }. canvasRef 로 완성 명함을 꺼내고, 등록 직전 drawRef.current() 로 한 번 더 그린다
// legacyCard: 기존 완성 명함 주소 — 프로필 사진이 없을 때 미리보기 자리에 보여 주고, 거기서 사진·로고를 꺼낼 수도 있다
// onUploadCard: 완성된 명함 이미지를 직접 올릴 때 (File)
export default function CardForm({ member, card, setCard, photo, setPhoto, logo, setLogo, canvasRef, drawRef, legacyCard, onUploadCard }) {
  const [bits, setBits] = useState({ header: null, photo: null, logo: null });
  const [busy, setBusy] = useState(false);
  const [work, setWork] = useState({ photo: "", logo: "", legacy: "" });
  const timer = useRef();
  const set = (k) => (v) => setCard((c) => ({ ...c, [k]: v }));
  const say = (k, msg) => setWork((w) => ({ ...w, [k]: msg }));

  useEffect(() => { loadImage("/brand/card-header@2x.png").then((header) => setBits((b) => ({ ...b, header }))); }, []);
  useEffect(() => {
    loadImage(photo?.file ?? photo?.url).then((p) => setBits((b) => ({ ...b, photo: p }))).catch(() => say("photo", "사진을 읽지 못했습니다."));
  }, [photo]);
  // 로고: 체크하면 배경을 지운 것으로 그린다 (원본은 그대로 보관)
  useEffect(() => {
    const src = logo?.file ?? logo?.url;
    if (!src) return setBits((b) => ({ ...b, logo: null }));
    say("logo", card.logoClear ? "로고 배경 지우는 중…" : "");
    (card.logoClear ? removeLogoBg(src) : Promise.resolve(src))
      .then(loadImage)
      .then((l) => { setBits((b) => ({ ...b, logo: l })); say("logo", ""); })
      .catch((err) => say("logo", `로고를 읽지 못했습니다: ${err.message}`));
  }, [logo, card.logoClear]);

  if (drawRef) drawRef.current = async () => {
    clearTimeout(timer.current);
    if (!bits.header) throw new Error("명함 틀을 아직 불러오는 중입니다. 잠시 후 다시 눌러 주세요.");
    if (!bits.photo) throw new Error("프로필 사진을 아직 불러오는 중입니다. 잠시 후 다시 눌러 주세요.");
    await renderCard(canvasRef.current, member, card, bits);
  };

  // 입력이 멈추고 0.3초 뒤에 다시 그린다
  useEffect(() => {
    if (!bits.header || !bits.photo) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setBusy(true);
      try { await renderCard(canvasRef.current, member, card, bits); } finally { setBusy(false); }
    }, 300);
    return () => clearTimeout(timer.current);
  }, [member.name, member.phone, member.phone2, member.email, card, bits]);

  // 프로필 사진: 배경이 있으면 바로 지운다
  async function pickPhoto(e) {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    try {
      set("photoAdj")(NO_ADJ); // 새 사진은 자동 배치부터
      say("photo", "사진 확인 중…");
      if (hasTransparentBg(await loadImage(file))) { setPhoto({ file }); return say("photo", ""); }
      say("photo", "배경 지우는 중… (처음 한 번은 10~30초)");
      setPhoto({ file: await removePersonBg(file, (msg) => say("photo", msg)) });
      say("photo", "");
    } catch (err) {
      say("photo", `배경 지우기 실패: ${err.message}`);
    }
  }
  function pickLogo(e) {
    const file = e.target.files[0];
    e.target.value = "";
    if (file) setLogo({ file });
  }

  async function fromLegacy() {
    say("legacy", "기존 명함에서 꺼내는 중…");
    try {
      const [p, l] = await Promise.all([extractPerson(legacyCard, (msg) => say("legacy", msg)), extractLogo(legacyCard)]);
      setPhoto({ file: p });
      if (l) setLogo({ file: l });
      say("legacy", l ? "" : "사진은 꺼냈고, 이 명함에서는 로고를 찾지 못했습니다.");
    } catch (err) {
      say("legacy", `꺼내기 실패: ${err.message}`);
    }
  }

  const photoBusy = work.photo.endsWith("…") || work.photo.includes("%");

  // 사진 손보기: 위치 1mm씩 ±5mm, 크기 5%씩 (비율 유지)
  const adj = { ...NO_ADJ, ...card.photoAdj };
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const nudge = (k, d) => set("photoAdj")({
    ...adj,
    [k]: k === "zoom" ? +clamp(adj.zoom + d, PHOTO_ADJ.zoomMin, PHOTO_ADJ.zoomMax).toFixed(2) : clamp(adj[k] + d, -PHOTO_ADJ.mm, PHOTO_ADJ.mm),
  });
  const mm = (v) => `${v > 0 ? "+" : ""}${v}mm`;
  return (
    <div className="card-maker">
      <div className="card-maker-form">
        <h3 className="card-maker-h">이미지 명함 정보</h3>
        <Field label="업종 한 줄 (파란 띠)" value={card.badge} onChange={set("badge")} placeholder="좋은 기분을 선물하는 문구점" />
        <div className="adm-grid adm-grid3">
          <Field label="명함에 쓸 회사명" value={card.company} onChange={set("company")} />
          <Field label="직함" value={card.title} onChange={set("title")} placeholder="대표" />
          <Field label="주황 직함 배지 (디렉터만)" value={card.role} onChange={set("role")} placeholder="런칭 디렉터" />
        </div>
        <Field label="회사명 아래 작은 줄 (있으면)" value={card.companySub} onChange={set("companySub")} placeholder="코스닥 상장기업" />
        <Field label="소개 문구 (3줄까지, 줄바꿈으로 나눔)" rows={2} value={card.intro} onChange={set("intro")} />
        <div className="adm-checks">
          <label><input type="radio" checked={card.introStyle !== "plain"} onChange={() => set("introStyle")("blue")} /> 파란 굵은 글씨</label>
          <label><input type="radio" checked={card.introStyle === "plain"} onChange={() => set("introStyle")("plain")} /> 검정 보통 글씨</label>
        </div>
        <Field label="강점 (한 줄에 하나, 8개까지)" rows={8} value={card.bullets} onChange={set("bullets")}
          hint="'-' '(' '1.'로 시작하는 줄은 위 항목 아래 작은 글씨로 붙습니다" placeholder={"B2B 사무용품 납품\n전문판매사 상시근무\n-SK KT LG 전담상담사"} />
        <small className="muted">연락처(휴대폰·전화·팩스·이메일·홈페이지·카카오톡·SNS·주소)는 위 멤버 정보 칸에서 가져옵니다. 비운 칸은 명함에서 빠집니다.</small>

        <div className="adm-photos">
          <div>
            <b>프로필 사진</b>
            <input type="file" accept="image/*" onChange={pickPhoto} disabled={photoBusy} />
            <small className={work.photo.includes("실패") ? "adm-warn" : "muted"}>
              {work.photo || "올리면 배경을 자동으로 지우고 명함 배경 위에 앉힙니다"}
            </small>
            {legacyCard && !photo && (
              <div className="adm-bg">
                <button type="button" className="adm-btn" disabled={work.legacy.endsWith("…") || work.legacy.includes("%")} onClick={fromLegacy}>기존 명함에서 사진·로고 꺼내기</button>
                <small className="muted">{work.legacy || "원본 사진이 없을 때만 쓰세요 (작은 명함은 흐릿할 수 있음)"}</small>
              </div>
            )}
          </div>
          <div>
            <b>회사 로고</b>
            <input type="file" accept="image/*" onChange={pickLogo} />
            <label className="adm-check"><input type="checkbox" checked={!!card.logoClear} onChange={(e) => set("logoClear")(e.target.checked)} /> 로고 배경 지우기 (끄면 배경 그대로)</label>
            <small className="muted">{work.logo || (logo ? "로고가 들어갔습니다" : "흰 바탕 로고는 그대로 둬도 자연스럽습니다")}</small>
          </div>
        </div>
      </div>

      <div className="card-maker-preview">
        <canvas ref={canvasRef} style={{ display: photo ? "block" : "none" }} />
        {!photo && (legacyCard
          ? <img src={legacyCard} alt="현재 명함" />
          : <div className="card-maker-empty">프로필 사진을 올리면<br />명함 미리보기가 나타납니다</div>)}
        {photo && (
          <div className="card-adj">
            <div className="card-adj-row">
              <button type="button" className="adm-btn" onClick={() => nudge("zoom", 0.05)} disabled={adj.zoom >= PHOTO_ADJ.zoomMax}>확대</button>
              <button type="button" className="adm-btn" onClick={() => nudge("zoom", -0.05)} disabled={adj.zoom <= PHOTO_ADJ.zoomMin}>축소</button>
              <button type="button" className="adm-btn" onClick={() => nudge("dy", -1)} disabled={adj.dy <= -PHOTO_ADJ.mm} aria-label="위로">↑</button>
              <button type="button" className="adm-btn" onClick={() => nudge("dy", 1)} disabled={adj.dy >= PHOTO_ADJ.mm} aria-label="아래로">↓</button>
              <button type="button" className="adm-btn" onClick={() => nudge("dx", -1)} disabled={adj.dx <= -PHOTO_ADJ.mm} aria-label="왼쪽으로">←</button>
              <button type="button" className="adm-btn" onClick={() => nudge("dx", 1)} disabled={adj.dx >= PHOTO_ADJ.mm} aria-label="오른쪽으로">→</button>
              <button type="button" className="adm-btn" onClick={() => set("photoAdj")(NO_ADJ)}>원래대로</button>
            </div>
            <small className="muted">사진 크기 {Math.round(adj.zoom * 100)}% · 가로 {mm(adj.dx)} · 세로 {mm(adj.dy)} (위치는 1mm씩 최대 ±5mm)</small>
          </div>
        )}
        <small className="muted">
          {photo ? (busy ? "그리는 중…" : "미리보기 — '등록'을 누르면 이 명함이 멤버 목록에 반영됩니다")
            : legacyCard ? "지금 쓰는 명함입니다. 프로필 사진을 올리면 위 정보로 새로 만들어집니다" : ""}
        </small>
        {onUploadCard && (
          <label className="card-maker-alt">
            완성된 명함 이미지가 따로 있으면 <span className="adm-link">직접 올리기</span>
            <input type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files[0]; e.target.value = ""; if (f) onUploadCard(f); }} />
          </label>
        )}
      </div>
    </div>
  );
}
