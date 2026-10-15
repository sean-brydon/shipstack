export function toCents(dollars) {
  return Math.round(dollars * 100);
}

export function lineTotal(item) {
  return toCents(item.price) * item.qty;
}

export function invoiceTotals(items, { discountPercent = 0, taxPercent = 0 } = {}) {
  const subtotal = items.reduce((sum, item) => sum + lineTotal(item), 0);
  const discount = Math.floor((subtotal * discountPercent) / 100);
  const afterDiscount = subtotal - discount;
  const tax = Math.round((afterDiscount * taxPercent) / 100);
  return { subtotal, discount, tax, total: afterDiscount + tax };
}

export function formatCents(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}
