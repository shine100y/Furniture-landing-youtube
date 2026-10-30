/* =========================================================
   설정: 구글 앱스 스크립트 배포 후 나온 "웹 앱 URL"을 아래에 붙여넣으세요.
   비어 있으면 테스트 모드(실제 전송 없이 완료 화면만 표시)로 동작합니다.
   ========================================================= */
var SHEET_URL = '';
var PAGE_NAME = '가구설치기사';

(function () {
  'use strict';

  /* ---------- 유입경로(utm) 기억 ---------- */
  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  var params = new URLSearchParams(location.search);
  var store = {};
  try { store = JSON.parse(sessionStorage.getItem('lp_utm') || '{}'); } catch (e) {}
  UTM_KEYS.forEach(function (k) { if (params.get(k)) store[k] = params.get(k); });
  if (!store.referrer && document.referrer) store.referrer = document.referrer;
  try { sessionStorage.setItem('lp_utm', JSON.stringify(store)); } catch (e) {}

  /* ---------- 하단 고정 버튼: 지원 폼이 보이면 숨김 ---------- */
  var dock = document.getElementById('dock');
  var applySec = document.getElementById('apply');
  if ('IntersectionObserver' in window && dock && applySec) {
    new IntersectionObserver(function (entries) {
      dock.classList.toggle('is-hidden', entries[0].isIntersecting);
    }, { rootMargin: '0px 0px -30% 0px' }).observe(applySec);
  }

  /* ---------- 폼 ---------- */
  var form = document.getElementById('applyForm');
  if (!form) return;
  var sido = document.getElementById('f-sido');
  var sigungu = document.getElementById('f-sigungu');
  var phone = document.getElementById('f-phone');
  var agreeAll = document.getElementById('agreeAll');
  var agreePrivacy = document.getElementById('agreePrivacy');
  var agreeMarketing = document.getElementById('agreeMarketing');
  var submitBtn = document.getElementById('submitBtn');
  var statusEl = document.getElementById('formStatus');
  var doneBox = document.getElementById('doneBox');

  Object.keys(window.REGIONS || {}).forEach(function (name) {
    sido.add(new Option(name, name));
  });
  sido.addEventListener('change', function () {
    sigungu.length = 1;
    var list = (window.REGIONS || {})[sido.value] || [];
    list.forEach(function (n) { sigungu.add(new Option(n, n)); });
    sigungu.disabled = !list.length;
    if (list.length === 1) sigungu.value = list[0];
  });

  phone.addEventListener('input', function () {
    var d = phone.value.replace(/\D/g, '').slice(0, 11);
    if (d.length < 4) phone.value = d;
    else if (d.length < 8) phone.value = d.slice(0, 3) + '-' + d.slice(3);
    else if (d.length === 10) phone.value = d.slice(0, 3) + '-' + d.slice(3, 6) + '-' + d.slice(6);
    else phone.value = d.slice(0, 3) + '-' + d.slice(3, 7) + '-' + d.slice(7);
  });

  agreeAll.addEventListener('change', function () {
    agreePrivacy.checked = agreeMarketing.checked = agreeAll.checked;
  });
  [agreePrivacy, agreeMarketing].forEach(function (c) {
    c.addEventListener('change', function () {
      agreeAll.checked = agreePrivacy.checked && agreeMarketing.checked;
    });
  });

  function setErr(key, msg, el) {
    var p = form.querySelector('.err[data-for="' + key + '"]');
    if (p) p.textContent = msg || '';
    if (el) el.classList.toggle('is-invalid', !!msg);
    return !msg;
  }

  function validate() {
    var ok = true, first = null;
    function check(cond, key, msg, el) {
      var good = setErr(key, cond ? '' : msg, el);
      if (!good) { ok = false; if (!first) first = el || form.querySelector('[data-for="' + key + '"]'); }
    }
    var name = form.elements['name'].value.trim();
    check(name.length >= 2, 'name', '이름을 입력해주세요.', form.elements['name']);
    check(/^01[016789]-?\d{3,4}-?\d{4}$/.test(phone.value), 'phone', '휴대폰 번호를 정확히 입력해주세요. 예: 010-1234-5678', phone);
    check(sido.value && sigungu.value, 'region', '시·도와 시·군·구를 모두 선택해주세요.', sido.value ? sigungu : sido);
    var age = parseInt(form.elements['age'].value, 10);
    check(age >= 19 && age <= 75, 'age', '나이를 숫자로 입력해주세요. (19~75)', form.elements['age']);
    var lic = form.querySelector('input[name="license"]:checked');
    check(!!lic, 'license', '운전면허 종류를 선택해주세요.', null);
    check(agreePrivacy.checked, 'agree', '개인정보 수집 및 이용에 동의해야 지원할 수 있어요.', null);
    if (first && first.focus) first.focus();
    else if (first) first.scrollIntoView({ block: 'center' });
    return ok;
  }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    statusEl.textContent = '';
    if (form.elements['website'].value) return; // 스팸 봇
    if (!validate()) return;

    var lic = form.querySelector('input[name="license"]:checked');
    var data = {
      page: PAGE_NAME,
      name: form.elements['name'].value.trim(),
      phone: phone.value,
      sido: sido.value,
      sigungu: sigungu.value,
      age: form.elements['age'].value,
      license: lic ? lic.value : '',
      agreePrivacy: agreePrivacy.checked ? 'Y' : 'N',
      agreeMarketing: agreeMarketing.checked ? 'Y' : 'N',
      device: window.matchMedia('(min-width:900px)').matches ? 'PC' : '모바일',
      url: location.href.split('#')[0]
    };
    UTM_KEYS.concat(['referrer']).forEach(function (k) { data[k] = store[k] || ''; });

    submitBtn.disabled = true;
    submitBtn.textContent = '보내는 중…';

    var finish = function () {
      form.hidden = true;
      doneBox.hidden = false;
      doneBox.focus();
      doneBox.scrollIntoView({ block: 'center' });
    };

    if (!SHEET_URL) { // 테스트 모드
      console.info('[테스트 모드] 전송될 데이터:', data);
      setTimeout(finish, 500);
      return;
    }

    fetch(SHEET_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: new URLSearchParams(data)
    }).then(finish).catch(function () {
      submitBtn.disabled = false;
      submitBtn.textContent = '지원서 보내기';
      statusEl.textContent = '전송에 실패했어요. 인터넷 연결을 확인한 뒤 다시 눌러주세요.';
    });
  });
})();
