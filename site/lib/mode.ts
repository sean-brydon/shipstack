// The "With berth / Without berth" switch. The choice lives on <html> as
// data-mode, set before first paint by modeScript, so CSS shows the right
// blocks with no flash. With JS off there is no data-mode, and both kinds of
// block show, each with its label.
export type Mode = 'berth' | 'noberth';
export const MODE_KEY = 'shipstack.mode';
export const MODE_EVENT = 'shipstack:mode';
export const DEFAULT_MODE: Mode = 'noberth';

export const modeScript = `(function(){var m;try{m=localStorage.getItem(${JSON.stringify(MODE_KEY)})}catch(e){}document.documentElement.setAttribute('data-mode',m==='berth'?'berth':${JSON.stringify(DEFAULT_MODE)})})();`;
