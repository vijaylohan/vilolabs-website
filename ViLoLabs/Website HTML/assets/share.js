/* ════════════════════════════════════════════════════════════════
   ViLoLabs — shared Share component
   Renders a theme-agnostic share bar. Native share sheet on phones,
   explicit button row on desktop. No dependencies.

   USAGE (auto):
     <link rel="stylesheet" href="/assets/share.css">
     <div class="vshare"
          data-url="https://vilolabs.in/blog/foo"   (optional; defaults to current URL)
          data-title="Headline to share"            (optional; defaults to document.title)
          data-hook="Found this useful? Share it 👇" (optional)
          data-pin-image="https://.../card.jpg"></div> (optional, for Pinterest)
     <script src="/assets/share.js" defer></script>

   USAGE (manual, e.g. after dynamic render):
     ViloShare.mount(elementOrSelector, {url, title, hook, pinImage, variant});
   ════════════════════════════════════════════════════════════════ */
(function (w, d) {
  'use strict';

  // SVG glyphs (inherit currentColor)
  var ICON = {
    native:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>',
    wa:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-2.8.7.8-2.7-.2-.3A8 8 0 1 1 12 20zm4.4-6c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.1-.2 0-.4.1-.5l.4-.5.2-.4v-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2c0 1.3 1 2.6 1.1 2.8.1.2 1.9 2.9 4.6 4 .6.3 1.1.4 1.5.6.6.2 1.2.2 1.6.1.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1l-.4-.2z"/></svg>',
    tg:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.9 4.3l-3.3 15.6c-.2 1.1-.9 1.4-1.8.9l-5-3.7-2.4 2.3c-.3.3-.5.5-1 .5l.4-5 9.1-8.2c.4-.4-.1-.6-.6-.2L6 13.9l-4.9-1.5c-1.1-.3-1.1-1 .2-1.5l19.1-7.4c.9-.3 1.7.2 1.4 1.3z"/></svg>',
    fb:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 9h3V6h-3c-1.7 0-3 1.3-3 3v2H9v3h2v6h3v-6h2.5l.5-3H14V9.5c0-.3.2-.5.5-.5z"/></svg>',
    pin:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-3.6 19.3c-.1-.8-.2-2 0-2.9l1.2-5s-.3-.6-.3-1.5c0-1.4.8-2.4 1.8-2.4.9 0 1.3.6 1.3 1.4 0 .9-.5 2.2-.8 3.4-.2.9.5 1.7 1.4 1.7 1.7 0 2.9-2.2 2.9-4.7 0-1.9-1.3-3.4-3.7-3.4a4.2 4.2 0 0 0-4.4 4.2c0 .8.3 1.4.6 1.8l-.3 1c0 .2-.2.3-.4.2-1.1-.5-1.7-2-1.7-3.1 0-2.5 1.9-4.9 5.5-4.9 2.9 0 5.1 2.1 5.1 4.8 0 2.9-1.8 5.2-4.4 5.2-.9 0-1.7-.5-2-1l-.5 2c-.2.8-.7 1.7-1 2.3A10 10 0 1 0 12 2z"/></svg>',
    x:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 3h3l-6.6 7.5L21.8 21h-5.9l-4.6-6-5.3 6H3l7-8L2.6 3h6l4.2 5.5L17.5 3zm-1 16h1.6L7.6 4.7H5.9L16.5 19z"/></svg>',
    mail:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
    copy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1"/></svg>'
  };

  // labels (English default; pass opts.labels to override, e.g. Hindi on sheets.html)
  var L = {share:'Share', wa:'WhatsApp', tg:'Telegram', fb:'Facebook',
           pin:'Pinterest', x:'X', mail:'Email', copy:'Copy', copyLink:'Copy link',
           copied:'Link copied! ✓'};

  function enc(s){ return encodeURIComponent(s); }
  function pop(url){ w.open(url,'_blank','noopener,width=600,height=620'); }

  // phones get the native sheet; desktop gets the button row
  function isMobileShare(){
    return !!(navigator.share) && w.matchMedia && w.matchMedia('(pointer: coarse)').matches;
  }

  function toast(msg){
    var t = d.querySelector('.vshare-toast');
    if(!t){ t = d.createElement('div'); t.className='vshare-toast'; d.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._t); t._t = setTimeout(function(){ t.classList.remove('show'); }, 2200);
  }

  function btn(cls, icon, label){
    return '<button type="button" class="vsbtn '+cls+'" data-act="'+cls+'">'+ICON[icon]+'<span>'+label+'</span></button>';
  }

  function canonicalURL(){
    var c = d.querySelector('link[rel="canonical"]');
    return (c && c.href) ? c.href : (location.origin + location.pathname);
  }

  // strip a trailing " | Brand" / " — Brand" SEO suffix for a cleaner headline
  function cleanTitle(s){ return (s||'').split(' | ')[0].trim(); }

  function render(el, o){
    var url   = o.url   || canonicalURL();
    var title = o.title || d.title;
    // the natural one-line message that travels WITH the link (falls back to a
    // cleaned headline). Keep it short & human — set per surface via opts.message.
    var msg   = o.message || cleanTitle(title);
    var hook  = o.hook  || 'Found this useful? Send it to someone 👇';
    var pin   = o.pinImage || '';
    var lab   = o.labels || L;

    var u = enc(url), t = enc(msg);
    // optional tail (e.g. "Want to make your own? 👉 <create-url>") appended AFTER
    // the shared link. Include its own leading newlines in the string.
    var tail = o.tail || '';
    var tEnc = tail ? enc(tail) : '';
    var intents = {
      wa:'https://wa.me/?text='+t+'%20'+u+tEnc,
      tg:'https://t.me/share/url?url='+u+'&text='+t+tEnc,
      fb:'https://www.facebook.com/sharer/sharer.php?u='+u,
      pin:'https://pinterest.com/pin/create/button/?url='+u+'&description='+t+tEnc+(pin?'&media='+enc(pin):''),
      x:'https://twitter.com/intent/tweet?text='+t+tEnc+'&url='+u,
      mail:'mailto:?subject='+t+'&body='+t+'%0A%0A'+u+tEnc
    };

    var mobile = '<div class="vshare-row" data-row="mobile">'+
        btn('native','native',lab.share)+ btn('wa','wa',lab.wa)+ btn('copy','copy',lab.copy)+
      '</div>';
    var desktop = '<div class="vshare-row" data-row="desktop">'+
        btn('wa','wa',lab.wa)+ btn('tg','tg',lab.tg)+ btn('fb','fb',lab.fb)+
        btn('pin','pin',lab.pin)+ btn('x','x',lab.x)+ btn('mail','mail',lab.mail)+
        btn('copy','copy',lab.copyLink)+
      '</div>';

    el.innerHTML = (hook? '<div class="vshare-hook">'+hook+'</div>':'') + mobile + desktop;

    // rowOnly → always show the explicit desktop row (used where the native
    // sheet is triggered separately, e.g. a toolbar button, to avoid a double tap)
    var mob = o.rowOnly ? false : isMobileShare();
    el.querySelector('[data-row="mobile"]').hidden  = !mob;
    el.querySelector('[data-row="desktop"]').hidden =  mob;

    // keep latest url/title/labels/intents on the element so a single
    // delegated listener (bound once) always uses fresh values even if
    // render() runs again (e.g. auto-init then a manual mount()).
    el._vs = {url:url, title:title, msg:msg, tail:tail, intents:intents, lab:lab, beforeShare:o.beforeShare};
    if(!el._vsBound){
      el._vsBound = true;
      el.addEventListener('click', function(e){
        var b = e.target.closest('.vsbtn'); if(!b) return;
        e.preventDefault();
        var s = el._vs, act = b.getAttribute('data-act');
        // optional side-effect before any share (e.g. register worksheet in DB)
        if(typeof s.beforeShare === 'function'){ try{ s.beforeShare(act); }catch(_){} }
        if(act==='native'){
          if(navigator.share){ navigator.share({title:s.title, text:s.msg+(s.tail||''), url:s.url}).catch(function(){}); }
          else { el.querySelector('[data-row="mobile"]').hidden=true; el.querySelector('[data-row="desktop"]').hidden=false; }
        } else if(act==='copy'){
          if(navigator.clipboard){ navigator.clipboard.writeText(s.url).then(function(){ toast(s.lab.copied); }); }
          else { toast(s.lab.copied); }
        } else if(act==='mail'){
          location.href = s.intents.mail;
        } else if(s.intents[act]){
          pop(s.intents[act]);
        }
      });
    }
    el.setAttribute('data-ready','1');
  }

  var ViloShare = {
    // true on phones (native OS share sheet available) — callers can branch on this
    canNative: function(){ return isMobileShare(); },
    // fire the native share sheet directly (runs before() first, e.g. a DB push)
    nativeShare: function(o){
      o = o || {};
      if(typeof o.before === 'function'){ try{ o.before('native'); }catch(_){} }
      if(navigator.share){
        var msg = (o.text || cleanTitle(o.title || d.title)) + (o.tail||'');
        return navigator.share({title:o.title||d.title, text:msg, url:o.url||canonicalURL()}).catch(function(){});
      }
    },
    mount: function(target, opts){
      var el = (typeof target==='string') ? d.querySelector(target) : target;
      if(el) render(el, opts||{});
      return el;
    },
    initAll: function(root){
      var els = (root||d).querySelectorAll('.vshare:not([data-ready])');
      [].forEach.call(els, function(el){
        render(el, {
          url:  el.dataset.url || undefined,
          title:el.dataset.title || undefined,
          message: el.dataset.message || undefined,   // optional punchy share line
          hook: el.dataset.hook || undefined,
          pinImage: el.dataset.pinImage || undefined
        });
      });
    }
  };
  w.ViloShare = ViloShare;

  if(d.readyState==='loading') d.addEventListener('DOMContentLoaded', function(){ ViloShare.initAll(); });
  else ViloShare.initAll();

})(window, document);
