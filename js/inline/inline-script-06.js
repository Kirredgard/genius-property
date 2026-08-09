// ── Custom dropdown "Choix du type de bien" ──
function toggleBiensTypeDropdown(e){
  e && e.stopPropagation();
  const menu = document.getElementById('biensTypeDropMenu');
  const btn  = document.getElementById('biensTypeDropBtn');
  if(!menu) return;
  const open = menu.style.display !== 'none';
  menu.style.display = open ? 'none' : 'block';
  if(btn) btn.style.borderColor = open ? '#e5e7eb' : 'var(--gold)';
}
document.addEventListener('click', function(e){
  const wrap = document.getElementById('biensTypeDropWrap');
  if(wrap && !wrap.contains(e.target)){
    const menu = document.getElementById('biensTypeDropMenu');
    const btn  = document.getElementById('biensTypeDropBtn');
    if(menu) menu.style.display = 'none';
    if(btn) btn.style.borderColor = '#e5e7eb';
  }
});
function setBiensTypeFilter(val){
  const sel   = document.getElementById('biensFilterType');
  const label = document.getElementById('biensTypeDropLabel');
  const menu  = document.getElementById('biensTypeDropMenu');
  const btn   = document.getElementById('biensTypeDropBtn');
  if(sel){ sel.value = val; }
  if(label) label.textContent = val || 'Choix du type de bien';
  if(menu) menu.style.display = 'none';
  if(btn) btn.style.borderColor = '#e5e7eb';
  if(typeof window.renderBiensCards === 'function') window.renderBiensCards(true);
}
// Patch syncBienTypeFilter to also update the visual dropdown
const _origSyncBienTypeFilter = window.syncBienTypeFilter;
function patchSyncBienTypeFilter(){
  const sel = document.getElementById('biensFilterType');
  const menu = document.getElementById('biensTypeDropMenu');
  if(!sel || !menu) return;
  // Rebuild menu items from select options
  const currentVal = sel.value;
  menu.innerHTML = '';
  Array.from(sel.options).forEach(opt => {
    const div = document.createElement('div');
    div.style.cssText = 'display:flex;align-items:center;gap:8px;padding:9px 14px;font-size:12.5px;cursor:pointer;color:#374151;font-weight:500;transition:.12s';
    div.onmouseover = function(){ this.style.background='#fdf9ec'; };
    div.onmouseout  = function(){ this.style.background=''; };
    // icon mapping
    const icons = {'':"home_work","Appartement":"apartment","Villa":"villa","Studio":"bed","Immeuble":"domain","Bureau":"business","Commerce":"storefront","Maison":"home","Terrain":"landscape"};
    const icon = icons[opt.value] || 'home';
    div.innerHTML = `<span class="material-symbols-rounded" style="font-size:16px;color:#9ca3af">${icon}</span> ${opt.textContent}`;
    const v = opt.value;
    div.onclick = function(){ setBiensTypeFilter(v); };
    menu.appendChild(div);
  });
  // Update label
  const label = document.getElementById('biensTypeDropLabel');
  if(label) label.textContent = currentVal || 'Choix du type de bien';
}
// Override syncBienTypeFilter globally
window.syncBienTypeFilter = function(){
  if(typeof _origSyncBienTypeFilter === 'function') _origSyncBienTypeFilter();
  patchSyncBienTypeFilter();
};
// Run once DOM ready
document.addEventListener('DOMContentLoaded', function(){
  setTimeout(patchSyncBienTypeFilter, 800);
});
