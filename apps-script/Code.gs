/**
 * 가구설치기사 랜딩(유튜브) 지원서 → 구글 시트 [유튜브_가구_자체폼] 탭 자동 저장
 *
 * ⚠️ 이 코드는 시트의 [확장 프로그램 → Apps Script]에 넣지 마세요.
 *    그 시트에는 다른 폼들의 자동 입력 코드가 이미 있어서 서로 충돌할 수 있어요.
 *    script.google.com 에서 [새 프로젝트]로 따로 만들어서 사용하세요.
 *
 * 사용법
 * 1. https://script.google.com → [새 프로젝트]
 * 2. 기본 코드를 모두 지우고 이 파일 내용을 붙여넣은 뒤 저장
 * 3. [배포] → [새 배포] → 유형: 웹 앱
 *    - 실행 계정: 나
 *    - 액세스 권한: 모든 사용자
 * 4. 권한 승인 후 나오는 "웹 앱 URL"을 랜딩 담당자에게 전달
 *
 * 다른 탭과 기존 자동 입력 코드는 건드리지 않고, 아래 탭에만 한 줄씩 추가합니다.
 */

// 저장할 스프레드시트 (광고테스트)
var SPREADSHEET_ID = '1WvKNQxoDLCTHDoH2yrgE3WFRByIuLpqgn2LZvFI331U';

// 저장할 탭: 탭 고유번호(gid)로 먼저 찾고, 없으면 이름으로 찾습니다.
// 탭 이름을 바꿔도 gid는 그대로라 계속 같은 탭에 저장돼요.
var TARGET_GID = 545631075;
var TARGET_NAME = '유튜브_가구_자체폼';

// 새 지원 알림 메일을 받을 주소 (비워두면 메일 안 보냄)
var NOTIFY_EMAIL = '';

var HEADERS = [
  ['receivedAt', '접수시각'],
  ['page', '페이지'],
  ['name', '이름'],
  ['phone', '연락처'],
  ['sido', '시·도'],
  ['sigungu', '시·군·구'],
  ['age', '나이'],
  ['license', '운전면허'],
  ['agreePrivacy', '개인정보동의'],
  ['agreeMarketing', '마케팅동의'],
  ['device', '기기'],
  ['utm_source', '유입(utm_source)'],
  ['utm_medium', '매체(utm_medium)'],
  ['utm_campaign', '캠페인(utm_campaign)'],
  ['utm_content', '콘텐츠(utm_content)'],
  ['utm_term', '키워드(utm_term)'],
  ['referrer', '이전 페이지'],
  ['url', '접수 페이지 주소']
];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var p = (e && e.parameter) || {};
    if (!p.name || !p.phone) return out_({ ok: false, error: 'missing' });

    var sheet = getSheet_();
    p.receivedAt = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
    var row = HEADERS.map(function (h) {
      var v = p[h[0]] == null ? '' : String(p[h[0]]).slice(0, 500);
      // 수식으로 해석되는 값 차단, 전화번호 앞자리 0 유지
      if (/^[=+\-@]/.test(v) || h[0] === 'phone') v = "'" + v;
      return v;
    });
    sheet.appendRow(row);

    if (NOTIFY_EMAIL) {
      MailApp.sendEmail(NOTIFY_EMAIL,
        '[새 지원] ' + (p.page || '') + ' - ' + p.name,
        HEADERS.map(function (h, i) { return h[1] + ': ' + String(row[i]).replace(/^'/, ''); }).join('\n'));
    }
    return out_({ ok: true });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// 브라우저로 웹 앱 URL을 열었을 때 연결 확인용
function doGet() {
  var name = '';
  try { name = getSheet_().getName(); } catch (err) { name = '탭을 찾지 못함: ' + err; }
  return out_({ ok: true, message: '지원서 수집 웹 앱 정상 동작 중', tab: name });
}

// 배포 전에 편집기에서 한 번 실행해 보면 권한 승인 + 탭 연결을 미리 확인할 수 있어요.
function testConnection() {
  var sheet = getSheet_();
  Logger.log('연결된 탭: ' + sheet.getName() + ' / 마지막 행: ' + sheet.getLastRow());
}

function getSheet_() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = null;
  var all = ss.getSheets();
  for (var i = 0; i < all.length; i++) {
    if (all[i].getSheetId() === TARGET_GID) { sheet = all[i]; break; }
  }
  if (!sheet) sheet = ss.getSheetByName(TARGET_NAME);
  if (!sheet) throw new Error('[' + TARGET_NAME + '] 탭을 찾을 수 없습니다.');

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS.map(function (h) { return h[1]; }));
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#FFCD4A');
  }
  return sheet;
}

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
