// localStorage can throw (privacy mode, disabled storage, quota). Preferences are best-effort.
export function readPref(key: string): string | null {
	try {
		return window.localStorage.getItem(key);
	} catch {
		return null;
	}
}

export function writePref(key: string, value: string): void {
	try {
		window.localStorage.setItem(key, value);
	} catch {
		// ignore: preference simply does not persist
	}
}
