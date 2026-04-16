export class CustomerId {
  constructor(private value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('CustomerId cannot be empty');
    }
  }

  toString(): string {
    return this.value;
  }

  equals(other: CustomerId): boolean {
    return this.value === other.value;
  }
}