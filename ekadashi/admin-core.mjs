export const clone = x => JSON.parse(JSON.stringify(x));
export const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function photoUrl(s,draft=false){return typeof s==='string' && ( /^https:\/\/[^\s"'<>\\]+$/.test(s) || /^\/ekadashi\/img\/[\w.-]+$/.test(s) || (draft && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(s)) ) ? s : '';}
export function product(raw,states,draft=false){
  if(!raw||typeof raw!=='object')throw Error('Invalid saree.');
  const text=(k,n)=>String(raw[k]??'').trim().slice(0,n);
  if(!text('name',160))throw Error('Enter the saree name.');
  if(!states.some(s=>s.key===raw.state))throw Error('Choose a valid state / collection.');
  if(!Number.isSafeInteger(+raw.id)||+raw.id<1)throw Error('Invalid saree ID.');
  const money=k=>{const n=Number(raw[k]??0);if(!Number.isFinite(n)||n<0||n>100000000)throw Error('Enter a valid '+k+'.');return Math.round(n);};
  const price=money('price'),mrp=money('mrp');if(mrp&&mrp<price)throw Error('MRP cannot be lower than the selling price.');
  const img=(Array.isArray(raw.img)?raw.img:[]).slice(0,12);if(img.some(s=>!photoUrl(s,draft)))throw Error('Use valid HTTPS photo links or uploaded photos.');
  return {id:+raw.id,name:text('name',160),state:raw.state,weave:text('weave',80),fabric:text('fabric',40),color:/^#[0-9a-f]{6}$/i.test(raw.color)?raw.color:'#7A1020',colorName:text('colorName',30),occasion:(Array.isArray(raw.occasion)?raw.occasion:[]).filter(x=>['Wedding','Festive','Party','Office','Daily wear'].includes(x)),price,mrp,stock:['in','made','out'].includes(raw.stock)?raw.stock:'in',blouse:!!raw.blouse,length:text('length',60),desc:text('desc',3000),cert:text('cert',80),img,featured:!!raw.featured,hidden:!!raw.hidden,order:Number.isFinite(+raw.order)?+raw.order:0};
}
export function collection(raw){
  if(!raw||! /^[a-z0-9-]{1,40}$/.test(raw.key||''))throw Error('State key must contain lowercase letters, numbers or hyphens.');
  const name=String(raw.name||'').trim().slice(0,60);if(!name)throw Error('Enter a state name.');
  const hex=(v,d)=>/^#[a-f0-9]{6}$/i.test(v||'')?v:d;
  return {key:raw.key,name,region:['North','West','South','East','Central','Northeast'].includes(raw.region)?raw.region:'North',weaves:(Array.isArray(raw.weaves)?raw.weaves:[]).map(s=>String(s).trim().slice(0,60)).filter(Boolean).slice(0,12),note:String(raw.note||'').slice(0,600),motif:['buti','phulkari','kani','dots','ikat','paithani','checks','sheer','tussar','temple','zari','kasavu','jamdani','muga','stripes'].includes(raw.motif)?raw.motif:'buti',base:hex(raw.base,'#7A1020'),accent:hex(raw.accent,'#D9A441'),border:hex(raw.border,'#4A0A14'),hidden:!!raw.hidden};
}
export function backup(raw){
 if(raw?.brand!=='Ekadashi Heritage'||raw?.version!==1||!Array.isArray(raw.data?.config?.states)||!Array.isArray(raw.data?.products))throw Error('Choose an Ekadashi Admin backup file.');
 const states=raw.data.config.states.map(collection);if(!states.length||new Set(states.map(s=>s.key)).size!==states.length)throw Error('Invalid or duplicate collections.');
 const products=raw.data.products.map(p=>product(p,states,true));if(new Set(products.map(p=>p.id)).size!==products.length)throw Error('Duplicate saree IDs.');
 const photos={};for(const [k,v] of Object.entries(raw.data.config.photos||{})){if(k==='logo'||! /^[\w -]{1,50}$/.test(k))continue;if(!Array.isArray(v)||v.some(x=>!photoUrl(x,true)))throw Error('Invalid photo in backup.');photos[k]=v.slice(0,12);}
 return {products,config:{states,photos}};
}
