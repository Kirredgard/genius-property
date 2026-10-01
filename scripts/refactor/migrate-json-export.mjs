#!/usr/bin/env node
/**
 * Convertit un export GPDB JSON en fichiers JSONL prêts à importer dans les tables
 * relationnelles de 002_relational_core.sql.
 *
 * Usage:
 *   node scripts/refactor/migrate-json-export.mjs export.json ./migration-output
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const input = process.argv[2];
const outputDir = process.argv[3] || './migration-output';
if (!input) {
  console.error('Usage: node scripts/refactor/migrate-json-export.mjs <export.json> [output-dir]');
  process.exit(2);
}

const raw = JSON.parse(await fs.readFile(input, 'utf8'));
const db = raw?.data && typeof raw.data === 'object' ? raw.data : raw;
const getId = (row, prefix, index) => String(row?.id ?? row?.uuid ?? row?.code ?? `${prefix}-${index + 1}`);
const asNumber = value => {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(String(value).replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};
const asDate = value => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
};
const clean = value => value === undefined ? null : value;

const rows = {
  proprietaires: Array.isArray(db.proprietaires) ? db.proprietaires : [],
  biens: Array.isArray(db.biens) ? db.biens : [],
  locataires: Array.isArray(db.locataires) ? db.locataires : [],
  contrats: Array.isArray(db.contrats) ? db.contrats : [],
  paiements: Array.isArray(db.paiements) ? db.paiements : [],
  depenses: Array.isArray(db.depenses) ? db.depenses : []
};

const norm = value => String(value ?? '').trim().toLowerCase();
const ownerIdByName = new Map();
for (const [i, r] of rows.proprietaires.entries()) {
  const id = getId(r, 'proprietaire', i);
  for (const key of [r.id, r.nom, `${r.prenom ?? ''} ${r.nom ?? ''}`, `${r.nom ?? ''} ${r.prenom ?? ''}`]) {
    if (key) ownerIdByName.set(norm(key), id);
  }
}
const tenantIdByName = new Map();
for (const [i, r] of rows.locataires.entries()) {
  const id = getId(r, 'locataire', i);
  for (const key of [r.id, r.nom, `${r.prenom ?? ''} ${r.nom ?? ''}`, `${r.nom ?? ''} ${r.prenom ?? ''}`]) {
    if (key) tenantIdByName.set(norm(key), id);
  }
}
const propertyIdByName = new Map();
for (const [i, r] of rows.biens.entries()) {
  const id = getId(r, 'bien', i);
  for (const key of [r.id, r.nom]) if (key) propertyIdByName.set(norm(key), id);
}

await fs.mkdir(outputDir, { recursive: true });

const normalized = {
  proprietaires: rows.proprietaires.map((r,i) => ({
    id:getId(r,'proprietaire',i), nom:clean(r.nom), prenom:clean(r.prenom), email:clean(r.email),
    telephone:clean(r.telephone ?? r.tel), adresse:clean(r.adresse), legacy_data:r
  })),
  biens: rows.biens.map((r,i) => ({
    id:getId(r,'bien',i), nom:clean(r.nom), type:clean(r.type), adresse:clean(r.adresse),
    proprietaire_id:clean(r.proprietaire_id ?? r.owner_id) || ownerIdByName.get(norm(r.proprio ?? r.proprietaire ?? r.owner ?? '')) || null, legacy_data:r
  })),
  locataires: rows.locataires.map((r,i) => ({
    id:getId(r,'locataire',i), nom:clean(r.nom), prenom:clean(r.prenom), email:clean(r.email),
    telephone:clean(r.telephone ?? r.tel), legacy_data:r
  })),
  contrats: rows.contrats.map((r,i) => ({
    id:getId(r,'contrat',i), bien_id:clean(r.bien_id) || propertyIdByName.get(norm(r.bien ?? r.locative ?? '')) || null, locataire_id:clean(r.locataire_id) || tenantIdByName.get(norm(r.locataire ?? '')) || null, statut:clean(r.statut),
    date_debut:asDate(r.date_debut ?? r.dateDebut), date_fin:asDate(r.date_fin ?? r.dateFin),
    loyer:asNumber(r.loyer ?? r.montant), legacy_data:r
  })),
  paiements: rows.paiements.map((r,i) => ({
    id:getId(r,'paiement',i), contrat_id:clean(r.contrat_id) || null, montant:asNumber(r.montant),
    paye:asNumber(r.paye), reste:asNumber(r.reste), statut:clean(r.statut), date:asDate(r.date), legacy_data:r
  })),
  depenses: rows.depenses.map((r,i) => ({
    id:getId(r,'depense',i), bien_id:clean(r.bien_id) || propertyIdByName.get(norm(r.bien ?? '')) || null, montant:asNumber(r.montant), date:asDate(r.date),
    type:clean(r.type), legacy_data:r
  }))
};

for (const [table, data] of Object.entries(normalized)) {
  const file = path.join(outputDir, `${table}.jsonl`);
  await fs.writeFile(file, data.map(JSON.stringify).join('\n') + (data.length ? '\n' : ''));
  console.log(`${table}: ${data.length} lignes -> ${file}`);
}

await fs.writeFile(path.join(outputDir, 'manifest.json'), JSON.stringify({
  generatedAt:new Date().toISOString(),
  source:input,
  counts:Object.fromEntries(Object.entries(normalized).map(([k,v]) => [k,v.length]))
}, null, 2));
