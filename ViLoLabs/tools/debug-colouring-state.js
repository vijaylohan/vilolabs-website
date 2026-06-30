#!/usr/bin/env node
/* Quick CDP diagnostic — load a colouring URL and dump worksheet state every
   second for 15 sec, so we can see exactly which marker isn't firing. */
'use strict';
const { spawn, spawnSync } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');
const WebSocket = require(path.join(__dirname,'..','node_modules','ws'));

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9223;
const URL_ = process.argv[2] || 'https://vilolabs.in/sheets.html?w=coloring-pages-for-kids-animals-1w7r07f';

(async ()=>{
  const profile = path.join(require('os').tmpdir(), 'vilo-dbg-'+Date.now());
  fs.mkdirSync(profile,{recursive:true});
  const chrome = spawn(CHROME,[
    '--headless=new','--disable-gpu','--no-sandbox','--hide-scrollbars',
    '--window-size=900,1300','--remote-debugging-port='+PORT,
    '--user-data-dir='+profile,'about:blank',
  ],{stdio:['ignore','pipe','pipe']});

  // wait for port
  for(let i=0;i<60;i++){ try{
    await new Promise((r,j)=>http.get('http://127.0.0.1:'+PORT+'/json/version',o=>{o.resume();r();}).on('error',j));
    break;
  }catch(e){ await new Promise(r=>setTimeout(r,150));}}

  const targets = await new Promise(r=>http.get('http://127.0.0.1:'+PORT+'/json',o=>{let d='';o.on('data',c=>d+=c);o.on('end',()=>r(JSON.parse(d)));}));
  const t = targets.find(x=>x.type==='page');
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  let id=0; const pending = new Map();
  const send=(m,p={})=>new Promise((res,rej)=>{const i=++id;pending.set(i,{res,rej});ws.send(JSON.stringify({id:i,method:m,params:p}));});
  await new Promise(r=>ws.once('open',r));
  ws.on('message', raw=>{const m=JSON.parse(raw); if(m.id&&pending.has(m.id)){const {res,rej}=pending.get(m.id);pending.delete(m.id); m.error?rej(new Error(m.error.message)):res(m.result);}});

  await send('Page.enable'); await send('Runtime.enable');
  console.log('Loading', URL_);
  await send('Page.navigate',{url:URL_});

  for(let s=1; s<=15; s++){
    await new Promise(r=>setTimeout(r,1000));
    const r = await send('Runtime.evaluate',{expression: `JSON.stringify({
      readyState: document.readyState,
      hasWsPage: !!document.querySelector('.ws-page'),
      hasWsPageAct: !!document.querySelector('.ws-page.act'),
      hasColMain: !!document.querySelector('.col-main-wrap'),
      wsReady: (typeof _wsReady!=='undefined')?_wsReady:'undef',
      curLvl: (typeof curLvl!=='undefined')?curLvl:'undef',
      curTopic: (typeof curTopic!=='undefined')?curTopic:'undef',
      metaSlug: (typeof _wsCurrentMeta!=='undefined' && _wsCurrentMeta)?_wsCurrentMeta.slug:null,
      activeScreen: document.querySelector('.screen.act')?document.querySelector('.screen.act').id:null,
      visibleWsContainer: !!document.getElementById('wsContainer') && document.getElementById('wsContainer').offsetParent!==null,
      libLoaded: typeof LIB!=='undefined' && LIB && LIB.length || 0
    })`, returnByValue:true});
    console.log(`t+${s}s:`, r.result.value);
  }
  ws.close(); chrome.kill();
})().catch(e=>{console.error(e); process.exit(1);});
