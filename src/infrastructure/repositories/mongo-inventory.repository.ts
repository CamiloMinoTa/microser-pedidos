import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Inventory as InventoryEntity,
  InventoryRepository,
} from '../../domain/ports/inventory.repository';
import { ProductId } from '../../domain/value-objects/product-id.value-object';
import { Quantity } from '../../domain/value-objects/quantity.value-object';
import { InventoryDocument } from './schemas/inventory.schema';

@Injectable()
export class MongoInventoryRepository implements InventoryRepository {
  constructor(
    @InjectModel('Inventory')
    private readonly inventoryModel: Model<InventoryDocument>,
  ) {}

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
    return inventoryDocs.map((doc) => this.mapToDomain(doc));
  }

  async update(
    id: string,
    inventory: Partial<InventoryEntity>,
  ): Promise<InventoryEntity | null> {
    const updateData = {
      ...this.mapPartialToPersistence(inventory),
      lastUpdated: new Date(),
    };

    const updatedDoc = await this.inventoryModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
    return updatedDoc ? this.mapToDomain(updatedDoc) : null;
  }

  async reserve(
    productId: ProductId,
    quantity: Quantity,
  ): Promise<InventoryEntity | null> {
    const amount = quantity.toNumber();
    const updatedDoc = await this.inventoryModel
      .findOneAndUpdate(
        {
          productId: productId.toString(),
          $expr: {
            $gte: [{ $subtract: ['$quantity', '$reservedQuantity'] }, amount],
          },
        },
        {
          $inc: { reservedQuantity: amount },
          $set: { lastUpdated: new Date() },
        },
        { new: true },
      )
      .exec();

    return updatedDoc ? this.mapToDomain(updatedDoc) : null;
  }

  async release(
    productId: ProductId,
    quantity: Quantity,
  ): Promise<InventoryEntity | null> {
    const amount = quantity.toNumber();
    const updatedDoc = await this.inventoryModel
      .findOneAndUpdate(
        {
          productId: productId.toString(),
          reservedQuantity: { $gte: amount },
        },
        {
          $inc: { reservedQuantity: -amount },
          $set: { lastUpdated: new Date() },
        },
        { new: true },
      )
      .exec();

    return updatedDoc ? this.mapToDomain(updatedDoc) : null;
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

  private mapPartialToPersistence(
    inventory: Partial<InventoryEntity>,
  ): Record<string, unknown> {
    const updateData: Record<string, unknown> = {};

    if (inventory.productId) {
      updateData.productId = inventory.productId.toString();
    }

    if (inventory.quantity) {
      updateData.quantity = inventory.quantity.toNumber();
    }

    if (inventory.reservedQuantity) {
      updateData.reservedQuantity = inventory.reservedQuantity.toNumber();
    }

    if (inventory.lastUpdated) {
      updateData.lastUpdated = inventory.lastUpdated;
    }

    return updateData;
  }
}
