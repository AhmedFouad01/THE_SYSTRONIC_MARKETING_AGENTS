// M0 boundary only. Implementations must keep blobs private and reauthorize reads.
export interface PrivateStorage {
	put(tenantId: string, key: string, content: Uint8Array): Promise<void>;
	read(tenantId: string, key: string): Promise<Uint8Array>;
	remove(tenantId: string, key: string): Promise<void>;
}
