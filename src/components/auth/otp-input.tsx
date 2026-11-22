"use client";

import {
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import { OTP_LENGTH } from "@/lib/schemas";
import { cn } from "@/lib/utils";

export type OtpInputHandle = { focus: () => void };

type OtpInputProps = {
  /** One entry per cell: "" or a single digit. */
  value: string[];
  onChange: (value: string[]) => void;
  /** Called as soon as the last cell is filled. */
  onComplete: (code: string) => void;
  groupLabel: string;
  cellLabel: (position: number) => string;
  /** While a code is being checked: cells stay put and keep the focus, but can't be edited. */
  busy?: boolean;
  invalid?: boolean;
  describedBy?: string;
};

export const emptyOtp = () => Array.from({ length: OTP_LENGTH }, () => "");

/**
 * Six cells for a six-digit code. Typing moves on to the next cell, backspace goes back, and a pasted code
 * is spread over the cells whichever one has the focus (a full code always starts from the first cell).
 */
export const OtpInput = forwardRef<OtpInputHandle, OtpInputProps>(function OtpInput(
  { value, onChange, onComplete, groupLabel, cellLabel, busy, invalid, describedBy },
  handle,
) {
  const cells = useRef<(HTMLInputElement | null)[]>([]);

  const focusCell = (index: number) => {
    const cell = cells.current[Math.min(Math.max(index, 0), OTP_LENGTH - 1)];
    cell?.focus();
    cell?.select();
  };

  useImperativeHandle(handle, () => ({ focus: () => focusCell(0) }));

  /** Writes `digits` from cell `start` on, then moves the focus on, or submits when the code is complete. */
  const fill = (digits: string, start: number) => {
    const next = [...value];
    let index = start;
    for (const digit of digits) {
      if (index >= OTP_LENGTH) break;
      next[index] = digit;
      index += 1;
    }
    onChange(next);
    if (next.every(Boolean)) onComplete(next.join(""));
    else focusCell(index);
  };

  const handleChange = (index: number, event: ChangeEvent<HTMLInputElement>) => {
    const digits = event.target.value.replace(/\D/g, "");

    if (!digits) {
      const next = [...value];
      next[index] = "";
      onChange(next);
    } else if (digits.length >= OTP_LENGTH) {
      fill(digits.slice(0, OTP_LENGTH), 0); // a whole code at once, e.g. the phone's one-time-code autofill
    } else if (digits.length === 2 && value[index]) {
      fill(digits.slice(-1), index); // typed over a filled cell: keep the new digit
    } else {
      fill(digits, index);
    }
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case "Backspace":
        if (!value[index] && index > 0) {
          event.preventDefault();
          const next = [...value];
          next[index - 1] = "";
          onChange(next);
          focusCell(index - 1);
        }
        break;
      case "ArrowLeft":
        event.preventDefault();
        focusCell(index - 1);
        break;
      case "ArrowRight":
        event.preventDefault();
        focusCell(index + 1);
        break;
      case "Home":
        event.preventDefault();
        focusCell(0);
        break;
      case "End":
        event.preventDefault();
        focusCell(OTP_LENGTH - 1);
        break;
    }
  };

  const handlePaste = (index: number, event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const digits = event.clipboardData.getData("text").replace(/\D/g, "");
    if (!digits) return;
    if (digits.length >= OTP_LENGTH) fill(digits.slice(0, OTP_LENGTH), 0);
    else fill(digits, index);
  };

  return (
    <div role="group" aria-label={groupLabel} aria-busy={busy || undefined} className="flex justify-center gap-3">
      {value.map((digit, index) => (
        <input
          // Cells never reorder, so the position is a stable key.
          key={index}
          ref={(element) => {
            cells.current[index] = element;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          placeholder="0"
          value={digit}
          readOnly={busy}
          aria-label={cellLabel(index + 1)}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          onChange={(event) => handleChange(index, event)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={(event) => handlePaste(index, event)}
          onFocus={(event) => event.currentTarget.select()}
          className={cn(
            // Figma "OTP_Cell": 52x80, 1px white border, 4px radius, Inter 600 32/39, placeholder at 20%.
            "h-20 min-w-0 max-w-[52px] flex-1 rounded-[4px] border border-white bg-transparent text-center text-[32px] leading-[39px] font-semibold text-white outline-none transition-[border-color,box-shadow,opacity] duration-200 placeholder:text-white/20 focus:border-primary focus:shadow-[0_0_0_1px_var(--color-primary)] motion-reduce:transition-none",
            invalid && "border-danger focus:border-danger focus:shadow-[0_0_0_1px_var(--color-danger)]",
            busy && "opacity-60",
          )}
        />
      ))}
    </div>
  );
});
