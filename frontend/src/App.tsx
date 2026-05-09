import { FormEvent, useEffect, useMemo, useState } from 'react';

type CartItem = {
  productId: string;
  quantity: number;
  price: number;
};

type Cart = {
  id: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
};

type Order = {
  id: string;
  customerId: string;
  items: CartItem[];
  totalAmount: number;
  status: string;
  createdAt: string;
};

type Notice = {
  type: 'ok' | 'error' | 'info';
  text: string;
};

const API_CANDIDATES = [
  import.meta.env.VITE_API_URL || 'http://localhost:3004',
  import.meta.env.VITE_API_FALLBACK_URL || 'http://localhost:3005',
];

const statusOptions = [
  'pending',
  'confirmed',
  'shipped',
  'delivered',
  'cancelled',
];

const defaultCustomer = `cust-${Date.now()}`;

function totalFromItems(items: CartItem[]) {
  return items.reduce((total, item) => total + item.quantity * item.price, 0);
}

async function request<T>(
  apiUrl: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const body = (await response.json()) as { message?: string };
      message = body.message || message;
    } catch {
      message = await response.text();
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export default function App() {
  const [apiUrl, setApiUrl] = useState(API_CANDIDATES[0]);
  const [apiOnline, setApiOnline] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>({
    type: 'info',
    text: 'Listo para probar el backend.',
  });

  const [customerId, setCustomerId] = useState(defaultCustomer);
  const [productId, setProductId] = useState('prod-001');
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(25);
  const [cart, setCart] = useState<Cart | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('confirmed');
  const [reserveInventory, setReserveInventory] = useState(false);
  const [clearCartAfterCheckout, setClearCartAfterCheckout] = useState(true);

  const cartTotal = useMemo(() => totalFromItems(cart?.items || []), [cart]);

  async function detectApi() {
    for (const candidate of API_CANDIDATES) {
      try {
        const response = await fetch(`${candidate}/`);
        if (response.ok) {
          setApiUrl(candidate);
          setApiOnline(true);
          setNotice({ type: 'ok', text: `Backend activo en ${candidate}` });
          return candidate;
        }
      } catch {
        // Try next candidate.
      }
    }

    setApiOnline(false);
    throw new Error('No encontre backend en 3004 ni 3005.');
  }

  async function withBusy(action: () => Promise<void>) {
    try {
      setBusy(true);
      await action();
    } catch (error) {
      setNotice({
        type: 'error',
        text: error instanceof Error ? error.message : 'Error inesperado',
      });
    } finally {
      setBusy(false);
    }
  }

  async function loadCart(targetCustomer = customerId) {
    const data = await request<Cart>(apiUrl, `/cart/${targetCustomer}`);
    setCart(data);
    setCustomerId(targetCustomer);
    setNotice({
      type: 'ok',
      text: `Carrito cargado: ${data.items.length} item(s)`,
    });
  }

  async function addItem(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    await withBusy(async () => {
      const data = await request<Cart>(apiUrl, `/cart/${customerId}/items`, {
        method: 'POST',
        body: JSON.stringify({ productId, quantity, price }),
      });
      setCart(data);
      setNotice({ type: 'ok', text: 'Item agregado al carrito.' });
    });
  }

  async function updateItem(
    targetProductId = productId,
    targetQuantity = quantity,
  ) {
    await withBusy(async () => {
      const data = await request<Cart>(
        apiUrl,
        `/cart/${customerId}/items/${targetProductId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ quantity: targetQuantity }),
        },
      );
      setCart(data);
      setNotice({ type: 'ok', text: 'Cantidad actualizada.' });
    });
  }

  async function removeItem(targetProductId = productId) {
    await withBusy(async () => {
      const data = await request<Cart>(
        apiUrl,
        `/cart/${customerId}/items/${targetProductId}`,
        { method: 'DELETE' },
      );
      setCart(data);
      setNotice({ type: 'ok', text: 'Item eliminado.' });
    });
  }

  async function clearCart() {
    await withBusy(async () => {
      await request<{ cleared: boolean }>(apiUrl, `/cart/${customerId}`, {
        method: 'DELETE',
      });
      setCart(null);
      setNotice({ type: 'ok', text: 'Carrito limpiado.' });
    });
  }

  async function loadOrders(path = '/orders') {
    const data = await request<Order[]>(apiUrl, path);
    setOrders(data);
    setNotice({ type: 'ok', text: `${data.length} pedido(s) cargado(s).` });
  }

  async function checkoutFromCart() {
    await withBusy(async () => {
      const items = cart?.items || [];
      if (items.length === 0) {
        throw new Error('Agrega items al carrito antes del checkout.');
      }

      const order = await request<Order>(apiUrl, '/orders', {
        method: 'POST',
        body: JSON.stringify({
          customerId,
          items,
          totalAmount: totalFromItems(items),
          reserveInventory,
          clearCart: clearCartAfterCheckout,
        }),
      });

      setSelectedOrderId(order.id);
      if (clearCartAfterCheckout) {
        setCart(null);
      }
      await loadOrders();
      setNotice({ type: 'ok', text: `Orden creada: ${order.id}` });
    });
  }

  async function getOrderById() {
    await withBusy(async () => {
      const order = await request<Order>(apiUrl, `/orders/${selectedOrderId}`);
      setOrders([order]);
      setNotice({ type: 'ok', text: `Orden encontrada: ${order.id}` });
    });
  }

  async function loadUserOrders() {
    await withBusy(async () => {
      await loadOrders(`/orders/user/${customerId}`);
    });
  }

  async function updateOrderStatus() {
    await withBusy(async () => {
      const order = await request<Order>(
        apiUrl,
        `/orders/${selectedOrderId}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status: selectedStatus }),
        },
      );
      setOrders((current) =>
        current.map((item) => (item.id === order.id ? order : item)),
      );
      setNotice({ type: 'ok', text: `Estado actualizado a ${order.status}.` });
    });
  }

  async function cancelOrder() {
    await withBusy(async () => {
      await request<{ deleted: boolean }>(
        apiUrl,
        `/orders/${selectedOrderId}`,
        {
          method: 'DELETE',
        },
      );
      setOrders((current) =>
        current.filter((order) => order.id !== selectedOrderId),
      );
      setNotice({ type: 'ok', text: 'Orden cancelada/eliminada.' });
    });
  }

  async function runSmokeTest() {
    await withBusy(async () => {
      const testCustomer = `smoke-${Date.now()}`;
      const testProduct = `sku-${Date.now()}`;
      setCustomerId(testCustomer);
      setProductId(testProduct);

      const added = await request<Cart>(apiUrl, `/cart/${testCustomer}/items`, {
        method: 'POST',
        body: JSON.stringify({
          productId: testProduct,
          quantity: 1,
          price: 10,
        }),
      });

      const updated = await request<Cart>(
        apiUrl,
        `/cart/${testCustomer}/items/${testProduct}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ quantity: 2 }),
        },
      );

      await request<Cart>(apiUrl, `/cart/${testCustomer}`);

      const order = await request<Order>(apiUrl, '/orders', {
        method: 'POST',
        body: JSON.stringify({
          customerId: testCustomer,
          items: updated.items,
          totalAmount: updated.totalAmount,
          clearCart: false,
        }),
      });

      await request<Order>(apiUrl, `/orders/${order.id}`);
      await request<Order[]>(apiUrl, `/orders/user/${testCustomer}`);
      await request<Order>(apiUrl, `/orders/${order.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'confirmed' }),
      });
      await request<{ deleted: boolean }>(apiUrl, `/orders/${order.id}`, {
        method: 'DELETE',
      });
      await request<Cart>(
        apiUrl,
        `/cart/${testCustomer}/items/${testProduct}`,
        {
          method: 'DELETE',
        },
      );
      await request<{ cleared: boolean }>(apiUrl, `/cart/${testCustomer}`, {
        method: 'DELETE',
      });

      setCart(added);
      await loadOrders();
      setNotice({
        type: 'ok',
        text: 'Prueba completa: carrito, checkout, historial, estado, cancelacion y limpieza.',
      });
    });
  }

  useEffect(() => {
    void withBusy(async () => {
      await detectApi();
      await loadOrders();
    });
  }, []);

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <h1>Pedidos QA</h1>
          <p>{apiOnline ? `Conectado a ${apiUrl}` : 'Backend sin detectar'}</p>
        </div>
        <div className="topbar-actions">
          <input
            aria-label="API URL"
            value={apiUrl}
            onChange={(event) => setApiUrl(event.target.value)}
          />
          <button
            disabled={busy}
            onClick={() => void detectApi()}
            type="button"
          >
            Detectar
          </button>
          <button
            disabled={busy}
            onClick={() => void runSmokeTest()}
            type="button"
          >
            Prueba completa
          </button>
        </div>
      </header>

      <section className={`notice ${notice.type}`}>{notice.text}</section>

      <section className="layout">
        <article className="panel">
          <div className="panel-head">
            <h2>Carrito</h2>
            <button
              disabled={busy}
              onClick={() => void loadCart()}
              type="button"
            >
              Cargar
            </button>
          </div>

          <form className="form-grid" onSubmit={addItem}>
            <label>
              Cliente
              <input
                required
                value={customerId}
                onChange={(event) => setCustomerId(event.target.value)}
              />
            </label>
            <label>
              Producto
              <input
                required
                value={productId}
                onChange={(event) => setProductId(event.target.value)}
              />
            </label>
            <label>
              Cantidad
              <input
                min="0"
                required
                type="number"
                value={quantity}
                onChange={(event) => setQuantity(Number(event.target.value))}
              />
            </label>
            <label>
              Precio
              <input
                min="0"
                required
                step="0.01"
                type="number"
                value={price}
                onChange={(event) => setPrice(Number(event.target.value))}
              />
            </label>
            <button disabled={busy} type="submit">
              Agregar item
            </button>
          </form>

          <div className="actions">
            <button
              disabled={busy}
              onClick={() => void updateItem()}
              type="button"
            >
              Actualizar cantidad
            </button>
            <button
              disabled={busy}
              onClick={() => void removeItem()}
              type="button"
            >
              Quitar item
            </button>
            <button
              disabled={busy}
              onClick={() => void clearCart()}
              type="button"
            >
              Limpiar carrito
            </button>
          </div>

          <div className="summary">
            <strong>Total carrito: ${cartTotal}</strong>
            <span>{cart?.items.length || 0} item(s)</span>
          </div>

          <div className="list">
            {(cart?.items || []).map((item) => (
              <button
                className="row"
                key={item.productId}
                onClick={() => {
                  setProductId(item.productId);
                  setQuantity(item.quantity);
                  setPrice(item.price);
                }}
                type="button"
              >
                <span>{item.productId}</span>
                <small>
                  {item.quantity} x ${item.price}
                </small>
              </button>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-head">
            <h2>Checkout</h2>
            <button
              disabled={busy}
              onClick={() => void checkoutFromCart()}
              type="button"
            >
              Crear orden
            </button>
          </div>

          <div className="toggles">
            <label>
              <input
                checked={reserveInventory}
                type="checkbox"
                onChange={(event) => setReserveInventory(event.target.checked)}
              />
              Reservar inventario
            </label>
            <label>
              <input
                checked={clearCartAfterCheckout}
                type="checkbox"
                onChange={(event) =>
                  setClearCartAfterCheckout(event.target.checked)
                }
              />
              Limpiar al confirmar
            </label>
          </div>

          <div className="panel-head compact">
            <h2>Ordenes</h2>
            <button
              disabled={busy}
              onClick={() => void loadOrders()}
              type="button"
            >
              Todas
            </button>
          </div>

          <div className="form-grid order-tools">
            <label>
              Orden
              <input
                value={selectedOrderId}
                onChange={(event) => setSelectedOrderId(event.target.value)}
              />
            </label>
            <label>
              Estado
              <select
                value={selectedStatus}
                onChange={(event) => setSelectedStatus(event.target.value)}
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="actions">
            <button
              disabled={busy || !selectedOrderId}
              onClick={() => void getOrderById()}
              type="button"
            >
              Buscar ID
            </button>
            <button
              disabled={busy}
              onClick={() => void loadUserOrders()}
              type="button"
            >
              Historial cliente
            </button>
            <button
              disabled={busy || !selectedOrderId}
              onClick={() => void updateOrderStatus()}
              type="button"
            >
              Cambiar estado
            </button>
            <button
              disabled={busy || !selectedOrderId}
              onClick={() => void cancelOrder()}
              type="button"
            >
              Cancelar
            </button>
          </div>

          <div className="list orders">
            {orders.map((order) => (
              <button
                className="row order-row"
                key={order.id}
                onClick={() => setSelectedOrderId(order.id)}
                type="button"
              >
                <span>{order.customerId}</span>
                <small>
                  {order.status} | ${order.totalAmount} | {order.items.length}{' '}
                  item(s)
                </small>
              </button>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
