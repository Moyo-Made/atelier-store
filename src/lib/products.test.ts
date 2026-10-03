import assert from "node:assert/strict";
import { test } from "node:test";

import { getMaxQuantity, getStockState, MAX_MADE_TO_ORDER } from "./products";

test("getStockState words stock the way customers see it", () => {
  assert.deepEqual(getStockState({ stock: 0, madeToOrder: false }), {
    level: "out",
    label: "Sold out",
    available: false,
  });
  assert.deepEqual(getStockState({ stock: 1, madeToOrder: false }), {
    level: "low",
    label: "Only 1 left",
    available: true,
  });
  assert.deepEqual(getStockState({ stock: 3, madeToOrder: false }), {
    level: "low",
    label: "Only 3 left",
    available: true,
  });
  assert.deepEqual(getStockState({ stock: 4, madeToOrder: false }), {
    level: "in",
    label: "In stock",
    available: true,
  });
});

test("a made-to-order piece is available with no stock", () => {
  const state = getStockState({ stock: 0, madeToOrder: true });
  assert.equal(state.available, true);
  assert.equal(state.level, "made-to-order");
  assert.match(state.label, /^Made to order/);
});

test("getMaxQuantity is the stock, or the made-to-order limit", () => {
  assert.equal(getMaxQuantity({ stock: 0, madeToOrder: false }), 0);
  assert.equal(getMaxQuantity({ stock: 7, madeToOrder: false }), 7);
  assert.equal(getMaxQuantity({ stock: 0, madeToOrder: true }), MAX_MADE_TO_ORDER);
});
