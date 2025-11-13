const STORAGE_KEY = "app-cart-items";

const isBrowser = typeof window !== "undefined";

const loadInitialState = () => {
  if (!isBrowser) return [];
  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);
    if (!storedValue) return [];
    const parsed = JSON.parse(storedValue);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("장바구니 상태 복원 실패", error);
    return [];
  }
};

let cartState = loadInitialState();
const subscribers = new Set();

const persistState = () => {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cartState));
  } catch (error) {
    console.warn("장바구니 상태 저장 실패", error);
  }
};

const notifySubscribers = () => {
  subscribers.forEach((callback) => {
    try {
      callback(cartState);
    } catch (error) {
      console.error("장바구니 구독자 알림 실패", error);
    }
  });
};

const sanitizeQuantity = (quantity) => {
  const normalized = Number(quantity);
  if (!Number.isFinite(normalized) || normalized <= 0) return 1;
  return Math.floor(normalized);
};

const mapProductToCartItem = (product, quantity) => ({
  productId: product.productId,
  title: product.title,
  image: product.image,
  price: Number(product.lprice) || 0,
  quantity: sanitizeQuantity(quantity),
  checked: false,
});

const setState = (updater) => {
  const nextState = typeof updater === "function" ? updater([...cartState]) : updater;
  cartState = Array.isArray(nextState) ? nextState : [];
  persistState();
  notifySubscribers();
};

export const cartStore = {
  subscribe(callback) {
    if (typeof callback !== "function") return () => {};
    subscribers.add(callback);
    callback(cartState);
    return () => {
      subscribers.delete(callback);
    };
  },

  getState() {
    return cartState;
  },

  addItem(product, quantity = 1) {
    if (!product || !product.productId) return;
    const normalizedQuantity = sanitizeQuantity(quantity);
    setState((prevState) => {
      const nextState = [...prevState];
      const targetIndex = nextState.findIndex((item) => item.productId === product.productId);
      if (targetIndex >= 0) {
        const existingItem = nextState[targetIndex];
        nextState[targetIndex] = {
          ...existingItem,
          quantity: sanitizeQuantity(existingItem.quantity + normalizedQuantity),
        };
      } else {
        nextState.push(mapProductToCartItem(product, normalizedQuantity));
      }
      return nextState;
    });
  },

  updateItemQuantity(productId, quantity) {
    if (!productId) return;
    const normalizedQuantity = sanitizeQuantity(quantity);
    setState((prevState) =>
      prevState.map((item) => (item.productId === productId ? { ...item, quantity: normalizedQuantity } : item)),
    );
  },

  removeItem(productId) {
    if (!productId) return;
    setState((prevState) => prevState.filter((item) => item.productId !== productId));
  },

  clear() {
    setState([]);
  },
};
