"use client";

import { type KeyboardEvent, useRef } from "react";
import { cn } from "@/lib/utils";

type Tab<T extends string> = { id: T; label: string };

// Generic over the tab ids: `onChange` receives exactly "login" | "signup" here, not any string.
type AuthTabsProps<T extends string> = {
  tabs: readonly Tab<T>[];
  value: T;
  onChange: (id: T) => void;
  label: string;
  /** Prefix shared by tab and panel ids, so each panel can point back at its tab. */
  idBase: string;
};

export const tabId = (base: string, id: string) => `${base}-tab-${id}`;
export const panelId = (base: string, id: string) => `${base}-panel-${id}`;

/**
 * Connexion / Inscription: switches the card's content without leaving the page.
 * Follows the WAI-ARIA "tabs" pattern: role="tablist" / "tab" / "tabpanel" (the panels are in LoginCard), a
 * "roving" tab stop (only the selected tab can be reached with Tab) and arrow keys to move between tabs.
 */
export function AuthTabs<T extends string>({ tabs, value, onChange, label, idBase }: AuthTabsProps<T>) {
  const buttons = useRef<Record<string, HTMLButtonElement | null>>({}); // to move the focus with the arrows

  const select = (index: number) => {
    const next = tabs[(index + tabs.length) % tabs.length]; // wraps: the right arrow on the last tab goes to the first
    onChange(next.id);
    buttons.current[next.id]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent, index: number) => {
    if (event.key === "ArrowRight") select(index + 1);
    else if (event.key === "ArrowLeft") select(index - 1);
    else if (event.key === "Home") select(0);
    else if (event.key === "End") select(tabs.length - 1);
    else return; // any other key keeps its default behaviour
    event.preventDefault(); // we handled it: no page scroll
  };

  return (
    <div role="tablist" aria-label={label} className="flex justify-center border-b border-white/20">
      {tabs.map((tab, index) => {
        const selected = tab.id === value;
        return (
          <button
            key={tab.id}
            ref={(element) => {
              buttons.current[tab.id] = element;
            }}
            type="button"
            role="tab"
            id={tabId(idBase, tab.id)}
            aria-selected={selected}
            aria-controls={panelId(idBase, tab.id)}
            // Roving tabindex: one tab stop for the whole tablist, arrows do the rest.
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              "relative -mb-px cursor-pointer px-4 py-3 text-s font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-white/60 motion-reduce:transition-none",
              selected ? "text-primary-200" : "text-white hover:text-primary",
            )}
          >
            {tab.label}
            {/* The purple underline of the active tab; it sits over the grey line of the tablist (-mb-px). */}
            <span
              aria-hidden
              className={cn(
                "absolute inset-x-0 bottom-0 h-0.5 bg-primary-300 transition-opacity duration-200 motion-reduce:transition-none",
                selected ? "opacity-100" : "opacity-0",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
