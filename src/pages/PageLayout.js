import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { cartStore } from "../store/cartStore";

export const PageLayout = ({ children }) => {
  const cartItemCount = cartStore.getState().length;
  return `
    <div class="min-h-screen bg-gray-50">
      ${Header(cartItemCount)}
      <main class="max-w-md mx-auto px-4 py-4">
        ${children}
      </main>
      ${Footer()}
    </div>
  `;
};
