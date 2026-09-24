// ==UserScript==
// @name         百度网盘视频播放器
// @version      1.4.3
// @author       Telegram @xyxyspace
// @description  功能更全面，播放更流畅，界面更清爽！支持播放速度任意调节及 4、6、8 倍速播放、清晰度自由切换、播放列表与在线字幕自动加载、本地字幕导入、字幕样式精细设置、音质与音量增强、画面比例和色彩滤镜调整、快进快退、跳过片头片尾、自动连播及常用设置记忆；同时修复进度条、视频时长、清晰度选择和后台重复播放等问题，自动清理广告与推广内容，带来更纯净、稳定、便捷的极致播放体验。
// @match        http*://yun.baidu.com/s/*
// @match        http://127.0.0.1/*
// @match        http://localhost/*
// @match        https://pan.baidu.com/s/*
// @match        https://pan.baidu.com/wap/home*
// @match        https://pan.baidu.com/play/video*
// @match        https://pan.baidu.com/pfile/video*
// @match        https://pan.baidu.com/pfile/mboxvideo*
// @match        https://pan.baidu.com/mbox/streampage*
// @match        https://pan.baidu.com/fcb/videoedit*
// @icon         https://nd-static.bdstatic.com/business-static/pan-center/images/vipIcon/user-level2-middle_4fd9480.png
// @run-at       document-start
// @grant        unsafeWindow
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==
(async function localCtfBootstrap() {
    'use strict';

   
    installPageCleanup();
    if (/^\/fcb\/videoedit(?:\/|$)/.test(location.pathname)) {
        console.info('[Local CTF Player] Note editor cleanup enabled.');
        return;
    }


    function installPageCleanup() {
        const styleId = 'local-ctf-page-cleanup-style';
        let style = document.getElementById(styleId);
        if (!style) {
            style = document.createElement('style');
            style.id = styleId;
            const host = document.head || document.documentElement;
            if (host) host.appendChild(style);
            else document.addEventListener('DOMContentLoaded', function () {
                (document.head || document.documentElement).appendChild(style);
            }, { once: true });
        }
        style.textContent = `
                .vp-business-guide-box,
                .vp-vip-guide,
                .vp-vip-btn,
                .vp-ai-guide,
                .vp-toolsbar__guide-pc,
                .vp-personal-icon-aside-guide,
                .vp-chat-ai-btn,
                .sug-wrapper,
                #invoke-app-header-btn,
                .nd-invoke-app-btn,
                .open-client-button-wrapper,
                .reward-banner,
                .nd-custom-popover:has(.DownloadPC),
                .vp-personal-video-container__chat-wrapper,
                .vp-user-info__member-status-new-btn-wrap,
                .vp-user-info__drop-body,
                .vp-user-info__drop-privilege,
                [class*="ai-"][class*="guide"],
                [class*="ai-"][class*="recommend"],
                [class*="ai-"][class*="template"],
                [class*="note-"][class*="template"],
                a[href*="/buy/center"] {
                    display: none !important;
                }
            `;

        const exactPromotionText = /^(?:去开通|立即开通|开通(?:S?VIP|会员)|打开电脑端|奖励50GB空间|客户端下载|下载(?:百度)?网盘客户端|AI辅助模式|AI笔记|AI出题|AI脑图|AI笔记模板|图文笔记|大纲笔记|文稿笔记)$/;
        const recommendationTitle = /^(?:精选|热门推荐|猜你喜欢|为你推荐)$/;

        const hidePromotions = function (root) {
            const scope = root && root.querySelectorAll ? root : document;
            const findAll = function (selector) {
                const matches = scope.nodeType === 1 && scope.matches?.(selector) ? [scope] : [];
                return matches.concat(Array.from(scope.querySelectorAll(selector)));
            };

            findAll('.vp-aside-box__module').forEach(function (module) {
                const title = module.querySelector('.vp-aside-box__top-title');
                if (title && recommendationTitle.test(title.textContent.trim())) {
                    module.style.setProperty('display', 'none', 'important');
                    module.dataset.localCtfPromotionHidden = '1';
                }
            });

            findAll('button, a, li, label, [role="button"], .vp-header-more__item, span, p').forEach(function (node) {
                const text = node.textContent.trim();
                if (exactPromotionText.test(text) || /^点击.*AI笔记.*AI帮你写/.test(text)) {
                    const target = node.closest('button, a, li, label, [role="button"], [class*="item"], [class*="entry"], [class*="tool"]') || node;
                    target.style.setProperty('display', 'none', 'important');
                    target.dataset.localCtfPromotionHidden = '1';
                }
            });

            findAll('h1, h2, h3, h4, div, span').forEach(function (node) {
                if (node.textContent.trim() !== 'AI笔记模板') return;
                let cursor = node;
                let target = null;
                for (let depth = 0; depth < 5 && cursor.parentElement; depth += 1) {
                    const parent = cursor.parentElement;
                    if (/图文笔记/.test(parent.textContent) && /(?:大纲笔记|文稿笔记)/.test(parent.textContent)
                        && parent.textContent.length < 800) {
                        target = parent;
                        break;
                    }
                    if (parent === document.body || parent.textContent.length >= 800) {
                        break;
                    }
                    cursor = parent;
                }
                target = target || node.closest('[class*="template"]') || node;
                target.style.setProperty('display', 'none', 'important');
                target.dataset.localCtfPromotionHidden = '1';
            });
        };

        const startObserver = function () {
            hidePromotions(document);
            if (!document.documentElement || window.__LOCAL_CTF_PAGE_CLEANUP_OBSERVER__) return;

            let cleanupTimer = 0;
            const observer = new MutationObserver(function () {
                clearTimeout(cleanupTimer);
                cleanupTimer = window.setTimeout(function () { hidePromotions(document); }, 40);
            });
            observer.observe(document.documentElement, { childList: true, subtree: true });
            window.__LOCAL_CTF_PAGE_CLEANUP_OBSERVER__ = observer;
            window.addEventListener('pagehide', function () { observer.disconnect(); }, { once: true });
        };

        if (document.documentElement) startObserver();
        else document.addEventListener('DOMContentLoaded', startObserver, { once: true });
    }

    // ---- Embedded artPlugins 2.2.0, with local entitlement provider ----
window.artPlugins=window.artPlugins||function(t){var e={version:"2.2.0",init:t=>Promise.all([e.readyHls(),e.readyArtplayer(),e.readySupported()]).then(()=>e.initArtplayer(t)),readyHls:()=>{return window.Hls||unsafeWindow.Hls?Promise.resolve():e.loadJs("https://jsd.nn.ci/npm/hls.js@1.6.16/dist/hls.min.js")},readyArtplayer:()=>{return window.Artplayer||unsafeWindow.Artplayer?Promise.resolve():e.loadJs("https://jsd.nn.ci/npm/artplayer@5.4.0/dist/artplayer.js")},readySupported:()=>Promise.resolve(),initArtplayer:e=>{const o=window.Artplayer||unsafeWindow.Artplayer,{isMobile:n}=o.utils;return Object.assign(o,{ASPECT_RATIO:["default","自动","4:3","16:9"],AUTO_PLAYBACK_TIMEOUT:1e4,NOTICE_TIME:5e3}),new o(e=Object.assign({container:"#artplayer",url:"",quality:[],type:"hls",autoplay:!0,autoPlayback:!0,aspectRatio:!0,contextmenu:[],customType:{hls:(t,e,o)=>{const n=window.Hls||unsafeWindow.Hls;if(n.isSupported()){o.hls&&o.hls.destroy();const a=o.hls=new n({debug:!1,maxBufferLength:10*n.DefaultConfig.maxBufferLength,xhrSetup:(t,e)=>{t.withCredentials=!0;try{t.setRequestHeader("X-CTF-Player","1")}catch(t){}const n=(e.match(/^http(?:s)?:\/\/(.*?)\//)||[])[1];if(n!==location.host){if(/backhost=/.test(e)){let t,a=(decodeURIComponent(e||"").match(/backhost=(\[.*?\])/)||[])[1];if(a){try{t=JSON.parse(a)}catch(t){}if(t&&t.length){const e=(t=[].concat(t,[n])).findIndex(t=>t===o.realHost);o.realHost=t[e+1>=t.length?0:e+1]}}}o.realHost&&(e=e.replace(n,o.realHost),t.open("GET",e,!0))}}});a.loadSource(e),a.attachMedia(t),a.on(n.Events.MANIFEST_PARSED,()=>console.info("[Local CTF Player] HLS manifest parsed",a.url)),a.on(n.Events.ERROR,(t,e)=>{console.error("[Local CTF Player] HLS error",{url:a.url,type:e.type,details:e.details,fatal:e.fatal,response:e.response});if(e.fatal)switch(e.type){case n.ErrorTypes.NETWORK_ERROR:e.details===n.ErrorDetails.MANIFEST_LOAD_ERROR?setTimeout(()=>a.loadSource(a.url),1e3):e.details===n.ErrorDetails.MANIFEST_LOAD_TIMEOUT||e.details===n.ErrorDetails.MANIFEST_PARSING_ERROR?a.loadSource(a.url):e.details===n.ErrorDetails.FRAG_LOAD_ERROR?(a.fragLoadError=(a.fragLoadError||0)+1)<5?(a.loadSource(a.url),a.media.currentTime=o.currentTime,a.media.play()):(a.destroy(),o.notice.show="播放错误次数过多，请刷新重试"):setTimeout(()=>a.startLoad(),1e3);break;case n.ErrorTypes.MEDIA_ERROR:a.recoverMediaError();break;default:a.destroy(),o.notice.show="视频播放异常，请刷新重试"}}),o.on("destroy",()=>a.destroy())}else t.canPlayType("application/vnd.apple.mpegurl")?t.src=e:(alert("不支持的播放格式：m3u8"),o.notice.show="Unsupported playback format: m3u8")}},flip:!1,icons:{loading:'<img src="https://artplayer.org/assets/img/ploading.gif">',state:'<img width="150" heigth="150" src="https://artplayer.org/assets/img/state.svg">',indicator:'<img width="16" heigth="16" src="https://artplayer.org/assets/img/indicator.svg">'},id:"",pip:!n,poster:"",playbackRate:!1,screenshot:!0,setting:!0,subtitle:{url:"",type:"auto",style:{color:"#fe9200",bottom:"5%",fontSize:"25px",fontWeight:400,fontFamily:"",textShadow:""},encoding:"utf-8",escape:!1},subtitleOffset:!1,hotkey:!0,fullscreen:!0,fullscreenWeb:!n},e),e=>{t.forEach(t=>{e.plugins.add(t())})})},loadJs:t=>(window.instances||(window.instances={}),window.instances[t]||(window.instances[t]=new Promise((e,o)=>{const n=document.createElement("script");n.src=t,n.type="text/javascript",n.onload=e,n.onerror=o,Node.prototype.appendChild.call(document.head,n)})),window.instances[t])};return console.info(`%c artPlugins %c ${e.version} %c https://scriptcat.org/zh-CN/users/13895`,"color: #fff; background: #5f5f5f","color: #fff; background: #4bc729",""),e}([()=>t=>{const user=async()=>window.__LOCAL_CTF_ENTITLEMENT__||{expire_time:0};const show=()=>{};const emit=()=>user().then(data=>t.emit("user",data));t.isReady?queueMicrotask(emit):t.once("ready",emit);t.on("restart",emit);return{name:"user",user,show}},()=>t=>{const{i18n:e,option:o,notice:n,storage:a,controls:s,constructor:{utils:{isMobile:r,setStyle:i}}}=t;function l(t){return r?t.split(/\s/).shift():t}function c(){const{file:r,quality:i,getUrl:c,adToken:u}=o,[,p,d]=((r||{}).resolution||"").match(/width:(\d+),height:(\d+)/),h=+p*+d;h>2073600&&i.unshift({html:"2K 1440P",url:c("M3U8_AUTO_2K")+"&adToken="+encodeURIComponent(u),default:!1,type:"hls"}),h>3686400&&i.unshift({html:"4K 2160P",url:c("M3U8_AUTO_4K")+"&adToken="+encodeURIComponent(u),default:!1,type:"hls"});const m=i.find(t=>t.default)||i[0];s.update({name:"quality",html:m?l(m.html):"",selector:i.map(t=>({...t})),onSelect:o=>(t.switchQuality(o.url),n.show=`${e.get("Switch Video")}: ${o.html}`,a.set("quality",l(o.html)),l(o.html)),mounted:()=>{const e=a.get("quality");if(e){const o=s.cache.get("quality").option.selector.find(t=>l(t.html)===e);o&&!o.default&&(t.switchQuality(o.url),s.check(o))}}})}function u(){t.once("user",({expire_time:e})=>{if(Math.max(e-Date.now(),0)){c();let e=o.id;t.on("restart",()=>{if(e===o.id){const e=t.layers.cache.get("auto-playback");if(e){const{$ref:t}=e;i(t,"display","none")}}else e=o.id,c()})}})}return t.isReady?u():t.once("ready",u),{name:"quality"}},()=>t=>{const{i18n:e,proxy:o,option:n,controls:a,constructor:{utils:{query:s,isMobile:r}}}=t,i={icon:'<i class="art-icon"><svg class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="22" height="22"><path d="M810.666667 384H85.333333v85.333333h725.333334V384z m0-170.666667H85.333333v85.333334h725.333334v-85.333334zM85.333333 640h554.666667v-85.333333H85.333333v85.333333z m640-85.333333v256l213.333334-128-213.333334-128z" fill="#ffffff"></path></svg></i>'};function l(){t.once("user",({expire_time:t})=>{if(Math.max(t-Date.now(),0)){const{filelist:t}=n;(t||[]).length>1&&function(t=[]){a.update({html:r?i.icon:e.get("PlayList"),name:"playlist",position:"right",style:{paddingLeft:"10px",paddingRight:"10px"},selector:t.map(t=>({...t,html:t.name,style:{textAlign:"left"}})),onSelect:t=>(n.file=t,"function"==typeof t.open&&t.open(),r?i.icon:e.get("PlayList")),mounted:()=>{const t=a.cache.get("playlist"),{$ref:e,option:{selector:n}}=t,r=s(".art-selector-list",e),i=s(".art-selector-value",e),l=r.offsetHeight,c=r.firstElementChild.offsetHeight;o(i,"click",t=>{const e=n.findIndex(t=>t.default);r.scrollTop=(e+1)*c-l/2})}})}(t)}})}return e.update({"zh-cn":{PlayList:"播放列表"}}),t.isReady?l():t.once("ready",l),{name:"playlist"}},()=>t=>{const{i18n:e,icons:o,notice:n,layers:a,storage:s,plugins:r,setting:i,contextmenu:l,constructor:{PLAYBACK_RATE:c,SETTING_ITEM_WIDTH:u,utils:{query:p,throttle:d,setStyle:h,inverseClass:m}}}=t;e.update({"zh-cn":{Custom:"自定义"}});const f=a.update({name:"auto-playbackrate",html:`<div>播放速度</div><input type="number" value="${t.playbackRate}" style="min-height: 20px;border: none; border-radius: 3px;text-align: center;color: #000;" step=".05" max="16" min=".1"><div class="art-auto-playback-close"><i class="art-icon art-icon-close"><svg class="icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="22" height="22" style="fill: var(--art-theme);width: 15px;height: 15px;"><path d="m571.733 512 268.8-268.8c17.067-17.067 17.067-42.667 0-59.733-17.066-17.067-42.666-17.067-59.733 0L512 452.267l-268.8-268.8c-17.067-17.067-42.667-17.067-59.733 0-17.067 17.066-17.067 42.666 0 59.733l268.8 268.8-268.8 268.8c-17.067 17.067-17.067 42.667 0 59.733 8.533 8.534 19.2 12.8 29.866 12.8s21.334-4.266 29.867-12.8l268.8-268.8 268.8 268.8c8.533 8.534 19.2 12.8 29.867 12.8s21.333-4.266 29.866-12.8c17.067-17.066 17.067-42.666 0-59.733L571.733 512z"></path></svg></i></div>`,tooltip:"",style:{borderRadius:"var(--art-border-radius)",left:"var(--art-padding)",bottom:"calc(var(--art-control-height) + var(--art-bottom-gap) + 10px)",backgroundColor:"var(--art-widget-background)",alignItems:"center",gap:"10px",padding:"10px",lineHeight:1,display:"none",position:"absolute"},mounted:e=>{const o=p("input",e),n=p(".art-auto-playback-close",e);t.proxy(o,"change",()=>{const e=o.value;t.playbackRate=Number(e)}),t.proxy(n,"click",()=>{h(e,"display","none")})}});function g(t){return 1===t?e.get("Normal"):t?t.toFixed(2):e.get("Custom")}function y(){return c.includes(t.playbackRate)?t.playbackRate:0}function b(){t.once("user",({expire_time:e})=>{if(Math.max(e-Date.now(),0)){t.on("video:ratechange",()=>s.set("playbackRate",t.playbackRate));const e=s.get("playbackRate");e&&(t.playbackRate=Number(e))}})}return c.includes(0)||c.unshift(0),i.update({width:u,name:"playback-rate",html:e.get("Play Speed"),tooltip:g(t.playbackRate),icon:o.playbackRate,selector:c.map(t=>({value:t,name:`playback-rate-${t}`,default:t===y(),html:g(t)})),onSelect(e){if(e.value)t.playbackRate=e.value,h(f,"display","none");else{const{user:e,show:o}=r.user;e().then(({expire_time:e})=>{if(Math.max(e-Date.now(),0)){p("input",f).value=t.playbackRate,h(f,"display","flex")}else o()})}return e.html},mounted:()=>{const e=i.find(`playback-rate-${y()}`);e&&i.check(e),t.on("video:ratechange",()=>{const t=i.find(`playback-rate-${y()}`);t&&i.check(t)})}}),l.update({index:10,name:"playbackRate",html:`${e.get("Play Speed")}: ${c.map(t=>`<span data-value="${t}">${g(t)}</span>`).join("")}`,click:(e,o)=>{e.show=!1;const{value:n}=o.target.dataset;if(Number(n))t.playbackRate=Number(n),h(f,"display","none");else{const{user:e,show:o}=r.user;e().then(({expire_time:e})=>{if(Math.max(e-Date.now(),0)){p("input",f).value=t.playbackRate,h(f,"display","flex")}else o()})}},mounted:e=>{const o=p(`[data-value='${y()}']`,e);o&&m(o,"art-current"),t.on("video:ratechange",()=>{const t=p(`[data-value='${y()}']`,e);t&&m(t,"art-current")})}}),t.isReady?b():t.once("ready",b),{name:"playbackRate"}},()=>t=>{const{i18n:e,option:o,notice:n,storage:a,plugins:s,setting:r,controls:i,template:l,subtitle:c,contextmenu:u,constructor:{utils:{getExt:p,query:d,append:h,isMobile:m,inverseClass:f}}}=t,g={icon:'<i class="art-icon"><svg xmlns="http://www.w3.org/2000/svg" height="24" width="24" viewBox="0 0 48 48"><path d="M0 0h48v48H0z" fill="none"/><path fill="#ffffff" d="M40 8H8c-2.21 0-4 1.79-4 4v24c0 2.21 1.79 4 4 4h32c2.21 0 4-1.79 4-4V12c0-2.21-1.79-4-4-4zM8 24h8v4H8v-4zm20 12H8v-4h20v4zm12 0h-8v-4h8v4zm0-8H20v-4h20v4z"/></svg></i>',tooltip:'<label style="font-size: 0;padding: 4px;display: inline-block;"><span style="width: 20px;height: 20px;display: inline-block;border-radius: 50%;box-sizing: border-box;cursor: pointer;background: #FE9200;"></span></label>'};function y(t){return b(t).then(t=>(function(t){const e=new Blob([t],{type:"text/plain"});return URL.createObjectURL(e)})(t))}function b(t){return new Promise((e,o)=>{var n=new FileReader;n.readAsText(t,"UTF-8"),n.onload=(o=>{var a=n.result;return a.indexOf("�")>-1&&!n.markGBK?(n.markGBK=!0,n.readAsText(t,"GBK")):a.indexOf("")>-1&&!n.markBIG5?(n.markBIG5=!0,n.readAsText(t,"BIG5")):void e(a)}),n.onerror=(t=>{o(t)})})}function w(){const{getUrl:t,adToken:e}=o,n=t("M3U8_SUBTITLE_SRT")+"&adToken="+encodeURIComponent(e);return fetch(n).then(t=>t.ok?t.text():Promise.reject()).then(t=>{const e=function(e){const o=(t||"").split("\n"),n=[];try{for(var a=2;a<o.length;a+=2){const t=o[a]||"";if(-1!==t.indexOf("#EXT-X-MEDIA:")){for(var s=t.replace("#EXT-X-MEDIA:","").split(","),r={},i=0;i<s.length;i++){const t=s[i].split("=");r[(t[0]||"").toLowerCase().replace("-","_")]=String(t[1]).replace(/"/g,"")}r.url=o[a+1],n.push(r)}}}catch(t){}return n}();return Promise.all(e.map(t=>(function(t,e){return fetch(t,{headers:{range:"bytes=".concat(Array.isArray(e)?e.join("-"):e||"0-"),referer:location.protocol+"//"+location.host+"/","User-Agent":"pan.baidu.com"}}).then(t=>t.ok?t.blob():Promise.reject())})(t.url).then(e=>b(e).then(e=>({...t,html:t.name,default:"YES"===t.default,type:function(t){return/(\d+)?[\r\n]?(\d{0,2}:?\d{2}:\d{2}.\d{3})\s?-?->\s?(\d{0,2}:?\d{2}:\d{2}.\d{3})/.test(t)?/^WEBVTT[\r\n]/.test(t)?"vtt":"srt":/\[Script Info\]/.test(t)?/\[V4\+ Styles\]/.test(t)&&/Dialogue: .*?\d+,(\d+:\d{2}:\d{2}\.\d{2}),(\d+:\d{2}:\d{2}\.\d{2}),/.test(t)?"ass":"ssa":""}(e)||"srt"}))))).catch(()=>e.map(t=>({...t,html:t.name,default:"YES"===t.default,type:"srt"})))})}function x(t=[]){if(!t.length)return;const e=t.find(t=>t.default)||Object.assign(t[0],{default:!0}),s={...o.subtitle.style,...a.get("subtitleStyle")},r=Object.assign({},o.subtitle,e,{style:s});c.init({...r}).then(()=>{r.name&&(n.show=`加载字幕: ${r.name}`)}),i.update({html:m?g.icon:"字幕列表",name:"subtitle",position:"right",style:{paddingLeft:"10px",paddingRight:"10px"},selector:t.map((t,e)=>({...t})),onSelect:t=>{const e={...t,style:{...o.subtitle.style,...a.get("subtitleStyle")}};return c.switch(t.url,e),m?g.icon:"字幕列表"}})}function v(t=[]){if(i.cache.get("subtitle")){const e=i.cache.get("subtitle").option.selector;t=t.concat(e),i.update({name:"subtitle",selector:t.map(t=>({...t}))})}else x(t)}function k(){t.once("user",({expire_time:e})=>{if(Math.max(e-Date.now(),0)){t.on("subtitle",t=>a.set("subtitle",t));const e=a.get("subtitle");"boolean"==typeof e&&(c.show=e),(o.sublist||[]).length&&x(o.sublist),"function"==typeof o.getUrl&&w().then(t=>{v(t)});let n=o.id;t.on("restart",()=>{if(n===o.id)(o.sublist||[]).length&&c.createTrack("metadata",c.url);else{n=o.id;const{$subtitle:t}=l;t.innerHTML="",o.subtitle.url="",c.createTrack("metadata",""),i.cache.get("subtitle")&&i.remove("subtitle"),(o.sublist||[]).length&&x(o.sublist),"function"==typeof o.getUrl&&w().then(t=>{v(t)})}})}})}return r.update({html:"字幕设置",name:"subtitle",tooltip:"",icon:'<svg xmlns="http://www.w3.org/2000/svg" height="24" width="24" viewBox="0 0 48 48"><path d="M0 0h48v48H0z" fill="none"/><path fill="#ffffff" d="M40 8H8c-2.21 0-4 1.79-4 4v24c0 2.21 1.79 4 4 4h32c2.21 0 4-1.79 4-4V12c0-2.21-1.79-4-4-4zM8 24h8v4H8v-4zm20 12H8v-4h20v4zm12 0h-8v-4h8v4zm0-8H20v-4h20v4z"/></svg>',selector:[{html:"字幕显示",name:"state",tooltip:"显示",switch:!0,onSwitch(t){const e=!t.switch,{user:o,show:n}=s.user;return o().then(({expire_time:o})=>{Math.max(o-Date.now(),0)?(c.show=e,t.tooltip=e?"显示":"隐藏"):n()}),e},mounted(e,o){const n=c.show;o.switch=n,o.tooltip=n?"显示":"隐藏",t.on("subtitle",t=>{setTimeout(()=>{o.switch!==t&&(o.switch=t,o.tooltip=t?"显示":"隐藏")})})}},{html:"字幕偏移",name:"offset",tooltip:"0s",range:[0,-10,10,.1],onChange(e){const o=e.range[0];return t.subtitleOffset=o,o+"s"},mounted(e,o){t.on("subtitleOffset",t=>{setTimeout(()=>{o.$range.value=t,o.tooltip=t+"s"})})}},{html:"字幕位置",name:"bottom",tooltip:"5%",range:[5,1,90,1],onChange(t){const e=t.range[0]+"%";return c.style({bottom:e}),a.set("subtitleStyle",{...a.get("subtitleStyle"),bottom:e}),e},mounted(t,e){const{bottom:o}={...a.get("subtitleStyle")};o&&(e.tooltip=o,e.$range.value=parseFloat(o))}},{html:"字体大小",name:"fontSize",tooltip:"25px",range:[25,10,60,1],onChange(t){const e=t.range[0]+"px";return c.style({fontSize:e}),a.set("subtitleStyle",{...a.get("subtitleStyle"),fontSize:e}),e},mounted(t,e){const{fontSize:o}={...a.get("subtitleStyle")};o&&(e.tooltip=o,e.$range.value=parseFloat(o))}},{html:"字体粗细",name:"fontWeight",tooltip:400,range:[4,1,9,1],onChange(t){const e=100*t.range[0];return c.style({fontWeight:e}),a.set("subtitleStyle",{...a.get("subtitleStyle"),fontWeight:e}),e},mounted(t,e){const{fontWeight:o}={...a.get("subtitleStyle")};o&&(e.tooltip=o,e.$range.value=o/100)}},{html:"字体颜色",name:"color",tooltip:g.tooltip,selector:[{html:"预设",name:"color-presets",tooltip:'<style>.panel-setting-color label{font-size: 0;padding: 4px;display: inline-block;}.panel-setting-color input{display: none;}.panel-setting-color span{width: 22px;height: 22px;display: inline-block;border-radius: 50%;box-sizing: border-box;cursor: pointer;}</style><div class="panel-setting-color"><label><input type="radio" value="#fff"><span style="background: #fff;"></span></label><label><input type="radio" value="#e54256"><span style="background: #e54256"></span></label><label><input type="radio" value="#ffe133"><span style="background: #ffe133"></span></label><label><input type="radio" name="dplayer-danmaku-color-1" value="#64DD17"><span style="background: #64DD17"></span></label><label><input type="radio" value="#39ccff"><span style="background: #39ccff"></span></label><label><input type="radio" value="#D500F9"><span style="background: #D500F9"></span></label></div>'},{html:"默认颜色",name:"color-default",tooltip:g.tooltip},{html:"颜色选择器",name:"color-picker",tooltip:g.tooltip.replace("#FE9200","#000")}],onSelect(t,e,o){switch(t.name){case"color-presets":if("INPUT"===o.target.nodeName){const t=o.target.value;c.style({color:t}),a.set("subtitleStyle",{...a.get("subtitleStyle"),color:t})}break;case"color-picker":l.$colorPicker||(l.$colorPicker=h(l.$player,'<input hidden type="color">'),l.$colorPicker.oninput=(e=>{const o=e.target.value;c.style({color:o}),a.set("subtitleStyle",{...a.get("subtitleStyle"),color:o}),t.tooltip=t.$parent.tooltip=g.tooltip.replace("#FE9200",o)})),l.$colorPicker.click();break;default:c.style({color:"#FE9200"}),a.set("subtitleStyle",{...a.get("subtitleStyle"),color:"#FE9200"})}return g.tooltip.replace("#FE9200",l.$subtitle.style.color)},mounted(t,e){const{color:o}={...a.get("subtitleStyle")};o&&(e.tooltip=g.tooltip.replace("#FE9200",o))}},{html:"字体类型",name:"fontFamily",tooltip:e.get("Default"),selector:[{html:"默认",value:""},{html:"等宽 衬线",value:'"Courier New", Courier, "Nimbus Mono L", "Cutive Mono", monospace'},{html:"比例 衬线",value:'"Times New Roman", Times, Georgia, Cambria, "PT Serif Caption", serif'},{html:"等宽 无衬线",value:'"Deja Vu Sans Mono", "Lucida Console", Monaco, Consolas, "PT Mono", monospace'},{html:"比例 无衬线",value:'"YouTube Noto", Roboto, "Arial Unicode Ms", Arial, Helvetica, Verdana, "PT Sans Caption", sans-serif'},{html:"Casual",value:'"Comic Sans MS", Impact, Handlee, fantasy'},{html:"Cursive",value:'"Monotype Corsiva", "URW Chancery L", "Apple Chancery", "Dancing Script", cursive'},{html:"Small Capitals",value:'"Arial Unicode Ms", Arial, Helvetica, Verdana, "Marcellus SC", sans-serif'}],onSelect(t){const{html:e,value:o}=t;return c.style({fontFamily:o}),a.set("subtitleStyle",{...a.get("subtitleStyle"),fontFamily:o}),e},mounted(t,e){const{fontFamily:o}={...a.get("subtitleStyle")};if(o){const{selector:t}=e,n=t.find(t=>t.value===o);n&&(e.tooltip=n.html)}}},{html:"文字阴影",name:"textShadow",tooltip:e.get("Default"),selector:[{html:"默认",value:"rgb(0 0 0) 1px 0 1px, rgb(0 0 0) 0 1px 1px, rgb(0 0 0) -1px 0 1px, rgb(0 0 0) 0 -1px 1px, rgb(0 0 0) 1px 1px 1px, rgb(0 0 0) -1px -1px 1px, rgb(0 0 0) 1px -1px 1px, rgb(0 0 0) -1px 1px 1px"},{html:"重墨",value:"rgb(0, 0, 0) 1px 0px 1px, rgb(0, 0, 0) 0px 1px 1px, rgb(0, 0, 0) 0px -1px 1px, rgb(0, 0, 0) -1px 0px 1px"},{html:"描边",value:"rgb(0, 0, 0) 0px 0px 1px, rgb(0, 0, 0) 0px 0px 1px, rgb(0, 0, 0) 0px 0px 1px"},{html:"45°投影",value:"rgb(0, 0, 0) 1px 1px 2px, rgb(0, 0, 0) 0px 0px 1px"},{html:"阴影",value:"rgb(34, 34, 34) 1px 1px 1.4875px, rgb(34, 34, 34) 1px 1px 1.98333px, rgb(34, 34, 34) 1px 1px 2.47917px"},{html:"凸起",value:"rgb(34, 34, 34) 1px 1px"},{html:"下沉",value:"rgb(204, 204, 204) 1px 1px, rgb(34, 34, 34) -1px -1px"},{html:"边框",value:"rgb(34, 34, 34) 0px 0px 1px, rgb(34, 34, 34) 0px 0px 1px, rgb(34, 34, 34) 0px 0px 1px, rgb(34, 34, 34) 0px 0px 1px, rgb(34, 34, 34) 0px 0px 1px"}],onSelect(t){const{html:e,value:o}=t;return c.style({textShadow:o}),a.set("subtitleStyle",{...a.get("subtitleStyle"),textShadow:o}),e},mounted(t,e){const{textShadow:o}={...a.get("subtitleStyle")};if(o){const{selector:t}=e,n=t.find(t=>t.value===o);n&&(e.tooltip=n.html)}}},{html:"加载字幕",name:"loadSubtitles",selector:[{html:"本地文件",name:"file",tooltip:"",onClick:(t,e)=>{const{user:o,show:n}=s.user;return o().then(({expire_time:t})=>{Math.max(t-Date.now(),0)?(l.$file.click(),function(t){return new Promise((e,o)=>{t.onchange=(t=>{if(t.target.files.length){const o=[...t.target.files].map(t=>{const{name:e}=t,o=p(e).toLowerCase();if(["webvtt","vtt","srt","ssa","ass","smi"].includes(o))return y(t).then(t=>({url:t,type:o,name:e,html:`本地字幕「${o}」`}))}).filter(Boolean);Promise.all(o).then(t=>{e(t)})}t.target.value=""})})}(l.$file).then(t=>v(t))):n()}),""},mounted:(t,e)=>{l.$file||(l.$file=h(l.$container,'<input type="file" accept=".webvtt,.vtt,.srt,.ssa,.ass" style="display: none;">'))}}]}]}),u.update({name:"subtitle",index:31,html:`字幕显示: ${[1,0].map(t=>`<span data-value="${t}">${t?"显示":"隐藏"}</span>`).join("")}`,click:(t,e)=>{const{user:o,show:n}=s.user;o().then(({expire_time:t})=>{if(Math.max(t-Date.now(),0)){f(e.target,"art-current");const{value:t}=e.target.dataset;c.show=Boolean(Number(t))}else n()}),t.show=!1},mounted:e=>{const o=d(`[data-value='${Number(c.show)}']`,e);o&&f(o,"art-current"),t.on("subtitle",t=>{const o=d(`[data-value='${Number(t)}']`,e);o&&f(o,"art-current")})}}),t.isReady?k():t.once("ready",k),{name:"subtitle"}},()=>t=>{const{notice:e,storage:o,plugins:n,setting:a,template:{$video:s}}=t;function r(t){i().then(e=>{e.setEnabled(t)})}function i(){if(t.joySound)return Promise.resolve(t.joySound);const e=window.Joysound||unsafeWindow.Joysound;if(e){if(e.isSupport()){const o=t.joySound=new e;return o.hasSource()||o.init(s),Promise.resolve(o)}return Promise.reject("Not Joysound isSupport")}return Promise.reject("Not Joysound")}function l(){t.joySound&&t.joySound.destroy()}function c(){t.once("user",({expire_time:e})=>{if(Math.max(e-Date.now(),0)){const e=o.get("joysound");"boolean"==typeof e&&e&&r(e),t.on("destroy",l)}else o.del("joysound")})}return a.add({html:"声音设置",name:"joysound",tooltip:"",selector:[{html:"音质增强",name:"high",tooltip:"关闭",switch:!1,onSwitch:t=>{const a=!t.switch,{user:s,show:i}=n.user;return s().then(({expire_time:n})=>{Math.max(n-Date.now(),0)?(r(a),t.tooltip=a?"开启":"关闭",o.set("joysound",a),e.show=`音质增强: ${t.tooltip}`):i()}),a},mounted:(t,e)=>{o.get("joysound")&&(e.tooltip="增强",e.switch=!0)}},{html:"音量增强",name:"volume",tooltip:"0x",range:[0,0,5,.1],onRange:t=>{const o=t.range[0],{user:a,show:s}=n.user;return a().then(({expire_time:t})=>{Math.max(t-Date.now(),0)?(!function(t){i().then(e=>{e.setVolume(t)})}(o),e.show=`音量增强: ${Math.round(100*o)}%`):s()}),`${Math.round(100*o)/100}x`}}]}),t.playing?c():t.once("video:playing",c),{name:"sound"}},()=>t=>{const{notice:e,storage:o,plugins:n,setting:a,template:{$video:{style:s}}}=t,r=()=>{const{brightness:t=1,contrast:e=1,saturate:n=1}={...o.get("filter")};s.filter=1!==t||1!==e||1!==n?`brightness(${t}) contrast(${e}) saturate(${n})`:""};function i(){t.once("user",({expire_time:t})=>{Math.max(t-Date.now(),0)&&r()})}return a.update({html:"色彩滤镜",name:"filter",tooltip:"",selector:[{html:"亮度",name:"brightness",tooltip:100,range:[100,0,255,1],onRange:t=>{const a=t.range[0],{user:s,show:i}=n.user;return s().then(({expire_time:t})=>{Math.max(t-Date.now(),0)?(o.set("filter",{...o.get("filter"),brightness:a/100}),r(),e.show=`亮度: ${a}`):i()}),a},mounted:(t,e)=>{const{brightness:n=1}={...o.get("filter")},a=Math.trunc(100*n);e.$range.value=a,e.tooltip=a}},{html:"对比度",name:"contrast",tooltip:100,range:[100,0,255,1],onRange:t=>{const a=t.range[0],{user:s,show:i}=n.user;return s().then(({expire_time:t})=>{Math.max(t-Date.now(),0)?(o.set("filter",{...o.get("filter"),contrast:a/100}),r(),e.show=`对比度: ${a}`):i()}),a},mounted:(t,e)=>{const{contrast:n=1}={...o.get("filter")},a=Math.trunc(100*n);e.$range.value=a,e.tooltip=a}},{html:"饱和度",name:"saturate",tooltip:100,range:[100,0,255,1],onRange:t=>{const a=t.range[0],{user:s,show:i}=n.user;return s().then(({expire_time:t})=>{Math.max(t-Date.now(),0)?(o.set("filter",{...o.get("filter"),saturate:a/100}),r(),e.show=`饱和度: ${a}`):i()}),a},mounted:(t,e)=>{const{saturate:n=1}={...o.get("filter")},a=Math.trunc(100*n);e.$range.value=a,e.tooltip=a}},{html:"默认",tooltip:"",values:[1,1,1]},{html:"护眼",tooltip:"",values:[.7,.85,.85]},{html:"柔和",tooltip:"",values:[1.05,.85,.75]},{html:"清晰",tooltip:"",values:[1.1,1.05,1.01]},{html:"明亮",tooltip:"",values:[1.2,1,1.1]},{html:"高对比",tooltip:"",values:[1,1.5,1]},{html:"黑白",tooltip:"",values:[1,1.1,0]}],onSelect:t=>{const{user:e,show:s}=n.user;return e().then(({expire_time:e})=>{if(Math.max(e-Date.now(),0)){const e=t.values;["brightness","contrast","saturate"].forEach((t,o)=>{const n=a.find(t),s=Math.trunc(100*e[o]);n.tooltip=s,n.$range.value=s}),o.set("filter",{brightness:e[0],contrast:e[1],saturate:e[2]}),r()}else s()}),t.html}}),t.isReady?i():t.once("ready",i),{name:"filter"}},()=>t=>{const{i18n:e,notice:o,storage:n,plugins:a,setting:s,controls:r,constructor:{utils:{throttle:i}}}=t;function l(){t.once("user",({expire_time:e})=>{if(Math.max(e-Date.now(),0)){n.get("autoFullscreen")&&(t.fullscreenWeb=!0),t.on("video:timeupdate",i(()=>{const{start:e,end:o}={...n.get("skipTime")};if(0==e&&0==o)return;const{currentTime:a,duration:s}=t,r=[[0,e],[o?s-o:0,o?s:0]];for(const[e,o]of r)if(a>=e&&a<o){t.seek=o;break}},1e3)),t.on("video:ended",()=>{if(n.get("autoNext")&&r.cache.get("playlist")){const t=r.cache.get("playlist").option.selector,e=t[t.findIndex(t=>t.default)+1];e?(r.check(e),"function"==typeof e.open&&e.open()):o.show="没有下一集了"}})}})}return s.update({html:"播放设置",name:"playSetting",icon:"",tooltip:"",selector:[{html:"自动连播",name:"autoNext",icon:"",tooltip:"关闭",switch:!1,onSwitch:t=>{const e=!t.switch,{user:s,show:r}=a.user;return s().then(({expire_time:a})=>{Math.max(a-Date.now(),0)?(t.tooltip=e?"开启":"关闭",n.set("autoNext",e),o.show=`自动下一集: ${t.tooltip}`):r()}),e},mounted:(t,e)=>{n.get("autoNext")&&(e.tooltip="开启",e.switch=!0)}},{html:"自动全屏",name:"autoFullscreen",icon:"",tooltip:"关闭",switch:!1,onSwitch:e=>{const s=!e.switch,{user:r,show:i}=a.user;return r().then(({expire_time:a})=>{Math.max(a-Date.now(),0)?(t.fullscreenWeb=s,n.set("autoFullscreen",s),e.tooltip=s?"开启":"关闭",o.show=`自动全屏: ${e.tooltip}`):i()}),s},mounted:(t,e)=>{n.get("autoFullscreen")&&(e.tooltip="开启",e.switch=!0)}},{html:"跳过片头",name:"start",tooltip:"0s",range:[0,0,120,1],onChange(t){const e=t.range[0],{user:s,show:r}=a.user;return s().then(({expire_time:t})=>{Math.max(t-Date.now(),0)?(n.set("skipTime",{...n.get("skipTime"),start:e}),o.show=`跳过片头: ${e} 秒`):r()}),e+"s"},mounted:(t,e)=>{const{start:o}={...n.get("skipTime")};o&&(e.tooltip=o+"s",e.$range.value=o)}},{html:"跳过片尾",name:"end",tooltip:"0s",range:[0,0,120,1],onChange(t){const e=t.range[0],{user:s,show:r}=a.user;return s().then(({expire_time:t})=>{Math.max(t-Date.now(),0)?(n.set("skipTime",{...n.get("skipTime"),end:e}),o.show=`跳过片尾: ${e} 秒`):r()}),e+"s"},mounted:(t,e)=>{const{end:o}={...n.get("skipTime")};o&&(e.tooltip=o+"s",e.$range.value=o)}}]}),t.isReady?l():t.once("ready",l),{name:"playSetting"}},()=>t=>{!function(t){const{proxy:e,storage:o,template:{$player:n,$video:a},constructor:{FAST_FORWARD_VALUE:s,FAST_FORWARD_TIME:r,utils:{addClass:i,removeClass:l,hasClass:c}}}=t;let u=null,p=!1,d=1;const h=e=>{const{state:a,playbackRate:l=s}={...o.get("fastForward")};a&&("touch"!==e.pointerType||e.isPrimary)&&("mouse"===e.pointerType&&0!==e.button||t.playing&&!t.isLock&&(u=setTimeout(()=>{p=!0,d=t.playbackRate,t.playbackRate=l,i(n,"art-fast-forward")},r)))},m=()=>{clearTimeout(u),p&&(p=!1,t.playbackRate=d,l(n,"art-fast-forward"),setTimeout(()=>t.play()))},f=t=>{"touch"===t.pointerType&&m()};function g(){t.once("user",({expire_time:o})=>{Math.max(o-Date.now(),0)&&(e(a,"pointerdown",h),t.on("document:pointermove",f),t.on("document:pointerup",m),t.on("document:pointercancel",m))})}t.isReady?g():t.once("ready",g)}(t);const e=function(t){const{proxy:e,layers:o,storage:n,constructor:{CONTROL_HIDE_TIME:a,utils:{isMobile:s,throttle:r}}}=t,{state:i,backward:l=15,forward:c=15}={...n.get("fastSeek")},u={position:"absolute",top:"50%",transform:"translateY(-50%) scale(1)",borderRadius:"50%",color:"#fff",display:"none",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"transform 0.15s ease, backdrop-filter 0.15s ease",userSelect:"none",pointerEvents:"auto",WebkitTapHighlightColor:"transparent",touchAction:"none"},p=o.update({name:"backward",html:`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" aria-hidden="true" viewBox="0 0 64 64"><path d="M52 32a20 20 0 0 0-20-20 20 20 0 0 0-14.14 5.86L16 12v8h8l-2.93-2.93A14 14 0 0 1 32 18a14 14 0 0 1 14 14 14 14 0 0 1-14 14 14 14 0 0 1-9.93-4.07L20 42.93A20 20 0 0 0 52 32z"></path><text x="32" y="37" text-anchor="middle" dominant-baseline="middle" fill="currentColor" font-size="18" font-weight="600" font-family="system-ui, -apple-system, sans-serif">${l}</text></svg>`,style:{...u,left:"25%"},click:()=>{const{backward:e=15}={...n.get("fastSeek")};t.backward=e},mounted:t=>{}}),d=o.update({name:"forward",html:`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" aria-hidden="true" viewBox="0 0 64 64"><path d="M12 32a20 20 0 0 1 20-20 20 20 0 0 1 14.14 5.86L48 12v8h-8l2.93-2.93A14 14 0 0 0 32 18a14 14 0 0 0-14 14 14 14 0 0 0 14 14 14 14 0 0 0 9.93-4.07L44 42.93A20 20 0 0 1 12 32z"></path><text x="32" y="37" text-anchor="middle" dominant-baseline="middle" fill="currentColor" font-size="18" font-weight="600" font-family="system-ui, -apple-system, sans-serif">${c}</text></svg>`,style:{...u,right:"25%"},click:()=>{const{forward:e=15}={...n.get("fastSeek")};t.forward=e},mounted:t=>{}}),h=()=>{p.style.display="flex",d.style.display="flex"},m=()=>{p.style.display="none",d.style.display="none"};function f(){t.once("user",({expire_time:o})=>{if(Math.max(o-Date.now(),0)){let o=!1;[p,d].forEach(n=>{e(n,"pointerenter",()=>{o=!0}),e(n,"pointerleave",()=>{o=!1}),e(n,"pointerdown",()=>{n.style.color=t.theme,n.style.backdropFilter="blur(6px)",n.style.transform="translateY(-50%) scale(0.85)"}),e(n,"pointerup",()=>{n.style.color=u.color,n.style.backdropFilter="",n.style.transform="translateY(-50%) scale(1)"}),e(n,"pointercancel",()=>{n.style.color=u.color,n.style.backdropFilter="",n.style.transform="translateY(-50%) scale(1)"})}),t.on("control",r(t=>{const{state:e}={...n.get("fastSeek")};e&&(t?h():o||m())},a/3))}})}return t.isReady?f():t.once("ready",f),{name:"fastSeek",show:h,hide:m,updateBackward:t=>{p.querySelector("svg > text").innerHTML=t},updateForward:t=>{d.querySelector("svg > text").innerHTML=t}}}(t),{notice:o,setting:n,storage:a,plugins:s}=t;return n.update({html:"快捷控制",name:"quick",icon:"",tooltip:"",selector:[{html:"长按倍速",name:"fastForward",icon:"",tooltip:"",selector:[{html:"状态",name:"",icon:"",tooltip:"关闭",switch:!1,onSwitch:t=>{const e=!t.switch,{user:n,show:r}=s.user;return n().then(({expire_time:n})=>{Math.max(n-Date.now(),0)?(a.set("fastForward",{...a.get("fastForward"),state:e}),t.tooltip=e?"开启":"关闭",o.show=`长按倍速: ${t.tooltip}`):r()}),e},mounted:(t,e)=>{const{state:o}={...a.get("fastForward")};o&&(e.tooltip="开启",e.switch=!0)}},{html:"播放速度",name:"",icon:"",tooltip:"3x",range:[3,2,6,.5],onChange(t){const e=t.range[0];return a.set("fastForward",{...a.get("fastForward"),playbackRate:e}),e+"x"},mounted:(t,e)=>{const{playbackRate:o}={...a.get("fastForward")};o&&(e.$range.value=o,e.tooltip=o+"x")}}]},{html:"快进快退",name:"fastSeek",icon:"",tooltip:"",selector:[{html:"状态",name:"",icon:"",tooltip:"关闭",switch:!1,onSwitch:t=>{const n=!t.switch,{user:r,show:i}=s.user;return r().then(({expire_time:s})=>{Math.max(s-Date.now(),0)?(a.set("fastSeek",{...a.get("fastSeek"),state:n}),n?(e.show(),t.tooltip="开启"):(e.hide(),t.tooltip="关闭"),o.show=`快进快退: ${t.tooltip}`):i()}),n},mounted:(t,e)=>{const{state:o}={...a.get("fastSeek")};o&&(e.tooltip="开启",e.switch=!0)}},{html:"快退时间",name:"backward",tooltip:"15s",range:[15,10,90,1],onChange(t){const o=t.range[0];return a.set("fastSeek",{...a.get("fastSeek"),backward:o}),e.updateBackward(o),o+"s"},mounted:(t,e)=>{const{backward:o}={...a.get("fastSeek")};o&&(e.$range.value=o,e.tooltip=o+"s")}},{html:"快进时间",name:"forward",tooltip:"15s",range:[15,10,90,1],onChange(t){const o=t.range[0];return a.set("fastSeek",{...a.get("fastSeek"),forward:o}),e.updateForward(o),o+"s"},mounted:(t,e)=>{const{forward:o}={...a.get("fastSeek")};o&&(e.$range.value=o,e.tooltip=o+"s")}}]}]}),{name:"quick"}},()=>t=>{const{option:e,constructor:{utils:{isMobile:o}}}=t;function n(){t.once("user",({expire_time:n})=>{Math.max(n-Date.now(),0)&&(e.hotkey&&!o&&(t.isFocus||(t.isFocus=!0)),t.on("blur",n=>{e.hotkey&&!o&&(t.isFocus=!0)}))})}return t.isReady?n():t.once("ready",n),{name:"hotkey"}},()=>t=>{const{info:e,proxy:o,contextmenu:n,template:{$video:a,$infoPanel:s},constructor:{INFO_LOOP_TIME:r,utils:{query:i,append:l,isMobile:c}}}=t;function u(){t.once("user",({expire_time:a})=>{Math.max(a-Date.now(),0)&&function(){if(c)return;const{hls:a}=t;if(a){const t=l(s,'<div class="art-info-item"><div class="art-info-title">Hls bandwidth:</div><div class="art-info-content">NaN</div></div>'),c=i(".art-info-content",t);o(n.info,"click",function t(){if(e.show){const e=a.bandwidthEstimate,o="number"==typeof e?`${(e/1024/1024/8).toFixed(4)} MBps/s`:e;c.innerText!==o&&(c.innerText=o),setTimeout(t,r)}})}}()})}return t.isReady?u():t.once("ready",u),{name:"info"}}]);

    // 非阻塞预热：净化逻辑已执行，播放器依赖在页面数据准备期间并行下载。
    const preloadPlayerDependencies = function () {
        window.artPlugins.readyHls().catch(function (error) {
            console.warn('[Local CTF Player] HLS preload failed', error);
        });
        window.artPlugins.readyArtplayer().catch(function (error) {
            console.warn('[Local CTF Player] Artplayer preload failed', error);
        });
        window.artPlugins.loadJs('https://scriptcat.org/lib/950/^1.0.3/joysound.js').catch(function (error) {
            console.warn('[Local CTF Player] optional Joysound preload failed', error);
        });
    };
    if (document.head) preloadPlayerDependencies();
    else document.addEventListener('DOMContentLoaded', preloadPlayerDependencies, { once: true });

    // ---- Main player integration ----
(function() {
    'use strict';

    var obj = {
        playerInitGeneration: 0,
        artPlayer: null,
        video_page: {
            flag: "",
            file: {},
            filelist: [],
            quality: [],
            adToken: "",
        }
    };

    obj.currentList = function () {
        try {
            var currentList = unsafeWindow.require('system-core:context/context.js').instanceForSystem.list.getCurrentList();
            if (currentList.length) {
                sessionStorage.setItem(obj.getShareId(), JSON.stringify(currentList));
            }
            else {
                setTimeout(obj.currentList, 500);
            }
        } catch (e) { }
        window.onhashchange = function (e) {
            setTimeout(obj.currentList, 500);
        };
        document.querySelector(".fufHyA") && [ ...document.querySelectorAll(".fufHyA") ].forEach(function (element) {
            element.onclick = function () {
                setTimeout(obj.currentList, 500);
            };
        });
    };

    obj.forcePreview = function () {
        unsafeWindow.jQuery(document).on("click", "#shareqr dd", function () {
            try {
                var selectedFile = unsafeWindow.require('system-core:context/context.js').instanceForSystem.list.getSelected()
                , file = selectedFile[0];
                if (file.category == 1) {
                    var ext = file.server_filename.split(".").pop().toLowerCase();
                    if (["ts", '3gp2','3g2','3gpp','amv','divx','dpg','f4v','m2t','m2ts','m2v','mpe','mpeg','mts','vob','webm','wxp','wxv','vob'].includes(ext)) {
                        window.open("https://pan.baidu.com" + location.pathname + "?fid=" + file.fs_id, "_blank");
                    }
                }
            } catch (error) { }
        });
    };

    obj.sharevideo = function () {
        if (unsafeWindow.require) {
            unsafeWindow.locals.get("file_list", "share_uk", "shareid", "sign", "timestamp", function (file_list, share_uk, shareid, sign, timestamp) {
                if (file_list.length == 1 && file_list[0].category == 1) {
                    obj.startObj().then(function (obj) {
                        obj.video_page.flag = "sharevideo";
                        const { fs_id } = obj.video_page.file = file_list[0]
                        , vip = obj.getVip();
                        obj.video_page.getUrl = function (type) {
                            return "/share/streaming?channel=chunlei&uk=" + share_uk + "&fid=" + fs_id + "&sign=" + sign + "&timestamp=" + timestamp + "&shareid=" + shareid + "&type=" + type + "&vip=" + vip + "&jsToken=" + unsafeWindow.jsToken;
                        }
                        obj.getAdToken().then(function () {
                            obj.addQuality();
                            obj.addFilelist();
                            obj.initVideoPlayer();
                        });
                    });
                }
                else {
                    obj.currentList();
                    obj.forcePreview();
                }
            });
        }
        else {
        }
    };

    obj.playvideo = function () {
        unsafeWindow.jQuery(document).ajaxComplete(function (event, xhr, options) {
            var response, requestUrl = options.url;
            if (requestUrl.indexOf("/api/categorylist") >= 0) {
                response = xhr.responseJSON;
                obj.video_page.filelist = response.info || [];
            }
            else if (requestUrl.indexOf("/api/filemetas") >= 0) {
                response = xhr.responseJSON;
                if (response && response.info) {
                    obj.startObj().then(function (obj) {
                        obj.video_page.flag = "playvideo";
                        const { path } = obj.video_page.file = response.info[0]
                        , vip = obj.getVip();
                        obj.video_page.getUrl = function (type) {
                            if (type.includes(1080)) vip > 1 || (type = type.replace(1080, 720));
                            return "/api/streaming?path=" + encodeURIComponent(path) + "&app_id=250528&clienttype=0&type=" + type + "&vip=" + vip + "&jsToken=" + unsafeWindow.jsToken;
                        }
                        obj.getAdToken().then(function () {
                            obj.addQuality();
                            obj.addFilelist();
                            obj.initVideoPlayer();
                        });
                    });
                }
            }
        });
    };

    obj.video = function () {
        const { $pinia, $router } = document.querySelector("#app")?.__vue_app__?.config?.globalProperties || {};
        if ($pinia && $router && Object.keys($pinia.state._rawValue.videoinfo?.videoinfo || {}).length) {
            obj.startObj().then(function (obj) {
                obj.video_page.flag = "video";
                const { recommendListInfo, videoinfo: { videoinfo } } = $pinia.state._rawValue;
                const { selectionVideoList } = recommendListInfo;
                if (Array.isArray(selectionVideoList) && selectionVideoList.length) {
                    obj.video_page.filelist = selectionVideoList;
                }
                else {
                    Object.defineProperty(recommendListInfo, "selectionVideoList", {
                        enumerable: true,
                        set(selectionVideoList) {
                            obj.video_page.filelist = selectionVideoList;
                        }
                    });
                }
                const { path } = obj.video_page.file = videoinfo
                , vip = obj.getVip();
                obj.video_page.getUrl = function (type) {
                    if (type.includes(1080)) vip > 1 || (type = type.replace(1080, 720));
                    return "/api/streaming?path=" + encodeURIComponent(path) + "&app_id=250528&clienttype=0&type=" + type + "&vip=" + vip + "&jsToken=" + unsafeWindow.jsToken
                }
                obj.getAdToken().then(function () {
                    obj.addQuality();
                    obj.addFilelist();
                    obj.initVideoPlayer();
                });
            });
            $router.isReady().then(function () {
                $router.afterEach(function (to, from) {
                    from.fullPath === "/" || from.fullPath === to.fullPath || location.reload();
                });
            });
        }
        else {
            obj.delay().then(obj.video);
        }
    };

    obj.mboxvideo = function () {
        const { $pinia, $router } = document.querySelector("#app")?.__vue_app__?.config?.globalProperties || {};
        if ($pinia && $router && Object.keys($pinia.state._rawValue.videoinfo?.videoinfo || {}).length) {
            obj.startObj().then(function (obj) {
                obj.video_page.flag = "mboxvideo";
                const { to, from_uk, msg_id, fs_id, type, trans, ltime, adToken } = obj.video_page.file = $pinia.state._rawValue.videoinfo.videoinfo;
                obj.video_page.getUrl = function (stream_type) {
                    return "/mbox/msg/streaming?to=" + to + "&from_uk=" + from_uk + "&msg_id=" + msg_id + "&fs_id=" + fs_id + "&type=" + type + "&stream_type=" + stream_type + "&trans=" + (trans || "") + "&ltime=" + ltime;
                }
                obj.video_page.adToken = adToken || "";
                obj.getAdToken().then(function () {
                    obj.addQuality();
                    obj.addFilelist();
                    obj.initVideoPlayer();
                });
            });

            $router.isReady().then(function () {
                $router.afterEach(function (to, from) {
                    from.fullPath === "/" || from.fullPath === to.fullPath || location.reload();
                });
            });
        }
        else {
            obj.delay().then(obj.mboxvideo);
        }
    };

    obj.videoView = function () {
        const { videoFile } = document.querySelector(".preview-video")?.__vue__ || {};
        if (videoFile) {
            obj.startObj().then(function (obj) {
                obj.video_page.flag = "videoView";
                const { path } = obj.video_page.file = videoFile
                , vip = obj.getVip();
                obj.video_page.getUrl = function (type) {
                    if (type.includes(1080)) vip > 1 || (type = type.replace(1080, 720));
                    return "/rest/2.0/xpan/file?method=streaming&path=" + encodeURIComponent(path) + "&type=" + type;
                }
                obj.getAdToken().then(function () {
                    obj.addQuality();
                    obj.addFilelist();
                    obj.initVideoPlayer();
                });
            });
        }
        else {
            obj.delay().then(obj.videoView);
        }
    };

    obj.isM3u8Text = function (text) {
        return typeof text === "string" && /^\s*#EXTM3U/m.test(text);
    };

    obj.inspectStream = async function (item) {
        const result = {
            html: item.html,
            url: item.url,
            ok: false,
            status: 0,
            contentType: "",
            preview: ""
        };
        try {
            const response = await fetch(item.url, {
                method: "GET",
                credentials: "include",
                cache: "no-store",
                headers: {
                    "Accept": "application/vnd.apple.mpegurl, application/x-mpegURL, */*"
                }
            });
            const text = await response.text();
            result.status = response.status;
            result.contentType = response.headers.get("content-type") || "";
            result.preview = text.slice(0, 300);
            result.ok = response.ok && obj.isM3u8Text(text);
        } catch (error) {
            result.preview = String(error && (error.stack || error.message) || error);
        }
        console[result.ok ? "info" : "warn"]("[Local CTF Player] stream probe", result);
        return result;
    };

    obj.selectPlayableQuality = async function () {
        const quality = obj.video_page.quality || [];
        if (!quality.length) {
            throw new Error("没有生成任何清晰度地址");
        }

        // 不再在播放器出现前逐档串行下载清单。720P 是本地挑战的稳定首选，
        // 低分辨率源则直接使用列表中的最高可用档位；其他档位在用户切换时检测。
        const item = quality.find(function (candidate) { return /(?:^|\s)720P$/.test(candidate.html); }) || quality[0];
        quality.forEach(function (candidate) { candidate.default = candidate === item; });
        console.info("[Local CTF Player] fast startup quality", item.html, item.url);
        return item;
    };

    obj.initVideoPlayer = function () {
        const initGeneration = ++obj.playerInitGeneration;
        obj.selectPlayableQuality().then(function () {
            return obj.replaceVideoPlayer();
        }).then(function () {
            if (initGeneration !== obj.playerInitGeneration) return null;
            const { file, filelist, quality, getUrl, adToken } = obj.video_page;
            const { url, type } = quality.find((item) => item.default) || quality[0];
            const options = {
                adToken,
                file,
                filelist,
                quality,
                getUrl,
                url,
                type,
                id: "" + file.fs_id,
                poster: (Object.values(file.thumbs || []).slice(-1)[0] || "").replace(/size=c\d+_u\d+/, "size=c850_u580")
            };
            return window.artPlugins.readyArtplayer().then(function () {
                if (initGeneration !== obj.playerInitGeneration) return null;
                if (obj.artPlayer) {
                    const previousPlayer = obj.artPlayer;
                    obj.artPlayer = null;
                    try { previousPlayer.destroy(); } catch (error) {}
                    document.getElementById("artplayer")?.replaceChildren();
                }
                const Artplayer = window.Artplayer || unsafeWindow.Artplayer;
                const playbackRates = Array.isArray(Artplayer.PLAYBACK_RATE)
                    ? Artplayer.PLAYBACK_RATE : [0.5, 0.75, 1, 1.25, 1.5, 2];
                [4, 6, 8].forEach(function (rate) {
                    if (!playbackRates.includes(rate)) playbackRates.push(rate);
                });
                playbackRates.sort(function (a, b) { return a - b; });
                Artplayer.PLAYBACK_RATE = playbackRates;
                console.info("[Local CTF Player] extended playback rates enabled", playbackRates);
                return window.artPlugins.init(options);
            }).then(function (player) {
                if (initGeneration !== obj.playerInitGeneration) {
                    try { player?.destroy(); } catch (error) {}
                    return;
                }
                if (player) {
                    obj.artPlayer = player;
                    player.on("destroy", function () {
                        if (obj.artPlayer === player) obj.artPlayer = null;
                    });
                    const localEntitlement = window.__LOCAL_CTF_ENTITLEMENT__;
                    if (player.plugins && player.plugins.user) {
                        player.plugins.user.user = async function () { return localEntitlement; };
                        player.plugins.user.show = function () {};
                    }

                    const originalEmit = player.emit;
                    player.emit = function(event, data) {
                        if (event === "user") {
                            data = localEntitlement;
                        }
                        return originalEmit.call(this, event, data);
                    };

                    player.on("user", () => {
                        setTimeout(() => {
                            try {
                                if (player.setting && player.setting.find("author-setting")) {
                                    player.setting.remove("author-setting");
                                }
                                if (player.contextmenu && player.contextmenu.option && player.contextmenu.option.selector) {
                                    if (player.contextmenu.option.selector.find(i => i.index === 51)) player.contextmenu.remove(51);
                                    if (player.contextmenu.option.selector.find(i => i.index === 52)) player.contextmenu.remove(52);
                                }
                            } catch (e) {}
                        }, 200);
                    });

                    // artPlugins' user event can fire before the quality plugin has
                    // registered its listener. Re-emit once after init to close that race.
                    player.emit("user", localEntitlement);

                    // Some CTF browser profiles report an Android/mobile UA even when a
                    // mouse is used. ArtPlayer may then hide its controls and the page's
                    // transparent layers can consume progress-bar events. Install a small
                    // desktop/mixed-input compatibility layer after the player is ready.
                    obj.installDurationFix(player);
                    obj.installInteractionFix(player);
                    obj.installQualityFix(player);
                }
                else {
                    return;
                }
                obj.showTip("视频播放器已就绪 ...", "success");
                obj.destroyPlayer();
            });
        }).catch(function (error) {
            if (initGeneration !== obj.playerInitGeneration) return;
            console.error("[Local CTF Player] 初始化失败", error);
            obj.showTip("播放地址无效，请查看控制台 Local CTF Player 日志", "failure", 8000);
        });
    };

    obj.getMetadataDuration = function (file) {
        const durationKeys = new Set([
            "duration", "videoduration", "playduration", "mediaduration",
            "totalduration", "playtime", "runtime", "timelength"
        ]);
        const parseClock = function (value) {
            if (typeof value !== "string" || !/^\d{1,3}:\d{2}(?::\d{2})?$/.test(value.trim())) return 0;
            return value.trim().split(":").reduce(function (total, part) {
                return total * 60 + Number(part);
            }, 0);
        };
        const normalize = function (value, key) {
            let seconds = parseClock(value) || Number(value);
            if (!Number.isFinite(seconds) || seconds <= 0) return 0;
            if (/ms|millisecond/i.test(key)) seconds /= 1000;
            else if (seconds > 7 * 24 * 3600) {
                const milliseconds = seconds / 1000;
                const microseconds = seconds / 1000000;
                seconds = milliseconds <= 7 * 24 * 3600 ? milliseconds : microseconds;
            }
            return Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
        };
        const queue = [{ value: file, depth: 0 }];
        while (queue.length) {
            const entry = queue.shift();
            if (!entry.value || typeof entry.value !== "object" || entry.depth > 3) continue;
            for (const [key, value] of Object.entries(entry.value)) {
                const normalizedKey = key.toLowerCase().replace(/[^a-z]/g, "");
                if (durationKeys.has(normalizedKey)) {
                    const duration = normalize(value, key);
                    if (duration) return duration;
                }
                if (value && typeof value === "object" && !Array.isArray(value)) {
                    queue.push({ value, depth: entry.depth + 1 });
                }
                else if (typeof value === "string" && /(media|video|meta|info)/i.test(key)
                    && /^\s*[\[{]/.test(value)) {
                    try { queue.push({ value: JSON.parse(value), depth: entry.depth + 1 }); } catch (error) {}
                }
            }
        }
        return 0;
    };

    obj.getReliableDuration = function (player) {
        const state = player?.__localCtfDurationState;
        if (state) return Number(state.value || 0);
        const nativeDuration = Number(player?.video?.duration || player?.duration || 0);
        return Number.isFinite(nativeDuration) && nativeDuration > 0 ? nativeDuration : 0;
    };

    obj.installDurationFix = function (player) {
        if (!player || player.__localCtfDurationState) return;
        const metadataDuration = obj.getMetadataDuration(obj.video_page.file);
        const state = player.__localCtfDurationState = {
            value: 0,
            source: "pending",
            priority: 0,
            hls: null,
            hlsEvent: "",
            hlsHandler: null
        };

        const formatTime = function (rawSeconds) {
            const seconds = Math.max(0, Math.floor(Number(rawSeconds) || 0));
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor(seconds % 3600 / 60);
            const rest = seconds % 60;
            return (hours ? String(hours).padStart(2, "0") + ":" : "")
                + String(minutes).padStart(2, "0") + ":"
                + String(rest).padStart(2, "0");
        };

        const renderTime = function () {
            const node = document.querySelector("#artplayer .art-control-time");
            if (!node || obj.artPlayer !== player) return;
            const current = Number(player.video?.currentTime || player.currentTime || 0);
            node.textContent = formatTime(current) + " / "
                + (state.value > 0 ? formatTime(state.value) : "--:--");
        };

        const commit = function (duration, source, priority) {
            duration = Number(duration);
            if (!Number.isFinite(duration) || duration <= 0 || priority < state.priority) return;
            const changed = Math.abs(duration - state.value) >= 0.5 || source !== state.source;
            state.value = duration;
            state.source = source;
            state.priority = priority;
            renderTime();
            if (changed) {
                console.info("[Local CTF Player] reliable duration", {
                    duration: Number(duration.toFixed(3)), source
                });
            }
        };

        if (metadataDuration) commit(metadataDuration, "file-metadata", 2);

        const detachHls = function () {
            try {
                if (state.hls && state.hlsHandler && state.hlsEvent) {
                    state.hls.off(state.hlsEvent, state.hlsHandler);
                }
            } catch (error) {}
            state.hls = null;
            state.hlsEvent = "";
            state.hlsHandler = null;
        };

        const inspectLevelDetails = function (details) {
            if (!details || details.live === true) return;
            const duration = Number(details.totalduration || details.totalDuration || 0);
            if (duration > 0) commit(duration, "hls-vod-playlist", 3);
        };

        const attachHls = function () {
            const hls = player.hls;
            if (!hls || hls === state.hls) return;
            detachHls();
            state.hls = hls;
            const mediaWindow = typeof unsafeWindow !== "undefined" && unsafeWindow
                ? unsafeWindow : window;
            const HlsClass = mediaWindow.Hls || window.Hls;
            const eventName = HlsClass?.Events?.LEVEL_LOADED;
            if (eventName && typeof hls.on === "function") {
                state.hlsEvent = eventName;
                state.hlsHandler = function (event, data) {
                    inspectLevelDetails(data?.details);
                };
                hls.on(eventName, state.hlsHandler);
            }
        };

        const inspectHls = function () {
            attachHls();
            const hls = state.hls;
            if (!hls) {
                const nativeDuration = Number(player.video?.duration || 0);
                if (nativeDuration > 0) commit(nativeDuration, "native-media", 1);
                return;
            }
            const levels = Array.isArray(hls.levels) ? hls.levels : [];
            const preferred = [hls.currentLevel, hls.loadLevel, hls.nextLoadLevel]
                .filter(function (index, position, list) {
                    return Number.isInteger(index) && index >= 0 && list.indexOf(index) === position;
                });
            preferred.forEach(function (index) { inspectLevelDetails(levels[index]?.details); });
            if (!preferred.length) levels.forEach(function (level) { inspectLevelDetails(level?.details); });
        };

        const onDurationSignal = function () {
            inspectHls();
            renderTime();
        };
        ["video:loadedmetadata", "video:durationchange", "video:timeupdate", "video:progress"]
            .forEach(function (eventName) { player.on(eventName, onDurationSignal); });
        player.on("video:ended", function () {
            if (!state.value) {
                const endedDuration = Math.max(Number(player.video?.duration || 0), Number(player.currentTime || 0));
                commit(endedDuration, "ended-media", 1);
            }
        });

        const timer = window.setInterval(onDurationSignal, 250);
        player.on("destroy", function () {
            window.clearInterval(timer);
            detachHls();
        });
        onDurationSignal();
        console.info("[Local CTF Player] stable duration guard enabled", {
            metadataDuration: metadataDuration || null
        });
    };

    obj.installInteractionFix = function (player) {
        const container = document.getElementById("artplayer");
        if (!container || !player || container.dataset.localCtfInteractionFix === "1") {
            return;
        }
        container.dataset.localCtfInteractionFix = "1";

        let style = document.getElementById("local-ctf-player-interaction-style");
        if (!style) {
            style = document.createElement("style");
            style.id = "local-ctf-player-interaction-style";
            style.textContent = `
                #artplayer {
                    position: relative !important;
                    z-index: 2147483000 !important;
                    isolation: isolate !important;
                    pointer-events: auto !important;
                    touch-action: manipulation !important;
                }
                #artplayer .art-video-player {
                    pointer-events: auto !important;
                }
                #artplayer .art-bottom {
                    pointer-events: none !important;
                }
                #artplayer .art-controls,
                #artplayer .art-progress {
                    pointer-events: auto !important;
                }
                #artplayer.local-ctf-controls-visible .art-bottom,
                #artplayer.local-ctf-controls-visible .art-controls,
                #artplayer.local-ctf-controls-visible .art-progress {
                    opacity: 1 !important;
                    visibility: visible !important;
                }
                #artplayer.local-ctf-controls-visible .art-controls,
                #artplayer.local-ctf-controls-visible .art-progress {
                    transform: none !important;
                }
                #artplayer .art-progress {
                    cursor: pointer !important;
                    touch-action: none !important;
                }
                #artplayer .art-layers,
                #artplayer .art-mask {
                    pointer-events: none !important;
                }
                #artplayer .art-layers .art-layer,
                #artplayer .art-mask .art-state {
                    pointer-events: auto !important;
                }
                #artplayer .art-control-selector .art-selector-list {
                    z-index: 1000 !important;
                }
                #artplayer .art-control-selector.local-ctf-selector-open .art-selector-list {
                    opacity: 1 !important;
                    transform: translateY(0) !important;
                    pointer-events: auto !important;
                }
                #artplayer .art-control-quality.local-ctf-quality-switching {
                    opacity: .55 !important;
                    cursor: wait !important;
                }
            `;
            (document.head || document.documentElement).appendChild(style);
        }

        const keepControlsVisible = function () {
            container.classList.add("local-ctf-controls-visible");
            container.classList.remove("art-hide-cursor");
            const playerRoot = container.querySelector(".art-video-player");
            if (playerRoot) {
                playerRoot.classList.add("art-control-show");
                playerRoot.classList.remove("art-hide-cursor");
            }

            const bottom = container.querySelector(".art-bottom");
            const controls = container.querySelector(".art-controls");
            const progress = container.querySelector(".art-bottom > .art-progress");
            [bottom, controls, progress].filter(Boolean).forEach(function (node) {
                node.style.setProperty("opacity", "1", "important");
                node.style.setProperty("visibility", "visible", "important");
            });
            if (bottom) bottom.style.setProperty("pointer-events", "none", "important");
            [controls, progress].filter(Boolean).forEach(function (node) {
                node.style.setProperty("pointer-events", "auto", "important");
                node.style.setProperty("transform", "none", "important");
            });
        };

        ["pointerenter", "pointermove", "mousemove", "touchstart"].forEach(function (eventName) {
            container.addEventListener(eventName, keepControlsVisible, { passive: true });
        });
        keepControlsVisible();

        const getProgressParts = function () {
            return {
                hitArea: container.querySelector(".art-bottom > .art-progress"),
                track: container.querySelector(".art-control-progress-inner"),
                played: container.querySelector(".art-progress-played"),
                loaded: container.querySelector(".art-progress-loaded"),
                indicator: container.querySelector(".art-progress-indicator")
            };
        };

        const syncProgressVisual = function () {
            const parts = getProgressParts();
            const video = player.video;
            const videoCurrentTime = Number(video?.currentTime);
            const duration = obj.getReliableDuration(player);
            const currentTime = Number.isFinite(videoCurrentTime)
                ? videoCurrentTime : Number(player.currentTime || 0);
            if (!Number.isFinite(duration) || duration <= 0) return;

            const percent = Math.max(0, Math.min(100, currentTime / duration * 100));
            if (parts.played) parts.played.style.width = percent + "%";
            if (parts.indicator) parts.indicator.style.left = percent + "%";

            if (parts.loaded && video?.buffered?.length) {
                let bufferedEnd = 0;
                for (let index = 0; index < video.buffered.length; index += 1) {
                    bufferedEnd = Math.max(bufferedEnd, video.buffered.end(index));
                }
                const loadedPercent = Math.max(0, Math.min(100, bufferedEnd / duration * 100));
                parts.loaded.style.width = loadedPercent + "%";
            } else if (parts.loaded) {
                parts.loaded.style.width = "0%";
            }
        };

        ["video:loadedmetadata", "video:durationchange", "video:timeupdate", "video:progress", "video:seeking", "video:seeked"]
            .forEach(function (eventName) { player.on(eventName, syncProgressVisual); });
        syncProgressVisual();

        const seekFromPointer = function (event) {
            const parts = getProgressParts();
            if (!parts.hitArea || !parts.track) return false;

            const hitRect = parts.hitArea.getBoundingClientRect();
            const trackRect = parts.track.getBoundingClientRect();
            if (!trackRect.width || !hitRect.height) return false;
            if (event.clientX < trackRect.left || event.clientX > trackRect.right
                || event.clientY < hitRect.top - 6 || event.clientY > hitRect.bottom + 6) {
                return false;
            }

            const duration = obj.getReliableDuration(player);
            if (!Number.isFinite(duration) || duration <= 0) return false;

            const ratio = Math.max(0, Math.min(1, (event.clientX - trackRect.left) / trackRect.width));
            const target = ratio * duration;
            try {
                player.seek = target;
            } catch (error) {
                if (player.video) player.video.currentTime = target;
            }
            keepControlsVisible();
            syncProgressVisual();
            console.debug("[Local CTF Player] manual seek", {
                ratio: Number(ratio.toFixed(4)),
                target: Number(target.toFixed(2)),
                duration: Number(duration.toFixed(2)),
            });
            return true;
        };

        // Capture at document level as well: this still works when a transparent
        // Baidu page layer sits above the visual progress bar.
        const onPointerDown = function (event) {
            if (event.button !== undefined && event.button > 0) return;
            if (!seekFromPointer(event)) return;
            event.preventDefault();
            event.stopPropagation();
            if (typeof event.stopImmediatePropagation === "function") {
                event.stopImmediatePropagation();
            }
        };
        const onTouchStart = function (event) {
            const touch = event.touches && event.touches[0];
            if (!touch) return;
            const synthetic = { clientX: touch.clientX, clientY: touch.clientY };
            if (seekFromPointer(synthetic)) {
                event.preventDefault();
                event.stopPropagation();
            }
        };

        const pointerEventName = window.PointerEvent ? "pointerdown" : "mousedown";
        document.addEventListener(pointerEventName, onPointerDown, { capture: true, passive: false });
        if (!window.PointerEvent) {
            document.addEventListener("touchstart", onTouchStart, { capture: true, passive: false });
        }

        const onSelectorClick = function (event) {
            const selector = event.target.closest?.(".art-control-selector");
            container.querySelectorAll(".art-control-selector.local-ctf-selector-open").forEach(function (node) {
                if (node !== selector) node.classList.remove("local-ctf-selector-open");
            });
            if (!selector) return;
            if (event.target.closest(".art-selector-item")) {
                selector.classList.remove("local-ctf-selector-open");
            } else {
                selector.classList.toggle("local-ctf-selector-open");
            }
        };
        container.addEventListener("click", onSelectorClick);

        player.on("destroy", function () {
            document.removeEventListener(pointerEventName, onPointerDown, true);
            document.removeEventListener("touchstart", onTouchStart, true);
            container.removeEventListener("click", onSelectorClick);
            delete container.dataset.localCtfInteractionFix;
        });

        console.info("[Local CTF Player] interaction fix enabled");
    };

    obj.installQualityFix = function (player) {
        const qualityList = obj.video_page.quality || [];
        if (!player?.controls || !qualityList.length) return;

        let switching = false;
        let current = qualityList.find(function (item) { return item.default; }) || qualityList[0];
        try {
            const savedQuality = String(player.storage.get("quality") || "");
            const savedItem = qualityList.find(function (item) {
                return item.html === savedQuality || item.html.startsWith(savedQuality + " ");
            });
            if (savedItem) current = savedItem;
        } catch (error) {}
        qualityList.forEach(function (item) { item.default = item === current; });

        const renderControl = function () {
            player.controls.update({
                name: "quality",
                position: "right",
                style: { marginRight: "10px" },
                html: current.html,
                selector: qualityList.map(function (item) { return { ...item, default: item === current }; }),
                onSelect: function (selected) {
                    const item = qualityList.find(function (candidate) { return candidate.url === selected.url; });
                    if (!item || item === current || switching) return current.html;

                    switching = true;
                    const control = document.querySelector("#artplayer .art-control-quality");
                    control?.classList.add("local-ctf-quality-switching");
                    player.notice.show = "正在检测并切换至 " + item.html + "…";

                    (async function () {
                        const probe = await obj.inspectStream(item);
                        if (!probe.ok) {
                            throw new Error(item.html + " 未返回有效 M3U8（HTTP " + (probe.status || "ERR") + "）");
                        }

                        await player.switchQuality(item.url, item.html);
                        current = item;
                        qualityList.forEach(function (candidate) { candidate.default = candidate === item; });
                        try { player.storage.set("quality", item.html); } catch (error) {}
                        renderControl();
                        player.notice.show = "已切换至 " + item.html;
                        console.info("[Local CTF Player] quality switched", item.html, item.url);
                    })().catch(function (error) {
                        console.error("[Local CTF Player] quality switch failed", error);
                        player.notice.show = "清晰度切换失败：" + (error?.message || error);
                        renderControl();
                    }).finally(function () {
                        switching = false;
                        document.querySelector("#artplayer .art-control-quality")
                            ?.classList.remove("local-ctf-quality-switching");
                    });

                    return current.html;
                }
            });
        };

        renderControl();
        console.info("[Local CTF Player] quality switch fix enabled", qualityList.map(function (item) { return item.html; }));
    };

    obj.installExclusivePlaybackGuard = function (container, legacyRoot) {
        if (!container) return;
        if (obj.exclusivePlaybackGuard) {
            obj.exclusivePlaybackGuard.container = container;
            if (legacyRoot) obj.exclusivePlaybackGuard.legacyRoots.add(legacyRoot);
            obj.exclusivePlaybackGuard.scan();
            return;
        }

        // Resolve the page realm locally. Some userscript managers compile this
        // function into a separate wrapper where outer lexical bindings are not
        // retained, which made the previous `pageWindow` reference fail at run time.
        const mediaWindow = typeof unsafeWindow !== "undefined" && unsafeWindow
            ? unsafeWindow
            : window;
        const MediaElement = mediaWindow.HTMLMediaElement || window.HTMLMediaElement;
        const mediaPrototype = MediaElement?.prototype;
        if (!mediaPrototype) return;

        const playDescriptor = Object.getOwnPropertyDescriptor(mediaPrototype, "play");
        const mutedDescriptor = Object.getOwnPropertyDescriptor(mediaPrototype, "muted");
        const volumeDescriptor = Object.getOwnPropertyDescriptor(mediaPrototype, "volume");
        const originalPlay = playDescriptor?.value || mediaPrototype.play;
        const originalPause = mediaPrototype.pause;
        const blockedMedia = new WeakSet();

        const guard = {
            active: true,
            container,
            legacyRoots: new Set(legacyRoot ? [legacyRoot] : []),
            scan: function () {},
            release: function () {}
        };

        const isAllowed = function (media) {
            if (!guard.active || !guard.container?.contains(media)) return false;
            const activeVideo = obj.artPlayer?.video;
            return activeVideo ? media === activeVideo : true;
        };

        const setNativeProperty = function (media, descriptor, property, value) {
            try {
                if (descriptor?.set) descriptor.set.call(media, value);
                else media[property] = value;
            } catch (error) {}
        };

        const silenceMedia = function (media) {
            if (!media || isAllowed(media)) return;
            try { originalPause.call(media); } catch (error) {}
            try {
                if (media.autoplay) media.autoplay = false;
                if (media.hasAttribute?.("autoplay")) media.removeAttribute("autoplay");
            } catch (error) {}
            try {
                if (!media.muted) setNativeProperty(media, mutedDescriptor, "muted", true);
                if (media.volume !== 0) setNativeProperty(media, volumeDescriptor, "volume", 0);
            } catch (error) {}
            if (!blockedMedia.has(media)) {
                blockedMedia.add(media);
                console.info("[Local CTF Player] blocked background media source", {
                    tag: media.tagName,
                    src: String(media.currentSrc || media.src || "").slice(0, 180)
                });
            }
        };

        guard.scan = function () {
            const scanRoot = function (root) {
                if (!root) return;
                if (root instanceof MediaElement) silenceMedia(root);
                root.querySelectorAll?.("video, audio").forEach(silenceMedia);
            };
            scanRoot(document);
            guard.legacyRoots.forEach(scanRoot);
        };

        if (typeof originalPlay === "function") {
            Object.defineProperty(mediaPrototype, "play", {
                ...playDescriptor,
                configurable: true,
                value: function (...args) {
                    if (guard.active && !isAllowed(this)) {
                        silenceMedia(this);
                        return Promise.resolve();
                    }
                    return originalPlay.apply(this, args);
                }
            });
        }

        const patchSetter = function (property, descriptor, blockedValue) {
            if (!descriptor?.set || !descriptor.configurable) return;
            Object.defineProperty(mediaPrototype, property, {
                ...descriptor,
                set: function (value) {
                    return descriptor.set.call(this,
                        guard.active && !isAllowed(this) ? blockedValue : value);
                }
            });
        };
        patchSetter("muted", mutedDescriptor, true);
        patchSetter("volume", volumeDescriptor, 0);

        const onBackgroundMediaEvent = function (event) {
            const media = event.target;
            if (media instanceof MediaElement && !isAllowed(media)) silenceMedia(media);
        };
        ["play", "playing", "volumechange"].forEach(function (eventName) {
            document.addEventListener(eventName, onBackgroundMediaEvent, true);
        });

        const observer = new MutationObserver(function () { guard.scan(); });
        observer.observe(document.documentElement, { childList: true, subtree: true });
        const timer = window.setInterval(guard.scan, 250);

        guard.release = function () {
            if (!guard.active) return;
            guard.active = false;
            window.clearInterval(timer);
            observer.disconnect();
            ["play", "playing", "volumechange"].forEach(function (eventName) {
                document.removeEventListener(eventName, onBackgroundMediaEvent, true);
            });
            try {
                if (playDescriptor) Object.defineProperty(mediaPrototype, "play", playDescriptor);
                if (mutedDescriptor) Object.defineProperty(mediaPrototype, "muted", mutedDescriptor);
                if (volumeDescriptor) Object.defineProperty(mediaPrototype, "volume", volumeDescriptor);
            } catch (error) {}
        };

        obj.exclusivePlaybackGuard = guard;
        guard.scan();
        console.info("[Local CTF Player] exclusive playback guard enabled");
    };

    obj.replaceVideoPlayer = function () {
        const { flag } = obj.video_page;
        var container, videoNode = document.querySelector("#video-wrap, .vp-video__player, #app .video-content");
        if (videoNode) {
            while (videoNode.nextSibling) {
                videoNode.parentNode.removeChild(videoNode.nextSibling);
            }
            container = document.getElementById("artplayer");
            if (!container) {
                container = document.createElement("div");
                container.setAttribute("id", "artplayer");
                if ([ "videoView" ].includes(flag)) {
                    container.setAttribute("style", "width: 100%; height: 3.75rem;");
                }
                else {
                    container.setAttribute("style", "width: 100%; height: 100%;");
                }
                obj.videoNode = videoNode.parentNode.replaceChild(container, videoNode);
                container.style.setProperty("position", "relative", "important");
                container.style.setProperty("z-index", "2147483000", "important");
                container.style.setProperty("pointer-events", "auto", "important");
                container.style.setProperty("overflow", "hidden", "important");
                if (container.parentNode) {
                    container.parentNode.style.setProperty("position", "relative", "important");
                    container.parentNode.style.setProperty("z-index", "2147482999", "important");
                    container.parentNode.style.setProperty("pointer-events", "auto", "important");
                }
                obj.installExclusivePlaybackGuard(container, obj.videoNode);
                return Promise.resolve();
            }
            obj.installExclusivePlaybackGuard(container, obj.videoNode);
            return Promise.resolve();
        }
        else {
            return obj.delay().then(function () {
                return obj.replaceVideoPlayer();
            });
        }
    };

    obj.destroyPlayer = function () {
        // Keep Baidu's internal player object alive. Disposing it makes the page's
        // own timers read currentTime from a null tech object. Only pause/mute the
        // detached native media so ArtPlayer remains the sole audible player.
        const silence = function (candidate) {
            try {
                const nativePlayer = candidate && (candidate.player || candidate);
                if (nativePlayer && typeof nativePlayer.pause === "function") {
                    nativePlayer.pause();
                }
                if (nativePlayer && typeof nativePlayer.muted === "function") {
                    nativePlayer.muted(true);
                }
                const media = candidate?.el_?.querySelector?.("video")
                    || candidate?.querySelector?.("video")
                    || obj.videoNode?.querySelector?.("video");
                if (media) {
                    media.pause();
                    media.muted = true;
                    media.volume = 0;
                }
            } catch (error) {}
        };

        const { flag } = obj.video_page;
        if ([ "sharevideo", "playvideo" ].includes(flag) && unsafeWindow.require?.async) {
            unsafeWindow.require.async("file-widget-1:videoPlay/context.js", function (context) {
                silence(context && context.getContext()?.playerInstance);
            });
        } else {
            silence(obj.videoNode?.firstChild || obj.videoNode);
        }
        obj.videoNode = null;
    };

    // The outer bootstrap verifies the isolated local CTF marker before this code runs.
    obj.getVip = function () {
        return 2; // Local simulated SVIP.
    };

    obj.getAdToken = async function () {
        // Do not short-circuit on the locally simulated VIP value.
        // The local challenge endpoint may still require one adToken exchange
        // before it returns a manifest for 720P/480P/360P.
        if (obj.video_page.adToken) {
            return obj.video_page.adToken;
        }

        const tokenOwner = String(obj.video_page.file?.fs_id || obj.video_page.file?.path || location.pathname);
        const tokenCacheKey = "local-ctf-player-ad-token:" + tokenOwner;
        try {
            const cached = JSON.parse(sessionStorage.getItem(tokenCacheKey) || "null");
            if (cached && cached.value && Date.now() - Number(cached.savedAt || 0) < 120000) {
                obj.video_page.adToken = String(cached.value);
                console.info("[Local CTF Player] reused short-lived adToken cache");
                return obj.video_page.adToken;
            }
            sessionStorage.removeItem(tokenCacheKey);
        } catch (error) {}

        const { getUrl } = obj.video_page;
        const url = getUrl("M3U8_AUTO_480");
        try {
            const response = await fetch(url, {
                method: "GET",
                credentials: "include",
                cache: "no-store",
                headers: {
                    "Accept": "application/vnd.apple.mpegurl, application/json, */*"
                }
            });
            const text = await response.text();

            // Some local CTF backends return a manifest immediately.
            if (obj.isM3u8Text(text)) {
                console.info("[Local CTF Player] 480P challenge returned M3U8 directly");
                return "";
            }

            let data = null;
            try { data = JSON.parse(text); } catch (error) {
                console.warn("[Local CTF Player] adToken response is not JSON", text.slice(0, 300));
                return "";
            }

            if (data && Number(data.errno) === 133 && data.adToken) {
                obj.video_page.adToken = String(data.adToken);
                try {
                    sessionStorage.setItem(tokenCacheKey, JSON.stringify({
                        value: obj.video_page.adToken,
                        savedAt: Date.now()
                    }));
                } catch (error) {}
                console.info("[Local CTF Player] acquired local adToken challenge", {
                    adTime: Number(data.adTime) || 0,
                    tokenLength: obj.video_page.adToken.length
                });
            } else {
                console.warn("[Local CTF Player] no usable adToken in challenge response", data);
            }
        } catch (error) {
            console.warn("[Local CTF Player] adToken challenge failed", error);
        }
        return obj.video_page.adToken || "";
    };

    obj.addQuality = function () {
        const { file: { resolution }, getUrl, adToken } = obj.video_page;
        const templates = {
            1080: "超清 1080P",
            720: "高清 720P",
            480: "流畅 480P",
            360: "省流 360P"
        };
        const freeList = function (e) {
            e = e || "";
            var t = [480, 360]
            , a = e.match(/width:(\d+),height:(\d+)/) || ["", "", ""]
            , i = +a[1] * +a[2];
            return i ? (i > 409920 && t.unshift(720), i > 921600 && t.unshift(1080), t) : t;
        }(resolution);
        obj.video_page.quality = freeList.map(function (template, index) {
            const streamUrl = getUrl("M3U8_AUTO_" + template);
            return {
                html: templates[template],
                url: streamUrl + (adToken ? (streamUrl.includes("?") ? "&" : "?") + "adToken=" + encodeURIComponent(adToken) : ""),
                default: index === 0,
                type: "hls"
            };
        });
        return obj.video_page.quality;
    };

    obj.addFilelist = function () {
        const { flag, file, filelist } = obj.video_page;
        if ([ "sharevideo" ].includes(flag)) {
            const currentList = JSON.parse(sessionStorage.getItem(obj.getShareId()) || "[]");
            if (currentList.length) {
                currentList.forEach(function (item) {
                    if (item.category == 1) {
                        item.name = item.server_filename;
                        item.open = function () {
                            location.href = "https://pan.baidu.com" + location.pathname + "?fid=" + item.fs_id;
                        }
                        filelist.push(item);
                    }
                });
            }
        }
        else if ([ "playvideo" ].includes(flag)) {
            filelist.forEach(function (item, index) {
                item.name = item.server_filename;
                item.open = function () {
                    location.href = "https://pan.baidu.com" + location.pathname + "#/video?path=" + encodeURIComponent(item.path) + "&t=" + index;
                }
            });
        }
        else if ([ "video" ].includes(flag)) {
            filelist.forEach(function (item) {
                item.name = item.name || item.server_filename;
                item.open = function () {
                    location.href = "https://pan.baidu.com/pfile/video?path=" + encodeURIComponent(item.path);
                }
            });
        }
        if (filelist && filelist.length) {
            filelist.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
            const fileDefault = filelist.find(function (item, index) {
                return item.fs_id == file.fs_id;
            });
            if (fileDefault) {
                fileDefault.default = true;
            }
        }
    };

    obj.getShareId = function () {
        return (/baidu.com\/(?:s\/1|(?:share|wap)\/init\?surl=)([\w-]{5,25})/.exec(location.href) || [])[1] || "";
    };

    obj.startObj = function () {
        return Promise.resolve(obj);
    };

    obj.ready = function (state = 3) {
        return new Promise(function (resolve) {
            var states = ["uninitialized", "loading", "loaded", "interactive", "complete"];
            state = Math.min(state, states.length - 1);
            if (states.indexOf(document.readyState) >= state) {
                window.setTimeout(resolve);
            }
            else {
                const onReadyStateChange = function () {
                    if (states.indexOf(document.readyState) >= state) {
                        document.removeEventListener("readystatechange", onReadyStateChange);
                        window.setTimeout(resolve);
                    }
                };
                document.addEventListener("readystatechange", onReadyStateChange);
            }
        });
    };

    obj.delay = function (ms = 500) {
        return new Promise(resolve => setTimeout(resolve, ms));
    };

    obj.showTip = function (msg, mode, durtime) {
        if (unsafeWindow.require) {
            unsafeWindow.require("system-core:system/uiService/tip/tip.js").show({ vipType: "svip", mode: mode, msg: msg });
        }
        else if (unsafeWindow.toast) {
            unsafeWindow.toast.show({
                type: ["caution", "failure"].includes(mode) ? "wide" : "svip",
                message: msg,
                duration: durtime || 3e3
            });
        }
        else if (unsafeWindow.$bus) {
            unsafeWindow.$bus.$Toast.addToast({
                type: { caution: "tip", failure: "error" }[mode] || mode,
                content: msg,
                durtime: durtime || 3e3
            });
        }
        else if (unsafeWindow.VueApp) {
            unsafeWindow.VueApp.$Toast.addToast({
                type: { caution: "tip", failure: "error" }[mode] || mode,
                content: msg,
                durtime: durtime || 3e3
            });
        }
    };

    obj.run = function () {
        var url = location.href;
        if (url.indexOf(".baidu.com/s/") > 0) {
            obj.ready().then(obj.sharevideo);
        }
        else if (url.indexOf(".baidu.com/play/video#/video") > 0) {
            obj.ready().then(obj.playvideo);
            window.onhashchange = function (e) {
                location.reload();
            };
        }
        else if (url.indexOf(".baidu.com/pfile/video") > 0) {
            obj.ready().then(obj.video);
        }
        else if (url.indexOf(".baidu.com/pfile/mboxvideo") > 0) {
            obj.ready().then(obj.mboxvideo);
        }
        else if (url.indexOf(".baidu.com/wap") > 0) {
            obj.ready(4).then(function () {
                const { $router } = document.getElementById("app").__vue__;
                $router.onReady(function () {
                    const { currentRoute } = $router;
                    if (currentRoute && currentRoute.name === "videoView") {
                        obj.videoView();
                    }
                    $router.afterEach(function (to, from) {
                        if (to.name !== from.name) {
                            obj.video_page.adToken = "";
                            if (to.name === "videoView") {
                                obj.videoView();
                            }
                        }
                    });
                });
            });
        }
    }();

    console.log("=== 百度 网 网 网盘 好 好 好棒棒！===");

    // Your code here...
})();
})();
