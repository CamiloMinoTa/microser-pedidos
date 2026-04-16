export class Quantity {
  constructor(private value: number) {
    if (value < 0) {
      throw new Error('Quantity cannot be negative');
    }
  }

  toNumber(): number {
    return this.value;
  }

  add(other: Quantity): Quantity {
    return new Quantity(this.value + other.value);
  }

  equals(other: Quantity): boolean {
    return this.value === other.value;
  }
}