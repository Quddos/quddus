// Runs while the wrapper is being parsed, so the right palette paints first.
export function ThemeScript() {
  const js = `(function(){try{var e=document.currentScript.parentElement;var t=localStorage.getItem('career-theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}e.setAttribute('data-theme',t);}catch(_){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}
