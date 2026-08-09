
/* ================================================================
   GENIUS PROPERTY V20 — Common Renderers
   Objectif : isoler les helpers d'affichage hors du legacy bundle.
================================================================ */
(function(){
  'use strict';

  function esc(value){
    if(window.GPRuntime && typeof window.GPRuntime.esc === 'function') return window.GPRuntime.esc(value);
    return String(value ?? '').replace(/[&<>"']/g, function(ch){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch];
    });
  }

  function money(value){
    if(window.GPRuntime && typeof window.GPRuntime.money === 'function') return window.GPRuntime.money(value);
    var n = Math.round(Number(String(value||0).replace(/[^0-9.-]/g,''))||0);
    return n.toLocaleString('fr-FR') + ' FCFA';
  }

  function byId(id){ return document.getElementById(id); }
  function html(id, markup){ var el=byId(id); if(el) el.innerHTML = markup; return el; }
  function text(id, value){ var el=byId(id); if(el) el.textContent = value == null ? '' : String(value); return el; }
  function show(id, visible){ var el=byId(id); if(el) el.style.display = visible ? '' : 'none'; return el; }
  function clear(id){ return html(id, ''); }

  function emptyState(message, icon){
    return '<div class="gp-empty-state" style="padding:28px;text-align:center;color:#9ca3af;font-size:13px">'
      + (icon ? '<span class="material-symbols-rounded" style="font-size:34px;display:block;margin-bottom:8px">'+esc(icon)+'</span>' : '')
      + esc(message || 'Aucune donnée disponible')
      + '</div>';
  }

  function errorState(message){
    return '<div class="gp-error-state" style="padding:16px;border:1px solid #fecaca;background:#fef2f2;color:#991b1b;border-radius:12px;font-size:13px">'
      + esc(message || 'Erreur d’affichage')
      + '</div>';
  }

  function table(headers, rows, opts){
    opts = opts || {};
    var th = (headers||[]).map(function(h){ return '<th>'+esc(h)+'</th>'; }).join('');
    var body = (rows||[]).map(function(row){
      return '<tr>' + row.map(function(cell){ return '<td>'+(opts.raw ? cell : esc(cell))+'</td>'; }).join('') + '</tr>';
    }).join('');
    if(!body) body = '<tr><td colspan="'+Math.max(1,(headers||[]).length)+'">'+emptyState(opts.empty || 'Aucun résultat')+'</td></tr>';
    return '<div class="gp-table-wrap"><table class="gp-table"><thead><tr>'+th+'</tr></thead><tbody>'+body+'</tbody></table></div>';
  }

  function renderSafely(name, fn){
    try{ return fn && fn(); }
    catch(err){
      console.error('[GPRenderers]', name, err);
      if(typeof window.toast === 'function') window.toast('Erreur affichage : '+name, 'err');
      return null;
    }
  }

  window.GPRenderers = {
    esc: esc,
    money: money,
    byId: byId,
    html: html,
    text: text,
    show: show,
    clear: clear,
    emptyState: emptyState,
    errorState: errorState,
    table: table,
    renderSafely: renderSafely
  };
})();
