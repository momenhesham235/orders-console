import type { ReactNode } from "react";

const ICONS = {
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  inbox: (
    <>
      <path d="M3 13h5l1.5 3h5L16 13h5" />
      <path d="M5.5 5h13L21 13v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6z" />
    </>
  ),
  question: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6" />
      <path d="M12 17.5v.01" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3 2 20h20z" />
      <path d="M12 10v4" />
      <path d="M12 17.5v.01" />
    </>
  ),
};

interface StateMessageProps {
  icon: keyof typeof ICONS;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  tone?: "neutral" | "danger";
}

/** Full-panel empty / error state, sized like the panel it replaces so the page does not jump. */
export function StateMessage({ icon, title, description, action, tone = "neutral" }: StateMessageProps) {
  return (
    <div className={`state-message state-message--${tone}`} role={tone === "danger" ? "alert" : "status"}>
      <svg className="state-message-icon" viewBox="0 0 24 24" aria-hidden="true">
        {ICONS[icon]}
      </svg>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}
