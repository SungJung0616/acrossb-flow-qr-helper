(() => {
  'use strict';
  if (document.getElementById('acrossb-local-helper')) return;
  const api=globalThis.AcrossBHelper;
  const language = {
    ko:{info:'작업 중 목록 · 배치 코드 날짜 기준',help:'QR을 스캔하면 일치하는 행이 바로 선택됩니다.',input:'스캐너 입력',process:'입력 처리',ready:'입력창을 클릭한 뒤 스캔하세요.',lookup:'검색',undo:'이 선택 취소',history:'스캔 기록',enter:'Enter로 처리 · Enter 없는 스캐너는 입력 처리 클릭',memory:'기록은 이 탭 메모리에만 보관되며 새로고침 시 사라집니다.',close:'접기',open:'펼치기',cancel:'취소'},
    en:{info:'In progress · batch code date',help:'Scanning selects the one matching row immediately.',input:'Scanner input',process:'Process input',ready:'Click the input, then scan.',lookup:'Lookup',undo:'Undo this selection',history:'Scan history',enter:'Enter to process · click Process input if scanner omits Enter',memory:'History stays in this tab and clears on reload.',close:'Collapse',open:'Expand',cancel:'Undo'},
    es:{info:'En curso · fecha del código de lote',help:'El escaneo selecciona inmediatamente la fila coincidente.',input:'Entrada del escáner',process:'Procesar',ready:'Haga clic en el campo y escanee.',lookup:'Buscar',undo:'Deshacer selección',history:'Historial de escaneos',enter:'Enter para procesar · use Procesar si el escáner no envía Enter',memory:'El historial solo permanece en esta pestaña hasta recargar.',close:'Cerrar',open:'Abrir',cancel:'Deshacer'}
  };
  const errors = {
    en:{'형식 오류':'Invalid QR format','날짜/배치 코드 불명확':'Unclear batch code date','대상 페이지 아님':'Wrong page','화면 구조 불명확: 대화상자/로딩':'Page busy or dialog open','작업 중 탭 확인 실패':'In progress tab not confirmed','전체 배치 수 확인 실패':'Batch count unavailable','날짜 기준/헤더 확인 실패':'Batch date header not confirmed','화면 구조 불명확: 목록':'List structure uncertain','전체 목록 미확인: 필터/부분 로딩':'Full list unavailable: filter or partial load','화면 구조 불명확: 행/체크박스':'Row or checkbox uncertain','날짜 기준/배치 필드 불명확':'Batch code field uncertain','배치 없음':'Batch not found','복수 일치':'Multiple matches','체크박스 사용 불가':'Checkbox unavailable','처리 중: 재스캔 필요':'Busy: scan again','취소 불가: 이 도구의 선택 이력/행이 변경됨':'Cannot undo: row changed','이미 선택됨':'Already selected','이미 해제됨':'Already unselected','목록 변경됨: 재스캔 필요':'List changed: scan again','대상 변경됨':'Page changed','선택 상태 확인 실패: 화면 확인 필요':'Selection unconfirmed: inspect page','다른 행 변경 감지: 화면 확인 필요':'Other row changed: inspect page','선택 취소됨':'Selection undone','선택됨':'Selected'},
    es:{'형식 오류':'Formato QR no válido','날짜/배치 코드 불명확':'Fecha del lote no clara','대상 페이지 아님':'Página incorrecta','화면 구조 불명확: 대화상자/로딩':'Página ocupada o diálogo abierto','작업 중 탭 확인 실패':'Pestaña En curso no confirmada','전체 배치 수 확인 실패':'Total de lotes no disponible','날짜 기준/헤더 확인 실패':'Encabezado de fecha no confirmado','화면 구조 불명확: 목록':'Estructura de lista incierta','전체 목록 미확인: 필터/부분 로딩':'Lista incompleta: filtro o carga parcial','화면 구조 불명확: 행/체크박스':'Fila o casilla incierta','날짜 기준/배치 필드 불명확':'Código de lote incierto','배치 없음':'Lote no encontrado','복수 일치':'Varias coincidencias','체크박스 사용 불가':'Casilla no disponible','처리 중: 재스캔 필요':'Ocupado: vuelva a escanear','취소 불가: 이 도구의 선택 이력/행이 변경됨':'No se puede deshacer: la fila cambió','이미 선택됨':'Ya seleccionado','이미 해제됨':'Ya desmarcado','목록 변경됨: 재스캔 필요':'La lista cambió: vuelva a escanear','대상 변경됨':'La página cambió','선택 상태 확인 실패: 화면 확인 필요':'Selección no confirmada: revise la página','다른 행 변경 감지: 화면 확인 필요':'Otra fila cambió: revise la página','선택 취소됨':'Selección deshecha','선택됨':'Seleccionado'}
  };
  const host=document.createElement('aside'); host.id='acrossb-local-helper';
  host.style.cssText='position:fixed;right:18px;bottom:18px;z-index:2147483646;width:390px;max-width:95vw';
  const ui=host.attachShadow({mode:'open'});
  ui.innerHTML=`<style>
    :host{all:initial;font:14px/1.5 "Segoe UI",sans-serif;color:#172b3a}*{box-sizing:border-box}
    section{background:#fff;border:1px solid #bdccd6;border-radius:16px;box-shadow:0 10px 40px #102d3d30;overflow:hidden}
    header{background:#123849;color:white;padding:14px 18px;display:flex;justify-content:space-between;align-items:center}
    h2{font-size:17px;margin:0}small{font-size:11px}main{padding:16px}p{margin:0 0 12px;color:#526977}#info{white-space:pre-line}
    label{display:block;margin-bottom:10px}input[type=text]{width:100%;font:22px monospace;padding:12px;border:2px solid #37848b;border-radius:8px}
    button,select{font:inherit;border:1px solid #b6c7d0;border-radius:6px;background:#f4f8fa;padding:6px 10px;cursor:pointer}
    button:disabled{opacity:.4;cursor:default}#scan{background:#12636b;color:white;margin:10px 0}#status{padding:12px;background:#eaf3f5;border-radius:8px;overflow-wrap:anywhere}
    #log{max-height:220px;overflow:auto;margin-top:12px}article{border-bottom:1px solid #d9e4e9;padding:9px 0;overflow-wrap:anywhere}article small{color:#617884}
    #mini{background:transparent;color:white;border-color:#587780}footer{font-size:11px;color:#617884;margin-top:10px}
  </style><section><header><div><h2>AcrossB Flow · QR</h2><small>LOCAL WORK ASSISTANT · 1.0.4</small></div><button id="mini" type="button"></button></header><main>
    <label for="lang">Language / 언어 / Idioma <select id="lang"><option value="ko">한국어</option><option value="en">English</option><option value="es">Español</option></select></label>
    <p id="info"></p>
    <label id="scan-label" for="qr"></label><input id="qr" type="text" maxlength="64" autocomplete="off" spellcheck="false" placeholder="09_23_473">
    <button id="scan" type="button"></button>
    <div id="status" role="status" aria-live="polite"></div>
    <div id="log"></div><footer><span id="enter"></span><br><span id="memory"></span></footer>
  </main></section>`;
  document.documentElement.append(host);
  const $=id=>ui.getElementById(id), engine=new api.Engine(document,()=>location.href);
  let lastURL=location.href, latest=null;
  const pageLang=document.documentElement.lang.toLowerCase().slice(0,2);
  $('lang').value=language[pageLang]?pageLang:'ko';
  const t=()=>language[$('lang').value];
  const resultText=result=>errors[$('lang').value]?.[result]||result;
  function render(){
    $('mini').textContent=ui.querySelector('main').hidden?t().open:t().close;
    $('mini').setAttribute('aria-label',t().close);
    $('info').textContent=`${t().info}\n${t().help}\n09_23_473 → YYYY-09-23_473`;
    $('scan-label').textContent=t().input;$('scan').textContent=t().process;
    $('log').setAttribute('aria-label',t().history);$('enter').textContent=t().enter;$('memory').textContent=t().memory;
    if(latest){const q=lookupLabel(latest.raw);$('status').textContent=[resultText(latest.result),q&&`${t().lookup} ${q}`,latest.code].filter(Boolean).join(' · ');}
    else $('status').textContent=t().ready;
  }
  function lookupLabel(raw) {
    try {
      const qr=api.parseQR(raw);
      return `${qr.month}-${qr.day}_${qr.batch}`;
    } catch { return null; }
  }
  function log(out, raw) {
    latest={...out,raw:raw.replace(/^(?:취소|Undo|Deshacer) /,'')};
    const at=new Date().toLocaleString($('lang').value==='ko'?'ko-KR':$('lang').value==='es'?'es-ES':'en-US',{hour12:false});
    const lookup=lookupLabel(latest.raw);
    const message=resultText(out.result);
    $('status').textContent=[message,lookup&&`${t().lookup} ${lookup}`,out.code].filter(Boolean).join(' · ');
    const item=document.createElement('article');
    const time=document.createElement('small');time.textContent=at;
    const text=document.createElement('div');text.textContent=`${raw}${lookup?' → '+t().lookup+' '+lookup:''} → ${message}${out.code?' · '+out.code:''}`;
    item.append(time,text);
    if(out.undo){const undo=document.createElement('button');undo.type='button';undo.textContent=t().undo;
      undo.addEventListener('click',async()=>{if(engine.busy)return;undo.disabled=true;
        const result=await engine.run(raw,{dry:false,undoCode:out.code});
        log(result,`${t().cancel} ${raw}`); if(result.result!=='선택 취소됨'&&result.result!=='이미 해제됨')undo.disabled=false;
      });item.append(undo);}
    $('log').prepend(item);
  }
  async function submit(){const raw=$('qr').value;if(!raw)return;$('qr').value='';
    const out=await engine.run(raw,{dry:false});log(out,raw);$('qr').focus();}
  $('scan').addEventListener('click',submit);
  // Do not let scanner Enter reach the site's handlers or forms.
  $('qr').addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter'){e.preventDefault();if(!e.repeat)submit();}});
  for(const event of ['keyup','keypress','input','change','click']) ui.addEventListener(event,e=>e.stopPropagation());
  $('lang').addEventListener('change',render);
  $('mini').addEventListener('click',()=>{const main=ui.querySelector('main');main.hidden=!main.hidden;render();});
  function route(){host.hidden=!api.allowed(location.href);if(location.href!==lastURL){lastURL=location.href;$('qr').value='';engine.owned.clear();}}
  render();route();setInterval(route,300);
})();

