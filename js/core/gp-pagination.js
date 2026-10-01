/* Genius Property — pagination commune des listes */
(function(){
  'use strict';
  var state = Object.create(null), renderers = Object.create(null);

  function normalize(key, total, size){
    var max = Math.max(1, Math.ceil((Number(total)||0) / (Number(size)||10)));
    var p = Math.min(Math.max(1, Number(state[key]) || 1), max);
    state[key] = p;
    return {page:p, pages:max, start:(p-1)*(Number(size)||10)};
  }

  function pages(key, total, size, renderer){
    var m = normalize(key,total,size);
    if (typeof renderer === 'function') renderers[key] = renderer;
    var h = '<nav class="gp-common-pagination" aria-label="Pagination">';
    h += '<button type="button" class="gp-common-page-btn" '+(m.page<=1?'disabled':'')+' aria-label="Page précédente" onclick="gpCommonPage(\''+key+'\','+(m.page-1)+')">‹</button>';
    for(var i=1;i<=m.pages;i++){
      if(i===1 || i===m.pages || Math.abs(i-m.page)<=1){
        h += '<button type="button" class="gp-common-page-btn '+(i===m.page?'active':'')+'" aria-current="'+(i===m.page?'page':'false')+'" onclick="gpCommonPage(\''+key+'\','+i+')">'+i+'</button>';
      } else if(i===2 && m.page>4 || i===m.pages-1 && m.page<m.pages-3 || Math.abs(i-m.page)===2){
        h += '<span class="gp-common-page-ellipsis">…</span>';
      }
    }
    h += '<button type="button" class="gp-common-page-btn" '+(m.page>=m.pages?'disabled':'')+' aria-label="Page suivante" onclick="gpCommonPage(\''+key+'\','+(m.page+1)+')">›</button>';
    return h+'</nav>';
  }

  function setPage(key, page){
    state[key] = Math.max(1, Number(page)||1);
    if(typeof renderers[key] === 'function') return renderers[key]();
  }

  function reset(key){ state[key] = 1; }

  var style = document.createElement('style');
  style.id='gp-common-pagination-style';
  style.textContent=''+
    '.gp-common-pagination{display:flex;align-items:center;justify-content:flex-end;gap:5px;flex-shrink:0}'+
    '.gp-common-page-btn{min-width:30px;height:30px;padding:0 8px;border:1px solid #e5e7eb;border-radius:8px;background:#fff;color:#374151;font-size:12px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;justify-content:center}'+
    '.gp-common-page-btn:hover:not(:disabled){background:#f8fafc;border-color:#d1d5db}'+
    '.gp-common-page-btn.active{background:#111827;border-color:#111827;color:#fff}'+
    '.gp-common-page-btn:disabled{opacity:.42;cursor:not-allowed;background:#f9fafb}'+
    '.gp-common-page-ellipsis{min-width:18px;text-align:center;color:#9ca3af;font-size:12px}'+
    '.gp-common-footer{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:12px 14px;color:#6b7280;font-size:12px;border-top:1px solid #eef2f7;flex-wrap:wrap}'+
    '@media(max-width:700px){.gp-common-footer{align-items:flex-start}.gp-common-pagination{width:100%;justify-content:flex-end}}';
  (document.head||document.documentElement).appendChild(style);

  window.GPPagination = {normalize:normalize, pages:pages, setPage:setPage, reset:reset, state:state};
  window.gpCommonPage = setPage;
})();
