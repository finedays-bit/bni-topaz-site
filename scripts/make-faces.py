# 리더십팀 얼굴 사진 만들기 → public/faces/{이름}.jpg (정사각형 400px)
# - 챕터 멤버: public/cards 의 명함(npm run cards 먼저)에서 얼굴 부분을 잘라낸다 (파란 곡선 제거·가운데 정렬)
# - 지역 서포트 팀(디렉터·앰배서더)도 토파즈 틀로 만든 명함("이름 직책_토파즈")에서 똑같이 자른다
# 사용: npm run faces   (2단계부터는 관리자 페이지 사진 업로드가 대신한다)
import json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "faces")
SIZE = 400

# 명함 얼굴: 파란 곡선을 흰색으로 지우고, 머리 위치를 찾아 가운데로 맞춘다
SIDE = 0.40  # 얼굴 사진 한 변 = 명함 폭의 40%


def card_face(path):
    im = Image.open(path).convert("RGB")
    W, H = im.size
    a = np.asarray(im).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    # 밝고 파란 곳(명함 곡선)일수록 흰색으로 — 어두운 남색 정장은 그대로
    blue = np.clip((b - r - 20) / 35, 0, 1) * np.clip((b - 120) / 40, 0, 1)
    a = a * (1 - blue[..., None]) + 255 * blue[..., None]

    # 오른쪽 위에서 사람 찾기 (맨 위 BNI 로고 줄과 빨간 글자는 제외)
    x0, y0, y1 = int(W * 0.45), int(H * 0.075), int(H * 0.55)
    reg = a[y0:y1, x0:]
    rr, gg, bb = reg[..., 0], reg[..., 1], reg[..., 2]
    person = (reg.min(axis=2) < 215) & ~((rr - gg > 60) & (rr - bb > 60))
    top = np.where(person.sum(axis=1) > W * 0.04)[0][0]          # 머리 꼭대기
    xs = np.nonzero(person[top:top + int(W * 0.14)])[1]          # 머리 부분의 가로 위치
    cx = x0 + float(np.median(xs))
    side = W * SIDE
    cy = y0 + top + side * 0.40

    # 잘라내기 (명함 밖으로 나가면 흰색)
    clean = Image.fromarray(a.clip(0, 255).astype(np.uint8))
    pad = Image.new("RGB", (W * 2, H * 2), "white")
    pad.paste(clean, (W // 2, H // 2))
    box = (int(cx - side / 2) + W // 2, int(cy - side / 2) + H // 2,
           int(cx + side / 2) + W // 2, int(cy + side / 2) + H // 2)
    face = np.asarray(pad.crop(box).resize((SIZE, SIZE), Image.LANCZOS)).astype(np.float32)

    # 사람과 이어지지 않은 글자·로고 지우기: 아래 끝(몸)에 닿는 덩어리만 남긴다
    solid = ndimage.binary_dilation(face.min(axis=2) < 235, iterations=3)
    labels, _ = ndimage.label(solid)
    keep = np.isin(labels, np.unique(labels[-1][labels[-1] > 0]))
    face[~keep] = 255
    return Image.fromarray(face.astype(np.uint8))


def main():
    os.makedirs(OUT, exist_ok=True)
    cards = json.load(open(os.path.join(ROOT, "lib", "cards.json"), encoding="utf-8"))
    leaders = json.load(open(os.path.join(ROOT, "lib", "leadership.json"), encoding="utf-8"))
    names = [p["name"] for g in leaders["groups"] for p in g["people"]]
    done, missing = [], []
    for name in names:
        if name in cards:
            face = card_face(os.path.join(ROOT, "public", "cards", cards[name]["file"]))
        else:
            missing.append(name)
            continue
        face.save(os.path.join(OUT, f"{name}.jpg"), quality=88)
        done.append(name)
    print(f"얼굴 {len(done)}명 저장 → public/faces")
    if missing:
        print("사진 없음:", ", ".join(missing))


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
