export default class Vector {
  constructor(items) {
    this.items = [...items];
  }

  subtract(other) {
    let result = [];
    for (let i = 0; i < this.items.length && i < other.items.length; i++) {
      result.push(this.items[i] - other.items[i]);
    }
    return new Vector(result);
  }

  add(other) {
    let result = [];
    for (let i = 0; i < this.items.length && i < other.items.length; i++) {
      result.push(this.items[i] + other.items[i]);
    }
    return new Vector(result);
  }

  scale(scalar) {
    let result = [];
    for (let i = 0; i < this.items.length; i++) {
      result.push(this.items[i] * scalar);
    }
    return new Vector(result);
  }

  equals(other) {
    if (other.items.length !== this.items.length) return false;
    for (let i = 0; i < this.items.length; i++) {
      if (this.items[i] !== other.items[i]) {
        return false;
      }
    }
    return true;
  }

  normalize() {
    let norm = 0;
    for (let i = 0; i < this.items.length; i++) {
      norm += this.items[i] * this.items[i];
    }
    if (norm === 0) return new Vector(this.items);
    let result = [];
    for (let i = 0; i < this.items.length; i++) {
      result.push(this.items[i] / norm);
    }
    return new Vector(result);
  }
}
