// In-house blocklist (AUTH_PLAN D11: no breached-password API). Entries are matched
// case-insensitively against the NFKC-normalised password, also with a trailing
// run of digits/punctuation stripped. Only the 12+ character policy minimum matters
// for whole-string matches; shorter stems cover the "stem + digits" variants.
const STEMS = [
	"password", "passw0rd", "p@ssword", "p@ssw0rd", "qwerty", "qwertyuiop", "qwertyuiopasdfghjkl",
	"asdfghjkl", "zxcvbnm", "azerty", "letmein", "welcome", "admin", "administrator", "iloveyou",
	"monkey", "dragon", "football", "baseball", "basketball", "superman", "batman", "trustno1",
	"sunshine", "princess", "master", "shadow", "michael", "jennifer", "abc", "abcdef",
	"changeme", "default", "secret", "login", "starwars", "whatever", "freedom", "computer",
	"internet", "mustang", "access", "hello", "charlie", "donald", "cheese", "flower", "summer",
	"winter", "spring", "autumn", "liverpool", "arsenal", "chelsea", "barcelona", "realmadrid",
	"ahmed", "mohamed", "mohammed", "egypt", "cairo", "alexandria", "systronic", "crm", "tsst",
];
const WHOLE = [
	"123456789012", "1234567890123", "12345678901234", "123456789012345", "111111111111",
	"000000000000", "123123123123", "123412341234", "1q2w3e4r5t6y", "1q2w3e4r5t6y7u",
	"1qaz2wsx3edc", "qazwsxedcrfv", "zaq12wsxcde3", "qwertyuiop12", "qwertyuiop123",
	"asdfghjkl123", "abcdefghijkl", "abcdefghijklmnop", "abcd12345678", "aaaaaaaaaaaa",
	"iloveyou1234", "passwordpassword", "password1234", "password12345", "password123456",
	"letmein12345", "welcome12345", "administrator1", "adminadminadmin", "changemechangeme",
	"qwerty123456", "qwerty1234567", "trustno1trustno1", "correcthorsebatterystaple",
	"thequickbrownfox", "thequickbrownfoxjumpsoverthelazydog", "openpassword", "mypassword123",
	"mypassword1234", "myspace123456", "football12345", "baseball12345", "superman12345",
	"0123456789ab", "9876543210ab", "987654321098", "098765432109", "112233445566",
	"147258369147", "159753159753", "741852963741", "121212121212", "696969696969",
];

const exact = new Set<string>(WHOLE);
const stems = new Set<string>(STEMS);

/** Strip a trailing run of digits and punctuation ("Password2024!!" -> "password"). */
function stem(s: string): string {
	return s.replace(/[\d\s!@#$%^&*()_+=.,?-]+$/u, "");
}

export function isCommonPassword(normalised: string): boolean {
	const lower = normalised.toLowerCase();
	if (exact.has(lower)) return true;
	const base = stem(lower);
	if (stems.has(base)) return true;
	// "stem + stem" and "stem + stem + digits" repeats such as passwordpassword1
	for (const s of stems) {
		if (base.length >= 8 && base.length % s.length === 0 && s.repeat(base.length / s.length) === base) return true;
	}
	return false;
}
