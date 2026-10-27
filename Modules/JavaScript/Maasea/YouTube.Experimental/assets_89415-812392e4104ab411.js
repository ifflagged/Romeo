performance.mark("js-parse-end:89415-812392e4104ab411.js");
"use strict";(globalThis.rspackChunk_github_ui_github_ui=globalThis.rspackChunk_github_ui_github_ui||[]).push([[89415],{789272(){if(void 0!==globalThis.Element&&void 0!==globalThis.Document&&(!("ariaNotify"in Element.prototype)||!("ariaNotify"in Document.prototype))){let e=`${Date.now()}`;try{e=crypto.randomUUID()}catch{}let t=Symbol(),o=`live-region-${e}`;class n{element;message;priority="normal";constructor({element:e,message:t,priority:o="normal"}){this.element=e,this.message=t,this.priority=o}#e(){return this.element.isConnected&&!this.element.closest("[inert]")&&(this.element.ownerDocument.querySelector(CSS.supports("selector(:modal)")?":modal":"dialog[open]")?.contains(this.element)??!0)}async announce(){if(!this.#e())return;let e=this.element.closest("dialog")||this.element.closest("[role='dialog']")||this.element.getRootNode();(!e||e instanceof Document)&&(e=document.body);let n=e.querySelector(o);n||(n=document.createElement(o),e.append(n)),await new Promise(e=>setTimeout(e,250)),n.handleMessage(t,this.message)}}let r=new class{#t=[];#o;enqueue(e){let{priority:t}=e;if("high"===t){let t=this.#t.findLastIndex(e=>"high"===e.priority);this.#t.splice(t+1,0,e)}else this.#t.push(e);this.#o||this.#n()}async #n(){this.#o=this.#t.shift(),this.#o&&(await this.#o.announce(),this.#n())}};class i extends HTMLElement{#r=this.attachShadow({mode:"closed"});connectedCallback(){this.ariaLive="polite",this.ariaAtomic="true",this.style.marginLeft="-1px",this.style.marginTop="-1px",this.style.position="absolute",this.style.width="1px",this.style.height="1px",this.style.overflow="hidden",this.style.clipPath="rect(0 0 0 0)",this.style.overflowWrap="normal"}handleMessage(e=null,o=""){t===e&&(this.#r.textContent==o&&(o+="\xa0"),this.#r.textContent=o)}}customElements.define(o,i),"ariaNotify"in Element.prototype||(Element.prototype.ariaNotify=function(e,{priority:t="normal"}={}){r.enqueue(new n({element:this,message:e,priority:t}))}),"ariaNotify"in Document.prototype||(Document.prototype.ariaNotify=function(e,{priority:t="normal"}={}){r.enqueue(new n({element:this.documentElement,message:e,priority:t}))})}},905225(e,t,o){function n(...e){return JSON.stringify(e,(e,t)=>"object"==typeof t?t:String(t))}function r(e,t={}){let{hash:o=n,cache:i=new Map}=t;return function(...t){let n=o.apply(this,t);if(i.has(n))return i.get(n);let r=e.apply(this,t);return r instanceof Promise&&(r=r.catch(e=>{throw i.delete(n),e})),i.set(n,r),r}}o.d(t,{A:()=>r,G:()=>n})},200913(e,t,o){o.r(t);var n=class extends Event{oldState;newState;constructor(e,{oldState:t="",newState:o="",...n}={}){super(e,n),this.oldState=String(t||""),this.newState=String(o||"")}},r=new WeakMap;function i(e,t,o){r.set(e,setTimeout(()=>{r.has(e)&&e.dispatchEvent(new n("toggle",{cancelable:!1,oldState:t,newState:o}))},0))}var l=globalThis.ShadowRoot||function(){},a=globalThis.HTMLDialogElement||function(){},s=new WeakMap,u=new WeakMap,p=new WeakMap;function c(e){return p.get(e)||"hidden"}var h=new WeakMap;function d(e,t){return!("auto"!==e.popover&&"manual"!==e.popover||!e.isConnected||t&&"showing"!==c(e)||!t&&"hidden"!==c(e)||e instanceof a&&e.hasAttribute("open"))&&document.fullscreenElement!==e}function f(e){return e?Array.from(u.get(e.ownerDocument)||[]).indexOf(e)+1:0}function m(e){let t=u.get(e);for(let e of t||[])if(e.isConnected)return e;else t.delete(e);return null}function g(e){return"function"==typeof e.getRootNode?e.getRootNode():e.parentNode?g(e.parentNode):e}function v(e){for(;e;){if(e instanceof HTMLElement&&"auto"===e.popover&&"showing"===p.get(e))return e;if((e=e instanceof Element&&e.assignedSlot||e.parentElement||g(e))instanceof l&&(e=e.host),e instanceof Document)return}}var w=new WeakMap;function y(e){if(!d(e,!1))return;let t=e.ownerDocument;if(!e.dispatchEvent(new n("beforetoggle",{cancelable:!0,oldState:"closed",newState:"open"}))||!d(e,!1))return;let o=!1;if("auto"===e.popover){let o=e.getAttribute("popover");if(S(function(e){let t=new Map,o=0;for(let n of u.get(e.ownerDocument)||[])t.set(n,o),o+=1;t.set(e,o),o+=1;let n=null;return!function(e){let o=v(e);if(null===o)return;let r=t.get(o);(null===n||t.get(n)<r)&&(n=o)}(e.parentElement||g(e)),n}(e)||t,!1,!0),o!==e.getAttribute("popover")||!d(e,!1))return}m(t)||(o=!0),w.delete(e);let r=t.activeElement;e.classList.add(":popover-open"),p.set(e,"showing"),s.has(t)||s.set(t,new Set),s.get(t).add(e),(function(e){if(e.shadowRoot&&!0!==e.shadowRoot.delegatesFocus)return null;let t=e;t.shadowRoot&&(t=t.shadowRoot);let o=t.querySelector("[autofocus]");if(o)return o;for(let e of t.querySelectorAll("slot"))for(let t of e.assignedElements({flatten:!0}))if(t.hasAttribute("autofocus"))return t;else if(o=t.querySelector("[autofocus]"))return o;let n=e.ownerDocument.createTreeWalker(t,NodeFilter.SHOW_ELEMENT),r=n.currentNode;for(;r;){var i;if(!((i=r).hidden||i instanceof l||(i instanceof HTMLButtonElement||i instanceof HTMLInputElement||i instanceof HTMLSelectElement||i instanceof HTMLTextAreaElement||i instanceof HTMLOptGroupElement||i instanceof HTMLOptionElement||i instanceof HTMLFieldSetElement)&&i.disabled||i instanceof HTMLInputElement&&"hidden"===i.type||i instanceof HTMLAnchorElement&&""===i.href)&&"number"==typeof i.tabIndex&&-1!==i.tabIndex)return r;r=n.nextNode()}})(e)?.focus(),"auto"===e.popover&&(u.has(t)||u.set(t,new Set),u.get(t).add(e),A(h.get(e),!0)),o&&r&&"auto"===e.popover&&w.set(e,r),i(e,"closed","open")}function b(e,t=!1,o=!1){if(!d(e,!0))return;let r=e.ownerDocument;if("auto"===e.popover&&(S(e,t,o),!d(e,!0))||(A(h.get(e),!1),h.delete(e),o&&(e.dispatchEvent(new n("beforetoggle",{oldState:"open",newState:"closed"})),!d(e,!0))))return;s.get(r)?.delete(e),u.get(r)?.delete(e),e.classList.remove(":popover-open"),p.set(e,"hidden"),o&&i(e,"open","closed");let l=w.get(e);l&&(w.delete(e),t&&l.focus())}function E(e,t=!1,o=!1){let n=m(e);for(;n;)b(n,t,o),n=m(e)}function S(e,t,o){let n=e.ownerDocument||e;if(e instanceof Document)return E(n,t,o);let r=null,i=!1;for(let t of u.get(n)||[])if(t===e)i=!0;else if(i){r=t;break}if(!i)return E(n,t,o);for(;r&&"showing"===c(r)&&u.get(n)?.size;)b(r,t,o)}var T=new WeakMap;function M(e){let t,o;if(!e.isTrusted)return;let n=e.composedPath()[0];if(!n)return;let r=n.ownerDocument;if(!m(r))return;let i=(t=v(n),o=function(e){for(;e;){let t=e.popoverTargetElement;if(t instanceof HTMLElement)return t;if((e=e.parentElement||g(e))instanceof l&&(e=e.host),e instanceof Document)return}}(n),f(t)>f(o)?t:o);if(i&&"pointerdown"===e.type)T.set(r,i);else if("pointerup"===e.type){let e=T.get(r)===i;T.delete(r),e&&S(i||r,!1,!0)}}var L=new WeakMap;function A(e,t=!1){if(!e)return;L.has(e)||L.set(e,e.getAttribute("aria-expanded"));let o=e.popoverTargetElement;if(o instanceof HTMLElement&&"auto"===o.popover)e.setAttribute("aria-expanded",String(t));else{let t=L.get(e);t?e.setAttribute("aria-expanded",t):e.removeAttribute("aria-expanded")}}var D=globalThis.ShadowRoot||function(){};function k(){return"u">typeof HTMLElement&&"object"==typeof HTMLElement.prototype&&"popover"in HTMLElement.prototype}function x(){return!!(document.body?.showPopover&&!/native code/i.test(document.body.showPopover.toString()))}function H(e,t,o){let n=e[t];Object.defineProperty(e,t,{value(e){return n.call(this,o(e))}})}var N=/(^|[^\\]):popover-open\b/g,q=null;function P(e){let t,o=(t="function"==typeof globalThis.CSSLayerBlockRule,`
${t?"@layer popover-polyfill {":""}
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
${t?"}":""}
`);if(null===q)try{(q=new CSSStyleSheet).replaceSync(o)}catch{q=!1}if(!1===q){let t=document.createElement("style");t.textContent=o,e instanceof Document?e.head.prepend(t):e.prepend(t)}else e.adoptedStyleSheets=[q,...e.adoptedStyleSheets]}function C(){var e;if("u"<typeof window)return;function t(e){return e?.includes(":popover-open")&&(e=e.replace(N,"$1.\\:popover-open")),e}window.ToggleEvent=window.ToggleEvent||n,H(Document.prototype,"querySelector",t),H(Document.prototype,"querySelectorAll",t),H(Element.prototype,"querySelector",t),H(Element.prototype,"querySelectorAll",t),H(Element.prototype,"matches",t),H(Element.prototype,"closest",t),H(DocumentFragment.prototype,"querySelectorAll",t),Object.defineProperties(HTMLElement.prototype,{popover:{enumerable:!0,configurable:!0,get(){if(!this.hasAttribute("popover"))return null;let e=(this.getAttribute("popover")||"").toLowerCase();return""===e||"auto"==e?"auto":"manual"},set(e){null===e?this.removeAttribute("popover"):this.setAttribute("popover",e)}},showPopover:{enumerable:!0,configurable:!0,value(){y(this)}},hidePopover:{enumerable:!0,configurable:!0,value(){b(this,!0,!0)}},togglePopover:{enumerable:!0,configurable:!0,value(e){"showing"===p.get(this)&&void 0===e||!1===e?b(this,!0,!0):(void 0===e||!0===e)&&y(this)}}});let o=Element.prototype.attachShadow;o&&Object.defineProperties(Element.prototype,{attachShadow:{enumerable:!0,configurable:!0,writable:!0,value(e){let t=o.call(this,e);return P(t),t}}});let r=HTMLElement.prototype.attachInternals;r&&Object.defineProperties(HTMLElement.prototype,{attachInternals:{enumerable:!0,configurable:!0,writable:!0,value(){let e=r.call(this);return e.shadowRoot&&P(e.shadowRoot),e}}});let i=new WeakMap;function l(e){Object.defineProperties(e.prototype,{popoverTargetElement:{enumerable:!0,configurable:!0,set(e){if(null===e)this.removeAttribute("popovertarget"),i.delete(this);else if(e instanceof Element)this.setAttribute("popovertarget",""),i.set(this,e);else throw TypeError("popoverTargetElement must be an element or null")},get(){if("button"!==this.localName&&"input"!==this.localName||"input"===this.localName&&"reset"!==this.type&&"image"!==this.type&&"button"!==this.type||this.disabled||this.form&&"submit"===this.type)return null;let e=i.get(this);if(e&&e.isConnected)return e;if(e&&!e.isConnected)return i.delete(this),null;let t=g(this),o=this.getAttribute("popovertarget");return(t instanceof Document||t instanceof D)&&o&&t.getElementById(o)||null}},popoverTargetAction:{enumerable:!0,configurable:!0,get(){let e=(this.getAttribute("popovertargetaction")||"").toLowerCase();return"show"===e||"hide"===e?e:"toggle"},set(e){this.setAttribute("popovertargetaction",e)}}})}l(HTMLButtonElement),l(HTMLInputElement);(e=document).addEventListener("click",e=>{let t=e.composedPath(),o=t[0];if(!(o instanceof Element)||o?.shadowRoot)return;let n=g(o);if(!(n instanceof D||n instanceof Document))return;let r=t.find(e=>e.matches?.("[popovertargetaction],[popovertarget]"));if(r){!function(e){let t=e.popoverTargetElement;if(!(t instanceof HTMLElement))return;let o=c(t);"show"===e.popoverTargetAction&&"showing"===o||("hide"!==e.popoverTargetAction||"hidden"!==o)&&("showing"===o?b(t,!0,!0):d(t,!1)&&(h.set(t,e),y(t)))}(r),e.preventDefault();return}}),e.addEventListener("keydown",e=>{let t=e.key,o=e.target;!e.defaultPrevented&&o&&("Escape"===t||"Esc"===t)&&S(o.ownerDocument,!0,!0)}),e.addEventListener("pointerdown",M),e.addEventListener("pointerup",M),P(document)}o.d(t,{apply:()=>C,injectStyles:()=>P,isPolyfilled:()=>x,isSupported:()=>k})}}]);
//# sourceMappingURL=89415-812392e4104ab411-547fff716fa5e63f.js.map