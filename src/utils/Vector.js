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

  normalize() {
    let norm = 0;
    for (let i = 0; i < this.items.length; i++) {
      norm += this.items[i] * this.items[i];
    }
    let result = [];
    for (let i = 0; i < this.items.length; i++) {
      result.push(this.items[i] / norm);
    }
    return new Vector(result);
  }
}
