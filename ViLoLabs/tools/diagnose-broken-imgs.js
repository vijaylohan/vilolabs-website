#!/usr/bin/env node
/* Load a worksheet URL, wait 25 seconds, then dump the state of every <img>
   inside .ws-page.act so we can see exactly which images break and why. */
'use strict';
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');
const WebSocket = require(path.join(__dirname,'..','node_modules','ws'));

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9224;
const URL_ = process.argv[2] || 'https://vilolabs.in/sheets.html?w=free-printable-worksheets-grade-1-animals-028w5k5';

(async ()=>{
  const profile = path.join(require('os').tmpdir(), 'vilo-diag-'+Date.now());
  fs.mkdirSync(profile,{recursive:true});
  const chrome = spawn(CHROME,[
    '--headless=new','--disable-gpu','--no-sandbox','--hide-scrollbars',
    '--window-size=900,1300','--remote-debugging-port='+PORT,
    '--user-data-dir='+profile,'about:blank',
  ],{stdio:['ignore','pipe','pipe']});

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

  // Wait 25 seconds
  await new Promise(r=>setTimeout(r, 25000));

  // Dump every img inside the active page
  const r = await send('Runtime.evaluate',{expression: `JSON.stringify((function(){
    const screen = document.querySelector('.ws-page.act');
    if(!screen) return { error:'no .ws-page.act' };
    const imgs = [...screen.querySelectorAll('img')];
    return {
      wsReady: (typeof _wsReady!=='undefined')?_wsReady:'undef',
      curLvl: (typeof curLvl!=='undefined')?curLvl:'undef',
      totalImgs: imgs.length,
      brokenImgs: imgs
        .map((img, i) => ({
          i,
          complete: img.complete,
          nw: img.naturalWidth,
          nh: img.naturalHeight,
          srcKind: img.src.startsWith('data:') ? 'data-uri' : 'url',
          srcSample: img.src.startsWith('data:')
            ? img.src.slice(0, 30) + '...' + img.src.length + 'B'
            : img.src.slice(-60),
        }))
        .filter(o => !o.complete || o.nw === 0)
    };
  })())`, returnByValue:true});
  console.log(JSON.parse(r.result.value));

  ws.close(); chrome.kill();
})().catch(e=>{console.error(e); process.exit(1);});
