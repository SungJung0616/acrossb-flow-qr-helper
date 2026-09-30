/* No network, cookie, storage, credential, or completion API access. */
(function (root) {
  'use strict';
  const HOST = 'https://axb-us-cpm-1.flow.acrossb.io';
  const fail = (message) => { throw new Error(message); };
  const norm = s => String(s).replace(/\s+/g, ' ').trim();
  function allowed(url) {
    try { const u = new URL(url); return u.origin === HOST && u.pathname === '/flow/work-groups' &&
      u.searchParams.getAll('tab').length === 1 && u.searchParams.get('tab') === 'JOB_IN_PROGRESS' && !u.hash; }
    catch { return false; }
  }
  function dateOK(y, m, d) {
    const dt = new Date(Date.UTC(y, m - 1, d));
    return y >= 1000 && dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
  }
  function parseQR(raw) {
    const text = String(raw).replace(/[\r\n]+$/, '');
    const m = /^(\d{2})[-_](\d{2})_([1-9]\d{0,11})$/.exec(text);
    if (!m || !dateOK(2000, +m[1], +m[2])) fail('형식 오류');
    return {month:m[1], day:m[2], batch:m[3], key:`${m[1]}_${m[2]}_${m[3]}`};
  }
  function parseCode(text) {
    const m = /^(\d{4})-(\d{2})-(\d{2})_([1-9]\d{0,11})$/.exec(text);
    if (!m || !dateOK(+m[1], +m[2], +m[3])) fail('날짜/배치 코드 불명확');
    return {year:m[1], month:m[2], day:m[3], batch:m[4], code:text};
  }
  function visible(e) {
    if (!e || !e.isConnected || e.closest('[hidden], [aria-hidden="true"], [inert]')) return false;
    const s = e.ownerDocument.defaultView.getComputedStyle(e);
    return s.visibility !== 'hidden' && s.display !== 'none' && e.getClientRects().length > 0;
  }
  function inspect(doc, url) {
    if (!allowed(url)) fail('대상 페이지 아님');
    if (doc.querySelector('[role="dialog"], [aria-modal="true"], [aria-busy="true"]')) fail('화면 구조 불명확: 대화상자/로딩');
    const tabs = [...doc.querySelectorAll('button')].filter(e => /^작업 중\s*\d/.test(norm(e.textContent)) && visible(e));
    if (tabs.length !== 1 || !tabs[0].querySelector('.bg-grayblue-50')) fail('작업 중 탭 확인 실패');
    const count = /작업 중\s*([\d,]+)배치\s*\//.exec(norm(tabs[0].textContent));
    if (!count) fail('전체 배치 수 확인 실패');
    const headers = [...doc.querySelectorAll('span')].filter(e => norm(e.textContent) === '고객사 / 배치 코드' && visible(e));
    if (headers.length !== 1) fail('날짜 기준/헤더 확인 실패');
    const header = headers[0].parentElement.parentElement;
    const container = header.parentElement;
    if (container.children.length !== 2 || container.firstElementChild !== header ||
        header.querySelectorAll('input[type="checkbox"]').length !== 1) fail('화면 구조 불명확: 목록');
    const list = container.children[1];
    const rowEls = [...list.querySelectorAll('div[role="button"]')].filter(e => e.querySelector('input[type="checkbox"]'));
    if (rowEls.length !== +count[1].replace(/,/g, '')) fail('전체 목록 미확인: 필터/부분 로딩');
    const rows = rowEls.map(row => {
      const line = row.firstElementChild;
      const checks = row.querySelectorAll('input[type="checkbox"]');
      if (!visible(row) || row.getAttribute('tabindex') !== '0' || checks.length !== 1 || !line ||
          !line.children[0]?.contains(checks[0])) fail('화면 구조 불명확: 행/체크박스');
      const field = line.children[1];
      const identity = field?.children.length === 2 ? field.lastElementChild : null;
      const spans = identity ? [...identity.children].filter(e => e.tagName === 'SPAN') : [];
      if (spans.length !== 2 || !norm(spans[0].textContent) || !visible(spans[1])) fail('날짜 기준/배치 필드 불명확');
      const code = parseCode(norm(spans[1].textContent));
      const cb = checks[0];
      return {...code, row, cb, customer:norm(spans[0].textContent), checked:cb.checked,
        disabled:cb.disabled || cb.matches(':disabled') || !!cb.closest('[aria-disabled="true"], [inert]'),
        indeterminate:cb.indeterminate || cb.getAttribute('aria-checked') === 'mixed'};
    });
    return {rows, list};
  }
  function match(snapshot, qr) {
    const found = snapshot.rows.filter(r => r.month === qr.month && r.day === qr.day && r.batch === qr.batch);
    if (!found.length) fail('배치 없음');
    if (found.length !== 1) fail('복수 일치');
    const r = found[0];
    if (r.disabled || r.indeterminate || !visible(r.cb)) fail('체크박스 사용 불가');
    return r;
  }
  const signature = s => s.rows.map(r=>[r.code,r.customer,r.checked,r.disabled,r.indeterminate].join('|')).join('\n');
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
  class Engine {
    constructor(doc, getURL) { this.doc=doc; this.getURL=getURL; this.busy=false; this.owned=new Map(); }
    async run(raw, {dry=true, dateConfirmed=false, undoCode=null}={}) {
      if (this.busy) return {result:'처리 중: 재스캔 필요', raw};
      this.busy=true;
      let r;
      try {
        const qr=parseQR(raw);
        let s=inspect(this.doc,this.getURL()); r=match(s,qr);
        if (undoCode && (r.code!==undoCode || this.owned.get(undoCode)!==r.cb)) fail('취소 불가: 이 도구의 선택 이력/행이 변경됨');
        if (!dry && !dateConfirmed) fail('날짜 기준 확인 필요');
        if (!undoCode && r.checked) return {result:'이미 선택됨',code:r.code,raw};
        if (undoCode && !r.checked) { this.owned.delete(r.code); return {result:'이미 해제됨',code:r.code,raw}; }
        await pause(220);
        const fresh=inspect(this.doc,this.getURL()); const next=match(fresh,qr);
        if (signature(s)!==signature(fresh) || r.cb!==next.cb || r.row!==next.row) fail('목록 변경됨: 재스캔 필요');
        r=next;
        if (dry) return {result:'테스트: 1행 일치 (체크 안 함)',code:r.code,raw};
        // Last synchronous preflight; only this exact native checkbox is activated.
        if (!allowed(this.getURL()) || !r.cb.isConnected || !visible(r.cb) || r.cb.disabled) fail('대상 변경됨');
        r.cb.click();
        await pause(150);
        const after=inspect(this.doc,this.getURL()); const selected=match(after,qr);
        const desired=!undoCode;
        if (selected.code!==r.code || selected.checked!==desired) fail('선택 상태 확인 실패: 화면 확인 필요');
        const othersBefore=s.rows.filter(x=>x.cb!==r.cb).map(x=>[x.code,x.customer,x.checked]);
        const othersAfter=after.rows.filter(x=>x.cb!==selected.cb).map(x=>[x.code,x.customer,x.checked]);
        if (JSON.stringify(othersBefore)!==JSON.stringify(othersAfter)) fail('다른 행 변경 감지: 화면 확인 필요');
        if (undoCode) this.owned.delete(r.code); else this.owned.set(r.code,selected.cb);
        if (!undoCode) selected.row.scrollIntoView?.({behavior:'smooth',block:'center',inline:'nearest'});
        return {result:undoCode?'선택 취소됨':'선택됨',code:r.code,raw,undo:!undoCode};
      } catch(e) { return {result:e.message,raw,code:r?.code}; }
      finally { this.busy=false; }
    }
  }
  const api={allowed,parseQR,parseCode,inspect,match,Engine};
  if (typeof module!=='undefined') module.exports=api; else root.AcrossBHelper=api;
})(typeof globalThis!=='undefined'?globalThis:this);

