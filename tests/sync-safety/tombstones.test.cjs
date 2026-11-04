const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const assert = require('node:assert/strict');

const store = new Map();
const localStorage = {
  getItem: k => store.has(k) ? store.get(k) : null,
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: k => store.delete(k)
};
const window = {
  dispatchEvent() {},
  addEventListener() {},
  GPStorage: null,
  GPLicenseGuard: null
};
const context = {
  window, localStorage, console, Date, JSON, Object, Array, Number, String,
  Math, Promise, CustomEvent: function CustomEvent() {},
  setTimeout, clearTimeout, Blob: function Blob() {}, document: { createElement(){ return {click(){},remove(){}}; }, body:{appendChild(){} } }, URL:{createObjectURL(){return ''},revokeObjectURL(){}}
};
vm.createContext(context);
const source = fs.readFileSync(path.join(__dirname, '../../js/core/db.js'), 'utf8');
vm.runInContext(source, context, { filename: 'db.js' });
const merge = window.GPDB.mergeSnapshots;

const oldDate = new Date(Date.now() - 400 * 24 * 3600 * 1000).toISOString();
const cloud = { locataires: [{id:'L-1', nom:'Ancienne fiche'}], meta:{ deleted:{locataires:{'L-1':oldDate}} } };
const local = { locataires: [], meta:{ deleted:{} } };
const merged = merge(cloud, local);
assert.equal(merged.locataires.length, 0, 'une suppression ancienne doit rester prioritaire');
assert.equal(merged.meta.deleted.locataires['L-1'], oldDate, 'le marqueur ancien doit être conservé');

const noMarker = merge({locataires:[{id:'L-2',nom:'Actif'}]}, {locataires:[]});
assert.equal(noMarker.locataires.length, 1, 'une absence locale seule ne doit pas être interprétée comme une suppression');

console.log('OK: tombstone ancien conservé; fusion sans marqueur non destructive.');
