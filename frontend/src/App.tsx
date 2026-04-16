import { FormEvent, useEffect, useState } from 'react';

type OrderItem = {
  productId: string;
  quantity: number;
  price: number;
};

type Order = {
  id: string;
  customerId: string;
  totalAmount: number;
  status: string;
  items: OrderItem[];
  createdAt: string;
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3004';

const initialForm = {
  customerId: '',
  productId: '',
  quantity: 1,
  price: 0,
};

export default function App() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function loadOrders() {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${API_URL}/orders`);
      if (!response.ok) {
        throw new Error('No se pudieron cargar los pedidos');
      }

      const data = (await response.json()) as Order[];
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadOrders();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError('');

      const item = {
        productId: form.productId,
        quantity: Number(form.quantity),
        price: Number(form.price),
      };

      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: form.customerId,
          items: [item],
          totalAmount: item.quantity * item.price,
        }),
      });

      if (!response.ok) {
        const body = (await response.json()) as { message?: string };
        throw new Error(body.message || 'No se pudo crear el pedido');
      }

      setForm(initialForm);
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">Microservicio de pedidos</p>
        <h1>Frontend inicial para gestionar pedidos</h1>
        <p className="lead">
          Vista base para crear pedidos y consultar el historial actual del
          backend Nest.
        </p>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Crear pedido</h2>
            <p>Usa un item por pedido para arrancar el flujo del frontend.</p>
          </div>
        </div>

        <form className="order-form" onSubmit={handleSubmit}>
          <label>
            Cliente
            <input
              required
              value={form.customerId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  customerId: event.target.value,
                }))
              }
              placeholder="cust-001"
            />
          </label>

          <label>
            Producto
            <input
              required
              value={form.productId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  productId: event.target.value,
                }))
              }
              placeholder="prod-001"
            />
          </label>

          <label>
            Cantidad
            <input
              min="1"
              required
              type="number"
              value={form.quantity}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  quantity: Number(event.target.value),
                }))
              }
            />
          </label>

          <label>
            Precio
            <input
              min="0"
              required
              step="0.01"
              type="number"
              value={form.price}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  price: Number(event.target.value),
                }))
              }
            />
          </label>

          <button disabled={submitting} type="submit">
            {submitting ? 'Creando...' : 'Crear pedido'}
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Pedidos registrados</h2>
            <p>Fuente: {API_URL}/orders</p>
          </div>
          <button className="secondary" onClick={() => void loadOrders()} type="button">
            Recargar
          </button>
        </div>

        {error ? <p className="error">{error}</p> : null}
        {loading ? <p className="muted">Cargando pedidos...</p> : null}

        {!loading && orders.length === 0 ? (
          <p className="muted">Todavia no hay pedidos creados.</p>
        ) : null}

        <div className="orders-grid">
          {orders.map((order) => (
            <article className="order-card" key={order.id}>
              <div className="order-card-header">
                <span className={`status status-${order.status}`}>{order.status}</span>
                <strong>{order.customerId}</strong>
              </div>
              <p className="amount">${order.totalAmount}</p>
              <ul>
                {order.items.map((item) => (
                  <li key={`${order.id}-${item.productId}`}>
                    {item.productId} x {item.quantity} @ ${item.price}
                  </li>
                ))}
              </ul>
              <small>{new Date(order.createdAt).toLocaleString('es-CO')}</small>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
