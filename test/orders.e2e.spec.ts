import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { MongoMemoryServer } from 'mongodb-memory-server';

describe('Orders Microservice E2E (MongoDB Real)', () => {
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    // Iniciar MongoDB en memoria para testing
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('MONGO_URI')
      .useValue(mongoUri)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    if (mongoServer) await mongoServer.stop();
  });

  describe('Crear Pedido (POST /orders)', () => {
    it('Debe crear un nuevo pedido con MongoDB real', async () => {
      const createOrderDto = {
        customerId: 'cust-123',
        items: [
          {
            productId: 'prod-001',
            quantity: 2,
            price: 100,
          },
        ],
        totalAmount: 200,
      };

      const response = await request(app.getHttpServer())
        .post('/orders')
        .send(createOrderDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.customerId).toBe('cust-123');
      expect(response.body.totalAmount).toBe(200);
      expect(response.body.status).toBe('pending');
    });

    it('Debe fallar sin datos requeridos', async () => {
      await request(app.getHttpServer())
        .post('/orders')
        .send({})
        .expect(400);
    });
  });

  describe('Obtener Pedido (GET /orders/:id)', () => {
    let orderId: string;

    beforeAll(async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/orders')
        .send({
          customerId: 'cust-456',
          items: [{ productId: 'prod-002', quantity: 1, price: 50 }],
          totalAmount: 50,
        });
      orderId = createResponse.body.id;
    });

    it('Debe obtener un pedido existente', async () => {
      const response = await request(app.getHttpServer())
        .get(`/orders/${orderId}`)
        .expect(200);

      expect(response.body.id).toBe(orderId);
      expect(response.body.customerId).toBe('cust-456');
    });

    it('Debe retornar 404 para pedido inexistente', async () => {
      await request(app.getHttpServer())
        .get('/orders/nonexistent-id')
        .expect(404);
    });
  });

  describe('Listar Pedidos (GET /orders)', () => {
    it('Debe retornar lista de pedidos', async () => {
      const response = await request(app.getHttpServer())
        .get('/orders')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Actualizar Estado de Pedido (PATCH /orders/:id/status)', () => {
    let orderId: string;

    beforeAll(async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/orders')
        .send({
          customerId: 'cust-789',
          items: [{ productId: 'prod-003', quantity: 1, price: 75 }],
          totalAmount: 75,
        });
      orderId = createResponse.body.id;
    });

    it('Debe actualizar el estado del pedido', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/orders/${orderId}/status`)
        .send({ status: 'confirmed' })
        .expect(200);

      expect(response.body.status).toBe('confirmed');
    });
  });

  describe('Cancelar Pedido (DELETE /orders/:id)', () => {
    let orderId: string;

    beforeAll(async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/orders')
        .send({
          customerId: 'cust-999',
          items: [{ productId: 'prod-004', quantity: 1, price: 100 }],
          totalAmount: 100,
        });
      orderId = createResponse.body.id;
    });

    it('Debe cancelar (eliminar) un pedido', async () => {
      await request(app.getHttpServer())
        .delete(`/orders/${orderId}`)
        .expect(200);

      // Verificar que fue eliminado
      await request(app.getHttpServer())
        .get(`/orders/${orderId}`)
        .expect(404);
    });
  });
});
