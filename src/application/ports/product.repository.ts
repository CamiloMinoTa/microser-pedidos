import { Product } from '../../domain/entities/product.entity';

export const PRODUCT_REPOSITORY = Symbol('ProductRepository');

export interface ProductRepository {
  create(product: Product): Promise<Product>;
  findById(id: string): Promise<Product | null>;
  findByCategory(category: string): Promise<Product[]>;
  findAll(): Promise<Product[]>;
  update(id: string, product: Partial<Product>): Promise<Product | null>;
  delete(id: string): Promise<boolean>;
  decreaseStock(id: string, quantity: number): Promise<Product | null>;
}