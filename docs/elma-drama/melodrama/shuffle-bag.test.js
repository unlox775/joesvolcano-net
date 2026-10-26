/**
 * Node test for Melodrama shuffle-bags.
 * Run: node docs/elma-drama/melodrama/shuffle-bag.test.js
 */
"use strict";

const assert = require("assert");
const { ShuffleBag } = require("./shuffle-bag.js");

const LINES = [
  { character: "A", line: "one" },
  { character: "B", line: "two" },
  { character: "C", line: "three" },
  { character: "D", line: "four" },
  { character: "E", line: "five" },
  { character: "F", line: "six" },
];

const EMOTIONS = [
  "Sleepy",
  "Happy",
  "Scared",
  "Angry",
  "Bored",
  "Heartbroken",
  "Suspicious",
  "Villain",
];

function ids(items, idOf) {
  return items.map(idOf || ((x) => x));
}

function assertBagWindows(draws, bagSize, bags, idOf) {
  const ident = idOf || ((x) => x);
  assert.strictEqual(draws.length, bagSize * bags, "draw count");
  for (let b = 0; b < bags; b++) {
    const window = draws.slice(b * bagSize, (b + 1) * bagSize).map(ident);
    const unique = new Set(window);
    assert.strictEqual(
      unique.size,
      bagSize,
      "bag " + b + " must contain each item once, got " + window.join(", ")
    );
  }
  for (let b = 1; b < bags; b++) {
    const lastOfOld = ident(draws[b * bagSize - 1]);
    const firstOfNew = ident(draws[b * bagSize]);
    assert.notStrictEqual(
      firstOfNew,
      lastOfOld,
      "bag " + b + " starts with the last item of the previous bag"
    );
  }
}

function testLineBags() {
  const trials = 50;
  for (let t = 0; t < trials; t++) {
    const bag = new ShuffleBag(LINES, { idOf: (item) => item.line });
    const draws = [];
    for (let i = 0; i < LINES.length * 3; i++) {
      draws.push(bag.draw());
    }
    assertBagWindows(draws, LINES.length, 3, (item) => item.line);
  }
}

function testEmotionPairsThreeBags() {
  const trials = 50;
  for (let t = 0; t < trials; t++) {
    const bag = new ShuffleBag(EMOTIONS);
    const pairs = [];
    const flat = [];
    // 3 full bags of 8 = 12 pairs
    for (let i = 0; i < (EMOTIONS.length * 3) / 2; i++) {
      const pair = bag.drawPair();
      assert.strictEqual(pair.length, 2, "pair length");
      assert.notStrictEqual(
        pair[0],
        pair[1],
        "pair must be two different emotions, got " + pair.join(" / ")
      );
      pairs.push(pair);
      flat.push(pair[0], pair[1]);
    }
    assertBagWindows(flat, EMOTIONS.length, 3);

    // Consecutive pairs should avoid recently shown emotions when possible.
    // After a refill (every 4 pairs) the new pair must not reuse either
    // emotion from the previous pair if alternatives exist (they do: 8-2=6).
    for (let i = 1; i < pairs.length; i++) {
      const prev = pairs[i - 1];
      const next = pairs[i];
      const overlap = next.filter((e) => prev.indexOf(e) !== -1);
      // Within a bag, leftover items are never the previous pair, so overlap
      // must be empty. At a bag boundary the recent-avoid rule also forbids it.
      assert.strictEqual(
        overlap.length,
        0,
        "pair " +
          i +
          " reuses recent emotion(s) " +
          overlap.join(", ") +
          " from " +
          prev.join(" / ")
      );
    }
  }
}

function testOddBagPairAcrossRefill() {
  // 5 unique items: pairs will refill mid-draw on the 3rd, 6th, ... pair.
  const items = ["a", "b", "c", "d", "e"];
  const trials = 80;
  for (let t = 0; t < trials; t++) {
    const bag = new ShuffleBag(items);
    const pairs = [];
    const flat = [];
    for (let i = 0; i < 9; i++) {
      const pair = bag.drawPair();
      assert.notStrictEqual(
        pair[0],
        pair[1],
        "odd-bag pair must still differ across a refill boundary: " + pair.join("/")
      );
      pairs.push(pair);
      flat.push(pair[0], pair[1]);
    }
    // First-of-new-bag != last-of-old-bag, measured on the flat draw stream.
    // Bag size 5: boundaries at indexes 5, 10, 15, ...
    for (let b = 1; b < 3; b++) {
      assert.notStrictEqual(
        flat[b * items.length],
        flat[b * items.length - 1],
        "odd-bag refill boundary repeat at bag " + b
      );
    }
  }
}

function testSingleItemBagThrowsOnPair() {
  const bag = new ShuffleBag(["only"]);
  assert.throws(function () {
    bag.drawPair();
  }, /matching pair/);
}

testLineBags();
testEmotionPairsThreeBags();
testOddBagPairAcrossRefill();
testSingleItemBagThrowsOnPair();

console.log("shuffle-bag tests passed");
