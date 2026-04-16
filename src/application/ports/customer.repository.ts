import { CustomerId } from '../../domain/value-objects/customer-id.value-object';

export class Customer {
  constructor(
    public id: CustomerId,
    public name: string,
    public email: string,
    public phone: string,
    public address: string,
    public createdAt: Date,
  ) {}
}

export const CUSTOMER_REPOSITORY = Symbol('CustomerRepository');

export interface CustomerRepository {
  create(customer: Customer): Promise<Customer>;
  findById(id: CustomerId): Promise<Customer | null>;
  findByEmail(email: string): Promise<Customer | null>;
  findAll(): Promise<Customer[]>;
  update(id: CustomerId, customer: Partial<Customer>): Promise<Customer | null>;
  delete(id: CustomerId): Promise<boolean>;
}