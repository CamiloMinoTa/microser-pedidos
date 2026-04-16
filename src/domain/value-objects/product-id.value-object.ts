export class ProductId {
  constructor(private value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('ProductId cannot be empty');
    }
  }

  toString(): string {
    return this.value;
  }

  equals(other: ProductId): boolean {
    return this.value === other.value;
  }
}