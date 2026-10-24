import Link from "next/link";
import { getSettings } from "@/lib/store";
import WantedFields from "../WantedFields";

export const metadata = { title: "찾는 전문분야 · BNI 토파즈 챕터" };
export const revalidate = 60;

export default async function WantedPage() {
  const { wanted } = await getSettings();
  return (
    <main>
      <div className="page-head wrap">
        <p className="eyebrow">Open Seats</p>
        <h1>토파즈가 찾고 있는 전문분야</h1>
        <p className="muted">
          지금 토파즈 멤버들이 고객을 가장 많이 소개해 드릴 수 있는데, 아직 자리가 비어 있는 분야입니다.
          아래 다섯 분야의 대표님을 가장 먼저 모시고, 그 밖의 분야도 함께 찾고 있습니다.
        </p>
      </div>

      <section className="wrap">
        <WantedFields wanted={wanted} full />
      </section>

      <section className="band">
        <div className="wrap cta-box">
          <p className="eyebrow">One Seat Per Field</p>
          <h2>한 전문분야에 한 분만 모십니다</h2>
          <p>BNI는 업종마다 한 명만 멤버가 될 수 있어, 먼저 오시는 분이 그 자리를 갖습니다.<br />
            해당 분야이시거나 주변에 이런 대표님이 계시면 이번 주 모임에 초대해 주세요.</p>
          <div className="actions">
            <Link href="/invite" className="btn btn-main">이번 주 모임 참관 신청</Link>
            <Link href="/members" className="btn btn-line">지금 멤버 보기</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
