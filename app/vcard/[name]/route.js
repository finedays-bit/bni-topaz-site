import { toVCard } from "@/lib/profiles";
import { getPeople, getPerson } from "@/lib/store";

// 연락처 파일(.vcf): 아이폰은 바로 '연락처 추가' 화면, 갤럭시는 받은 파일을 눌러 주소록에 저장
export const revalidate = 60;

export async function generateStaticParams() {
  return (await getPeople()).map((p) => ({ name: p.name }));
}

export async function GET(_req, { params }) {
  const p = await getPerson(decodeURIComponent((await params).name));
  if (!p) return new Response("없는 멤버입니다", { status: 404 });
  return new Response(toVCard(p), {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="contact.vcf"; filename*=UTF-8''${encodeURIComponent(p.name)}.vcf`,
    },
  });
}
