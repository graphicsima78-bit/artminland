/* Contact import: explicitly reviewed before changing the form. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const labels={name:'نام شخص یا کسب‌وکار',managerName:'نام مدیر / مسئول',phones:'شماره‌ها؛ هر شماره در یک خط',email:'ایمیل',address:'آدرس',title:'سمت',description:'یادداشت',website:'وب‌سایت',instagram:'اینستاگرام',telegram:'تلگرام',whatsapp:'واتساپ',eitaa:'ایتا',bale:'بله',rubika:'روبیکا'};
const ids={name:'name',managerName:'manager-name',email:'email',address:'address',title:'title-field',description:'description',website:'website',instagram:'instagram',telegram:'telegram',whatsapp:'whatsapp',eitaa:'eitaa',bale:'bale',rubika:'rubika'};
function unescapeValue(v){return v.replace(/\\[nN]/g,'\n').replace(/\\([,;\\])/g,'$1');}
function decodeValue(v,header){
 if(/ENCODING=QUOTED-PRINTABLE/i.test(header)){
  const bytes=[];
  for(let i=0;i<v.length;i++){if(v[i]==='='&&/^[\da-f]{2}$/i.test(v.slice(i+1,i+3))){bytes.push(parseInt(v.slice(i+1,i+3),16));i+=2;}else bytes.push(...new TextEncoder().encode(v[i]));}
  let charset=(header.match(/CHARSET=([^;:]+)/i)||[])[1]||'utf-8';
  try{v=new TextDecoder(charset).decode(new Uint8Array(bytes));}catch(e){v=new TextDecoder().decode(new Uint8Array(bytes));}
 }
 return unescapeValue(v);
}
function parseCard(text){
 const out={phones:[],extras:[]};let personal='',company='';
 text=text.replace(/=\r?\n/g,'').replace(/\r?\n[ \t]/g,'');
 function addUrl(url,header){
  const p=AL.parseScanned(url);
  if(p&&['instagram','telegram','whatsapp','eitaa','bale','rubika','email'].includes(p.type)){if(!out[p.type])out[p.type]=p.value;else out.extras.push(url);return;}
  const type=((header||'').match(/TYPE=([^;:]+)/i)||[])[1];
  const keys={instagram:'instagram',telegram:'telegram',whatsapp:'whatsapp',eitaa:'eitaa',bale:'bale',rubika:'rubika'};
  if(type&&keys[type.toLowerCase()]&&/^@?[\w.]+$/.test(url)){out[keys[type.toLowerCase()]]=url.replace(/^@/,'');return;}
  if(/^https?:\/\//i.test(url)&&!out.website)out.website=url;else out.extras.push(url);
 }
 for(const line of text.split(/\r?\n/)){
  const colon=line.indexOf(':');if(colon<0)continue;
  const header=line.slice(0,colon),key=header.split(';')[0].replace(/^item\d+\./i,'').toUpperCase();
  if(['BEGIN','END','VERSION','PRODID','REV'].includes(key))continue;
  if(['PHOTO','LOGO','SOUND','KEY'].includes(key)){out.extras.push(key+': داده پیوست در این واردسازی منتقل نمی‌شود.');continue;}
  const value=decodeValue(line.slice(colon+1),header).trim();if(!value)continue;
  switch(key){
   case 'FN':personal=value;break;
   case 'N':if(!personal)personal=value.split(';').filter(Boolean).reverse().join(' ');break;
   case 'ORG':company=value.replace(/;/g,' — ');break;
   case 'TITLE':case 'ROLE':if(!out.title)out.title=value;else out.extras.push(key+': '+value);break;
   case 'TEL':{const phone=AL.normDigits(value.replace(/^tel:/i,''));if(phone&&!out.phones.includes(phone))out.phones.push(phone);break;}
   case 'EMAIL':if(!out.email)out.email=value;else out.extras.push('ایمیل دیگر: '+value);break;
   case 'ADR':{const address=value.split(';').filter(Boolean).join(' — ');if(!out.address)out.address=address;else out.extras.push('آدرس دیگر: '+address);break;}
   case 'NOTE':out.description=[out.description,value].filter(Boolean).join('\n');for(const url of value.match(/https?:\/\/[^\s<>]+/gi)||[])addUrl(url,'');break;
   case 'URL':case 'X-SOCIALPROFILE':case 'IMPP':addUrl(value,header);break;
   default:out.extras.push(key+': '+value);
  }
 }
 out.name=company||personal;
 if(company&&personal&&personal!==company)out.managerName=personal;
 return out;
}
window.ALContactImport={parseCard};
let returnFocus=null;
const overlay=document.createElement('div');overlay.hidden=true;overlay.id='contact-review';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','بررسی اطلاعات مخاطب');overlay.style.cssText='position:fixed;inset:0;z-index:12000;background:#000b;overflow:auto;padding:18px;';
const panel=document.createElement('div');panel.style.cssText='background:white;color:#222;max-width:540px;margin:20px auto;padding:20px;border-radius:18px;';overlay.appendChild(panel);document.body.appendChild(overlay);
function close(){overlay.hidden=true;panel.replaceChildren();if(returnFocus)returnFocus.focus();}
function review(data){
 returnFocus=document.activeElement;panel.replaceChildren();
 const title=document.createElement('h3');title.textContent='بررسی و انتخاب اطلاعات مخاطب';panel.appendChild(title);
 const hint=document.createElement('p');hint.textContent='موارد تیک‌خورده به فرم منتقل می‌شوند و جای اطلاعات همان فیلد را می‌گیرند. مقدارها را ویرایش یا تیک موارد ناخواسته را بردارید. دفترچه تلفن گوشی تغییر نمی‌کند و هنوز چیزی ابری ذخیره نمی‌شود.';panel.appendChild(hint);
 const fields=[];
 for(const [key,label] of Object.entries(labels)){
  let value=key==='phones'?(data.phones||[]).join('\n'):data[key];if(!value)continue;
  const wrap=document.createElement('div');wrap.style.cssText='margin:16px 0;border-bottom:1px solid #ddd;padding-bottom:12px;';
  const check=document.createElement('input');check.type='checkbox';check.checked=true;check.style.cssText='width:22px;height:22px;margin-left:8px;vertical-align:middle;';
  const heading=document.createElement('label');heading.append(check,document.createTextNode(label));wrap.appendChild(heading);
  const input=document.createElement('textarea');input.value=value;input.rows=key==='phones'?3:2;input.setAttribute('aria-label',label);if(key==='phones')input.dir='ltr';wrap.appendChild(input);panel.appendChild(wrap);fields.push({key,check,input});
 }
 if(data.extras&&data.extras.length){const label=document.createElement('p');label.textContent='اطلاعات دیگر (خودکار منتقل نمی‌شوند؛ در صورت نیاز کپی کنید):';const notes=document.createElement('textarea');notes.readOnly=true;notes.rows=5;notes.value=data.extras.join('\n');panel.append(label,notes);}
 const apply=document.createElement('button');apply.type='button';apply.textContent='انتقال موارد انتخاب‌شده به فرم';
 apply.onclick=()=>{
  const selected=fields.filter(f=>f.check.checked);
  const phonesField=selected.find(f=>f.key==='phones');
  let numbers=[];if(phonesField){numbers=[...new Set(phonesField.input.value.split(/[\n,،]+/).map(AL.normDigits).filter(Boolean))];if(numbers.length>10){alert('حداکثر ۱۰ شماره قابل انتقال است؛ شماره‌های اضافی را از این فهرست حذف کنید.');return;}}
  if(!confirm('فیلدهای انتخاب‌شده در فرم جایگزین شوند؟ اطلاعات قبلی این فیلدها در فرم تغییر می‌کند، ولی مخاطب گوشی و کارت ذخیره‌شده هنوز تغییر نمی‌کنند.'))return;
  for(const field of selected){if(field.key==='phones'){const container=$('phones-container');container.replaceChildren();(numbers.length?numbers:['']).forEach(n=>addPhoneField(n));}else{const target=$(ids[field.key]);if(target)target.value=field.input.value.trim();}}
  if(selected.some(f=>f.key==='address')){const target=$('address');target.dispatchEvent(new Event('input',{bubbles:true}));}
  close();if(typeof showStatus==='function')showStatus('✅ اطلاعات به فرم منتقل شد؛ بررسی کنید، سپس ساخت کارت را بزنید.','success');
 };
 const cancel=document.createElement('button');cancel.type='button';cancel.textContent='انصراف';cancel.onclick=close;panel.append(apply,cancel);overlay.hidden=false;cancel.focus();
}
overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
document.addEventListener('keydown',e=>{if(overlay.hidden)return;if(e.key==='Escape')close();if(e.key==='Tab'){const focus=[...panel.querySelectorAll('input,textarea,button')];if(!focus.length)return;const first=focus[0],last=focus[focus.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
window.pickPhoneContact=async function(){
 if(!navigator.contacts||!navigator.contacts.select){alert('این مرورگر انتخاب مستقیم مخاطب را پشتیبانی نمی‌کند. از دکمه «وارد کردن فایل مخاطب VCF» استفاده کنید یا اطلاعات را دستی وارد کنید.');return;}
 try{
  const supported=navigator.contacts.getProperties?await navigator.contacts.getProperties():['name','tel'];
  const properties=['name','tel','email','address'].filter(k=>supported.includes(k));
  if(!properties.length)throw new Error('unsupported');
  const result=await navigator.contacts.select(properties,{multiple:false});if(!result.length)return;const c=result[0];
  const data={name:(c.name||[])[0]||'',phones:(c.tel||[]).map(AL.normDigits).filter(Boolean),email:(c.email||[])[0]||'',extras:[]};
  const addresses=(c.address||[]).map(a=>[...(a.addressLine||[]),a.city,a.region,a.postalCode,a.country].filter(Boolean).join(' — '));data.address=addresses[0]||'';
  if((c.name||[]).length>1)data.extras.push('نام‌های دیگر: '+c.name.slice(1).join(' — '));
  if((c.email||[]).length>1)data.extras.push('ایمیل‌های دیگر: '+c.email.slice(1).join(' — '));
  if(addresses.length>1)data.extras.push('آدرس‌های دیگر: '+addresses.slice(1).join('\n'));
  review(data);
 }catch(e){if(e.name!=='AbortError')alert('خواندن مخاطب انجام نشد. مجوز را بررسی کنید یا از فایل VCF استفاده کنید.');}
};
const picker=document.createElement('input');picker.type='file';picker.accept='.vcf,.vcard,text/vcard,text/x-vcard';picker.hidden=true;document.body.appendChild(picker);
picker.onchange=async()=>{
 const file=picker.files[0];if(!file)return;
 try{
  if(file.size>10*1024*1024)throw new Error('فایل بیش از ۱۰ مگابایت است؛ فقط یک مخاطب را صادر کنید.');
  const text=await file.text();const cards=text.match(/BEGIN:VCARD[\s\S]*?END:VCARD/gi)||[];
  if(!cards.length)throw new Error('فایل مخاطب VCF معتبر پیدا نشد.');
  let index=0;
  if(cards.length>1){if(cards.length>100)throw new Error('این فایل مخاطبان زیادی دارد؛ فقط مخاطب موردنظر را صادر کنید.');const answer=prompt('این فایل چند مخاطب دارد. شماره مخاطب موردنظر را بنویسید:\n'+cards.map((v,i)=>(i+1)+': '+(parseCard(v).name||'بدون نام')).join('\n'),'1');if(answer===null)return;index=Number(answer)-1;if(!Number.isInteger(index)||index<0||index>=cards.length)throw new Error('انتخاب مخاطب نامعتبر است.');}
  review(parseCard(cards[index]));
 }catch(e){alert(e.message||'فایل خوانده نشد.');}finally{picker.value='';}
};
const importButton=document.createElement('button');importButton.type='button';importButton.textContent='📂 وارد کردن اطلاعات از فایل مخاطب VCF';importButton.onclick=()=>picker.click();
const note=document.createElement('p');note.className='hint';note.textContent='برای جزئیات بیشتر، در برنامه مخاطبین گوشی، مخاطب را به‌صورت فایل VCF صادر یا به اشتراک بگذارید و فایل ذخیره‌شده را اینجا انتخاب کنید. فقط اطلاعات موجود در فایل قابل انتقال است.';
$('phones-container').parentElement.append(importButton,note);
})();
