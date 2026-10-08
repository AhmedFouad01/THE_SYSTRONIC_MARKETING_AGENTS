import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { DropZone, FileTrigger, Text } from "react-aria-components";
import { Bdi, useI18n } from "../i18n/index.ts";
import { Icon } from "../icons/index.ts";
import { Button, IconButton } from "./Button.tsx";
import { createFileSelection } from "./fileSelection.ts";

export type FileDropZoneProps = {
 label: string;
 acceptedFileTypes: readonly string[];
 file: { name: string; size: number } | null;
 disabled?: boolean;
 onSelect: (file: File) => void;
 onRemove: () => void;
};

export function FileDropZone({ label, acceptedFileTypes, file, disabled = false, onSelect, onRemove }: FileDropZoneProps) {
 const { t, formatNumber } = useI18n();
 const [failed, setFailed] = useState(false);
 const current = useRef({ disabled, onSelect });
 const selection = useMemo(() => createFileSelection({
  isDisabled: () => current.current.disabled,
  onSelect: (next) => { setFailed(false); current.current.onSelect(next); },
  onError: () => setFailed(true),
 }), []);
 useLayoutEffect(() => {
  current.current = { disabled, onSelect };
  if (disabled) selection.invalidate();
 }, [disabled, onSelect, selection]);
 useLayoutEffect(() => () => selection.invalidate(), [selection]);
 return <div className="grid gap-8 min-w-0">
  <DropZone isDisabled={disabled} onDrop={(event) => void selection.drop(event.items)}
   className="grid justify-items-center gap-12 min-w-0 border border-dashed border-border-strong rounded-8 p-24 bg-surface text-text data-[drop-target]:border-focus data-[drop-target]:bg-selected data-[focus-visible]:outline-2 data-[focus-visible]:outline-focus data-[focus-visible]:outline-offset-2 data-[disabled]:opacity-60">
   <Icon name="upload" size={24} />
   <Text slot="label" className="font-[600] text-center">{label}</Text>
   <p className="text-text-3 text-center">{t("fileDrop.prompt")}</p>
   <FileTrigger acceptedFileTypes={acceptedFileTypes} onSelect={(files) => selection.browse(files)}>
    <Button disabled={disabled}>{t("fileDrop.browse")}</Button>
   </FileTrigger>
  </DropZone>
  {file ? <div className="flex items-center gap-8 min-w-0 border border-solid border-border rounded-8 bg-surface-2 p-8">
   <div className="grid gap-4 min-w-0 flex-1" role="status">
    <span className="break-words"><Bdi>{file.name}</Bdi></span>
    <span className="text-text-3 text-data">{formatNumber(file.size / 1024, { maximumFractionDigits: 1 })} {t("fileDrop.kib")}</span>
   </div>
   <IconButton icon="close" disabled={disabled} aria-label={t("fileDrop.remove", { name: file.name })} onClick={() => { selection.invalidate(); setFailed(false); onRemove(); }} />
  </div> : <p className="text-text-3" role="status">{t("fileDrop.empty")}</p>}
  {failed ? <p role="alert" className="text-danger-fg">{t("fileDrop.readFailed")}</p> : null}
 </div>;
}
