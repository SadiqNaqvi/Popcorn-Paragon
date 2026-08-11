import appToast from "@lib/frontend/providers/appToast";
import { dobSchema } from "@lib/shared/validation/schemas";
import { GenericDate } from "@type/internal";
import React, { useImperativeHandle, useRef } from "react";

type DateInputValue = {
  day: string;
  month: string;
  year: string;
};

type DateInputProps = {
  defaultVal?: GenericDate;
  onComplete?: (value: GenericDate) => void;
  dateRef?: React.RefObject<{ get: () => Date | undefined }|null>,
}

const DateInput: React.FC<DateInputProps> = ({ defaultVal, onComplete, dateRef }) => {

  const dayRef = useRef<HTMLInputElement>(null);
  const monthRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(dateRef, () => ({ get: handleReturn }));

  const handleInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    max: number,
    nextRef?: React.RefObject<HTMLInputElement | null>
  ) => {
    let value = e.target.value.replace(/\D/g, "").slice(0, max);
    const numVal = Number(value);

    if (isNaN(numVal)) e.target.value = "";

    // Auto-move to next field
    else if (value.length === max && nextRef?.current) {
      nextRef.current.focus();
    }
  };

  const handleReturn = () => {
    const day = dayRef.current?.value;
    const month = monthRef.current?.value;
    const year = yearRef.current?.value;
    console.log("handle return me aaya");
    if (!(day && month && year)) return;

    const { success, error, data } = dobSchema.safeParse(`${year}/${month}/${day}`);
    console.log(success, error, data);

    if (!success) {
      appToast.error(error.issues[0].message);
      return;
    }

    return new Date(data);
  }

  const handleBackJump = (field: keyof DateInputValue) => {

    let current: HTMLInputElement | undefined = undefined;
    let prev: HTMLInputElement | undefined = undefined;

    if (field === "day") {
      current = dayRef.current || undefined;
    } else if (field === "month") {
      current = monthRef.current || undefined;
      prev = dayRef.current || undefined;
    } else {
      current = yearRef.current || undefined;
      prev = monthRef.current || undefined;
    }

    if (current && current.value.length === 0 && prev) {
      prev.focus();
    }
  }

  const handleForwardJump = (field: keyof DateInputValue) => {
    if (field !== "year" || !onComplete) return;

    const dateToReturn = handleReturn();
    if (dateToReturn) onComplete(dateToReturn)

  }

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    field: keyof DateInputValue,
  ) => {
    if (e.key === "Backspace") handleBackJump(field);
    else if (e.key === "Enter") handleForwardJump(field);
  }

  const className = "py-1 text-center text-lg w-[33%] bg-transparent"

  return (
    <div className="group flex gap-3 items-center border border-gray-500 rounded-md">

      {/* Day */}
      <input
        ref={dayRef}
        // value={date.day}
        data-testid="dateInputBox-day"
        onChange={(e) => handleInput(e, 2, monthRef)}
        onKeyDown={(e) => handleKeyDown(e, "day")}
        className={className}
        defaultValue={defaultVal && String(new Date(defaultVal).getDate())}
        maxLength={2}
        minLength={1}
        placeholder="DD"
        inputMode="numeric"
        autoFocus
      />

      <span className="ghostColor">/</span>

      {/* Month */}
      <input
        ref={monthRef}
        // value={date.month}
        data-testid="dateInputBox-month"
        onChange={(e) => handleInput(e, 2, yearRef)}
        onKeyDown={(e) => handleKeyDown(e, "month")}
        defaultValue={defaultVal && String(new Date(defaultVal).getMonth() + 1)}
        className={className}
        maxLength={2}
        minLength={1}
        placeholder="MM"
        inputMode="numeric"
      />

      <span className="ghostColor">/</span>

      {/* Year */}
      <input
        ref={yearRef}
        data-testid="dateInputBox-year"
        // value={date.year}
        onChange={(e) => handleInput(e, 4)}
        onKeyDown={(e) => handleKeyDown(e, "year")}
        defaultValue={defaultVal && String(new Date(defaultVal).getFullYear())}
        className={className}
        maxLength={4}
        minLength={1}
        placeholder="YYYY"
        inputMode="numeric"
      />
    </div>
  );
};

export default DateInput;
