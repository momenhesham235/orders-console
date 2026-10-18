import { useEffect, useRef, type ReactNode } from "react";

interface ModalProps {
  labelledBy: string;
  /** Escape or a backdrop click. The owner decides whether to close (e.g. after confirming). */
  onRequestClose: () => void;
  children: ReactNode;
}

// Native <dialog> opened with showModal(): focus trap, Escape and inert background for free.
// Mount it to open it, unmount it to close it.
export function Modal({ labelledBy, onRequestClose, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pressStartedOnBackdrop = useRef(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-labelledby={labelledBy}
      onCancel={(event) => {
        event.preventDefault();
        onRequestClose();
      }}
      // The content fills the dialog, so a target of the dialog itself means the backdrop.
      // Both press and release must be on it: selecting text in an input and releasing the
      // mouse outside must not count as a backdrop click.
      onMouseDown={(event) => {
        pressStartedOnBackdrop.current = event.target === event.currentTarget;
      }}
      onClick={(event) => {
        if (pressStartedOnBackdrop.current && event.target === event.currentTarget) onRequestClose();
      }}
    >
      {children}
    </dialog>
  );
}
