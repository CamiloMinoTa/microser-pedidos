import { OrderStatus } from '../value-objects/order-status';

export class Order {
  constructor(
    public readonly id: string,
    public readonly items: string[],
    public status: OrderStatus = 'pending',
  ) {}

  markProcessing() {
    this.status = 'processing';
  }

  markCompleted() {
    this.status = 'completed';
  }

  markFailed() {
    this.status = 'failed';
  }
}
