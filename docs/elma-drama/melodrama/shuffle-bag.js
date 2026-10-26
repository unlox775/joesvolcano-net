/**
 * Shuffle-bag drawers for the Melodrama minigame.
 * Works in the browser (classic script) and in Node (module.exports).
 *
 * Draw without replacement from a shuffled bag. Reshuffle only when empty.
 * The first item of a new bag never equals the last item drawn from the old bag.
 * drawPair() always returns two different items, even if the bag refills mid-pair,
 * and prefers items that were not in the most recently shown pair.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.MelodramaBags = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function defaultId(item) {
    return item;
  }

  function fisherYates(arr, random) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function ShuffleBag(items, options) {
    if (!items || !items.length) {
      throw new Error("ShuffleBag needs at least one item");
    }
    options = options || {};
    this.items = items.slice();
    this.idOf = options.idOf || defaultId;
    this.random = options.random || Math.random;
    this.bag = [];
    this.lastId = null;
    this.recentIds = [];
  }

  ShuffleBag.prototype._refill = function () {
    this.bag = fisherYates(this.items.slice(), this.random);
    if (this.lastId == null || this.bag.length < 2) {
      return;
    }
    if (this.idOf(this.bag[0]) === this.lastId) {
      for (let i = 1; i < this.bag.length; i++) {
        if (this.idOf(this.bag[i]) !== this.lastId) {
          const tmp = this.bag[0];
          this.bag[0] = this.bag[i];
          this.bag[i] = tmp;
          break;
        }
      }
    }
  };

  ShuffleBag.prototype._takePreferred = function (avoidIds) {
    if (this.bag.length === 0) {
      this._refill();
    }
    let idx = 0;
    if (avoidIds && avoidIds.size) {
      const found = this.bag.findIndex(function (item) {
        return !avoidIds.has(this.idOf(item));
      }, this);
      if (found >= 0) {
        idx = found;
      }
    }
    const taken = this.bag.splice(idx, 1)[0];
    this.lastId = this.idOf(taken);
    return taken;
  };

  ShuffleBag.prototype.draw = function () {
    const item = this._takePreferred(null);
    this.recentIds = [this.lastId];
    return item;
  };

  /**
   * Draw two different items. Uses the same bag (no replacement).
   * If the bag empties after the first draw, the refill's first item
   * will not equal the first of the pair.
   * Items from the previous pair are avoided when alternatives remain.
   */
  ShuffleBag.prototype.drawPair = function () {
    const avoid = new Set(this.recentIds);
    const first = this._takePreferred(avoid);
    avoid.add(this.idOf(first));
    const second = this._takePreferred(avoid);
    if (this.idOf(first) === this.idOf(second)) {
      throw new Error("drawPair produced a matching pair");
    }
    this.recentIds = [this.idOf(first), this.idOf(second)];
    return [first, second];
  };

  ShuffleBag.prototype.remaining = function () {
    return this.bag.length;
  };

  return {
    ShuffleBag: ShuffleBag,
  };
});
