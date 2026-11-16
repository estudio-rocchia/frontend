"use client";

import { useTemplateCopy } from "@/components/foundations/template-copy/template-copy";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { RefObject } from "react";
import { Calendar, Dialog, Popover, useLocale } from "react-aria-components";
import type { CalendarDate } from "@internationalized/date";
import { RiCalendarLine } from "@remixicon/react";
import {
  MonthPanel,
  formatTriggerDate,
  popoverClassName,
  triggerButtonClassName,
} from "@/components/base/date-picker/shared";
import { useOverlayPortalContainer } from "@/lib/ui/overlay-portal";
import { cx } from "@/utils/cx";
import {
  closestRocchiaOverlayKind,
  rocchiaOverlayKind,
  useDismissOnOutsidePress,
  useTriggerToggle,
} from "@/utils/use-dismiss-on-outside-press";

/**
 * Figma source: Board UI → "Calendar_single" (node 3879:6708).
 *
 * A single-date picker: trigger button opens a popover with one month
 * (react-aria's plain `Calendar`, so both nav chevrons are fully functional —
 * unlike `DateRangePicker`'s dual view, there's only one month to navigate)
 * Selecting a day commits immediately and closes the popover (no Apply/Cancel).
 *
 * Reuses the exact chevrons, day-cell rendering, month-panel chrome, editable
 * date chip, and trigger/popover surfaces built for `DateRangePicker` — see
 * `./shared`. A plain `Calendar`'s `CalendarCellRenderProps` always reports
 * `isSelectionStart === isSelectionEnd === isSelected` for the one chosen
 * day, so the shared `DayCell` renders it as a single fully-rounded pill
 * with no connecting range background, matching Figma without any
 * single-vs-range branching in the cell itself.
 *
 * Standalone `Popover` + `triggerRef` (like `MeetingScheduler`), not
 * `DialogTrigger`, so an external trigger can be swapped in: pass
 * `triggerRef`/`isOpen`/`onOpenChange` to anchor the popover to your own
 * element (e.g. the calendar template's month switcher label) instead of
 * DatePicker's own button, which is hidden in that case.
 */

/** Altura aproximada del panel; usada para flip fuera de modales. */
const CALENDAR_POPOVER_ESTIMATE_PX = 470;

type CalendarPopoverPlacement = "bottom start" | "top start";

export interface DatePickerProps {
  value?: CalendarDate | null;
  defaultValue?: CalendarDate | null;
  onChange?: (value: CalendarDate | null) => void;
  isDisabled?: boolean;
  className?: string;
  "aria-label"?: string;
  /** Anchor the popover to an external element instead of DatePicker's own
   *  trigger button (which is hidden when this is provided). Pair with
   *  `isOpen`/`onOpenChange` for full external control. */
  triggerRef?: RefObject<HTMLElement | null>;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}

export function DatePicker({
  value,
  defaultValue = null,
  onChange,
  isDisabled,
  className,
  "aria-label": ariaLabel = "Fecha",
  triggerRef: externalTriggerRef,
  isOpen: controlledIsOpen,
  onOpenChange: controlledOnOpenChange,
}: DatePickerProps) {
  const localize = useTemplateCopy();
  const { locale } = useLocale();
  const ownTriggerRef = useRef<HTMLButtonElement>(null);
  const triggerRef = externalTriggerRef ?? ownTriggerRef;
  const isExternal = externalTriggerRef !== undefined;
  const popoverRef = useRef<HTMLElement>(null);
  const overlayPortal = useOverlayPortalContainer();
  const inModal = overlayPortal != null;

  const [placement, setPlacement] = useState<CalendarPopoverPlacement>("bottom start");
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = isExternal ? (controlledIsOpen ?? false) : internalOpen;
  const setIsOpen = isExternal ? (controlledOnOpenChange ?? (() => {})) : setInternalOpen;
  const allowOpenChange = useTriggerToggle(isOpen, ownTriggerRef);

  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<CalendarDate | null>(defaultValue);
  const committedValue = isControlled ? (value ?? null) : internalValue;

  // React Aria's `Calendar` keeps its own internal `visibleRange` state for
  // as long as it stays mounted (Popover keeps its content mounted between
  // opens for the exit animation), so it never re-derives the visible month
  // from a later `value` change on its own. Bumping this on every open and
  // keying `Calendar` on it forces a fresh mount showing the right month —
  // needed for the external-trigger case, where `value` can jump (e.g. the
  // calendar template's month switcher) between one open and the next.
  const [openKey, setOpenKey] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setOpenKey((k) => k + 1);
    }
  }, [isOpen]);

  const commit = (next: CalendarDate | null) => {
    if (!isControlled) setInternalValue(next);
    onChange?.(next);
    setIsOpen(false);
  };

  const resolvePlacement = useCallback((trigger: HTMLElement): CalendarPopoverPlacement => {
    const needed = CALENDAR_POPOVER_ESTIMATE_PX;
    const rect = trigger.getBoundingClientRect();
    const padding = 16;
    const spaceBelow = window.innerHeight - rect.bottom - padding;
    const spaceAbove = rect.top - padding;
    return spaceBelow < needed && (spaceAbove >= needed || spaceAbove > spaceBelow)
      ? "top start"
      : "bottom start";
  }, []);

  const setOpen = useCallback(
    (open: boolean) => {
      if (open && !inModal && triggerRef.current) {
        setPlacement(resolvePlacement(triggerRef.current));
      }
      setIsOpen(open);
    },
    [inModal, resolvePlacement, setIsOpen],
  );

  const ignoreNestedMenuPress = useCallback(
    (target: Node) => closestRocchiaOverlayKind(target) === "menu",
    [],
  );

  const dismiss = useCallback(() => setIsOpen(false), [setIsOpen]);

  useDismissOnOutsidePress(isOpen, dismiss, [triggerRef, popoverRef], {
    ignoreIf: ignoreNestedMenuPress,
  });

  const calendarPanel = (
    <Dialog aria-label={ariaLabel} className="overflow-visible outline-none">
      <Calendar
        key={openKey}
        aria-label={ariaLabel}
        value={committedValue}
        onChange={(next) => commit(next)}
      >
        <div className="flex flex-col overflow-visible pt-2 pe-2 pb-4 ps-2">
          <MonthPanel offset={0} showPrev showNext />
        </div>
      </Calendar>
    </Dialog>
  );

  const modalCalendar =
    inModal && isOpen && overlayPortal
      ? createPortal(
          <div
            className="fixed inset-0 z-[109] flex items-center justify-center p-4"
            role="presentation"
          >
            <div ref={popoverRef} className={popoverClassName} {...rocchiaOverlayKind("calendar")}>
              {calendarPanel}
            </div>
          </div>,
          overlayPortal,
        )
      : null;

  return localize((
    <>
      {!isExternal && (
        <button
          ref={ownTriggerRef}
          type="button"
          disabled={isDisabled}
          onClick={() => {
            const next = !isOpen;
            if (!allowOpenChange(next)) return;
            setOpen(next);
          }}
          className={cx(triggerButtonClassName, className)}
        >
          <RiCalendarLine className="size-5 shrink-0 text-foreground-icon-primary" aria-hidden />
          <span className="flex items-center justify-center whitespace-nowrap px-1 text-body-medium text-text-primary">
            {committedValue ? formatTriggerDate(committedValue, locale) : "Elegir fecha"}
          </span>
        </button>
      )}
      {modalCalendar}
      {!inModal && (
        <Popover
          ref={popoverRef}
          triggerRef={triggerRef}
          isOpen={isOpen}
          offset={8}
          placement={placement}
          shouldFlip
          containerPadding={16}
          isNonModal
          UNSTABLE_portalContainer={overlayPortal}
          className={popoverClassName}
          {...rocchiaOverlayKind("calendar")}
        >
          {calendarPanel}
        </Popover>
      )}
    </>
  ));
}