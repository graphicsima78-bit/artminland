(function(){
'use strict';
const VERSION=1;
function bundle(cards,source){return {format:'artminland-backup',version:VERSION,source:source||'unknown',exportedAt:new Date().toISOString(),total:cards.length,cards};}
function file(cards,source){return new File([JSON.stringify(bundle(cards,source),null,2)],'ARTMIN-LAND-backup-'+new Date().toISOString().replace(/[:.]/g,'-')+'.json',{type:'application/json'});}
async function deliver(cards,source,share){
 if(!cards.length){alert('موردی برای پشتیبان‌گیری وجود ندارد.');return;}
 const backup=file(cards,source);
 if(share&&navigator.share&&navigator.canShare&&navigator.canShare({files:[backup]})){
  if(!confirm('این فایل شامل اطلاعات مشتریان است. فقط برای حساب یا فرد مورداعتماد ارسال کنید. ادامه می‌دهید؟'))return;
  try{await navigator.share({title:'بک‌آپ بانک مخاطبان آرتمین لند',files:[backup]});return;}catch(e){if(e.name==='AbortError')return;}
 }
 AL.downloadBlob(backup,backup.name);
 if(share)alert('فایل بک‌آپ برای دانلود آماده شد. این مرورگر اشتراک فایل را پشتیبانی نمی‌کند؛ Gmail را باز کنید و فایل دانلودشده را دستی پیوست کنید. فایل هنوز ایمیل نشده است.');
}
function parse(text){const p=JSON.parse(text);const list=Array.isArray(p)?p:(Array.isArray(p.cards)?p.cards:Array.isArray(p.customers)?p.customers:(p.name?[p]:null));if(!list||list.length>10000)throw Error('بک‌آپ JSON معتبر نیست یا بیش از ۱۰هزار مورد دارد.');return list;}
window.ALBackup={bundle,deliver,parse};
})();
