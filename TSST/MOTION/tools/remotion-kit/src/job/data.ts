// Every number on screen comes from data, never typed into a scene. A real job snapshots the client's
// source (offers file, landing page data) into src/job/ with its sha256 in the notes, and computes
// savings and percentages with the same math the client's page uses.
export const fmt = (n: number) => n.toLocaleString('en-US');

const was = 12500;
const price = 7900;
export const OFFER = {name: 'طقم شاور', was, price, save: was - price, pct: Math.round(((was - price) / was) * 100)};
