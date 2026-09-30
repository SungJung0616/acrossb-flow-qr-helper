// Local fixture adapter only. NOT listed in manifest.json; never runs on AcrossB.
(() => {
  if (!['127.0.0.1','localhost',''].includes(location.hostname)) throw Error('Local demo only');
  const Base=globalThis.AcrossBHelper.Engine;
  globalThis.AcrossBHelper={...globalThis.AcrossBHelper,allowed:()=>true,
    Engine:class extends Base{constructor(doc){super(doc,()=> 'https://axb-us-cpm-1.flow.acrossb.io/flow/work-groups?tab=JOB_IN_PROGRESS');}}};
})();

