import { useState } from 'react';
import {
  useFloating, useHover, useFocus, useClick, useDismiss, useRole, useInteractions,
  FloatingPortal, offset, flip, shift, autoUpdate,
} from '@floating-ui/react';

/**
 * InfoTooltip — a "?" icon that opens a spacious, readable explainer card (portal, so it never
 * clips inside the profile card's overflow-hidden). Shared by the campaign-finance components.
 *
 * Props:
 *   content — { title: string, paragraphs: Array<string | JSX> }
 *   label   — accessible label for the trigger (default "More information")
 */
export default function InfoTooltip({ content, label = 'More information' }) {
  const [isOpen, setIsOpen] = useState(false);
  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'bottom-start',
    middleware: [offset(8), flip(), shift({ padding: 12 })],
    whileElementsMounted: autoUpdate,
  });
  const hover = useHover(context, { move: false });
  const focus = useFocus(context);
  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'dialog' });
  const { getReferenceProps, getFloatingProps } = useInteractions([hover, focus, click, dismiss, role]);

  return (
    <>
      <button
        type="button"
        ref={refs.setReference}
        aria-label={label}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-gray-400 dark:border-gray-500 text-gray-500 dark:text-gray-400 text-[10px] font-semibold leading-none hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-600 dark:hover:border-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        {...getReferenceProps()}
      >
        ?
      </button>
      {isOpen && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={{ ...floatingStyles, zIndex: 70, width: '320px', maxWidth: 'calc(100vw - 24px)' }}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-5"
            {...getFloatingProps()}
          >
            <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3" style={{ fontFamily: "'Manrope', sans-serif" }}>
              {content.title}
            </h5>
            <div className="space-y-3">
              {content.paragraphs.map((p, i) => (
                <p key={i} className="text-[13px] leading-relaxed text-gray-600 dark:text-gray-300">{p}</p>
              ))}
            </div>
          </div>
        </FloatingPortal>
      )}
    </>
  );
}
