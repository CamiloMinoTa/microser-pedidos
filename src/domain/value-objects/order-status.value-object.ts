export class OrderStatus {
  private static readonly VALID_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

  constructor(private value: string) {
    if (!OrderStatus.VALID_STATUSES.includes(value)) {
      throw new Error(`Invalid order status: ${value}`);
    }
  }

  toString(): string {
    return this.value;
  }

  equals(other: OrderStatus): boolean {
    return this.value === other.value;
  }

  static pending(): OrderStatus {
    return new OrderStatus('pending');
  }

  static confirmed(): OrderStatus {
    return new OrderStatus('confirmed');
  }

  static shipped(): OrderStatus {
    return new OrderStatus('shipped');
  }

  static delivered(): OrderStatus {
    return new OrderStatus('delivered');
  }

  static cancelled(): OrderStatus {
    return new OrderStatus('cancelled');
  }
}