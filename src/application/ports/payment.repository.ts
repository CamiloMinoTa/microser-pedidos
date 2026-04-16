import { OrderId } from '../../domain/value-objects/order-id.value-object';
import { Money } from '../../domain/value-objects/money.value-object';

export class Payment {
  constructor(
    public id: string,
    public orderId: OrderId,
    public amount: Money,
    public status: 'pending' | 'completed' | 'failed',
    public paymentMethod: string,
    public transactionId: string,
    public createdAt: Date,
  ) {}
}

export const PAYMENT_REPOSITORY = Symbol('PaymentRepository');

export interface PaymentRepository {
  create(payment: Payment): Promise<Payment>;
  findById(id: string): Promise<Payment | null>;
  findByOrderId(orderId: OrderId): Promise<Payment | null>;
  findAll(): Promise<Payment[]>;
  update(id: string, payment: Partial<Payment>): Promise<Payment | null>;
  delete(id: string): Promise<boolean>;
}