/* Genius Property — canonical image persistence helper.
   Keeps uploaded photos small enough for local persistence and preserves a single read path. */
(function(){
  'use strict';
  function readFile(file){
    return new Promise(function(resolve,reject){
      if(!file) return resolve('');
      var r=new FileReader();
      r.onload=function(){resolve(r.result||'');};
      r.onerror=reject;
      r.readAsDataURL(file);
    });
  }
  function compressDataUrl(data,maxSide,quality){
    return new Promise(function(resolve){
      if(!data || !/^data:image\//i.test(data)) return resolve(data||'');
      var img=new Image();
      img.onload=function(){
        var w=img.naturalWidth||img.width, h=img.naturalHeight||img.height;
        if(!w||!h) return resolve(data);
        var scale=Math.min(1,maxSide/Math.max(w,h));
        var cw=Math.max(1,Math.round(w*scale)), ch=Math.max(1,Math.round(h*scale));
        var canvas=document.createElement('canvas'); canvas.width=cw; canvas.height=ch;
        var ctx=canvas.getContext('2d');
        if(!ctx) return resolve(data);
        ctx.drawImage(img,0,0,cw,ch);
        var out=canvas.toDataURL('image/jpeg',quality);
        resolve(out || data);
      };
      img.onerror=function(){resolve(data);};
      img.src=data;
    });
  }
  async function readImage(inputId){
    var input=document.getElementById(inputId), file=input&&input.files&&input.files[0];
    if(!file) return '';
    if(!/^image\//i.test(file.type||'')) throw new Error('Le fichier sélectionné n’est pas une image.');
    if(file.size>12*1024*1024) throw new Error('La photo dépasse 12 Mo.');
    var raw=await readFile(file);
    return compressDataUrl(raw,1280,0.78);
  }
  window.GPMedia=window.GPMedia||{};
  window.GPMedia.readImage=readImage;
  window.GPMedia.compressDataUrl=compressDataUrl;
})();
