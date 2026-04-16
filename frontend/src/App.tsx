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

type HealthStatus = 'idle' | 'checking' | 'online' | 'error';
type PersistenceStatus = 'idle' | 'checking' | 'verified' | 'error';
type BackendMode = 'detecting' | 'docker' | 'local' | 'custom' | 'offline';

const PRIMARY_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3004';
const FALLBACK_API_URL =
  import.meta.env.VITE_API_FALLBACK_URL || 'http://localhost:3005';
const API_CANDIDATES = Array.from(
  new Set([PRIMARY_API_URL, FALLBACK_API_URL].filter(Boolean)),
);

const initialForm = {
  customerId: '',
  productId: '',
  quantity: 1,
  price: 0,
};

function buildProbeOrder() {
  const stamp = Date.now();
  return {
    customerId: `atlas-check-${stamp}`,
    items: [
      {
        productId: `probe-${stamp}`,
        quantity: 1,
        price: 49,
      },
    ],
    totalAmount: 49,
  };
}

function getBackendMode(apiUrl: string): BackendMode {
  if (apiUrl.includes(':3004')) {
    return 'docker';
  }

  if (apiUrl.includes(':3005')) {
    return 'local';
  }

  return 'custom';
}

async function fetchWithTimeout(
  input: string,
  init?: RequestInit,
  timeoutMs = 3500,
) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export default function App() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [apiStatus, setApiStatus] = useState<HealthStatus>('idle');
  const [ordersStatus, setOrdersStatus] = useState<HealthStatus>('idle');
  const [persistenceStatus, setPersistenceStatus] =
    useState<PersistenceStatus>('idle');
  const [healthMessage, setHealthMessage] = useState('Sin revisar');
  const [lastSync, setLastSync] = useState('');
  const [lastProbeId, setLastProbeId] = useState('');
  const [activeApiUrl, setActiveApiUrl] = useState('');
  const [backendMode, setBackendMode] = useState<BackendMode>('detecting');

  async function detectBackend() {
    setApiStatus('checking');
    setBackendMode('detecting');

    const candidates = Array.from(
      new Set([activeApiUrl, ...API_CANDIDATES].filter(Boolean)),
    );
    let lastError: Error | null = null;

    for (const apiUrl of candidates) {
      try {
        const response = await fetchWithTimeout(`${apiUrl}/`);
        if (!response.ok) {
          throw new Error(`El backend en ${apiUrl} respondio con error`);
        }

        const message = await response.text();
        setActiveApiUrl(apiUrl);
        setBackendMode(getBackendMode(apiUrl));
        setApiStatus('online');
        setHealthMessage(message);
        return { apiUrl, message };
      } catch (err) {
        lastError = err instanceof Error ? err : new Error('No se pudo conectar');
      }
    }

    setActiveApiUrl('');
    setBackendMode('offline');
    setApiStatus('error');
    throw (
      lastError ??
      new Error(
        `No se encontro backend disponible en ${API_CANDIDATES.join(' o ')}`,
      )
    );
  }

  async function fetchOrders(apiUrl?: string) {
    setOrdersStatus('checking');

    try {
      const targetApiUrl = apiUrl || activeApiUrl || (await detectBackend()).apiUrl;
      const response = await fetchWithTimeout(`${targetApiUrl}/orders`);
      if (!response.ok) {
        throw new Error('No se pudieron cargar los pedidos');
      }

      const data = (await response.json()) as Order[];
      setOrders(data);
      setOrdersStatus('online');
      setLastSync(new Date().toLocaleString('es-CO'));
      setActiveApiUrl(targetApiUrl);
      return { apiUrl: targetApiUrl, data };
    } catch (err) {
      setOrdersStatus('error');
      throw err instanceof Error ? err : new Error('Error inesperado');
    }
  }

  async function createOrder(payload: {
    customerId: string;
    items: OrderItem[];
    totalAmount: number;
  }) {
    const targetApiUrl = activeApiUrl || (await detectBackend()).apiUrl;
    const response = await fetchWithTimeout(`${targetApiUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = (await response.json()) as { message?: string };
      throw new Error(body.message || 'No se pudo crear el pedido');
    }

    setActiveApiUrl(targetApiUrl);
    return {
      apiUrl: targetApiUrl,
      order: (await response.json()) as Order,
    };
  }

  async function refreshDashboard() {
    try {
      setLoading(true);
      setError('');
      const { apiUrl } = await detectBackend();
      await fetchOrders(apiUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshDashboard();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');
      setPersistenceStatus('checking');

      const item = {
        productId: form.productId,
        quantity: Number(form.quantity),
        price: Number(form.price),
      };

      const { apiUrl, order } = await createOrder({
        customerId: form.customerId,
        items: [item],
        totalAmount: item.quantity * item.price,
      });

      const updatedOrders = (await fetchOrders(apiUrl)).data;
      const persisted = updatedOrders.some((currentOrder) => currentOrder.id === order.id);

      if (!persisted) {
        setPersistenceStatus('error');
        throw new Error('El pedido se creo pero no reaparecio al recargar');
      }

      setPersistenceStatus('verified');
      setLastProbeId(order.id);
      setSuccess(
        `Pedido ${order.id} guardado y confirmado desde la base de datos usando ${apiUrl}.`,
      );
      setForm(initialForm);
    } catch (err) {
      setPersistenceStatus('error');
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setSubmitting(false);
    }
  }

  async function runVerification() {
    try {
      setVerifying(true);
      setError('');
      setSuccess('');
      setPersistenceStatus('checking');

      const { apiUrl } = await detectBackend();
      const beforeOrders = (await fetchOrders(apiUrl)).data;
      const probeOrder = buildProbeOrder();
      const createdOrder = (await createOrder(probeOrder)).order;
      const afterOrders = (await fetchOrders(apiUrl)).data;
      const persisted = afterOrders.some((order) => order.id === createdOrder.id);

      if (!persisted) {
        setPersistenceStatus('error');
        throw new Error('La API respondio, pero el pedido no quedo persistido');
      }

      setPersistenceStatus('verified');
      setLastProbeId(createdOrder.id);
      setSuccess(
        `Verificacion completa: backend ${apiUrl} OK y pedido ${createdOrder.id} guardado en Atlas. Antes habia ${beforeOrders.length} pedidos y ahora ${afterOrders.length}.`,
      );
    } catch (err) {
      setPersistenceStatus('error');
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setVerifying(false);
    }
  }

  const metrics = [
    {
      label: 'Backend activo',
      value:
        backendMode === 'docker'
          ? 'Docker 3004'
          : backendMode === 'local'
            ? 'Local 3005'
            : backendMode === 'custom'
              ? 'Custom'
              : backendMode === 'detecting'
                ? 'Buscando'
                : 'Sin conexion',
      tone: apiStatus === 'online' ? 'good' : apiStatus === 'error' ? 'bad' : 'neutral',
      detail: activeApiUrl || 'Sin backend activo',
    },
    {
      label: 'API Nest',
      value:
        apiStatus === 'online'
          ? 'En linea'
          : apiStatus === 'checking'
            ? 'Verificando'
            : apiStatus === 'error'
              ? 'Con error'
              : 'Sin revisar',
      tone: apiStatus === 'online' ? 'good' : apiStatus === 'error' ? 'bad' : 'neutral',
      detail: `GET / -> ${healthMessage}`,
    },
    {
      label: 'Pedidos cargados',
      value: loading ? 'Cargando' : String(orders.length),
      tone:
        ordersStatus === 'online' ? 'good' : ordersStatus === 'error' ? 'bad' : 'neutral',
      detail: lastSync ? `Ultima sincronizacion: ${lastSync}` : 'Sin sincronizar',
    },
    {
      label: 'Persistencia Atlas',
      value:
        persistenceStatus === 'verified'
          ? 'Confirmada'
          : persistenceStatus === 'checking'
            ? 'Probando'
            : persistenceStatus === 'error'
              ? 'Con error'
              : 'Pendiente',
      tone:
        persistenceStatus === 'verified'
          ? 'good'
          : persistenceStatus === 'error'
            ? 'bad'
            : 'neutral',
      detail: lastProbeId ? `Ultimo pedido verificado: ${lastProbeId}` : 'Sin pedido de prueba',
    },
  ];

  return (
    <main className="page">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Microservicio de pedidos</p>
          <h1>Panel para verificar backend y MongoDB Atlas</h1>
          <p className="lead">
            El frontend detecta automaticamente si el backend activo es Docker en
            `3004` o Nest local en `3005`, y luego prueba que los pedidos se
            guarden y reaparezcan al leerlos desde la base de datos.
          </p>
        </div>

        <div className="hero-actions">
          <button
            className="secondary"
            disabled={verifying}
            onClick={() => void runVerification()}
            type="button"
          >
            {verifying ? 'Probando backend...' : 'Verificar backend y Atlas'}
          </button>
          <button onClick={() => void refreshDashboard()} type="button">
            Recargar panel
          </button>
        </div>
      </section>

      <section className="metrics">
        {metrics.map((metric) => (
          <article className={`metric-card metric-${metric.tone}`} key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small>{metric.detail}</small>
          </article>
        ))}
      </section>

      <section className="panel panel-highlight">
        <div className="panel-header">
          <div>
            <h2>Chequeo rapido</h2>
            <p>
              El panel intenta primero `http://localhost:3004` y si no responde,
              prueba `http://localhost:3005`.
            </p>
          </div>
        </div>

        <div className="checklist">
          <div>
            <span className={`badge badge-${apiStatus}`}>1</span>
            <p>Detectar automaticamente el backend disponible.</p>
          </div>
          <div>
            <span className={`badge badge-${ordersStatus}`}>2</span>
            <p>Cargar `GET /orders` y revisar que el endpoint responda.</p>
          </div>
          <div>
            <span className={`badge badge-${persistenceStatus}`}>3</span>
            <p>Crear un pedido y confirmar que reaparece al recargar desde Atlas.</p>
          </div>
        </div>

        {success ? <p className="success">{success}</p> : null}
        {error ? <p className="error">{error}</p> : null}
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Crear pedido manual</h2>
            <p>
              Tambien puedes crear pedidos propios y validar persistencia con el
              backend activo.
            </p>
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
            {submitting ? 'Guardando...' : 'Crear y verificar pedido'}
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Pedidos registrados</h2>
            <p>Fuente activa: {activeApiUrl || 'sin detectar'}</p>
          </div>
          <button className="secondary" onClick={() => void refreshDashboard()} type="button">
            Recargar pedidos
          </button>
        </div>

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
