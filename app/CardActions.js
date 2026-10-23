"use client";

import { useState } from "react";
import Icon from "./Icon";
import { cardDownloadHref, extOf } from "@/lib/media";

// 명함 아래 버튼: 전화하기 · 연락처 저장 · 이미지 다운로드 · 링크 복사
export default function CardActions({ p }) {
  const [copied, setCopied] = useState(false);
  const name = encodeURIComponent(p.name);
  const fileName = `${p.company} ${p.name} 명함${extOf(p.card)}`;

  async function copyLink() {
    const url = `${window.location.origin}/card/${name}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // 클립보드 권한이 없는 브라우저용
      const t = document.createElement("textarea");
      t.value = url;
      document.body.appendChild(t);
      t.select();
      document.execCommand("copy");
      t.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="card-actions" onClick={(e) => e.stopPropagation()}>
      {p.phone && (
        <a className="ca-btn ca-main" href={`tel:${p.phone.replace(/-/g, "")}`}>
          <Icon name="phone" size={17} /> 전화하기
        </a>
      )}
      {p.email && (
        <a className="ca-btn" href={`mailto:${p.email}`}>
          <Icon name="mail" size={17} /> 이메일
        </a>
      )}
      <a className="ca-btn" href={`/vcard/${name}`} download={`${p.name}.vcf`}>
        <Icon name="contact" size={17} /> 연락처 저장
      </a>
      {p.card && (
        <a className="ca-btn" href={cardDownloadHref(p.card, fileName)} download={fileName}>
          <Icon name="download" size={17} /> 명함 다운로드
        </a>
      )}
      <button type="button" className="ca-btn" onClick={copyLink}>
        <Icon name="link" size={17} /> {copied ? "복사됨!" : "링크 복사"}
      </button>
    </div>
  );
}
