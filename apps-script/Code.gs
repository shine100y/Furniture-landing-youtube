/**
 * 랜딩페이지 지원서 → 구글 시트 자동 저장
 *
 * 사용법
 * 1. 지원서를 받을 구글 시트를 열고 [확장 프로그램] → [Apps Script]
 * 2. 기본 코드를 모두 지우고 이 파일 내용을 붙여넣은 뒤 저장
 * 3. [배포] → [새 배포] → 유형: 웹 앱
 *    - 실행 계정: 나
 *    - 액세스 권한: 모든 사용자
 * 4. 권한 승인 후 나오는 "웹 앱 URL"을 js/main.js 의 SHEET_URL 에 넣기
 */

// 새 지원서가 들어올 때 알림 메일을 받을 주소 (비워두면 메일 안 보냄)
var NOTIFY_EMAIL = '';

// 지원서를 쌓을 시트(탭) 이름
var SHEET_NAME = '지원서';

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
    // 전화번호가 숫자로 바뀌어 맨 앞 0이 사라지지 않도록 글자로 저장
    var row = HEADERS.map(function (h) {
      var v = p[h[0]] == null ? '' : String(p[h[0]]).slice(0, 500);
      if (h[0] === 'phone') v = "'" + v;
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
  return out_({ ok: true, message: '지원서 수집 웹 앱이 정상 동작 중입니다.' });
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
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
