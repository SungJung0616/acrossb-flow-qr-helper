(async()=>{
  const A=globalThis.AcrossBHelper, fixture=document.getElementById('fixture'), output=document.getElementById('results');
  const URL_OK='https://axb-us-cpm-1.flow.acrossb.io/flow/work-groups?tab=JOB_IN_PROGRESS';
  let url=URL_OK, clicks=0, completed=0, scrolls=0, e, passed=0, failed=0;
  function setup(codes=['2026-09-25_314','2026-09-24_314']) {
    url=URL_OK;clicks=0;completed=0;scrolls=0;
    fixture.innerHTML=`<button type="button"><div class="bg-grayblue-50">작업 중 ${codes.length}배치/5건</div></button>
      <div id="list-container"><div><div><input type="checkbox" aria-label="전체 선택"></div><div><span>우선순위</span><span>고객사 / 배치 코드</span></div></div><div>${codes.map(code=>`<div role="button" tabindex="0"><div><div><label><input type="checkbox"></label></div><div><div>보통</div><div><span>TEST CUSTOMER</span><span>${code}</span></div></div><div>일괄작업</div></div></div>`).join('')}</div></div><button id="complete" type="button">Complete</button>`;
    fixture.querySelector('#complete').onclick=()=>completed++;
    fixture.querySelectorAll('input').forEach(c=>c.addEventListener('click',()=>clicks++));
    fixture.querySelectorAll('[role="button"]').forEach(row=>row.scrollIntoView=()=>scrolls++);
    e=new A.Engine(document,()=>url);
  }
  const assert=(v,m='assertion failed')=>{if(!v)throw Error(m);};
  const live={dry:false,dateConfirmed:true};
  async function test(name,fn){try{await fn();passed++;output.textContent+=`PASS  ${name}\n`;}catch(err){failed++;output.textContent+=`FAIL  ${name}: ${err.message}\n`;}}
  async function run(){document.getElementById('run').disabled=true;passed=failed=0;output.textContent='';
    await test('QR 형식, 말미 CR/LF, 날짜 유효성',()=>{assert(A.parseQR('09_25_314\r\n').batch==='314');for(const bad of ['9_25_314','09_25_0314','02_30_1','13_01_1','09_25_0','09_25_1x',' 09_25_1','09_25_1\n09_25_2']){let blocked=false;try{A.parseQR(bad);}catch{blocked=true;}assert(blocked,bad);}assert(A.parseQR('02_29_1').day==='29');});
    await test('주소·탭 엄격 제한',()=>{assert(A.allowed(URL_OK));for(const bad of [URL_OK.replace('JOB_IN_PROGRESS','JOB_READY'),URL_OK+'&tab=JOB_READY',URL_OK.replace('/work-groups','/other'),URL_OK.replace('https:','http:'),URL_OK+'#x'])assert(!A.allowed(bad));});
    await test('테스트 모드는 일치해도 0회 클릭·화면 이동',async()=>{setup();const r=await e.run('09_25_314');assert(r.result.startsWith('테스트'));assert(clicks===0&&scrolls===0);});
    await test('날짜와 배치 일치 행만 선택 / 완료·전체선택 미작동 / 선택 후 화면 이동',async()=>{setup();const r=await e.run('09_25_314',live);assert(r.result==='선택됨',r.result);assert(clicks===1&&completed===0&&scrolls===1);const boxes=fixture.querySelectorAll('input');assert(!boxes[0].checked&&boxes[1].checked&&!boxes[2].checked);});
    await test('반복 스캔: 이미 선택됨, 클릭·화면 이동 증가 없음',async()=>{setup();await e.run('09_25_314',live);const r=await e.run('09_25_314',live);assert(r.result==='이미 선택됨'&&clicks===1&&scrolls===1);});
    await test('이 도구의 선택 취소 / 재스캔 재선택',async()=>{setup();await e.run('09_25_314',live);const r=await e.run('09_25_314',{...live,undoCode:'2026-09-25_314'});assert(r.result==='선택 취소됨',r.result);assert(clicks===2);assert((await e.run('09_25_314',live)).result==='선택됨');});
    await test('사용자 기존 선택의 취소 거부',async()=>{setup();fixture.querySelectorAll('input')[1].checked=true;const r=await e.run('09_25_314',{...live,undoCode:'2026-09-25_314'});assert(r.result.startsWith('취소 불가')&&clicks===0);});
    await test('배치 없음',async()=>{setup();assert((await e.run('09_26_314',live)).result==='배치 없음'&&clicks===0);});
    await test('복수 일치 및 서로 다른 연도도 모호성 차단',async()=>{for(const codes of [['2026-09-25_314','2026-09-25_314'],['2025-09-25_314','2026-09-25_314']]){setup(codes);assert((await e.run('09_25_314',live)).result==='복수 일치'&&clicks===0);}});
    await test('비활성 / indeterminate 체크박스 차단',async()=>{setup();fixture.querySelectorAll('input')[1].disabled=true;assert((await e.run('09_25_314',live)).result==='체크박스 사용 불가'&&clicks===0);setup();fixture.querySelectorAll('input')[1].indeterminate=true;assert((await e.run('09_25_314',live)).result==='체크박스 사용 불가');});
    await test('JOB_READY에서 무조작',async()=>{setup();url=URL_OK.replace('JOB_IN_PROGRESS','JOB_READY');assert((await e.run('09_25_314',live)).result==='대상 페이지 아님'&&clicks===0);});
    await test('날짜 기준 미확인시 실제 선택 차단',async()=>{setup();assert((await e.run('09_25_314',{dry:false})).result==='날짜 기준 확인 필요'&&clicks===0);});
    await test('부분 로딩 / 필터로 행 수 감소시 차단',async()=>{setup();fixture.querySelector('[role="button"]').remove();assert((await e.run('09_25_314',live)).result.startsWith('전체 목록 미확인')&&clicks===0);});
    await test('잘못된 날짜 필드 / 변경된 헤더 차단',async()=>{setup(['2026-02-30_314']);assert((await e.run('02_29_314',live)).result==='날짜/배치 코드 불명확');setup();[...fixture.querySelectorAll('span')].find(x=>x.textContent==='고객사 / 배치 코드').textContent='출고 예정일';assert((await e.run('09_25_314',live)).result==='날짜 기준/헤더 확인 실패');});
    await test('체크박스가 2개인 행 차단',async()=>{setup();fixture.querySelector('[role="button"]').append(document.createElement('input'));fixture.querySelector('[role="button"] > input').type='checkbox';assert((await e.run('09_25_314',live)).result.startsWith('화면 구조 불명확')&&clicks===0);});
    await test('검사 도중 URL 변경 차단',async()=>{setup();const pending=e.run('09_25_314',live);url=URL_OK.replace('JOB_IN_PROGRESS','JOB_READY');assert((await pending).result==='대상 페이지 아님'&&clicks===0);});
    await test('검사 도중 행 교체 차단',async()=>{setup();const pending=e.run('09_25_314',live);const row=fixture.querySelector('[role="button"]');row.replaceWith(row.cloneNode(true));assert((await pending).result.startsWith('목록 변경됨')&&clicks===0);});
    await test('동시 스캔 직렬 보호',async()=>{setup();const first=e.run('09_25_314',live);assert((await e.run('09_25_314',live)).result.startsWith('처리 중'));assert((await first).result==='선택됨'&&clicks===1);});
    await test('우선순위 장식 span은 날짜 필드와 분리',async()=>{setup();const dot=document.createElement('span');dot.setAttribute('aria-hidden','true');fixture.querySelector('[role="button"]').firstElementChild.children[1].firstElementChild.append(dot);assert((await e.run('09_25_314')).result.startsWith('테스트')&&clicks===0);});
    output.textContent+=`\n결과: ${passed} 통과 / ${failed} 실패`;document.title=`AcrossB Tests: ${passed} PASS / ${failed} FAIL`;document.getElementById('run').disabled=false;
  }
  document.getElementById('run').addEventListener('click',run);
})();

