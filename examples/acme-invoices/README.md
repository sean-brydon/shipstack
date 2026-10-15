# acme-invoices

Tiny invoice calculator. `npm test` runs the tests; `npm run invoice` prints the example order.

This is the demo app the shipstack docs record real `/shipit` runs against. It has a planted bug on purpose: a percentage discount floors the cents, so 15% off $59.97 shows $8.99 instead of $9.00. The CLI summary also says "Totall".
