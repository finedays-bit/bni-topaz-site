# 리더십팀 얼굴 사진 만들기 → public/faces/{이름}.jpg (정사각형 400px)
# - 챕터 멤버: public/cards 의 명함(npm run cards 먼저)에서 얼굴 부분을 잘라낸다
# - 지역 서포트 팀(디렉터·앰배서더): 오렌지 챕터 사이트에 올라간 같은 인물의 사진을 받아온다
# 사용: npm run faces   (2단계부터는 관리자 페이지 사진 업로드가 대신한다)
import io, json, os, sys, urllib.request
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "faces")
SIZE = 400

# 명함 틀이 모두 같아서 얼굴은 대체로 오른쪽 위에 있다: (가로 중심, 세로 중심, 한 변) — 명함 폭·높이에 대한 비율
DEFAULT = (0.79, 0.24, 0.40)
ADJUST = {
    "김나래": (0.74, 0.24, 0.40),
    "황미영": (0.78, 0.24, 0.40),
    "이주호": (0.79, 0.26, 0.42),
    "백소현": (0.78, 0.27, 0.40),
    "김연진": (0.77, 0.25, 0.36),
    "김광섭": (0.77, 0.24, 0.44),
}

ORANGE = "https://kvseuksnbrvrfwzqlmzv.supabase.co/storage/v1/object/public/member-cards/orange"
# (주소, 가로 중심, 세로 중심, 한 변) — 비율은 사진 폭 기준, 세로 중심만 사진 높이 기준
EXTERNAL = {
    "채승병": (f"{ORANGE}/members/318518c9-4625-4edc-a4c8-299475053997.jpg", 0.50, 0.36, 0.46),
    "성정훈": (f"{ORANGE}/ambassadors/61622548-3679-4556-bc18-9e7ee533ef80.jpg", 0.47, 0.29, 0.58),
    "민건홍": (f"{ORANGE}/members/70e43944-620e-40e6-8a4d-a7cfba306971.jpg", 0.50, 0.50, 1.00),
}


def square(im, cx, cy, side):
    half = side / 2
    box = (int(cx - half), int(cy - half), int(cx + half), int(cy + half))
    return im.crop(box).resize((SIZE, SIZE), Image.LANCZOS)


def main():
    os.makedirs(OUT, exist_ok=True)
    cards = json.load(open(os.path.join(ROOT, "lib", "cards.json"), encoding="utf-8"))
    leaders = json.load(open(os.path.join(ROOT, "lib", "leadership.json"), encoding="utf-8"))
    names = [p["name"] for g in leaders["groups"] for p in g["people"]]
    done, missing = [], []
    for name in names:
        if name in EXTERNAL:
            url, fx, fy, fs = EXTERNAL[name]
            data = urllib.request.urlopen(url, timeout=20).read()
            im = Image.open(io.BytesIO(data)).convert("RGB")
            w, h = im.size
            face = square(im, fx * w, fy * h, fs * w)
        elif name in cards:
            im = Image.open(os.path.join(ROOT, "public", "cards", cards[name]["file"])).convert("RGB")
            w, h = im.size
            fx, fy, fs = ADJUST.get(name, DEFAULT)
            face = square(im, fx * w, fy * h, fs * w)
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
