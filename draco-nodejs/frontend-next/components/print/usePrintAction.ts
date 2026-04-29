const stripSuffix = (title: string): string => {
  const sep = ' | ';
  const i = title.indexOf(sep);
  if (i === -1) return title;
  return title.slice(0, i).trim();
};

let savedTitle: string | null = null;
let listenerAttached = false;

const restore = () => {
  if (typeof window === 'undefined') return;
  if (savedTitle !== null) document.title = savedTitle;
  savedTitle = null;
  window.removeEventListener('afterprint', restore);
  listenerAttached = false;
};

const triggerPrint = () => {
  if (typeof window === 'undefined') return;
  if (savedTitle === null) {
    savedTitle = document.title;
    const cleaned = stripSuffix(savedTitle);
    if (cleaned !== savedTitle) document.title = cleaned;
  }
  if (!listenerAttached) {
    window.addEventListener('afterprint', restore);
    listenerAttached = true;
  }
  window.print();
};

const usePrintAction = () => {
  return { triggerPrint };
};

export default usePrintAction;
