"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { Field, SaveBar, useSetting } from "./shared";
import { about as aboutDefaults, formatKoreanDate } from "@/lib/data";
import { meetingDate } from "@/lib/invite";

const Loading = ({ status }) => <section className="adm-panel"><p className="muted">{status || "불러오는 중…"}</p></section>;

// 배열 안 한 칸 고치기
const patch = (arr, i, v) => arr.map((x, j) => (j === i ? { ...x, ...v } : x));
const move = (arr, i, d) => {
  const j = i + d;
  if (j < 0 || j >= arr.length) return arr;
  const a = [...arr];
  [a[i], a[j]] = [a[j], a[i]];
  return a;
};

// ── 챕터 소개글 ──────────────────────────────────────────────
export function AboutTab() {
  const { value: v, setValue, save, status } = useSetting("about", aboutDefaults);
  if (!v) return <Loading status={status} />;
  const set = (k) => (x) => setValue({ ...v, [k]: x });
  return (
    <section className="adm-panel">
      <h2>챕터 소개글</h2>
      <p className="muted">'챕터 소개' 페이지에 나오는 글입니다. 본문은 빈 줄로 문단을 나눕니다.</p>
      <Field label="큰 제목" value={v.headline} onChange={set("headline")} />
      <Field label="작은 영문 제목" value={v.sub} onChange={set("sub")} />
      <Field label="본문" rows={14} value={v.body} onChange={set("body")} />
      <Field label="맺음말 (가운데 강조)" rows={3} value={v.closing} onChange={set("closing")} />
      <Field label="안내 문구 (버튼 위)" rows={3} value={v.cta} onChange={set("cta")} />
      <SaveBar onSave={save} status={status} />
    </section>
  );
}

// 휴회일 입력: 쓰는 동안은 글자 그대로, 칸을 벗어나면 날짜만 골라 담는다
function SkipDates({ value, onChange }) {
  const [text, setText] = useState(value.join("\n"));
  const commit = () => onChange(text.split("\n").map((t) => t.trim()).filter((t) => /^\d{4}-\d{2}-\d{2}$/.test(t)));
  return (
    <Field label="휴회일 (이 날은 건너뛰고 다음 주로)" rows={3} value={text} onChange={setText}
      placeholder="2026-12-29" hint="한 줄에 하나, 2026-12-29 처럼. 칸 밖을 누르면 반영됩니다" onBlur={commit} />
  );
}

// 점수표 입력: 쓰는 동안은 글자 그대로, 칸을 벗어나면 '|' 가 있는 줄만 표로 담는다
function ScoreTable({ initial, onChange }) {
  const [text, setText] = useState(initial);
  const commit = () => onChange(text.split("\n").filter((s) => s.includes("|")).map((s) => s.split("|").map((c) => c.trim())));
  return <Field label="기본 표 (한 줄에 '교육점수 | 트래픽 점수')" rows={4} value={text} onChange={setText} onBlur={commit} />;
}

// ── 이번 주 초대장 ──────────────────────────────────────────────
export function InviteTab() {
  const { value: v, setValue, save, status } = useSetting("invite");
  const [copied, setCopied] = useState(false);
  if (!v) return <Loading status={status} />;
  const set = (k) => (x) => setValue({ ...v, [k]: x });
  const auto = v.auto !== false;
  const next = meetingDate(v);
  const link = typeof window !== "undefined" ? `${location.origin}/invite` : "/invite";
  const copy = async () => { try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {} };
  return (
    <section className="adm-panel">
      <h2>이번 주 초대장</h2>
      <div className="adm-card">
        <b>초대장 공유 링크 (매주 같은 주소)</b>
        <div className="adm-row"><code>{link}</code><button className="adm-btn" onClick={copy}>{copied ? "복사됨!" : "링크 복사"}</button></div>
        <p className="muted">지금 이 링크를 열면 <b>{formatKoreanDate(next)} {v.time}</b> 초대장이 보입니다.</p>
      </div>
      <div className="adm-checks">
        <label><input type="checkbox" checked={auto} onChange={(e) => set("auto")(e.target.checked)} /> 매주 화요일로 날짜 자동 갱신 (화요일 오전 9시가 지나면 다음 주로)</label>
      </div>
      <div className="adm-grid">
        {auto
          ? <SkipDates value={v.skipDates ?? []} onChange={set("skipDates")} />
          : <Field label="모임 날짜 (자동을 끈 경우)" type="date" value={v.date} onChange={set("date")} />}
        <Field label="시간" value={v.time} onChange={set("time")} />
        <Field label="장소" value={v.venue} onChange={set("venue")} />
        <Field label="드레스코드" value={v.dressCode} onChange={set("dressCode")} />
        <Field label="준비물" value={v.bring} onChange={set("bring")} />
        <Field label="참가비" value={v.fee} onChange={set("fee")} />
        <Field label="입금 계좌" value={v.account} onChange={set("account")} placeholder="은행 계좌번호 예금주" />
      </div>
      <SaveBar onSave={save} status={status} />
    </section>
  );
}

// ── 챕터 소개·숫자 ──────────────────────────────────────────────
export function ChapterTab() {
  const { value: v, setValue, save, status } = useSetting("chapter");
  if (!v) return <Loading status={status} />;
  const set = (k) => (x) => setValue({ ...v, [k]: x });
  const stats = v.stats ?? [];
  return (
    <section className="adm-panel">
      <h2>챕터 소개·실적 숫자</h2>
      <div className="adm-grid">
        <Field label="구호 앞" value={v.cheer?.[0]} onChange={(x) => set("cheer")([x, v.cheer?.[1] ?? ""])} />
        <Field label="구호 뒤 (파란 글씨)" value={v.cheer?.[1]} onChange={(x) => set("cheer")([v.cheer?.[0] ?? "", x])} />
        <Field label="슬로건 (영문)" value={v.slogan} onChange={set("slogan")} />
        <Field label="지역" value={v.region} onChange={set("region")} />
        <Field label="모임 요일" value={v.meetingDay} onChange={set("meetingDay")} />
        <Field label="모임 시간" value={v.meetingTime} onChange={set("meetingTime")} />
        <Field label="모임 장소" value={v.venue} onChange={set("venue")} />
      </div>
      <h3 className="adm-sub">메인 화면 실적 숫자 (부의장 보고 기준)</h3>
      {stats.map((s, i) => (
        <div className="adm-grid adm-grid3" key={i}>
          <Field label="이름" value={s.label} onChange={(x) => set("stats")(patch(stats, i, { label: x }))} />
          <Field label="숫자" value={s.value} onChange={(x) => set("stats")(patch(stats, i, { value: x }))} />
          <Field label="단위" value={s.unit} onChange={(x) => set("stats")(patch(stats, i, { unit: x }))} />
        </div>
      ))}
      <p className="muted">'활동 멤버 수'는 멤버 목록에서 자동으로 셉니다.</p>
      <SaveBar onSave={save} status={status} />
    </section>
  );
}

// ── 교육 정보 ──────────────────────────────────────────────────
export function EducationTab() {
  const { value: v, setValue, save, status } = useSetting("education");
  if (!v) return <Loading status={status} />;
  const items = v.items ?? [];
  const setItem = (i, x) => setValue({ ...v, items: patch(items, i, x) });
  const table = (v.scoreTable ?? []).map((r) => r.join(" | ")).join("\n");
  return (
    <section className="adm-panel">
      <h2>교육 정보</h2>
      {items.map((it, i) => (
        <div className="adm-card" key={i}>
          <b>{it.title}</b>
          <div className="adm-grid">
            <Field label="제목" value={it.title} onChange={(x) => setItem(i, { title: x })} />
            <Field label="설명" value={it.desc} onChange={(x) => setItem(i, { desc: x })} />
            <Field label="링크 (누르면 열릴 주소)" value={it.url} onChange={(x) => setItem(i, { url: x })}
              hint={it.icon === "book" ? "도서목록 구글 시트 주소. 비워 두면 '도서 선정 중'으로 표시" : undefined} />
            <Field label="점수 안내 (한 줄에 하나)" rows={2} value={(it.badges ?? []).join("\n")}
              onChange={(x) => setItem(i, { badges: x.split("\n").filter((s) => s.trim()) })} />
            {it.action && <>
              <Field label="버튼 글자" value={it.action.label} onChange={(x) => setItem(i, { action: { ...it.action, label: x } })} />
              <Field label="버튼 링크 (LT포럼 Zoom 등)" value={it.action.url} onChange={(x) => setItem(i, { action: { ...it.action, url: x } })} />
            </>}
          </div>
        </div>
      ))}
      <h3 className="adm-sub">월간 교육점수 적용 기준</h3>
      <Field label="구글 시트 CSV 주소 (넣으면 아래 표 대신 시트 내용을 보여줌)" value={v.scoreSheetCsv} onChange={(x) => setValue({ ...v, scoreSheetCsv: x })}
        hint="구글 시트 → 파일 → 공유 → 웹에 게시 → CSV 로 받은 주소. 첫 줄은 제목 줄" />
      <ScoreTable initial={table} onChange={(rows) => setValue({ ...v, scoreTable: rows })} />
      <SaveBar onSave={save} status={status} />
    </section>
  );
}

// ── RPS·링크 ──────────────────────────────────────────────────
export function LinksTab() {
  const links = useSetting("links");
  const rps = useSetting("rps_sheet");
  if (!links.value || !rps.value) return <Loading status={links.status || rps.status} />;
  return (
    <section className="adm-panel">
      <h2>RPS·외부 링크</h2>
      <div className="adm-grid">
        <Field label="BNI Connect 로그인 주소" value={links.value.bniConnect} onChange={(x) => links.setValue({ ...links.value, bniConnect: x })} />
        <Field label="RPS 사이트 주소" value={links.value.rps} onChange={(x) => links.setValue({ ...links.value, rps: x })} />
        <Field label="인스타그램 주소" value={links.value.instagram} onChange={(x) => links.setValue({ ...links.value, instagram: x })} hint="비워 두면 인스타그램 아이콘이 사라집니다" />
      </div>
      <SaveBar onSave={() => links.save()} status={links.status} />
      <h3 className="adm-sub">챕터 RPI 시트</h3>
      <Field label="RPI 시트 CSV 주소" value={rps.value.csv} onChange={(x) => rps.setValue({ ...rps.value, csv: x })}
        hint="'링크가 있는 모든 사용자 보기'로 공유된 시트의 …/export?format=csv&gid=… 주소" />
      <SaveBar onSave={() => rps.save()} status={rps.status} />
    </section>
  );
}

// ── 리더십팀 ──────────────────────────────────────────────────
export function LeadershipTab() {
  const { value: v, setValue, save, status } = useSetting("leadership");
  const [names, setNames] = useState([]);
  useEffect(() => {
    supabaseBrowser().from("members").select("name,company").order("sort").then(({ data }) => setNames(data ?? []));
  }, []);
  if (!v) return <Loading status={status} />;
  const groups = v.groups ?? [];
  const setGroups = (g) => setValue({ ...v, groups: g });
  const setPerson = (gi, pi, x) => setGroups(patch(groups, gi, { people: patch(groups[gi].people, pi, x) }));

  return (
    <section className="adm-panel">
      <h2>리더십팀</h2>
      <p className="muted">이름은 멤버 목록에 있는 이름과 같아야 얼굴·명함이 연결됩니다. 디렉터처럼 멤버가 아닌 분은 '멤버·명함' 탭에서 '멤버 아님'으로 먼저 추가하세요.</p>
      <div className="adm-grid">
        <Field label="기수" value={v.term} onChange={(x) => setValue({ ...v, term: x })} />
        <Field label="활동 기간" value={v.period} onChange={(x) => setValue({ ...v, period: x })} />
      </div>
      <datalist id="lt-names">{names.map((n) => <option key={n.name} value={n.name}>{n.company}</option>)}</datalist>
      {groups.map((g, gi) => (
        <div className="adm-card" key={gi}>
          <div className="adm-row">
            <Field label="묶음 이름" value={g.title} onChange={(x) => setGroups(patch(groups, gi, { title: x }))} />
            <button className="adm-btn adm-danger" onClick={() => confirm(`'${g.title}' 묶음을 지울까요?`) && setGroups(groups.filter((_, j) => j !== gi))}>묶음 삭제</button>
          </div>
          {g.people.map((p, pi) => (
            <div className="adm-person" key={pi}>
              <input value={p.role} placeholder="직책" onChange={(e) => setPerson(gi, pi, { role: e.target.value })} />
              <input value={p.name} placeholder="이름" list="lt-names" onChange={(e) => setPerson(gi, pi, { name: e.target.value })} />
              <button className="adm-btn" title="위로" onClick={() => setGroups(patch(groups, gi, { people: move(g.people, pi, -1) }))}>↑</button>
              <button className="adm-btn" title="아래로" onClick={() => setGroups(patch(groups, gi, { people: move(g.people, pi, 1) }))}>↓</button>
              <button className="adm-btn adm-danger" onClick={() => setGroups(patch(groups, gi, { people: g.people.filter((_, j) => j !== pi) }))}>빼기</button>
            </div>
          ))}
          <button className="adm-btn" onClick={() => setGroups(patch(groups, gi, { people: [...g.people, { role: "", name: "" }] }))}>+ 사람 추가</button>
        </div>
      ))}
      <button className="adm-btn" onClick={() => setGroups([...groups, { title: "새 묶음", people: [] }])}>+ 묶음 추가</button>
      <SaveBar onSave={save} status={status} />
    </section>
  );
}
