/* Lazy external libraries: loaded only when an export/import/chart action needs them. */
(function(){
  const CDN = {
    chart: 'https://cdn.jsdelivr.net/npm/chart.js',
    html2pdf: 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js',
    xlsx: 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
    docx: 'https://cdn.jsdelivr.net/npm/docx@8/build/index.umd.min.js'
  };
  const cache = {};
  function loadScript(key, globalName){
    if (window[globalName] && !window[globalName].__lazyStub) return Promise.resolve(window[globalName]);
    if (cache[key]) return cache[key];
    cache[key] = new Promise((resolve, reject)=>{
      const s = document.createElement('script');
      s.src = CDN[key]; s.async = true; s.crossOrigin = 'anonymous';
      s.onload = ()=> resolve(window[globalName]);
      s.onerror = ()=> reject(new Error('Impossible de charger '+key));
      document.head.appendChild(s);
    });
    return cache[key];
  }
  window.ensureChart = function(){ return loadScript('chart','Chart').then(real=>{ window.__RealChart = real; return real; }); };
  window.ensureHtml2Pdf = function(){
    return loadScript('html2pdf','html2pdf').then(real=>{ window.__html2pdfReal = real; window.html2pdf = lazyHtml2Pdf; return real; });
  };
  window.ensureXLSX = function(){ return loadScript('xlsx','XLSX'); };
  window.ensureDocx = function(){ return loadScript('docx','docx'); };

  function LazyChart(ctx, config){
    this._chart = null;
    this._pendingDestroy = false;
    window.ensureChart().then(Chart=>{
      if (this._pendingDestroy) return;
      this._chart = new Chart(ctx, config);
    }).catch(err=>{ console.warn(err); });
  }
  LazyChart.__lazyStub = true;
  LazyChart.prototype.destroy = function(){ this._pendingDestroy = true; if(this._chart && this._chart.destroy) this._chart.destroy(); };
  window.Chart = window.Chart || LazyChart;

  function lazyHtml2Pdf(){
    const state = { element:null, options:null };
    const api = {
      from(el){ state.element = el; return api; },
      set(opts){ state.options = opts; return api; },
      save(){
        return window.ensureHtml2Pdf().then(real => {
          const inst = real();
          if (state.element) inst.from(state.element);
          if (state.options) inst.set(state.options);
          return inst.save();
        });
      }
    };
    return api;
  }
  lazyHtml2Pdf.__lazyStub = true;
  window.html2pdf = window.html2pdf || lazyHtml2Pdf;
})();
