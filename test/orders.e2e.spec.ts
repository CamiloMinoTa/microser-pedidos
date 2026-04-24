import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { CreateOrderUseCase } from './../src/application/use-cases/checkout/create-order.use-case';
import { CancelOrderUseCase } from './../src/application/use-cases/checkout/cancel-order.use-case';
import { UpdateOrderStatusUseCase } from './../src/application/use-cases/checkout/update-order-status.use-case';
import { GetOrderByIdUseCase } from './../src/application/use-cases/history/get-order-by-id.use-case';
import { GetUserOrderHistoryUseCase } from './../src/application/use-cases/history/get-user-order-history.use-case';
import { ORDER_REPOSITORY } from '../src/domain/ports/order.repository';
import { OrdersController } from './../src/infrastructure/controllers/orders.controller';

type PlainOrder = {
  id: string;
  customerId: string;
  totalAmount: number;
  status: string;
  items: Array<{ productId: string; quantity: number; price: number }>;
  createdAt: string;
};

describe('OrdersController (e2e)', () => {
  let app: INestApplication;
  let orders: PlainOrder[];

  beforeEach(async () => {
    orders = [];

    const orderRepository = {
      findAll: jest.fn(async () => orders),
    };

    const createOrderUseCase = {
      execute: jest.fn(async (payload: any) => {
        const createdOrder: PlainOrder = {
          id: `order-${orders.length + 1}`,
          customerId: payload.customerId.toString(),
          items: payload.items,
          totalAmount: payload.totalAmount,
          status: 'pending',
          createdAt: new Date().toISOString(),
        };

        orders.push(createdOrder);
        return createdOrder;
      }),
    };

    const getOrderByIdUseCase = {
      execute: jest.fn(async (id: string) => orders.find((order) => order.id === id) ?? null),
    };

    const getOrderHistoryUseCase = {
      execute: jest.fn(async (customerId: any) =>
        orders.filter((order) => order.customerId === customerId.toString()),
      ),
    };

    const updateOrderStatusUseCase = {
      execute: jest.fn(async (id: string, status: any) => {
        const order = orders.find((item) => item.id === id);
        if (!order) {
          return null;
        }

        order.status = status.toString();
        return order;
      }),
    };

    const cancelOrderUseCase = {
      execute: jest.fn(async (id: string) => {
        const originalLength = orders.length;
        orders = orders.filter((order) => order.id !== id);
        return orders.length !== originalLength;
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        { provide: CreateOrderUseCase, useValue: createOrderUseCase },
        { provide: CancelOrderUseCase, useValue: cancelOrderUseCase },
        { provide: UpdateOrderStatusUseCase, useValue: updateOrderStatusUseCase },
        { provide: GetOrderByIdUseCase, useValue: getOrderByIdUseCase },
        { provide: GetUserOrderHistoryUseCase, useValue: getOrderHistoryUseCase },
        { provide: ORDER_REPOSITORY, useValue: orderRepository },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('crea un pedido', async () => {
    const response = await request(app.getHttpServer())
      .post('/orders')
      .send({
        customerId: 'cust-123',
        items: [{ productId: 'prod-001', quantity: 2, price: 100 }],
        totalAmount: 200,
      })
      .expect(201);

    expect(response.body.customerId).toBe('cust-123');
    expect(response.body.totalAmount).toBe(200);
    expect(response.body.status).toBe('pending');
  });

  it('valida datos requeridos al crear', async () => {
    await request(app.getHttpServer()).post('/orders').send({}).expect(400);
  });

  it('lista pedidos', async () => {
    orders.push({
      id: 'order-1',
      customerId: 'cust-abc',
      items: [{ productId: 'prod-001', quantity: 1, price: 50 }],
      totalAmount: 50,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    const response = await request(app.getHttpServer()).get('/orders').expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(1);
  });

  it('obtiene un pedido por id', async () => {
    orders.push({
      id: 'order-2',
      customerId: 'cust-456',
      items: [{ productId: 'prod-002', quantity: 1, price: 50 }],
      totalAmount: 50,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    const response = await request(app.getHttpServer()).get('/orders/order-2').expect(200);

    expect(response.body.id).toBe('order-2');
  });

  it('retorna 404 cuando el pedido no existe', async () => {
    await request(app.getHttpServer()).get('/orders/no-existe').expect(404);
  });

  it('retorna pedidos por usuario sin chocar con la ruta por id', async () => {
    orders.push({
      id: 'order-3',
      customerId: 'cust-user',
      items: [{ productId: 'prod-003', quantity: 3, price: 20 }],
      totalAmount: 60,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    const response = await request(app.getHttpServer())
      .get('/orders/user/cust-user')
      .expect(200);

    expect(response.body).toHaveLength(1);
    expect(response.body[0].customerId).toBe('cust-user');
  });

  it('actualiza el estado de un pedido', async () => {
    orders.push({
      id: 'order-4',
      customerId: 'cust-789',
      items: [{ productId: 'prod-004', quantity: 1, price: 75 }],
      totalAmount: 75,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    const response = await request(app.getHttpServer())
      .patch('/orders/order-4/status')
      .send({ status: 'confirmed' })
      .expect(200);

    expect(response.body.status).toBe('confirmed');
  });

  it('elimina un pedido', async () => {
    orders.push({
      id: 'order-5',
      customerId: 'cust-999',
      items: [{ productId: 'prod-005', quantity: 1, price: 100 }],
      totalAmount: 100,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    const response = await request(app.getHttpServer())
      .delete('/orders/order-5')
      .expect(200);

    expect(response.body).toEqual({ deleted: true });
  });
});
