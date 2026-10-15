import { readFileSync } from "node:fs";
import { invoiceTotals, formatCents } from "./invoice.js";

const file = process.argv[2] ?? "examples/order.json";
const order = JSON.parse(readFileSync(file, "utf8"));
const t = invoiceTotals(order.items, order);

console.log(`Subtotal: ${formatCents(t.subtotal)}`);
if (t.discount) console.log(`Discount: -${formatCents(t.discount)}`);
if (t.tax) console.log(`Tax:      ${formatCents(t.tax)}`);
console.log(`Totall:   ${formatCents(t.total)}`);
