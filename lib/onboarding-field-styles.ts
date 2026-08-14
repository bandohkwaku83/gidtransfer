/** Field labels on onboarding and matching split modals. */
export const onboardingLabelClass =
  "block text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-400";

/** Red asterisk for required onboarding labels (use inside label text). */
export const onboardingRequiredMarkClass = "text-red-500 normal-case";

/** Primary CTA on onboarding and matching flows (e.g. add-client modal). */
export const onboardingPrimaryButtonClassName =
  "w-full rounded-sm bg-neutral-800 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-60";

/** Shared control height for onboarding inputs, selects, and composite URL field. */
export const ONBOARDING_FIELD_H = "h-10";

export const onboardingFieldMt = "mt-0.5";

/** Border, radius, and fill shared by onboarding single-line controls. */
export const onboardingControlShellClassName = [
  "!rounded-lg",
  "!border !border-solid !border-neutral-300 !bg-[#F5F5F5]",
  "!shadow-none",
  "hover:!border-neutral-400",
].join(" ");

/** Body copy for inline controls — matches Ant Design {@link FormInput} text. */
export const onboardingFormTextClassName =
  "font-sans text-sm leading-normal text-zinc-900 dark:text-zinc-100";

/** Ant Design {@link FormInput} — overrides default min-h-11 / rounded-xl from formFieldClassName. */
export const onboardingAntInputClassName = [
  onboardingFieldMt,
  "[&.ant-input]:!h-10",
  "[&.ant-input]:!min-h-10",
  "[&.ant-input]:!max-h-10",
  "[&.ant-input]:!rounded-lg",
  "[&.ant-input]:!border-neutral-300",
  "[&.ant-input]:!bg-[#F5F5F5]",
  "[&.ant-input]:!px-2.5",
  "[&.ant-input]:!text-sm",
  "[&.ant-input]:!leading-normal",
  "[&.ant-input]:!shadow-none",
  "[&.ant-input:hover]:!border-neutral-400",
  "[&.ant-input:focus]:!border-neutral-500",
  "[&_.ant-input-affix-wrapper]:!h-10",
  "[&_.ant-input-affix-wrapper]:!min-h-10",
  "[&_.ant-input-affix-wrapper]:!max-h-10",
  "[&_.ant-input-affix-wrapper]:!rounded-lg",
  "[&_.ant-input-affix-wrapper]:!border-neutral-300",
  "[&_.ant-input-affix-wrapper]:!bg-[#F5F5F5]",
  "[&_.ant-input-affix-wrapper]:!px-2.5",
  "[&_.ant-input-affix-wrapper]:!py-0",
  "[&_.ant-input-affix-wrapper]:!shadow-none",
  "[&_.ant-input-affix-wrapper:hover]:!border-neutral-400",
  "focus-within:[&_.ant-input-affix-wrapper]:!border-neutral-500",
  "[&_.ant-input]:!h-10",
  "[&_.ant-input]:!min-h-0",
  "[&_.ant-input]:!rounded-lg",
  "[&_.ant-input]:!border-neutral-300",
  "[&_.ant-input]:!bg-[#F5F5F5]",
  "[&_.ant-input]:!px-2.5",
  "[&_.ant-input]:!text-sm",
  "[&_.ant-input]:!leading-normal",
  "[&_.ant-input]:!shadow-none",
  "[&_.ant-input:hover]:!border-neutral-400",
  "[&_.ant-input:focus]:!border-neutral-500",
].join(" ");

/** Ant Design {@link FormSelect} — matches onboarding inputs (40px / h-10). */
export const onboardingAntSelectClassName = [
  onboardingFieldMt,
  "w-full !h-10",
  "[&.ant-select]:!h-10",
  "[&.ant-select]:!min-h-10",
  "[&_.ant-select-selector]:!h-10",
  "[&_.ant-select-selector]:!min-h-10",
  "[&_.ant-select-selector]:!max-h-10",
  "[&_.ant-select-selector]:!flex",
  "[&_.ant-select-selector]:!items-center",
  "[&_.ant-select-selector]:!rounded-lg",
  "[&_.ant-select-selector]:!border-neutral-300",
  "[&_.ant-select-selector]:!bg-[#F5F5F5]",
  "[&_.ant-select-selector]:!px-2.5",
  "[&_.ant-select-selector]:!py-0",
  "[&_.ant-select-selector]:!shadow-none",
  "[&_.ant-select-selection-wrap]:!self-center",
  "[&_.ant-select-selection-item]:!text-sm",
  "[&_.ant-select-selection-item]:!text-[14px]",
  "[&_.ant-select-selection-item]:!font-normal",
  "[&_.ant-select-selection-item]:!leading-normal",
  "[&_.ant-select-selection-item]:!text-neutral-900",
  "[&_.ant-select-selection-placeholder]:!text-sm",
  "[&_.ant-select-selection-placeholder]:!text-[14px]",
  "[&_.ant-select-selection-placeholder]:!leading-normal",
  "[&_.ant-select-selection-search-input]:!text-sm",
  "[&_.ant-select-selector:hover]:!border-neutral-400",
  "[&.ant-select-focused_.ant-select-selector]:!border-neutral-500",
  "[&.ant-select-focused_.ant-select-selector]:!shadow-none",
].join(" ");

/**
 * Ant Design {@link FormDatePicker} — `className` is on `.ant-picker` root (not a wrapper).
 * Uses the same shell as {@link onboardingAntInputClassName} (border, radius, height).
 */
export const onboardingDatePickerClassName = [
  onboardingFieldMt,
  onboardingControlShellClassName,
  "!box-border !flex !h-10 !min-h-10 !max-h-10 !w-full !items-center !px-2.5 !py-0",
  "[&.ant-picker-focused]:!border-neutral-500 [&.ant-picker-focused]:!shadow-none",
  "[&_.ant-picker-input]:!flex [&_.ant-picker-input]:!h-full [&_.ant-picker-input]:!min-h-0 [&_.ant-picker-input]:!flex-1 [&_.ant-picker-input]:!items-center",
  "[&_.ant-picker-input>input]:!h-full [&_.ant-picker-input>input]:!border-0 [&_.ant-picker-input>input]:!bg-transparent [&_.ant-picker-input>input]:!p-0 [&_.ant-picker-input>input]:!text-sm [&_.ant-picker-input>input]:!leading-normal [&_.ant-picker-input>input]:!text-neutral-900 [&_.ant-picker-input>input]:placeholder:!text-neutral-400",
  "[&_.ant-picker-suffix]:!ms-0 [&_.ant-picker-suffix]:!flex [&_.ant-picker-suffix]:!items-center [&_.ant-picker-suffix]:!text-neutral-400",
].join(" ");

/** Ant Design {@link FormTextArea} — matches onboarding inputs. */
export const onboardingTextareaClassName = [
  onboardingFieldMt,
  "[&.ant-input]:!h-auto",
  "[&.ant-input]:!min-h-[4.5rem]",
  "[&.ant-input]:!max-h-none",
  "[&.ant-input]:!resize-y",
  "[&.ant-input]:!rounded-lg",
  "[&.ant-input]:!border-neutral-300",
  "[&.ant-input]:!bg-[#F5F5F5]",
  "[&.ant-input]:!px-2.5",
  "[&.ant-input]:!py-2",
  "[&.ant-input]:!text-sm",
  "[&.ant-input]:!leading-relaxed",
  "[&.ant-input]:!shadow-none",
  "[&.ant-input:hover]:!border-neutral-400",
  "[&.ant-input:focus]:!border-neutral-500",
].join(" ");

/** Native `<select>` and similar controls. */
export const onboardingNativeControlClassName = [
  onboardingFieldMt,
  ONBOARDING_FIELD_H,
  "w-full appearance-none rounded-lg border border-neutral-300 bg-[#F5F5F5] px-2.5 text-sm leading-normal text-neutral-900 shadow-none outline-none transition",
  "hover:border-neutral-400 focus:border-neutral-500 focus:ring-0",
  "disabled:cursor-not-allowed disabled:opacity-60",
].join(" ");

export const onboardingSelectChevronClassName =
  "bg-[length:0.875rem] bg-[position:right_0.65rem_center] bg-no-repeat pr-8 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%23737373%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%222%22%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')]";

/** Composite studio URL bar (https:// + slug + suffix). */
export const onboardingCompositeFieldClassName = [
  onboardingFieldMt,
  ONBOARDING_FIELD_H,
  "flex items-stretch overflow-hidden rounded-lg border border-neutral-300 bg-[#F5F5F5] transition-colors focus-within:border-neutral-500",
].join(" ");
