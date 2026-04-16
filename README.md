# Microservicio de Pedidos

Proyecto basado en NestJS para gestionar pedidos, carrito e historial, con persistencia en MongoDB y un frontend inicial en React.

## Estructura

- `src/domain`: entidades y value objects.
- `src/application`: puertos y casos de uso.
- `src/infrastructure`: controladores HTTP, repositorios Mongo y schemas.
- `test`: pruebas HTTP del backend.
- `frontend`: app React + Vite para empezar el frontend.

## Backend

```bash
npm install
npm run start:dev
```

Si `3004` ya esta ocupado por Docker, corre Nest local en `3005`:

```bash
npm run start:dev:local
```

Variables principales:

- `MONGO_URI`: conexion MongoDB. Default `mongodb://localhost:27017/pedidos`
- `PORT`: puerto HTTP. Default `3004`

Puedes dejar la conexion en `.env`:

```bash
MONGO_URI=mongodb+srv://usuario:password@tu-cluster.mongodb.net/?retryWrites=true&w=majority
MONGO_DB_NAME=pedidos
PORT=3004
```

Validaciones ejecutadas:

```bash
npm run build
npm test
npm run test:e2e
```

## Docker

`docker compose` usa las variables de `.env`, incluyendo `MONGO_URI` para MongoDB Atlas.

Antes de levantar el contenedor, configura `.env` asi:

```bash
MONGO_URI=mongodb+srv://usuario:password@tu-cluster.mongodb.net/?retryWrites=true&w=majority
MONGO_DB_NAME=pedidos
PORT=3004
```

Checklist de Atlas:

- `Database Access`: crea un usuario con password
- `Network Access`: agrega tu IP o `0.0.0.0/0` para pruebas
- `Clusters > Connect > Drivers`: copia la cadena oficial `mongodb+srv://...`

Luego levanta:

```bash
docker compose up --build
```

La API queda disponible en `http://localhost:3004`.

## Frontend

```bash
npm --prefix frontend install
npm run start:frontend
```

El frontend detecta automaticamente este orden:

- `http://localhost:3004` para Docker
- `http://localhost:3005` para Nest local

Para produccion:

```bash
npm run build:frontend
```

Si quieres cambiar la URL del backend, usa `frontend/.env.example` como base:

```bash
VITE_API_URL=http://localhost:3004
VITE_API_FALLBACK_URL=http://localhost:3005
```

## Endpoints base

- `GET /`
- `GET /orders`
- `POST /orders`
- `GET /orders/:id`
- `GET /orders/user/:userId`
- `PATCH /orders/:id/status`
- `DELETE /orders/:id`
