import type { ReactNode } from "react";
import { Bdi, BidiText } from "../i18n/Bdi.tsx";
import { useI18n } from "../i18n/index.ts";
import { Badge, type BadgeTone } from "../primitives/Badge.tsx";

/** Two-line identity cell: name (600) over a 11px text-3 caption. Both are bidi-correct truncating text (see BidiText). */
export function IdentityCell({ name, caption }: { name: string; caption?: string | undefined }) {
	return (
		<span className="sy-cell-id">
			<b className="sy-cell-id__name" title={name}>
				<BidiText>{name}</BidiText>
			</b>
			{caption ? (
				<span className="sy-cell-id__caption" title={caption}>
					<BidiText>{caption}</BidiText>
				</span>
			) : null}
		</span>
	);
}

/** Semantic status chip cell (success / warning / danger / info / neutral). */
export function ChipCell({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
	return <Badge tone={tone}>{children}</Badge>;
}

/** Relative time ("12 min ago") with the exact date-time as title. */
export function RelativeTimeCell({ iso }: { iso: string | null | undefined }) {
	const { formatRelative, formatDateTime } = useI18n();
	if (!iso) return null;
	return (
		<Bdi>
			<span title={formatDateTime(iso)}>{formatRelative(iso)}</span>
		</Bdi>
	);
}
