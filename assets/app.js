
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s??'').normalize('NFKC').toLowerCase().replace(/[\s·_()\-]/g,'');
const isReview=r=>r.status.includes('확인 필요')||r.status==='공급정보 미완';
let saved=new Set();try{const x=JSON.parse(localStorage.getItem('sh-finder-saved-v2')||'[]');if(Array.isArray(x))saved=new Set(x.map(Number));}catch{}
let state={mode:'all',q:'',district:'',supply:'',sort:'code'},current=[],toastTimer;
function notify(t){$('#toast').textContent=t;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,2200)}
function badge(r){return `<span class="badge ${r.status.includes('필요')?'warn':r.status==='공급정보 미완'?'gray':r.hidden?'missing':''}">${esc(r.status)}</span>`}
function field(v,fallback='미수집'){return esc(v||fallback)}
function star(r){return `<button class="star" data-star="${r.code}" aria-pressed="${saved.has(r.code)}" aria-label="${esc(r.name)} 관심 ${saved.has(r.code)?'해제':'등록'}">${saved.has(r.code)?'★':'☆'}</button>`}
function tableRow(r){return `<tr><td><span class="code">${r.code}</span>${star(r)}</td><td><strong>${esc(r.name)}</strong><div class="tablebadge">${badge(r)}</div>${r.note?`<p class="table-note">${esc(r.note)}</p>`:''}${r.source?`<a href="${esc(r.source)}" target="_blank" rel="noopener noreferrer">이름 대조 출처 ↗</a>`:''}</td><td class="table-address">${field(r.address)}</td><td>${field(r.type,'미등록')}</td><td>${r.units==='0'?'0 · 미완':field(r.units)}</td><td>${field(r.sizes)}</td><td><a class="btn" href="${r.url}" target="_blank" rel="noopener noreferrer">SH ↗</a></td></tr>`}
function filtered(){const raw=state.q.trim(),parts=raw.split(/\s+/).map(norm).filter(Boolean),whole=norm(raw);return DATA.rows.filter(r=>{
 if(state.mode==='hidden'&&!r.hidden||state.mode==='review'&&!isReview(r)||state.mode==='saved'&&!saved.has(r.code))return false;
 if(state.district&&r.district!==state.district)return false;
 if(state.supply&&(state.supply==='unknown'?!!r.type:!r.type.includes(state.supply)))return false;
 const text=norm([r.name,r.shName,r.address,r.code,r.type].join(' '));return !raw||text.includes(whole)||parts.every(p=>text.includes(p));
 }).sort((a,b)=>state.sort==='name'?a.name.localeCompare(b.name,'ko'):state.sort==='new'?b.code-a.code:a.code-b.code)}
function render(){current=filtered();$('#count').innerHTML=`${({all:'수록 목록',hidden:'이름 누락',review:'확인 필요',saved:'관심 목록'})[state.mode]} <span class="nowrap">${current.length}건</span>`;$('#clearq').hidden=!state.q;
 $$('.tab').forEach(b=>b.setAttribute('aria-pressed',String(state.mode===b.dataset.mode)));
 $('#savednum').textContent=saved.size;$('#tablebox').hidden=!current.length;$('#tablebody').innerHTML=current.map(tableRow).join('');
 $('#empty').hidden=!!current.length;$('#emptytitle').textContent=state.mode==='saved'&&!saved.size?'아직 관심 단지가 없습니다':'일치하는 단지가 없습니다';$('#emptytext').textContent=state.mode==='saved'&&!saved.size?'표의 별표를 눌러 관심 목록에 모아두세요.':'검색어를 짧게 입력하거나 필터를 줄여보세요.';
 $('#export').disabled=!current.length;
 const chips=[state.q&&['검색',state.q],state.district&&['지역',state.district],state.supply&&['유형',state.supply==='unknown'?'미등록':state.supply]].filter(Boolean);$('#activefilters').hidden=!chips.length;$('#activefilters').innerHTML=chips.map(([k,v])=>`<span class="chip">${k} · ${esc(v)}</span>`).join('')+'<button class="reset" id="reset">조건 초기화</button>';if($('#reset'))$('#reset').onclick=reset;
}
function update(){render()}function reset(){state.q='';state.district='';state.supply='';state.sort='code';$('#q').value='';$('#district').value='';$('#supply').value='';$('#sort').value='code';update()}
$('#allnum').textContent=DATA.rows.length;$('#hiddennum').textContent=DATA.rows.filter(r=>r.hidden).length;$('#reviewnum').textContent=DATA.rows.filter(isReview).length;
for(const d of [...new Set(DATA.rows.map(r=>r.district).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ko'))){const o=document.createElement('option');o.value=d;o.textContent=d;$('#district').append(o)}
$('#q').addEventListener('input',e=>{state.q=e.target.value;update()});$('#clearq').onclick=()=>{state.q='';$('#q').value='';update();$('#q').focus()};['district','supply','sort'].forEach(k=>$('#'+k).addEventListener('change',e=>{state[k]=e.target.value;update()}));$$('[data-mode]').forEach(b=>b.onclick=()=>{state.mode=b.dataset.mode;update()});$$('[data-query]').forEach(b=>b.onclick=()=>{state.q=b.dataset.query;$('#q').value=state.q;update()});$('#resetempty').onclick=()=>{state.mode='all';reset()};
function resultClick(e){const b=e.target.closest('[data-star]');if(!b)return;const code=Number(b.dataset.star);saved.has(code)?saved.delete(code):saved.add(code);try{localStorage.setItem('sh-finder-saved-v2',JSON.stringify([...saved]));notify(saved.has(code)?'관심 목록에 담았습니다':'관심 목록에서 해제했습니다')}catch{notify('관심 목록이 저장되지 않을 수 있습니다')}render()}$('#tablebody').onclick=resultClick;
$('#export').onclick=()=>{const keys=['code','name','shName','address','type','units','sizes','status','note','url','source'];const heads=['biznsCd','단지명','SH 표시명','SH 주소','공급유형','SH 임대세대수','공급형(SH 표기)','확인 상태','참고','SH URL','이름 대조 출처'];const csv=[heads,...current.map(r=>keys.map(k=>r[k]))].map(row=>row.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(',')).join('\r\n');const url=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='SH-단지목록-'+current.length+'개코드-20261028.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify(current.length+'개 코드의 CSV를 저장했습니다')};
document.addEventListener('keydown',e=>{const typing=/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);if(e.key==='/'&&!typing){e.preventDefault();$('#q').focus()}if(e.key==='Escape'&&document.activeElement===$('#q'))$('#clearq').click()});render();

