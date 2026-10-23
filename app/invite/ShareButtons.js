"use client";

import { useState } from "react";
import Icon from "../Icon";

// 초대장 공유: 링크는 항상 같은 주소(/invite) — 날짜는 매주 자동으로 바뀐다
export default function ShareButtons({ text }) {
  const [copied, setCopied] = useState(false);
  const url = () => `${window.location.origin}/invite`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url());
    } catch {
      const t = document.createElement("textarea");
      t.value = url();
      document.body.appendChild(t);
      t.select();
      document.execCommand("copy");
      t.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function share() {
    if (navigator.share) {
      try { await navigator.share({ title: "BNI 토파즈 챕터 초대장", text, url: url() }); } catch {}
    } else copy();
  }

  return (
    <div className="share">
      <button type="button" className="btn btn-line" onClick={copy}>
        <Icon name="link" size={17} /> {copied ? "링크 복사됨!" : "초대장 링크 복사"}
      </button>
      <button type="button" className="btn btn-line" onClick={share}>
        <Icon name="external" size={17} /> 카카오톡 등으로 공유
      </button>
    </div>
  );
}
