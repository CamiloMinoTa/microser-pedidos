import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Inventory as InventoryEntity } from '../../application/ports/inventory.repository';
import { InventoryRepository } from '../../application/ports/inventory.repository';
import { ProductId } from '../../domain/value-objects/product-id.value-object';
import { Quantity } from '../../domain/value-objects/quantity.value-object';
import { InventoryDocument } from './schemas/inventory.schema';

@Injectable()
export class MongoInventoryRepository implements InventoryRepository {
  constructor(@InjectModel('Inventory') private inventoryModel: Model<InventoryDocument>) {}

  async create(inventory: InventoryEntity): Promise<InventoryEntity> {
    const inventoryData = {
      productId: inventory.productId.toString(),
      quantity: inventory.quantity.toNumber(),
      reservedQuantity: inventory.reservedQuantity.toNumber(),
      lastUpdated: new Date(),
    };

    const createdInventory = new this.inventoryModel(inventoryData);
    const savedInventory = await createdInventory.save();
    return this.mapToDomain(savedInventory);
  }

  async findByProductId(productId: ProductId): Promise<InventoryEntity | null> {
    const inventoryDoc = await this.inventoryModel
      .findOne({ productId: productId.toString() })
      .exec();
    return inventoryDoc ? this.mapToDomain(inventoryDoc) : null;
  }

  async findAll(): Promise<InventoryEntity[]> {
    const inventoryDocs = await this.inventoryModel.find().exec();
    return inventoryDocs.map(doc => this.mapToDomain(doc));
  }

  async update(id: string, inventory: Partial<InventoryEntity>): Promise<InventoryEntity | null> {
    const updateData = {
      ...inventory,
      quantity: inventory.quantity?.toNumber(),
      reservedQuantity: inventory.reservedQuantity?.toNumber(),
      lastUpdated: new Date(),
    };

    const updatedDoc = await this.inventoryModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
    return updatedDoc ? this.mapToDomain(updatedDoc) : null;
  }

  async reserve(productId: ProductId, quantity: Quantity): Promise<InventoryEntity | null> {
    const inventory = await this.inventoryModel
      .findOne({ productId: productId.toString() })
      .exec();

    if (!inventory) {
      return null;
    }

    const available = inventory.quantity - inventory.reservedQuantity;
    if (available < quantity.toNumber()) {
      throw new Error('Insufficient inventory');
    }

    inventory.reservedQuantity += quantity.toNumber();
    inventory.lastUpdated = new Date();
    await inventory.save();
    return this.mapToDomain(inventory);
  }

  async release(productId: ProductId, quantity: Quantity): Promise<InventoryEntity | null> {
    const inventory = await this.inventoryModel
      .findOne({ productId: productId.toString() })
      .exec();

    if (!inventory) {
      return null;
    }

    inventory.reservedQuantity = Math.max(0, inventory.reservedQuantity - quantity.toNumber());
    inventory.lastUpdated = new Date();
    await inventory.save();
    return this.mapToDomain(inventory);
  }

  private mapToDomain(doc: InventoryDocument): InventoryEntity {
    return new InventoryEntity(
      doc._id.toString(),
      new ProductId(doc.productId),
      new Quantity(doc.quantity),
      new Quantity(doc.reservedQuantity),
      doc.lastUpdated,
    );
  }
}
