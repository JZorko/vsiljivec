import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

interface HelpDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpDialog({ isOpen, onClose }: HelpDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const getFocusable = () =>
      dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) || [];

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) return;

      const focusable = getFocusable();
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    getFocusable()?.[0]?.focus();
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-10 bg-slate-900/30 dark:bg-black/50 backdrop-blur-sm p-4 flex items-center justify-center"
    >
      <div
        ref={dialogRef}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-dialog-title"
        aria-describedby="help-dialog-description"
        className="w-full max-w-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl p-6 space-y-5 animation-scale-in"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="help-dialog-title" className="text-2xl font-black text-slate-900 dark:text-slate-100">
              Kako igrati
            </h2>
            <p id="help-dialog-description" className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Hitra družabna igra socialne dedukcije.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200 text-2xl leading-none"
            aria-label="Zapri pomoč"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <div className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl p-4 space-y-2">
          <h3 className="font-bold text-indigo-600 dark:text-indigo-400">Kaj je Vsiljivec?</h3>
          <p className="text-slate-600 dark:text-slate-300 text-sm leading-6">
            Večina igralcev dobi isto skrivno besedo, nekateri pa dobijo podobno besedo ali pa nobene. Cilj skupine
            je odkriti vsiljivca, cilj vsiljivca pa je, da ostane neodkrit.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="font-bold text-indigo-600 dark:text-indigo-400">Vloge</h3>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li>
              <span className="font-semibold text-slate-900 dark:text-slate-100">Večina:</span> prejme glavno besedo.
            </li>
            <li>
              <span className="font-semibold text-slate-900 dark:text-slate-100">Zmeden:</span> prejme podobno, a drugačno besedo.
            </li>
            <li>
              <span className="font-semibold text-slate-900 dark:text-slate-100">Vsiljivec:</span> ne prejme nobene besede in mora
              improvizirati.
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="font-bold text-indigo-600 dark:text-indigo-400">Pravila</h3>
          <ol className="space-y-2 text-sm text-slate-600 dark:text-slate-300 list-decimal list-inside">
            <li>Dodajte vse igralce, po želji izberite temo in začnite igro.</li>
            <li>Vsak igralec po vrsti vzame telefon, razkrije svojo besedo in ga poda naprej.</li>
            <li>Ko vsi vidijo svojo vlogo, vsak pove eno asociacijo na svojo besedo.</li>
            <li>Skupaj glasujte, kdo je po vašem mnenju vsiljivec.</li>
            <li>Po glasovanju začnite novo rundo.</li>
          </ol>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-2xl font-bold transition-colors shadow-lg"
        >
          Zapri pomoč
        </button>
      </div>
    </div>
  );
}
