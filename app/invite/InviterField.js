"use client";

import { useState } from "react";

const OTHER = "__other__";

// 초대한 멤버: 목록에서 고르거나, 목록에 없으면(타 챕터·신규 멤버) 직접 입력
export default function InviterField({ members }) {
  const [choice, setChoice] = useState("");

  return (
    <>
      <label>
        초대한 멤버
        <select name="inviter" value={choice} onChange={(e) => setChoice(e.target.value)}>
          <option value="">선택 안 함</option>
          {members.map((m) => <option key={m.name}>{m.name} ({m.company})</option>)}
          <option value={OTHER}>그 외 멤버 (직접 입력)</option>
        </select>
      </label>
      {choice === OTHER && (
        <label>
          초대한 멤버 이름
          <input name="inviterOther" placeholder="예: 홍길동 (OO챕터)" autoFocus />
        </label>
      )}
    </>
  );
}
