// 사진 주소: 관리자 화면에서 올린 사진은 Supabase 보관함 주소(https://…), 옛 사진은 public/ 폴더 파일
export function cardSrc(card) {
  if (!card) return null;
  return /^https?:\/\//.test(card) ? card : `/cards/${encodeURIComponent(card)}`;
}

// 다운로드 링크: 보관함 사진은 다른 주소라 ?download= 로 '저장'을 요청한다
export function cardDownloadHref(card, filename) {
  const src = cardSrc(card);
  if (!src) return null;
  return /^https?:\/\//.test(src) ? `${src}?download=${encodeURIComponent(filename)}` : src;
}

export function faceSrc(person, hasLocalFace) {
  if (person?.face) return person.face;
  return hasLocalFace ? `/faces/${encodeURIComponent(person.name)}.jpg` : null;
}

export function extOf(card) {
  const m = card?.match(/\.(jpe?g|png|webp)(\?|$)/i);
  return m ? `.${m[1].toLowerCase()}` : ".jpg";
}
