"use client";

import { type KeyboardEvent, useRef } from "react";
import { cn } from "@/lib/utils";

type Tab<T extends string> = { id: T; label: string };

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

/** Connexion / Inscription: switches the card's content without leaving the page. */
export function AuthTabs<T extends string>({ tabs, value, onChange, label, idBase }: AuthTabsProps<T>) {
  const buttons = useRef<Record<string, HTMLButtonElement | null>>({});

  const select = (index: number) => {
    const next = tabs[(index + tabs.length) % tabs.length];
    onChange(next.id);
    buttons.current[next.id]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent, index: number) => {
    if (event.key === "ArrowRight") select(index + 1);
    else if (event.key === "ArrowLeft") select(index - 1);
    else if (event.key === "Home") select(0);
    else if (event.key === "End") select(tabs.length - 1);
    else return;
    event.preventDefault();
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
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              "relative -mb-px cursor-pointer px-4 py-3 text-s font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-white/60 motion-reduce:transition-none",
              selected ? "text-primary-200" : "text-white hover:text-primary",
            )}
          >
            {tab.label}
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
