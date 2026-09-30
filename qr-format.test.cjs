const {test}=require('node:test');
const assert=require('node:assert/strict');
const {parseQR,parseCode}=require('./core.js');
test('하이픈과 언더바 QR은 같은 날짜/배치로 정규화',()=>{
  for(const batch of ['473','398','314']) {
    assert.deepEqual(parseQR(`09-23_${batch}`),parseQR(`09_23_${batch}`));
    const qr=parseQR(`09-23_${batch}\r\n`), row=parseCode(`2026-09-23_${batch}`);
    for(const field of ['month','day','batch']) assert.equal(qr[field],row[field]);
  }
});
test('날짜 또는 구분자가 잘못된 입력은 계속 차단',()=>{
  for(const raw of ['23_398','09-23-473','09/23_473','0923_473','02-30_473','13-23_473','09-23_0','09-23_0473','09-23_473x']) assert.throws(()=>parseQR(raw));
});

