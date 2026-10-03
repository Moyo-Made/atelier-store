import assert from "node:assert/strict";
import { test } from "node:test";

import { checkStock, isId, isStockFigure, readStockForm } from "./admin";

test("checkStock accepts whole numbers from 0 to 100,000", () => {
  assert.equal(checkStock("0"), 0);
  assert.equal(checkStock(" 5 "), 5);
  assert.equal(checkStock("007"), 7);
  assert.equal(checkStock("100000"), 100_000);
});

test("checkStock refuses anything else rather than rounding it", () => {
  for (const value of ["", " ", "-1", "+1", "1.5", "1e3", "abc", "5 units", "100001", "9999999999", "５"]) {
    assert.equal(checkStock(value), null, `"${value}"`);
  }
});

test("readStockForm reads the stock field as text", () => {
  const typed = new FormData();
  typed.set("stock", "12");
  assert.equal(readStockForm(typed), "12");

  assert.equal(readStockForm(new FormData()), "");

  const file = new FormData();
  file.set("stock", new Blob(["12"]));
  assert.equal(readStockForm(file), "");
});

test("isId accepts only a positive integer the database can hold", () => {
  assert.equal(isId(1), true);
  assert.equal(isId(2_147_483_647), true);
  for (const value of [0, -1, 1.5, 2_147_483_648, NaN, Infinity, "1", null, undefined, {}]) {
    assert.equal(isId(value), false, String(value));
  }
});

test("isStockFigure accepts zero and up, within what the database can hold", () => {
  assert.equal(isStockFigure(0), true);
  assert.equal(isStockFigure(2_147_483_647), true);
  for (const value of [-1, 0.5, 2_147_483_648, NaN, "0", null, undefined]) {
    assert.equal(isStockFigure(value), false, String(value));
  }
});
