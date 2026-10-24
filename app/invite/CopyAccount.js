"use client";

import { useState } from "react";

// 참가비 계좌: 누르면 계좌번호(숫자·-)만 복사해서 은행 앱에 바로 붙여 넣게 한다
export default function CopyAccount({ account }) {
  const [copied, setCopied] = useState(false);
  const number = account.match(/\d[\d-]{5,}\d/)?.[0] ?? account;

  async function copy() {
    try {
      await navigator.clipboard.writeText(number);
    } catch {
      const t = document.createElement("textarea");
      t.value = number;
      document.body.appendChild(t);
      t.select();
      document.execCommand("copy");
      t.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <span className="account">
      <span className="nowrap">{account}</span>
      <button type="button" className="account-copy" onClick={copy}>{copied ? "복사됨 ✓" : "계좌번호 복사"}</button>
    </span>
  );
}
