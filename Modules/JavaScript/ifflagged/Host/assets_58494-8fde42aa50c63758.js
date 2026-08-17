performance.mark("js-parse-end:58494-8fde42aa50c63758.js");
export const __rspack_esm_id=58494;export const __rspack_esm_ids=[58494];export const __webpack_modules__={330861(t,e,o){let n;o(959136);var i,r,s,a,l,p,c,h,d,u,f,m,v=o(792187),w=function(t,e,o,n){if("a"===o&&!n)throw TypeError("Private accessor was defined without a getter");if("function"==typeof e?t!==e||!n:!e.has(t))throw TypeError("Cannot read private member from an object whose class did not declare it");return"m"===o?n:"a"===o?n.call(t):n?n.value:e.get(t)},g=function(t,e,o,n,i){if("m"===n)throw TypeError("Private method is not writable");if("a"===n&&!i)throw TypeError("Private accessor was defined without a setter");if("function"==typeof e?t!==e||!i:!e.has(t))throw TypeError("Cannot write private member to an object whose class did not declare it");return"a"===n?i.call(t,o):i?i.value=o:e.set(t,o),o};let b=t=>n?t.matches(n):function(t){try{return n=":popover-open",t.matches(n)}catch{try{return n=":open",t.matches(":open")}catch{return n=".\\:popover-open",t.matches(".\\:popover-open")}}}(t),y="sr-only",E=["tooltip-n","tooltip-s","tooltip-e","tooltip-w","tooltip-ne","tooltip-se","tooltip-nw","tooltip-sw"];function T(t){for(let e of A)e!==t&&(b(e)?e.hidePopover():A.delete(e))}function L(){T()}function S(t){setTimeout(()=>{for(let e of A)b(e)&&"focus"===e.showReason&&e.control!==t.target&&e.hidePopover()},0)}let k=new Set,A=new Set;class M extends HTMLElement{constructor(){super(...arguments),i.add(this),r.set(this,void 0),s.set(this,"center"),a.set(this,"outside-bottom"),l.set(this,!1),p.set(this,"mouse"),c.set(this,!1)}styles(){return`
      :host {
        --tooltip-top: var(--tool-tip-position-top, 0);
        --tooltip-left: var(--tool-tip-position-left, 0);
        padding: var(--overlay-paddingBlock-condensed) var(--overlay-padding-condensed) !important;
        font: var(--text-body-shorthand-small);
        color: var(--tooltip-fgColor, var(--fgColor-onEmphasis)) !important;
        text-align: center;
        text-decoration: none;
        text-shadow: none;
        text-transform: none;
        letter-spacing: normal;
        word-wrap: break-word;
        white-space: pre;
        background: var(--tooltip-bgColor, var(--bgColor-emphasis)) !important;
        border-radius: var(--borderRadius-medium);
        border: 0 !important;
        opacity: 0;
        max-width: min(var(--overlay-width-small), 100vw);
        word-wrap: break-word;
        white-space: normal;
        width: max-content !important;
        inset: var(--tooltip-top) auto auto var(--tooltip-left) !important;
        overflow: visible !important;
        text-wrap: balance;
      }

      :host(:is(.tooltip-n, .tooltip-nw, .tooltip-ne)) {
        --tooltip-top: calc(var(--tool-tip-position-top, 0) - var(--overlay-offset, 0.25rem));
        --tooltip-left: var(--tool-tip-position-left);
      }

      :host(:is(.tooltip-s, .tooltip-sw, .tooltip-se)) {
        --tooltip-top: calc(var(--tool-tip-position-top, 0) + var(--overlay-offset, 0.25rem));
        --tooltip-left: var(--tool-tip-position-left);
      }

      :host(.tooltip-w) {
        --tooltip-top: var(--tool-tip-position-top);
        --tooltip-left: calc(var(--tool-tip-position-left, 0) - var(--overlay-offset, 0.25rem));
      }

      :host(.tooltip-e) {
        --tooltip-top: var(--tool-tip-position-top);
        --tooltip-left: calc(var(--tool-tip-position-left, 0) + var(--overlay-offset, 0.25rem));
      }

      :host:after{
        position: absolute;
        display: block;
        right: 0;
        left: 0;
        height: var(--overlay-offset, 0.25rem);
        content: "";
      }

      :host(.tooltip-s):after,
      :host(.tooltip-se):after,
      :host(.tooltip-sw):after {
        bottom: 100%
      }

      :host(.tooltip-n):after,
      :host(.tooltip-ne):after,
      :host(.tooltip-nw):after {
        top: 100%;
      }

      @keyframes tooltip-appear {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      :host(:popover-open),
      :host(:popover-open):before {
        animation-name: tooltip-appear;
        animation-duration: .1s;
        animation-fill-mode: forwards;
        animation-timing-function: ease-in;
      }

      :host(.\\:popover-open) {
        animation-name: tooltip-appear;
        animation-duration: .1s;
        animation-fill-mode: forwards;
        animation-timing-function: ease-in;
      }

      @media (forced-colors: active) {
        :host {
          outline: solid 1px transparent;
        }

        :host:before {
          display: none;
        }
      }
    `}get showReason(){return w(this,p,"f")}get htmlFor(){return this.getAttribute("for")||""}set htmlFor(t){this.setAttribute("for",t)}get type(){return"label"===this.getAttribute("data-type")?"label":"description"}set type(t){this.setAttribute("data-type",t)}get direction(){return this.getAttribute("data-direction")||"s"}set direction(t){this.setAttribute("data-direction",t)}get control(){return this.ownerDocument.getElementById(this.htmlFor)}set hiddenFromView(t){t&&b(this)?this.hidePopover():t||b(this)||this.showPopover()}get hiddenFromView(){return!b(this)}connectedCallback(){if(k.add(this),w(this,i,"m",u).call(this),w(this,i,"m",f).call(this),!this.shadowRoot){let t=this.attachShadow({mode:"open"});t.appendChild(document.createElement("style")).textContent=this.styles(),t.appendChild(document.createElement("slot"))}w(this,i,"m",h).call(this,!1),g(this,l,!0,"f"),w(this,i,"m",d).call(this)}disconnectedCallback(){k.delete(this),A.delete(this),w(this,r,"f")?.abort()}async handleEvent(t){if(!this.control)return;let e=b(this);"beforetoggle"===t.type&&t.currentTarget!==this&&g(this,c,"open"===t.newState,"f");let o=("mouseenter"===t.type||"focus"===t.type&&(navigator.webdriver||this.control.matches(":focus-visible")))&&!w(this,c,"f"),n="mouseleave"===t.type&&t.relatedTarget!==this.control&&t.relatedTarget!==this,r="keydown"===t.type&&"Escape"===t.key,s="mousedown"===t.type&&t.currentTarget===this.control,a="beforetoggle"===t.type&&t.currentTarget!==this&&"open"===t.newState;e&&r&&(t.stopImmediatePropagation(),t.preventDefault()),await Promise.resolve(),e||!o||b(this)?e&&(n||r||s||a)&&b(this)&&this.hidePopover():(g(this,p,"mouseenter"===t.type?"mouse":"focus","f"),this.showPopover()),"toggle"===t.type&&w(this,i,"m",h).call(this,"open"===t.newState)}attributeChangedCallback(t){this.isConnected&&("for"===t?w(this,i,"m",d).call(this):"id"===t||"data-type"===t?w(this,i,"m",u).call(this):"data-direction"===t&&w(this,i,"m",f).call(this))}}r=new WeakMap,s=new WeakMap,a=new WeakMap,l=new WeakMap,p=new WeakMap,c=new WeakMap,i=new WeakSet,h=function(t){t?(A.add(this),this.classList.remove(y),T(this),w(this,i,"m",m).call(this)):(A.delete(this),this.classList.remove(...E),this.classList.add(y))},d=function(){if(!this.control)return;this.setAttribute("role","tooltip"),w(this,r,"f")?.abort(),g(this,r,new AbortController,"f");let{signal:t}=w(this,r,"f");this.addEventListener("mouseleave",this,{signal:t}),this.addEventListener("toggle",this,{signal:t}),this.control.addEventListener("mouseenter",this,{signal:t}),this.control.addEventListener("mouseleave",this,{signal:t}),this.control.addEventListener("focus",this,{signal:t}),this.control.addEventListener("mousedown",this,{signal:t}),this.control.popoverTargetElement?.addEventListener("beforetoggle",this,{signal:t}),this.ownerDocument.addEventListener("focusout",L),this.ownerDocument.addEventListener("focusin",S),this.ownerDocument.addEventListener("keydown",this,{signal:t,capture:!0})},u=function(){if(this.id&&this.control)if("label"===this.type){let t=this.control.getAttribute("aria-labelledby");t=t?t.split(" ").includes(this.id)?`${t}`:`${t} ${this.id}`:this.id,this.control.setAttribute("aria-labelledby",t),this.setAttribute("aria-hidden","true")}else{let t=this.control.getAttribute("aria-describedby");t=t?t.split(" ").includes(this.id)?`${t}`:`${t} ${this.id}`:this.id,this.control.setAttribute("aria-describedby",t)}},f=function(){this.classList.remove(...E);let t=this.direction;"n"===t?(g(this,s,"center","f"),g(this,a,"outside-top","f")):"ne"===t?(g(this,s,"end","f"),g(this,a,"outside-top","f")):"e"===t?(g(this,s,"center","f"),g(this,a,"outside-right","f")):"se"===t?(g(this,s,"end","f"),g(this,a,"outside-bottom","f")):"s"===t?(g(this,s,"center","f"),g(this,a,"outside-bottom","f")):"sw"===t?(g(this,s,"start","f"),g(this,a,"outside-bottom","f")):"w"===t?(g(this,s,"center","f"),g(this,a,"outside-left","f")):"nw"===t&&(g(this,s,"start","f"),g(this,a,"outside-top","f"))},m=function(){if(!this.control||!w(this,l,"f")||!b(this))return;let t=(0,v.uG)(this,this.control,{side:w(this,a,"f"),align:w(this,s,"f"),anchorOffset:0}),e=t.anchorSide,o=t.anchorAlign;this.style.setProperty("--tool-tip-position-top",`${t.top}px`),this.style.setProperty("--tool-tip-position-left",`${t.left}px`);let n="s";n="outside-left"===e?"w":"outside-right"===e?"e":"outside-top"===e?"center"===o?"n":"start"===o?"ne":"nw":"center"===o?"s":"start"===o?"se":"sw",this.classList.add(`tooltip-${n}`)},M.observedAttributes=["data-type","data-direction","id","for"],window.customElements.get("tool-tip")||(window.ToolTipElement=M,window.customElements.define("tool-tip",M))},959136(){var t=class extends Event{oldState;newState;constructor(t,{oldState:e="",newState:o="",...n}={}){super(t,n),this.oldState=String(e||""),this.newState=String(o||"")}},e=new WeakMap;function o(o,n,i){e.set(o,setTimeout(()=>{e.has(o)&&o.dispatchEvent(new t("toggle",{cancelable:!1,oldState:n,newState:i}))},0))}var n=globalThis.ShadowRoot||function(){},i=globalThis.HTMLDialogElement||function(){},r=new WeakMap,s=new WeakMap,a=new WeakMap;function l(t){return a.get(t)||"hidden"}var p=new WeakMap;function c(t,e){return!("auto"!==t.popover&&"manual"!==t.popover||!t.isConnected||e&&"showing"!==l(t)||!e&&"hidden"!==l(t)||t instanceof i&&t.hasAttribute("open"))&&document.fullscreenElement!==t}function h(t){return t?Array.from(s.get(t.ownerDocument)||[]).indexOf(t)+1:0}function d(t){let e=s.get(t);for(let t of e||[])if(t.isConnected)return t;else e.delete(t);return null}function u(t){return"function"==typeof t.getRootNode?t.getRootNode():t.parentNode?u(t.parentNode):t}function f(t){for(;t;){if(t instanceof HTMLElement&&"auto"===t.popover&&"showing"===a.get(t))return t;if((t=t instanceof Element&&t.assignedSlot||t.parentElement||u(t))instanceof n&&(t=t.host),t instanceof Document)return}}var m=new WeakMap;function v(e){if(!c(e,!1))return;let i=e.ownerDocument;if(!e.dispatchEvent(new t("beforetoggle",{cancelable:!0,oldState:"closed",newState:"open"}))||!c(e,!1))return;let l=!1;if("auto"===e.popover){let t=e.getAttribute("popover");if(b(function(t){let e=new Map,o=0;for(let n of s.get(t.ownerDocument)||[])e.set(n,o),o+=1;e.set(t,o),o+=1;let n=null;return!function(t){let o=f(t);if(null===o)return;let i=e.get(o);(null===n||e.get(n)<i)&&(n=o)}(t.parentElement||u(t)),n}(e)||i,!1,!0),t!==e.getAttribute("popover")||!c(e,!1))return}d(i)||(l=!0),m.delete(e);let h=i.activeElement;e.classList.add(":popover-open"),a.set(e,"showing"),r.has(i)||r.set(i,new Set),r.get(i).add(e),(function(t){if(t.shadowRoot&&!0!==t.shadowRoot.delegatesFocus)return null;let e=t;e.shadowRoot&&(e=e.shadowRoot);let o=e.querySelector("[autofocus]");if(o)return o;for(let t of e.querySelectorAll("slot"))for(let e of t.assignedElements({flatten:!0}))if(e.hasAttribute("autofocus"))return e;else if(o=e.querySelector("[autofocus]"))return o;let i=t.ownerDocument.createTreeWalker(e,NodeFilter.SHOW_ELEMENT),r=i.currentNode;for(;r;){var s;if(!((s=r).hidden||s instanceof n||(s instanceof HTMLButtonElement||s instanceof HTMLInputElement||s instanceof HTMLSelectElement||s instanceof HTMLTextAreaElement||s instanceof HTMLOptGroupElement||s instanceof HTMLOptionElement||s instanceof HTMLFieldSetElement)&&s.disabled||s instanceof HTMLInputElement&&"hidden"===s.type||s instanceof HTMLAnchorElement&&""===s.href)&&"number"==typeof s.tabIndex&&-1!==s.tabIndex)return r;r=i.nextNode()}})(e)?.focus(),"auto"===e.popover&&(s.has(i)||s.set(i,new Set),s.get(i).add(e),L(p.get(e),!0)),l&&h&&"auto"===e.popover&&m.set(e,h),o(e,"closed","open")}function w(e,n=!1,i=!1){if(!c(e,!0))return;let l=e.ownerDocument;if("auto"===e.popover&&(b(e,n,i),!c(e,!0))||(L(p.get(e),!1),p.delete(e),i&&(e.dispatchEvent(new t("beforetoggle",{oldState:"open",newState:"closed"})),!c(e,!0))))return;r.get(l)?.delete(e),s.get(l)?.delete(e),e.classList.remove(":popover-open"),a.set(e,"hidden"),i&&o(e,"open","closed");let h=m.get(e);h&&(m.delete(e),n&&h.focus())}function g(t,e=!1,o=!1){let n=d(t);for(;n;)w(n,e,o),n=d(t)}function b(t,e,o){let n=t.ownerDocument||t;if(t instanceof Document)return g(n,e,o);let i=null,r=!1;for(let e of s.get(n)||[])if(e===t)r=!0;else if(r){i=e;break}if(!r)return g(n,e,o);for(;i&&"showing"===l(i)&&s.get(n)?.size;)w(i,e,o)}var y=new WeakMap;function E(t){let e,o;if(!t.isTrusted)return;let i=t.composedPath()[0];if(!i)return;let r=i.ownerDocument;if(!d(r))return;let s=(e=f(i),o=function(t){for(;t;){let e=t.popoverTargetElement;if(e instanceof HTMLElement)return e;if((t=t.parentElement||u(t))instanceof n&&(t=t.host),t instanceof Document)return}}(i),h(e)>h(o)?e:o);if(s&&"pointerdown"===t.type)y.set(r,s);else if("pointerup"===t.type){let t=y.get(r)===s;y.delete(r),t&&b(s||r,!1,!0)}}var T=new WeakMap;function L(t,e=!1){if(!t)return;T.has(t)||T.set(t,t.getAttribute("aria-expanded"));let o=t.popoverTargetElement;if(o instanceof HTMLElement&&"auto"===o.popover)t.setAttribute("aria-expanded",String(e));else{let e=T.get(t);e?t.setAttribute("aria-expanded",e):t.removeAttribute("aria-expanded")}}var S=globalThis.ShadowRoot||function(){};function k(t,e,o){let n=t[e];Object.defineProperty(t,e,{value(t){return n.call(this,o(t))}})}var A=/(^|[^\\]):popover-open\b/g,M=null;function x(t){let e,o=(e="function"==typeof globalThis.CSSLayerBlockRule,`
${e?"@layer popover-polyfill {":""}
  :where([popover]) {
    position: fixed;
    z-index: 2147483647;
    inset: 0;
    padding: 0.25em;
    width: fit-content;
    height: fit-content;
    border-width: initial;
    border-color: initial;
    border-image: initial;
    border-style: solid;
    background-color: canvas;
    color: canvastext;
    overflow: auto;
    margin: auto;
  }

  :where([popover]:not(.\\:popover-open)) {
    display: none;
  }

  :where(dialog[popover].\\:popover-open) {
    display: block;
  }

  :where(dialog[popover][open]) {
    display: revert;
  }

  :where([anchor].\\:popover-open) {
    inset: auto;
  }

  :where([anchor]:popover-open) {
    inset: auto;
  }

  @supports not (background-color: canvas) {
    :where([popover]) {
      background-color: white;
      color: black;
    }
  }

  @supports (width: -moz-fit-content) {
    :where([popover]) {
      width: -moz-fit-content;
      height: -moz-fit-content;
    }
  }

  @supports not (inset: 0) {
    :where([popover]) {
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
    }
  }
${e?"}":""}
`);if(null===M)try{(M=new CSSStyleSheet).replaceSync(o)}catch{M=!1}if(!1===M){let e=document.createElement("style");e.textContent=o,t instanceof Document?t.head.prepend(e):t.prepend(e)}else t.adoptedStyleSheets=[M,...t.adoptedStyleSheets]}"u">typeof HTMLElement&&"object"==typeof HTMLElement.prototype&&"popover"in HTMLElement.prototype||function(){var e;if("u"<typeof window)return;function o(t){return t?.includes(":popover-open")&&(t=t.replace(A,"$1.\\:popover-open")),t}window.ToggleEvent=window.ToggleEvent||t,k(Document.prototype,"querySelector",o),k(Document.prototype,"querySelectorAll",o),k(Element.prototype,"querySelector",o),k(Element.prototype,"querySelectorAll",o),k(Element.prototype,"matches",o),k(Element.prototype,"closest",o),k(DocumentFragment.prototype,"querySelectorAll",o),Object.defineProperties(HTMLElement.prototype,{popover:{enumerable:!0,configurable:!0,get(){if(!this.hasAttribute("popover"))return null;let t=(this.getAttribute("popover")||"").toLowerCase();return""===t||"auto"==t?"auto":"manual"},set(t){null===t?this.removeAttribute("popover"):this.setAttribute("popover",t)}},showPopover:{enumerable:!0,configurable:!0,value(){v(this)}},hidePopover:{enumerable:!0,configurable:!0,value(){w(this,!0,!0)}},togglePopover:{enumerable:!0,configurable:!0,value(t){"showing"===a.get(this)&&void 0===t||!1===t?w(this,!0,!0):(void 0===t||!0===t)&&v(this)}}});let n=Element.prototype.attachShadow;n&&Object.defineProperties(Element.prototype,{attachShadow:{enumerable:!0,configurable:!0,writable:!0,value(t){let e=n.call(this,t);return x(e),e}}});let i=HTMLElement.prototype.attachInternals;i&&Object.defineProperties(HTMLElement.prototype,{attachInternals:{enumerable:!0,configurable:!0,writable:!0,value(){let t=i.call(this);return t.shadowRoot&&x(t.shadowRoot),t}}});let r=new WeakMap;function s(t){Object.defineProperties(t.prototype,{popoverTargetElement:{enumerable:!0,configurable:!0,set(t){if(null===t)this.removeAttribute("popovertarget"),r.delete(this);else if(t instanceof Element)this.setAttribute("popovertarget",""),r.set(this,t);else throw TypeError("popoverTargetElement must be an element or null")},get(){if("button"!==this.localName&&"input"!==this.localName||"input"===this.localName&&"reset"!==this.type&&"image"!==this.type&&"button"!==this.type||this.disabled||this.form&&"submit"===this.type)return null;let t=r.get(this);if(t&&t.isConnected)return t;if(t&&!t.isConnected)return r.delete(this),null;let e=u(this),o=this.getAttribute("popovertarget");return(e instanceof Document||e instanceof S)&&o&&e.getElementById(o)||null}},popoverTargetAction:{enumerable:!0,configurable:!0,get(){let t=(this.getAttribute("popovertargetaction")||"").toLowerCase();return"show"===t||"hide"===t?t:"toggle"},set(t){this.setAttribute("popovertargetaction",t)}}})}s(HTMLButtonElement),s(HTMLInputElement);(e=document).addEventListener("click",t=>{let e=t.composedPath(),o=e[0];if(!(o instanceof Element)||o?.shadowRoot)return;let n=u(o);if(!(n instanceof S||n instanceof Document))return;let i=e.find(t=>t.matches?.("[popovertargetaction],[popovertarget]"));if(i){!function(t){let e=t.popoverTargetElement;if(!(e instanceof HTMLElement))return;let o=l(e);"show"===t.popoverTargetAction&&"showing"===o||("hide"!==t.popoverTargetAction||"hidden"!==o)&&("showing"===o?w(e,!0,!0):c(e,!1)&&(p.set(e,t),v(e)))}(i),t.preventDefault();return}}),e.addEventListener("keydown",t=>{let e=t.key,o=t.target;!t.defaultPrevented&&o&&("Escape"===e||"Esc"===e)&&b(o.ownerDocument,!0,!0)}),e.addEventListener("pointerdown",E),e.addEventListener("pointerup",E),x(document)}()}};
//# sourceMappingURL=58494-8fde42aa50c63758-a6d2a96c44810dc9.js.map