(() => {
  'use strict';
  if (document.getElementById('acrossb-local-helper')) return;
  const api=globalThis.AcrossBHelper;
  const host=document.createElement('aside'); host.id='acrossb-local-helper';
  host.style.cssText='position:fixed;right:18px;bottom:18px;z-index:2147483646;width:390px;max-width:95vw';
  const ui=host.attachShadow({mode:'open'});
  ui.innerHTML=`<style>
    :host{all:initial;font:14px/1.5 "Segoe UI",sans-serif;color:#172b3a}*{box-sizing:border-box}
    section{background:#fff;border:1px solid #bdccd6;border-radius:16px;box-shadow:0 10px 40px #102d3d30;overflow:hidden}
    header{background:#123849;color:white;padding:14px 18px;display:flex;justify-content:space-between;align-items:center}
    h2{font-size:17px;margin:0}small{font-size:11px}main{padding:16px}p{margin:0 0 12px;color:#526977}
    label{display:block;margin-bottom:10px}input[type=text]{width:100%;font:22px monospace;padding:12px;border:2px solid #37848b;border-radius:8px}
    button,select{font:inherit;border:1px solid #b6c7d0;border-radius:6px;background:#f4f8fa;padding:6px 10px;cursor:pointer}
    button:disabled{opacity:.4;cursor:default}#scan{background:#12636b;color:white;margin:10px 0}#status{padding:12px;background:#eaf3f5;border-radius:8px;overflow-wrap:anywhere}
    #log{max-height:220px;overflow:auto;margin-top:12px}article{border-bottom:1px solid #d9e4e9;padding:9px 0;overflow-wrap:anywhere}article small{color:#617884}
    #mini{background:transparent;color:white;border-color:#587780}footer{font-size:11px;color:#617884;margin-top:10px}
  </style><section><header><div><h2>AcrossB Flow · QR</h2><small>LOCAL WORK ASSISTANT</small></div><button id="mini" type="button" aria-label="패널 접기">접기</button></header><main>
    <p>작업 중 목록 · 배치 코드 날짜 기준<br>예: 09-23_473 → YYYY-09-23_473<br>09_23_473 형식도 사용할 수 있습니다.</p>
    <label>처리 모드 <button id="mode" type="button" value="dry">테스트 → 실제 선택 모드로 전환</button></label>
    <label><input id="basis" type="checkbox" checked> QR 날짜가 배치 코드 날짜임을 확인했습니다.</label>
    <label for="qr">스캐너 입력</label><input id="qr" type="text" maxlength="64" autocomplete="off" spellcheck="false" placeholder="09-23_473">
    <button id="scan" type="button">입력 처리</button>
    <div id="status" role="status" aria-live="polite">테스트 모드 · 입력창을 클릭한 뒤 스캔하세요.</div>
    <div id="log" aria-label="스캔 기록"></div><footer>Enter로 처리 · Enter 없는 스캐너는 입력 처리 클릭<br>기록은 이 탭 메모리에만 보관되며 새로고침 시 사라집니다.</footer>
  </main></section>`;
  document.documentElement.append(host);
  const $=id=>ui.getElementById(id), engine=new api.Engine(document,()=>location.href);
  let lastURL=location.href;
  function lookupLabel(raw) {
    try {
      const qr=api.parseQR(raw);
      return `${qr.month}-${qr.day}_${qr.batch}`;
    } catch { return null; }
  }
  function log(out, raw) {
    const at=new Date().toLocaleString('ko-KR',{hour12:false});
    const lookup=lookupLabel(raw);
    $('status').textContent=[out.result,lookup&&`검색 ${lookup}`,out.code].filter(Boolean).join(' · ');
    const item=document.createElement('article');
    const time=document.createElement('small');time.textContent=at;
    const text=document.createElement('div');text.textContent=`${raw}${lookup?' → 검색 '+lookup:''} → ${out.result}${out.code?' · '+out.code:''}`;
    item.append(time,text);
    if(out.undo){const undo=document.createElement('button');undo.type='button';undo.textContent='이 선택 취소';
      undo.addEventListener('click',async()=>{if(engine.busy)return;undo.disabled=true;
        const result=await engine.run(raw,{dry:$('mode').value!=='live',dateConfirmed:$('basis').checked,undoCode:out.code});
        log(result,`취소 ${raw}`); if(result.result!=='선택 취소됨'&&result.result!=='이미 해제됨')undo.disabled=false;
      });item.append(undo);}
    $('log').prepend(item);
  }
  async function submit(){const raw=$('qr').value;if(!raw)return;$('qr').value='';
    const out=await engine.run(raw,{dry:$('mode').value!=='live',dateConfirmed:$('basis').checked});log(out,raw);$('qr').focus();}
  $('scan').addEventListener('click',submit);
  // Do not let scanner Enter reach the site's handlers or forms.
  $('qr').addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter'){e.preventDefault();if(!e.repeat)submit();}});
  for(const event of ['keyup','keypress','input','change','click']) ui.addEventListener(event,e=>e.stopPropagation());
  $('mode').addEventListener('click',()=>{if(engine.busy)return;$('mode').value=$('mode').value==='dry'?'live':'dry';$('mode').textContent=$('mode').value==='dry'?'테스트 → 실제 선택 모드로 전환':'실제 선택 → 테스트 모드로 전환';$('status').textContent=$('mode').value==='dry'?'테스트 모드: 체크하지 않습니다.':'실제 선택 모드: 날짜 기준을 확인한 뒤 스캔하세요.';});
  $('mini').addEventListener('click',()=>{const main=ui.querySelector('main');main.hidden=!main.hidden;$('mini').textContent=main.hidden?'펼치기':'접기';});
  function route(){host.hidden=!api.allowed(location.href);if(location.href!==lastURL){lastURL=location.href;$('mode').value='dry';$('mode').textContent='테스트 → 실제 선택 모드로 전환';$('basis').checked=true;$('qr').value='';engine.owned.clear();}}
  route();setInterval(route,300);
})();


