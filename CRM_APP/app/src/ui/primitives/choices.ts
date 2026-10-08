export const choiceFocus =
	"data-[focus-visible]:outline-2 data-[focus-visible]:outline-focus data-[focus-visible]:outline-offset-2";
export const choiceTrigger = `flex items-center justify-between gap-8 w-full min-w-0 px-10 border border-solid border-border-strong rounded-8 bg-surface text-text text-data text-start cursor-pointer data-[hovered]:bg-hover data-[disabled]:bg-disabled-bg data-[disabled]:text-text-disabled data-[disabled]:cursor-not-allowed aria-[invalid=true]:border-danger-icon aria-[invalid=true]:bg-danger-field-bg ${choiceFocus}`;
export const choicePopup =
	"z-[1200] box-border min-w-[max(var(--trigger-width),160px)] w-max max-w-[min(360px,calc(100vw_-_16px))] max-h-[min(280px,var(--available-height))] overflow-y-auto p-4 border border-solid border-border rounded-10 bg-surface shadow-menu";
export const choiceItem = `flex items-center justify-between gap-8 min-h-[36px] max-mobile:min-h-[44px] px-10 rounded-8 text-text text-data cursor-pointer outline-none data-[focused]:bg-hover data-[selected]:bg-selected data-[selected]:font-[600] data-[disabled]:text-text-disabled data-[disabled]:cursor-not-allowed ${choiceFocus}`;
