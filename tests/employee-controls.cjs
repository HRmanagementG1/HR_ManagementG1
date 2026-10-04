const fs=require('fs'),vm=require('vm'),assert=require('assert');
const path = require('node:path');
const readScript = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const source = readScript('Shared/workspace.js');
const defaults=[{id:'hr',name:'HR',role:'HR',password:'p'},{id:'emp',name:'Employee',role:'Employee',password:'p'}];
const store=new Map();let redirects=[];
function put(k,v){store.set(k,JSON.stringify(v));}
async function load(){const context={URL,console,window:{},document:{currentScript:{src:'http://localhost/Shared/workspace.js'}},location:{href:'http://localhost/',replace:url=>redirects.push(String(url))},localStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},fetch:async()=>({ok:true,json:async()=>defaults})};vm.runInNewContext(source,context);await context.window.workspace.ready;return context.window.workspace;}
(async()=>{
 put('site_session',defaults[0]);let W=await load();assert.equal(W.setEmployeeBlocked('hr',true),false);assert.equal(W.setEmployeeBlocked('emp',true),true);assert.equal(W.users().length,2);
 W=await load();assert.equal(W.users().find(e=>e.id==='emp').blocked,true);assert.equal(W.setEmployeeBlocked('emp',false),true);W=await load();assert.equal(W.users().find(e=>e.id==='emp').blocked,false);
 put('site_session',defaults[1]);assert.equal(W.setEmployeeBlocked('hr',true),false);put('site_session',defaults[0]);W.setEmployeeBlocked('emp',true);put('site_session',defaults[1]);W=await load();assert.equal(W.session(),null);assert.equal(W.requireRole('Employee'),false);
 put('site_deleted_users',['emp']);put('site_session',defaults[0]);W=await load();assert.equal(W.users().find(e=>e.id==='emp').blocked,true);assert.equal(store.has('site_deleted_users'),false);W.setEmployeeBlocked('emp',false);
 put('site_leaves',[{owner:'emp',start:'2026-10-01',end:'2026-10-05',status:'Approved'},{owner:'emp',start:'2026-11-01',end:'2026-11-03',status:'Pending'},{owner:'emp',start:'2026-12-01',end:'2026-12-10',status:'Declined'},{owner:'hr',start:'2026-10-01',end:'2026-10-10',status:'Approved'}]);assert.equal(W.leaveBalance('emp',2026),10);assert.equal(W.leaveDays('2026-10-04','2026-10-04'),1);assert.equal(W.leaveDays('bad','bad'),0);
 let leaves=W.read('site_leaves');leaves[1].status='Declined';W.save('site_leaves',leaves);assert.equal(W.leaveBalance('emp',2026),10);
 leaves.push({owner:'emp',start:'2026-11-01',end:'2026-11-10',status:'Pending'});W.save('site_leaves',leaves);assert.equal(W.leaveBalance('emp',2026),10);leaves[leaves.length-1].status='Approved';W.save('site_leaves',leaves);assert.equal(W.leaveBalance('emp',2026),0);assert.equal(W.leaveBalance('emp',2027),15);
 const original={id:'task',employeeId:'emp',title:'Old',description:'Old description',priority:'Normal',dueDate:'2026-10-10',status:'Submitted',submission:'work.pdf',feedback:'Review',attachments:['file'],visibleToEmployee:false};W.saveTasks([original]);
 const fields={};for(const key of ['title','employeeId','description','priority','dueDate','visibility'])fields[key]={value:''};let submit;
 const form={elements:fields,querySelector:()=>({textContent:''}),addEventListener:(name,fn)=>{if(name==='submit')submit=fn;},reportValidity:()=>true};const nodes={taskForm:form,employeeSelect:{innerHTML:'',add(){} }};let onReady;
 const ctx={window:{workspace:W},document:{addEventListener:(name,fn)=>{onReady=fn;},querySelectorAll:()=>[],getElementById:id=>nodes[id]||null,querySelector:()=>({textContent:''})},location:{search:'?id=task',pathname:'/add-task.html'},URL,URLSearchParams,Option:function(){},crypto:{randomUUID:()=> 'new'}};
 vm.runInNewContext(readScript('Lujain/TaskHr/hr.js'),ctx);await onReady();assert.equal(fields.title.value,'Old');assert.equal(fields.priority.value,'Medium');fields.title.value='Edited';submit({preventDefault(){},target:form});const updated=W.tasks()[0];assert.equal(updated.title,'Edited');assert.equal(updated.status,'Submitted');assert.equal(updated.submission,'work.pdf');assert.equal(updated.attachments[0],'file');assert.equal(W.tasks().length,1);
 // Run the real employee leave submit handler with a small DOM fixture.
 put('site_session',defaults[1]); W=await load(); W.save('site_leaves',[]);
 function element() { return {value:'',textContent:'',style:{},classList:{remove(){},add(){}},events:{},addEventListener(name,handler){this.events[name]=handler;},appendChild(){},prepend(){},reportValidity:()=>true,querySelector:()=>({disabled:false})}; }
 const leaveNodes={};for(const id of ['myfile','imagePreview','leave-form','employee','type','start','end','reason','form-result','reason-count'])leaveNodes[id]=element();
 let leaveReady;
 const db={objectStoreNames:{contains:()=>true}};
 const indexedDB={open(){const request={};queueMicrotask(()=>request.onsuccess({target:{result:db}}));return request;}};
 const leaveContext={window:{workspace:W,addEventListener(){},employeeWorkspace:{getData:key=>W.read(key),saveData:(key,value)=>W.save(key,value),getCurrentUser:()=>W.session(),loadEmployees:async()=>W.users()}},document:{addEventListener:(name,fn)=>{leaveReady=fn;},getElementById:id=>leaveNodes[id],createElement:()=>element()},indexedDB,console,Date,setTimeout:()=>{}};
 vm.runInNewContext(readScript('Wessam/employee_leave_create.js'),leaveContext);await leaveReady();await new Promise(resolve=>setImmediate(resolve));
 Object.assign(leaveNodes.employee,{value:'emp'});leaveNodes.type.value='Annual';leaveNodes.start.value='2099-10-01';leaveNodes.end.value='2099-10-16';leaveNodes.reason.value='Test leave request';
 await leaveNodes['leave-form'].events.submit({preventDefault(){}});assert.equal(W.read('site_leaves').length,0);assert.match(leaveNodes['form-result'].textContent,/15 leave days remaining/);
 leaveNodes.end.value='2099-10-03';await leaveNodes['leave-form'].events.submit({preventDefault(){}});assert.equal(W.read('site_leaves').length,1);assert.equal(W.leaveBalance('emp',2099),15);
 // Test HR initialization, cancellation, and required rejection reasons.
 put('site_session',defaults[0]);W=await load();let hrReady;
 const hrNodes={};for(const id of ['leave-table-body','rejectionDialog','rejectionForm','rejectionEmployee','rejectionError','rejectionReason','cancelRejection','leaveActionError'])hrNodes[id]=element();
 hrNodes.rejectionDialog.showModal=function(){this.open=true;};hrNodes.rejectionDialog.close=function(){this.open=false;};hrNodes.rejectionForm.reset=()=>{hrNodes.rejectionReason.value='';};hrNodes.rejectionReason.focus=()=>{};
 const hrContext={window:{workspace:W,addEventListener(){}},document:{addEventListener:(name,fn)=>{hrReady=fn;},getElementById:id=>hrNodes[id]||null,querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>element()},indexedDB,URL,console,Date};
 vm.runInNewContext(readScript('Wessam/hr_leave.js'),hrContext);await hrReady();assert.equal(W.leaves().length,1);
 const id=W.leaves()[0].id;const event={target:{closest:selector=>selector==='.btn-decline'?{dataset:{id:String(id)}}:null}};
 const pending=W.leaves()[0];
 W.save('site_leaves',[pending,{id:999,owner:'emp',start:'2099-01-01',end:'2099-01-14',status:'Approved'}]);
 const approveEvent={target:{closest:selector=>selector==='.btn-approve'?{dataset:{id:String(id)}}:null}};
 hrNodes['leave-table-body'].events.click(approveEvent);assert.equal(W.leaves()[0].status,'Pending');assert.match(hrNodes.leaveActionError.textContent,/1 leave days remaining.*2099/);
 W.save('site_leaves',[pending]);hrNodes['leave-table-body'].events.click(approveEvent);assert.equal(W.leaves()[0].status,'Approved');assert.equal(W.leaveBalance('emp',2099),12);
 W.save('site_leaves',[pending]);
 hrNodes['leave-table-body'].events.click(event);assert.equal(hrNodes.rejectionDialog.open,true);hrNodes.cancelRejection.events.click();assert.equal(W.leaves()[0].status,'Pending');
 hrNodes['leave-table-body'].events.click(event);hrNodes.rejectionReason.value='   ';hrNodes.rejectionForm.events.submit.call(hrNodes.rejectionForm,{preventDefault(){}});assert.equal(W.leaves()[0].status,'Pending');
 const reason='Coverage is required for those dates.';hrNodes.rejectionReason.value=reason;hrNodes.rejectionForm.events.submit.call(hrNodes.rejectionForm,{preventDefault(){}});assert.equal(W.leaves()[0].status,'Declined');assert.equal(W.leaves()[0].rejectionReason,reason);assert.equal(W.leaveBalance('emp'),15);
 store.delete('site_leaves');vm.runInNewContext(readScript('Wessam/hr_leave.js'),hrContext);await hrReady();assert.equal(W.leaves().length,0);assert.equal(store.has('site_leaves'),false);
 const savedDB=hrContext.indexedDB;hrContext.indexedDB={open(){const request={error:new Error('Unavailable')};queueMicrotask(()=>request.onerror());return request;}};hrContext.console={warn(){}};vm.runInNewContext(readScript('Wessam/hr_leave.js'),hrContext);await hrReady();assert.match(hrNodes['leave-table-body'].innerHTML,/No leave requests/);hrContext.indexedDB=savedDB;
 W.save('site_leaves',{invalid:true});assert.equal(W.leaveBalance('emp'),15);W.save('site_leaves',[{owner:'emp',start:'2099-01-01',end:'2099-01-03',status:'approved'}]);assert.equal(W.leaveBalance('emp',2099),12);
 W.save('site_leaves',[{owner:'emp',start:'2026-12-29',end:'2027-01-04',status:'Approved'}]);assert.equal(W.leaveBalance('emp',2026),12);assert.equal(W.leaveBalance('emp',2027),11);assert.equal(W.leaveBalance('emp',2028),15);assert.match(W.leaveAllowanceError('emp','2027-02-01','2027-02-12'),/11 leave days remaining.*2027/);assert.equal(W.leaveAllowanceError('emp','2028-02-01','2028-02-15'),'');
 console.log('PASS: block/unblock, reload persistence, self-protection, employee authorization, session invalidation, legacy deletion migration, approved-only annual leave balances and exhaustion, task editing preserves submissions and status, leave form rejects over 15 days, HR rejection dialog validates and stores a reason, HR leaves initialize without demo data and tolerate attachment storage failure, invalid leave storage safely falls back.');
})().catch(e=>{console.error(e);process.exitCode=1;});
