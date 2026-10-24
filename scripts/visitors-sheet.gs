// BNI 토파즈 참관 신청 시트 — 관리자 Gmail(공용 계정)의 구글 시트에 붙이는 Apps Script
// 붙이는 법: 시트 메뉴 '확장 프로그램 → Apps Script' → 이 글 전체 붙여 넣기 → 저장
//          → '배포 → 새 배포 → 유형: 웹 앱' (실행: 나, 액세스: 모든 사용자) → 나온 주소(/exec)를
//          사이트 .env.local 의 VISITOR_SHEET_WEBHOOK= 에 넣는다 (주소는 비밀번호처럼 다룬다)
// 읽기(doGet)는 없다 — 이 주소로는 시트 내용을 볼 수 없고, 쓰기만 된다
const TAB = "참관신청";

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const book = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = book.getSheetByName(TAB) || book.insertSheet(TAB, 0);

    if (body.mode === "replace") {
      // 관리자 화면의 '구글 시트로 열기': 전체를 새로 쓴다 (사이트 관리자 화면이 원본)
      sheet.clearContents();
      const table = [body.header].concat(body.rows);
      sheet.getRange(1, 1, table.length, body.header.length).setValues(table);
    } else if (body.mode === "append") {
      // 새 신청이 들어올 때: 머리줄 바로 아래(최신이 위)에 한 줄 넣는다
      if (sheet.getLastRow() === 0) sheet.appendRow(body.header);
      sheet.insertRowAfter(1);
      sheet.getRange(2, 1, 1, body.row.length).setValues([body.row]);
    } else {
      throw new Error("알 수 없는 요청");
    }
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, sheet.getLastColumn()).setFontWeight("bold").setBackground("#e8eefc");
    return reply({ ok: true, url: book.getUrl() + "#gid=" + sheet.getSheetId() });
  } catch (err) {
    return reply({ ok: false, error: String(err.message || err) });
  }
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
