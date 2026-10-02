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
      s.onerror = ()=> { delete cache[key]; s.remove(); reject(new Error('Impossible de charger '+key)); };
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

  /* Proxy différé de html2pdf.
     IMPORTANT : le Worker html2pdf est immuable (chaque from()/set() renvoie un NOUVEAU worker).
     On enregistre donc la chaîne d'appels puis on la rejoue en réutilisant le worker retourné. */
  function lazyHtml2Pdf(src, opt){
    const queue = [];
    if (src) queue.push(['from', [src]]);
    if (opt) queue.push(['set', [opt]]);
    const replay = (terminal, args) => window.ensureHtml2Pdf().then(real => {
      let w = real();
      queue.forEach(([m, a]) => { w = w[m].apply(w, a); });
      return w[terminal].apply(w, args || []);
    });
    const api = {};
    ['from','set','to','toContainer','toCanvas','toImg','toPdf','get','using'].forEach(m => {
      api[m] = function(){ queue.push([m, Array.prototype.slice.call(arguments)]); return api; };
    });
    ['save','output','outputPdf','outputImg'].forEach(m => {
      api[m] = function(){ return replay(m, Array.prototype.slice.call(arguments)); };
    });
    return api;
  }
  lazyHtml2Pdf.__lazyStub = true;
  window.html2pdf = window.html2pdf || lazyHtml2Pdf;
})();
