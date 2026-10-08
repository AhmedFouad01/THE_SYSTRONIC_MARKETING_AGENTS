import type { DropItem } from "react-aria-components";

/** First file wins, matching the single-file picker. Ignore text/directory drops. */
export function createFileSelection(callbacks: {
 isDisabled: () => boolean;
 onSelect: (file: File) => void;
 onError: () => void;
}) {
 let revision = 0;
 const invalidate = () => { revision++; };
 return {
  invalidate,
  browse(files: FileList | null) {
   const file = files?.[0];
   if (!file || callbacks.isDisabled()) return; // Cancelling preserves the current file.
   invalidate();
   callbacks.onSelect(file);
  },
  async drop(items: readonly DropItem[]) {
   const item = items.find((item) => item.kind === "file");
   if (item?.kind !== "file" || callbacks.isDisabled()) return;
   const ticket = ++revision;
   try {
    const file = await item.getFile();
    if (ticket === revision && !callbacks.isDisabled()) callbacks.onSelect(file);
   } catch {
    if (ticket === revision && !callbacks.isDisabled()) callbacks.onError();
   }
  },
 };
}
