import { Footer } from "../components/Footer";
import { DetailHeader } from "../components/DetailHeader";
import { cartStore } from "../store/cartStore";

export const DetailLayout = ({ children }) => {
  const cartItemCount = cartStore.getState().length;
  return `
    <div class="min-h-screen bg-gray-50">
      ${DetailHeader(cartItemCount)}
      <main class="max-w-md mx-auto px-4 py-4">
        ${children}
      </main>
      ${Footer()}
    </div>
  `;
};
