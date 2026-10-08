// Shell hooks remain stable for consumers/tests; all visual values use the existing token bridge.
const styles: Record<string, string> = {
	"sy-shell":
		"grid grid-cols-[228px_minmax(0,1fr)] min-h-screen bg-canvas text-text max-mobile:block",
	"sy-skip":
		"absolute start-8 -top-[calc(var(--sy-space-22)*3)] z-[100] py-8 px-12 rounded-8 bg-primary text-primary-fg! font-[600] focus:top-8",
	"sy-sidebar":
		"sticky top-0 flex flex-col h-screen min-h-0 px-14 pb-[18px] bg-nav border-0 border-e border-solid border-border",
	"sy-brand":
		"flex items-center gap-10 box-border h-topbar-h mb-12 px-8 text-text! no-underline rounded-10",
	"sy-brand__mark":
		"grid place-items-center w-[34px] h-[34px] rounded-10 bg-primary text-primary-fg font-[800] text-[11px]",
	"sy-brand__copy": "min-w-0",
	"sy-brand__name": "font-[800] text-[12px]",
	"sy-brand__sub": "mt-2 text-[11px] text-text-3",
	"sy-primary-nav": "block min-h-0 overflow-y-auto mt-8",
	"sy-nav":
		"flex items-center gap-10 min-w-0 h-[38px] px-10 border-0 rounded-8 bg-transparent text-text-2! text-[13px]! text-start no-underline [&>.sy-icon]:text-icon-muted aria-[current=page]:bg-selected aria-[current=page]:text-text! aria-[current=page]:font-[600] aria-[current=page]:[&>.sy-icon]:text-focus data-[focus-visible]:outline-2 data-[focus-visible]:outline-focus data-[focus-visible]:outline-offset-2",
	"sy-nav--route":
		"cursor-pointer hover:aria-[current=page]:bg-selected hover:not-aria-[current=page]:bg-hover",
	"sy-nav__label": "min-w-0 truncate",
	"sy-sidebar__foot":
		"mt-auto pt-12 border-0 border-t border-solid border-border",
	"sy-actor":
		"relative flex items-center gap-10 min-w-0 py-4 px-8 max-mobile:p-0",
	"sy-actor__avatar":
		"grid flex-none place-items-center w-[32px] h-[32px] rounded-pill bg-surface-2 border border-solid border-border text-text text-[11px] font-[800]",
	"sy-actor__copy": "grid min-w-0 max-mobile:sr-only",
	"sy-actor__name": "truncate text-data font-[600] text-text",
	"sy-actor__role": "text-[11px] text-text-3",
	"sy-content": "min-w-0",
	"sy-topbar":
		"sticky top-0 z-[45] flex items-center justify-between gap-10 min-h-topbar-h h-topbar-h px-gutter bg-surface border-0 border-b border-solid border-border max-mobile:flex-wrap max-mobile:h-auto max-mobile:py-8",
	"sy-topbar__brand": "hidden font-[800] text-[12px] max-mobile:block",
	"sy-crumbs": "min-w-0",
	"sy-crumbs__list":
		"flex items-center gap-4 m-0 p-0 list-none text-data text-text-2 max-mobile:flex-wrap",
	"sy-crumbs__item": "inline-flex items-center gap-4 min-w-0 whitespace-nowrap",
	"sy-crumbs__icon": "text-icon-muted",
	"sy-crumbs__link":
		"text-text-2! no-underline rounded-6 hover:text-text! hover:underline",
	"sy-crumbs__record": "min-w-0 max-w-[24ch] truncate",
	"sy-crumbs__item--current": "text-text font-[600]",
	"sy-topbar__tools": "flex items-center gap-8 ms-auto min-w-0",
	"sy-main":
		"min-w-0 p-gutter focus:outline-none max-mobile:pb-[82px] in-data-[connected=false]:max-mobile:pb-gutter",
	"sy-page": "min-w-0 max-w-page mx-auto",
	"sy-bottomnav":
		"fixed inset-x-0 bottom-0 z-[60] flex gap-4 h-[68px] py-[7px] px-8 bg-nav border-0 border-t border-solid border-border [&_.sy-nav]:flex-[1_1_0] [&_.sy-nav]:min-w-0 [&_.sy-nav]:max-w-[20%] [&_.sy-nav]:flex-col [&_.sy-nav]:justify-center [&_.sy-nav]:gap-[3px] [&_.sy-nav]:h-[54px] [&_.sy-nav]:py-[3px] [&_.sy-nav]:px-2 [&_.sy-nav]:text-[11px]! [&_.sy-nav]:cursor-pointer [&_.sy-nav__label]:block [&_.sy-nav__label]:max-w-full [&_.sy-nav__label]:text-center",
	"sy-nav-branch__row":
		"flex items-center [&>.sy-nav]:flex-1 [&>.sy-nav--toggle]:flex-none [&>.sy-nav--toggle]:w-[34px] [&>.sy-nav--toggle]:justify-center",
	"sy-nav--disclosure":
		"cursor-pointer font-[600] [&>.sy-icon:last-child]:ms-auto",
	"sy-nav-branch__children": "ps-12",
	"sy-nav--upcoming":
		"h-[38px] cursor-not-allowed text-text-3!",
	"sy-sheet-nav": "grid gap-4",
	"sy-nav--sheet":
		"justify-start px-10 flex-row h-[44px] text-body! [&_.sy-nav__label]:block",
	"sy-workspace":
		"grid gap-4 min-w-0 p-8 border-0 border-b border-solid border-border",
	"sy-workspace__label": "text-[11px] text-text-3",
	"sy-workspace__hint": "text-[11px] text-text-3",
	"sy-workspace__name": "min-w-0 truncate text-data",
	"sy-workspace-options": "grid gap-8",
	"sy-workspace-option":
		"h-auto min-h-[44px] flex-wrap py-8 [overflow-wrap:anywhere] cursor-pointer data-[disabled]:cursor-default",
	"sy-topbar__workspace":
		"order-3 basis-full min-w-0 [&_.sy-workspace]:grid-cols-[minmax(0,1fr)_auto] [&_.sy-workspace]:p-0 [&_.sy-workspace]:border-0 [&_.sy-workspace__name]:col-start-1 [&_.sy-btn]:col-start-2 [&_.sy-btn]:row-start-1 [&_.sy-btn]:row-span-3 [&_.sy-btn]:self-center",
	"sy-workspace-announcement": "sr-only",
};

export function shellClass(hooks: string): string {
	return hooks
		.split(/\s+/)
		.flatMap((hook) => [hook, styles[hook] ?? ""])
		.join(" ");
}
