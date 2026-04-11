# Microservicio de Pedidos

Este es un microservicio para la gestión de pedidos, desarrollado con **Nest.js** y **TypeScript**. Utiliza una arquitectura hexagonal (Domain-Driven Design) para mantener la separación de responsabilidades y facilitar el mantenimiento y escalabilidad.

## Arquitectura

El proyecto está estructurado en las siguientes capas:

- **Domain**: Contiene las entidades de negocio, interfaces de repositorio y objetos de valor.
  - `entities/order.entity.ts`: Entidad principal del pedido.
  - `interfaces/order.repository.ts`: Interfaz para el repositorio de pedidos.
  - `value-objects/order-status.ts`: Objeto de valor para el estado del pedido.

- **Application**: Lógica de aplicación, controladores y servicios.
  - `orders.controller.ts`: Controlador REST para operaciones de pedidos.
  - `orders.service.ts`: Servicio de aplicación para lógica de negocio.
  - `dto/create-order.dto.ts`: DTO para crear pedidos.

- **Infrastructure**: Implementaciones concretas, como repositorios.
  - `in-memory-order.repository.ts`: Repositorio en memoria para pedidos.

- **Saga**: Servicio de saga para orquestar procesos complejos.
  - `order-saga.service.ts`: Servicio para manejar sagas de pedidos.

## Tecnologías

- **Nest.js**: Framework para Node.js.
- **TypeScript**: Lenguaje de programación.
- **Jest**: Para pruebas unitarias y e2e.

## Instalación

```bash
npm install
```

## Ejecución

```bash
# Desarrollo
npm run start

# Modo watch
npm run start:dev

# Producción
npm run start:prod
```

## Pruebas

```bash
# Pruebas unitarias
npm run test

# Pruebas e2e
npm run test:e2e

# Cobertura
npm run test:cov
```

## Endpoints

- `GET /orders`: Obtener todos los pedidos.
- `POST /orders`: Crear un nuevo pedido.
- `GET /orders/:id`: Obtener un pedido por ID.
- `PUT /orders/:id`: Actualizar un pedido.
- `DELETE /orders/:id`: Eliminar un pedido.

## Contribución

Para contribuir, por favor sigue las guías de estilo y envía un pull request.

## Licencia

Este proyecto está bajo la licencia MIT.
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
