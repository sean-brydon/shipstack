import { test } from "node:test";
import assert from "node:assert/strict";
import { invoiceTotals, formatCents } from "../src/invoice.js";

test("sums line items", () => {
  const t = invoiceTotals([{ price: 2.5, qty: 2 }, { price: 1, qty: 1 }]);
  assert.equal(t.total, 600);
});

test("applies tax", () => {
  const t = invoiceTotals([{ price: 10, qty: 1 }], { taxPercent: 10 });
  assert.equal(t.total, 1100);
});

test("formats cents", () => {
  assert.equal(formatCents(1234), "$12.34");
});
