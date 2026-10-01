import fs from 'node:fs';
import vm from 'node:vm';

let data = {
  proprietaires:[{id:'PR1',prenom:'Fall',nom:'Oumar'}],
  locataires:[{id:'T1',prenom:'Oumar',nom:'FALL'},{id:'T2',prenom:'FALL',nom:'OUMAR S'},{id:'T3',prenom:'SOW',nom:'Dame'}],
  biens:[
    {id:'B1',nom:'RET',type:'Immeuble',unites:[{id:'U1',nom:'Appartement 1'},{id:'U2',nom:'Appartement 2'}],proprietaireId:'PR1'},
    {id:'B2',nom:'Keur 2',type:'Appartement',unites:[{id:'U3',nom:'Keur 2'}],proprietaireId:'PR1'}
  ],
  locatives:[
    {id:'L1',nom:'Location - RET - Appartement 1',bien:'RET - Appartement 1',locataire:'Oumar FALL',statut:'Loué'},
    {id:'L2',nom:'Location - RET - Appartement 2',bien:'RET - Appartement 2',locataire:'FALL OUMAR S',statut:'Loué'},
    {id:'L3',nom:'Location - Keur 2',bien:'Keur 2',locataire:'SOW Dame',statut:'Loué'}
  ],
  contrats:[
    {id:'C1',locative:'Location - RET - Appartement 1',bien:'RET - Appartement 1',locataire:'Oumar FALL',statut:'Actif'},
    {id:'C2',locative:'Location - RET - Appartement 2',bien:'RET - Appartement 2',locataire:'FALL OUMAR S',statut:'Actif'},
    {id:'C3',locative:'Location - Keur 2',bien:'Keur 2',locataire:'SOW Dame',statut:'Actif'}
  ],
  paiements:[]
};

const GPDB={load:()=>data,save:async d=>{data=d;return true;}};
const context={console,Date,Math,JSON,GPDB,window:{GPDB},document:{readyState:'complete',addEventListener(){}}};
vm.createContext(context);
vm.runInContext(fs.readFileSync('js/core/relations-v52.js','utf8'),context);
const R=context.window.GPRelationsV52;
R.ensure(data);

const ret=R.propertySnapshot(data,data.biens[0]);
const keur=R.propertySnapshot(data,data.biens[1]);
if(ret.status!=='Loué' || ret.occupied.length!==2) throw new Error('RET: occupation incorrecte');
if(keur.status!=='Loué' || keur.occupied.length!==1 || keur.occupied[0].locataire!=='SOW Dame') throw new Error('Keur 2: locataire incorrect');

// Relation volontairement incohérente : le contrat C3 pointe vers L1/B1/T1
const c3=data.contrats[2];
c3.locationId='L1'; c3.locativeId='L1'; c3.bienId='B1'; c3.locataireId='T1';
R.ensure(data);
const repaired=R.propertySnapshot(data,data.biens[1]);
if(c3.locationId!=='L3' || c3.bienId!=='B2' || c3.locataireId!=='T3') throw new Error('Réparation de relation échouée');
if(repaired.occupied.length!==1 || repaired.occupied[0].locataire!=='SOW Dame') throw new Error('Keur 2 après réparation incorrect');

data.contrats[1].statut='Résilié';
const partial=R.propertySnapshot(data,data.biens[0]);
if(partial.status!=='Partiellement loué' || partial.available.length!==1) throw new Error('Occupation partielle incorrecte');

console.log('V56 relations: OK');
