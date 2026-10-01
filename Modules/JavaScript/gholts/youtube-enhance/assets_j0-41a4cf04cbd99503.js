performance.mark("js-parse-end:j0-41a4cf04cbd99503.js");
export const __rspack_esm_id="j0";export const __rspack_esm_ids=["j0"];export const __webpack_modules__={Bd(e,t,r){var n=r("TI");function o(){let e=document.getElementById("ajax-error-message");e&&(e.hidden=!1)}function i(){let e=document.getElementById("ajax-error-message");e&&(e.hidden=!0)}(0,n.on)("deprecatedAjaxError","[data-remote]",function(e){let{error:t,text:r}=e.detail;e.currentTarget!==e.target||"abort"!==t&&"canceled"!==t&&(/<html/.test(r)?(o(),e.stopImmediatePropagation()):setTimeout(function(){e.defaultPrevented||o()},0))}),(0,n.on)("deprecatedAjaxSend","[data-remote]",function(){i()}),(0,n.on)("click",".js-ajax-error-dismiss",function(){i()}),r.d(t,{a:()=>i,n:()=>o})},oz(e,t,r){var n=r("yo"),o=r("Ak"),i=r("TI"),a=r("K2");let d=new WeakMap;function l(e){let t=e.closest(".js-render-needs-enrichment");t&&(t.classList.remove("render-error"),d.get(t)?.setLoading(!1))}function s(e,t){let r=e.closest(".js-render-needs-enrichment");return!!r&&(r.classList.add("render-error"),r.querySelector(".js-render-block-actions")?.remove(),d.get(r)?.setError(!0,t))}function c(e,t,r){let o=r.identifier??"",i=new URL(e,window.location.origin);for(let[e,r]of Object.entries(t))i.searchParams.append(e,`${r}`);return i.hash=o,(0,n.qy)`
    <div
      class="render-container color-bg-transparent js-render-target p-0"
      data-identity="${o}"
      data-host="${i.origin}"
      data-type="${r.type}"
    >
      <iframe
        title="File display"
        role="presentation"
        class="render-viewer"
        src="${String(i)}"
        name="${o}"
        data-content="${r.contentJson}"
        sandbox="allow-scripts allow-same-origin allow-top-navigation allow-popups"
      >
      </iframe>
    </div>
  `}(0,o.l)(".js-render-needs-enrichment",{constructor:HTMLElement,initialize:function(e){var t,r;let o,i,l={color_mode:(0,a.PT)()},s=e.getAttribute("data-type"),u=e.getAttribute("data-src"),m=e.getAttribute("data-identity"),f=e.getElementsByClassName("js-render-enrichment-target")[0],h=e.getElementsByClassName("js-render-enrichment-loader")[0],p=f.closest("details"),g=document.createElement("div");g.classList.add("js-render-enrichment-fallback"),e.appendChild(g);let y=f.firstElementChild;g.appendChild(y);let v={setLoading(e){h.hidden=!e},setError:(e,t)=>(v.setLoading(!1),!1!==e&&(y.classList.toggle("render-plaintext-hidden",!e),!!t&&((0,n.XX)([t,y],g),!0)))};d.set(e,v);let b=f.getAttribute("data-plain"),w=f.getAttribute("data-json");if(null==w||null==b)throw v.setError(!0,(0,n.qy)`<p class="flash flash-error">Unable to render rich display</p>`),Error(`Expected to see input data for type: ${s}`);let k=c(u,l,{type:s,identifier:m,contentJson:w}),L=c(u,l,{type:s,identifier:`${m}-fullscreen`,contentJson:w}),x=(t=()=>{(0,n.XX)(L,f.getElementsByClassName("Box-body")[0])},r={type:s},o=(0,n.qy)`<clipboard-copy
    aria-label="Copy ${r.type} code"
    .value=${b}
    class="btn my-2 js-clipboard-copy p-0 d-inline-flex tooltipped-no-delay"
    role="button"
    data-copy-feedback="Copied!"
    data-tooltip-direction="s"
  >
    <svg
      aria-hidden="true"
      height="16"
      viewBox="0 0 16 16"
      version="1.1"
      width="16"
      class="octicon octicon-copy js-clipboard-copy-icon m-2"
    >
      <path
        fill-rule="evenodd"
        d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 010 1.5h-1.5a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-1.5a.75.75 0 011.5 0v1.5A1.75 1.75 0 019.25 16h-7.5A1.75 1.75 0 010 14.25v-7.5z"
      ></path>
      <path
        fill-rule="evenodd"
        d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0114.25 11h-7.5A1.75 1.75 0 015 9.25v-7.5zm1.75-.25a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-7.5a.25.25 0 00-.25-.25h-7.5z"
      ></path>
    </svg>
    <svg
      aria-hidden="true"
      height="16"
      viewBox="0 0 16 16"
      version="1.1"
      width="16"
      class="octicon octicon-check js-clipboard-check-icon color-fg-success d-none m-2"
    >
      <path
        fill-rule="evenodd"
        d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"
      ></path>
    </svg>
  </clipboard-copy>`,i=(0,n.qy)`
    <details class="details-reset details-overlay details-overlay-dark" style="display: contents">
      <summary
        role="button"
        aria-label="Open dialog"
        class="btn my-2 mr-2 p-0 d-inline-flex"
        aria-haspopup="dialog"
        @click="${t}"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" class="octicon m-2">
          <path
            fill-rule="evenodd"
            d="M3.72 3.72a.75.75 0 011.06 1.06L2.56 7h10.88l-2.22-2.22a.75.75 0 011.06-1.06l3.5 3.5a.75.75 0 010 1.06l-3.5 3.5a.75.75 0 11-1.06-1.06l2.22-2.22H2.56l2.22 2.22a.75.75 0 11-1.06 1.06l-3.5-3.5a.75.75 0 010-1.06l3.5-3.5z"
          ></path>
        </svg>
      </summary>
      <details-dialog
        class="Box Box--overlay render-full-screen d-flex flex-column anim-fade-in fast"
        aria-label="${r.type} rendered container"
      >
        <div>
          <button
            aria-label="Close dialog"
            data-close-dialog=""
            type="button"
            data-view-component="true"
            class="Link--muted btn-link position-absolute render-full-screen-close"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="currentColor"
              style="display:inline-block;vertical-align:text-bottom"
              class="octicon octicon-x"
            >
              <path
                fill-rule="evenodd"
                d="M5.72 5.72a.75.75 0 011.06 0L12 10.94l5.22-5.22a.75.75 0 111.06 1.06L13.06 12l5.22 5.22a.75.75 0 11-1.06 1.06L12 13.06l-5.22 5.22a.75.75 0 01-1.06-1.06L10.94 12 5.72 6.78a.75.75 0 010-1.06z"
              ></path>
            </svg>
          </button>
          <div class="Box-body border-0" role="presentation"></div>
        </div>
      </details-dialog>
    </details>
  `,(0,n.qy)`<div
    class="js-render-block-actions position-absolute top-0 pr-2 right-0 d-flex flex-justify-end flex-items-center"
  >
    ${i}${o}
  </div>`);p&&!p.open?p.addEventListener("toggle",()=>{p.open&&(0,n.XX)([x,k],f)},{once:!0}):(0,n.XX)([x,k],f)}}),(0,i.on)("preview:toggle:off",".js-previewable-comment-form",function(e){let t=e.currentTarget.querySelector(".js-render-needs-enrichment"),r=t?.querySelector(".js-render-enrichment-target");r&&(r.textContent="")}),(0,i.on)("preview:rendered",".js-previewable-comment-form",function(e){let t=e.currentTarget.querySelector(".js-render-needs-enrichment");t&&d.get(t)?.setLoading(!1)}),r.d(t,{A:()=>l,L:()=>s})},s5(e,t,r){var n=r("pI"),o=r("Ak"),i=r("TI");function a(e,t){let r=e.currentTarget;if(!(r instanceof Element))return;let n=t&&e instanceof CustomEvent&&e.detail?.error?.message?.includes("responded with a status of 403");for(let e of r.querySelectorAll("[data-show-on-forbidden-error]"))e instanceof HTMLElement&&(e.hidden=!n);for(let e of r.querySelectorAll("[data-show-on-error]"))e instanceof HTMLElement&&(e.hidden=n||!t);for(let e of r.querySelectorAll("[data-hide-on-error]"))e instanceof HTMLElement&&(e.hidden=t)}function d(e){a(e,!1)}function l(e){a(e,!0)}function s({currentTarget:e}){e instanceof Element&&c(e)}function c(e){let t=e.closest("details");t&&function(e){let t=e.getAttribute("data-deferred-details-content-url");if(t){e.removeAttribute("data-deferred-details-content-url");let r=e.querySelector("include-fragment, poll-include-fragment");r&&(r.src=t)}}(t)}(0,o.l)("include-fragment, poll-include-fragment",{subscribe:e=>(0,n.Zz)((0,n.Rt)(e,"error",l),(0,n.Rt)(e,"loadstart",d))}),(0,i.on)("click","include-fragment button[data-retry-button]",({currentTarget:e})=>{e.closest("include-fragment").refetch()}),r.d(t,{d:()=>c,s:()=>s})},JE(e,t,r){var n=r("yo"),o=r("oz"),i=r("Ak"),a=r("P6");function d(e){return!!e.querySelector('.js-render-target[data-type="ipynb"]')}let l=["is-render-pending","is-render-ready","is-render-loading","is-render-loaded"],s=["is-render-ready","is-render-loading","is-render-loaded","is-render-failed","is-render-failed-fatally"],c=new WeakMap;function u(e){let t=c.get(e);null!=t&&(t.load=t.hello=null,t.helloTimer&&(clearTimeout(t.helloTimer),t.helloTimer=null),t.loadTimer&&(clearTimeout(t.loadTimer),t.loadTimer=null))}function m(e,t=""){var r,i;let a;e.classList.remove(...l),e.classList.add("is-render-failed");let d=function(e){let t=(0,n.qy)`<p>Unable to render rich display</p>`;if(""!==e){let r=e.split("\n");t=(0,n.qy)`<p><b>Unable to render rich display</b></p>
      <p>${r.map(e=>(0,n.qy)`${e}<br />`)}</p>`}return(0,n.qy)`<div class="flash flash-error">${t}</div>`}(t);!1===(0,o.L)(e,d)&&(r=e,i=d,(a=r.querySelector(".render-viewer-error"))&&(a.remove(),r.classList.remove("render-container"),(0,n.XX)(i,r))),u(e)}function f(e,t=!1){!(!e||!(0,a.A)(e)||e.classList.contains("is-render-ready")||e.classList.contains("is-render-failed")||e.classList.contains("is-render-failed-fatally"))&&(!t||c.get(e)?.hello)&&m(e)}function h(e,t,r){return!!e&&!!e.postMessage&&(e.postMessage(JSON.stringify(t),r),!0)}function p(e){return t=>{if(!t.querySelector(".js-render-target"))return;let r=t.querySelector("iframe"),n=r?.contentWindow;if(n)return e(n)}}(0,i.l)(".js-render-target",function(e){e.classList.remove(...s),e.style.height="auto",c.get(e)?.load||(u(e),c.get(e)||(c.set(e,{load:Date.now(),hello:null,helloTimer:window.setTimeout(f,1e4,e,!0),loadTimer:window.setTimeout(f,45e3,e)}),e.classList.add("is-render-automatic","is-render-requested")))}),window.addEventListener("message",function(e){let t=e.data;if(!t)return;if("string"==typeof t)try{t=JSON.parse(t)}catch{return}if("object"!=typeof t&&void 0!=t||"render"!==t.type||"string"!=typeof t.identity)return;let r=t.identity;if("string"!=typeof t.body)return;let n=t.body,i=function(e,t){for(let r of e.querySelectorAll(".js-render-target[data-identity][data-host]"))if(r.getAttribute("data-identity")===t)return r;return null}(document,r);if(!i||e.origin!==i.getAttribute("data-host"))return;let a=e.origin,d=null!=t.payload?t.payload:void 0,s=i.querySelector("iframe"),u=s?.contentWindow;switch(n){case"hello":if((c.get(i)||{untimed:!0}).hello=Date.now(),!u)return;h(u,{type:"render:cmd",body:{cmd:"ack",ack:!0}},a),h(u,{type:"render:cmd",body:{cmd:"branding",branding:!1}},a);break;case"error":m(i,d?.error);break;case"error:fatal":m(i,d?.error),i.classList.add("is-render-failed-fatal");break;case"error:invalid":m(i,d?.error),i.classList.add("is-render-failed-invalid");break;case"loading":i.classList.remove(...l),i.classList.add("is-render-loading");break;case"loaded":i.classList.remove(...l),i.classList.add("is-render-loaded");break;case"ready":(0,o.A)(i),i.classList.remove(...l),i.classList.add("is-render-ready"),d&&"number"==typeof d.height&&(i.style.height=`${d.height}px`,""!==location.hash&&window.dispatchEvent(new HashChangeEvent("hashchange"))),d?.ack===!0&&window.requestAnimationFrame(()=>{setTimeout(()=>{h(u,{type:"render:cmd",body:{cmd:"code_rendering_service:ready:ack","code_rendering_service:ready:ack":{}}},a)},0)});break;case"resize":d&&"number"==typeof d.height&&(i.style.height=`${d.height}px`);break;case"code_rendering_service:container:get_size":h(u,{type:"render:cmd",body:{cmd:"code_rendering_service:container:size","code_rendering_service:container:size":{width:i?.getBoundingClientRect().width}}},a);break;case"code_rendering_service:markdown:get_data":let f;if(!u)return;let p=s?.getAttribute("data-content")??"";try{f=JSON.parse(p)?.data}catch{f=null}f&&h(u,{type:"render:cmd",body:{cmd:"code_rendering_service:data:ready","code_rendering_service:data:ready":{data:f,width:i?.getBoundingClientRect().width}}},a)}});let g=p(e=>h(e,{type:"render:cmd",body:{cmd:"code_rendering_service:behaviour:expand_all"}},origin)),y=p(e=>h(e,{type:"render:cmd",body:{cmd:"code_rendering_service:behaviour:collapse_all"}},origin));r.d(t,{hq:()=>d},{Qs:g,zr:y})},JN(e,t,r){let n;var o=r("Ak");let i=0,a=new ResizeObserver(e=>{for(let t of e){let e=t.target;if(e instanceof HTMLElement){let t=e.ownerDocument.documentElement,r=e.clientHeight;r!==i&&(n&&cancelAnimationFrame(n),n=requestAnimationFrame(()=>{t.style.setProperty("--observed-header-height",`${r}px`),i=r}))}}});function d(){return i}(0,o.l)(".js-observe-sticky-header-height",{constructor:HTMLElement,add(e){a.observe(e)}}),r.d(t,{D:()=>d})},K2(e,t,r){var n=r("OK"),o=r("DI");function i(){(0,o.TV)("preferred_color_mode",a())}function a(){return d("dark")?"dark":d("light")?"light":void 0}function d(e){return window.matchMedia&&window.matchMedia(`(prefers-color-scheme: ${e})`).matches}function l(e){let t=document.querySelector("html[data-color-mode]");t&&t.setAttribute("data-color-mode",e)}function s(e,t){let r=document.querySelector("html[data-color-mode]");r&&r.setAttribute(`data-${t}-theme`,e)}function c(e){let t=document.querySelector("html[data-color-mode]");if(t)return t.getAttribute(`data-${e}-theme`)}function u(e="light"){let t=function(){let e=document.querySelector("html[data-color-mode]");if(e)return e.getAttribute("data-color-mode")}();return("auto"===t?a():t)??e}(async()=>{if(await n.G,i(),window.matchMedia){let e=window.matchMedia("(prefers-color-scheme: dark)");e?.addEventListener?e.addEventListener("change",i):e.addListener(i)}})(),r.d(t,{OQ:()=>a,PA:()=>l,PT:()=>u,Px:()=>s,to:()=>c})},wP(e,t,r){var n=r("oO"),o=r("xK"),i=r("JN"),a=r("OK");async function d(e){if(e.hasAttribute("data-ignore-sticky-scroll"))return;let t=e.ownerDocument;if(t&&t.defaultView){await a.K,e.scrollIntoView();let r=t.querySelector(".secondary-sticky-header");r?t.defaultView.scrollBy(0,-s()-r.clientHeight):t.defaultView.scrollBy(0,-s())}}function l(e){let t=(0,n.rG)(e);t&&d(t)}function s(){return(0,o.Jd)()+(0,i.D)()}r.d(t,{GO:()=>l,Oc:()=>s,Rt:()=>d})},DI(e,t,r){function n(e){return o(e)[0]}function o(e){let t=[];for(let r of function(){try{return document.cookie.split(";")}catch{return[]}}()){let[n,o]=r.trim().split("=");e===n&&void 0!==o&&t.push({key:n,value:o})}return t}function i(e){return"string"==typeof e&&e.length>0&&e.length<4096&&!/[;\r\n]/.test(e)}function a(e,t,r=null,n=!1,o="lax",i=!1){let d=document.domain;if(null==d)throw Error("Unable to get document domain");d.endsWith(".github.com")&&(d="github.com");let l="https:"===location.protocol?"; secure":"",s=r?`; expires=${r}`:"";!1===n&&(d=`.${d}`);try{document.cookie=`${e}=${t}; path=/; domain=${d}${s}${l}; samesite=${o}${i?"; partitioned":""}`}catch{}}function d(e,t=!1){let r=document.domain;if(null==r)throw Error("Unable to get document domain");r.endsWith(".github.com")&&(r="github.com");let n=new Date(Date.now()-1).toUTCString(),o="https:"===location.protocol?"; secure":"",i=`; expires=${n}`;!1===t&&(r=`.${r}`);try{document.cookie=`${e}=''; path=/; domain=${r}${i}${o}`}catch{}}r.d(t,{OR:()=>o,Ri:()=>n,TV:()=>a,Yj:()=>d,cn:()=>i})},o(e,t,r){var n=r("P");r.d(t,{},{softNavigate:(e,t)=>{let r;try{r=new URL(String(e),n.cg?.location.href)}catch{return}("http:"===r.protocol||"https:"===r.protocol)&&(t?.action==="replace"?n.cg?.location.replace(r.href):n.cg?.location.assign(r.href))}})},xK(e,t,r){let n=0,o=new Set;function i(e){e(n),o.add(e)}function a(e){o.delete(e)}function d(){return n}function l(e){for(let t of(n=e,e?document.body.style.setProperty("--base-sticky-header-height",`${e}px`):document.body.style.removeProperty("--base-sticky-header-height"),o))t(e)}r.d(t,{Jd:()=>d,MG:()=>i,b:()=>a,zG:()=>l})},P6(e,t,r){function n(e){return!(e.offsetWidth<=0&&e.offsetHeight<=0)}r.d(t,{A:()=>n})}};
//# sourceMappingURL=j0-41a4cf04cbd99503-558581ba8cecc03e.js.map