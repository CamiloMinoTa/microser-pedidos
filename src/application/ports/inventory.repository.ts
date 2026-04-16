import { ProductId } from '../../domain/value-objects/product-id.value-object';
import { Quantity } from '../../domain/value-objects/quantity.value-object';

export class Inventory {
  constructor(
    public id: string,
    public productId: ProductId,
    public quantity: Quantity,
    public reservedQuantity: Quantity,
    public lastUpdated: Date,
  ) {}

  getAvailableQuantity(): Quantity {
    const available = this.quantity.toNumber() - this.reservedQuantity.toNumber();
    return new Quantity(available);
  }
}

export const INVENTORY_REPOSITORY = Symbol('InventoryRepository');

export interface InventoryRepository {
  create(inventory: Inventory): Promise<Inventory>;
  findByProductId(productId: ProductId): Promise<Inventory | null>;
  findAll(): Promise<Inventory[]>;
  update(id: string, inventory: Partial<Inventory>): Promise<Inventory | null>;
  reserve(productId: ProductId, quantity: Quantity): Promise<Inventory | null>;
  release(productId: ProductId, quantity: Quantity): Promise<Inventory | null>;
}