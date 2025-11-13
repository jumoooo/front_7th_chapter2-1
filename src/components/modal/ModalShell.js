import { ModalHeader } from "./ModalHeader.js";
import { EmptyCart } from "./EmptyCart.js";
import { CartContent } from "./CartContent.js";

const buildCartList = (productList) => {
  if (!Array.isArray(productList) || productList.length === 0) {
    return EmptyCart();
  }

  return CartContent(productList);
};

const buildTotalPrice = (productList) => {
  return Number(productList.reduce((acc, product) => acc + product.price * product.quantity, 0)).toLocaleString();
};

export const ModalShell = (state = {}) => {
  const productList = Array.isArray(state.productList) ? state.productList : [];

  return /*html*/ `
    <div class="hidden fixed inset-0 z-50 overflow-y-auto cart-modal">
      <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity cart-modal-overlay"></div>
      <div class="flex min-h-full items-end justify-center p-0 sm:items-center sm:p-4">
        <div class="relative bg-white rounded-t-lg sm:rounded-lg shadow-xl w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-hidden">

          <!-- 헤더 -->
          ${ModalHeader(productList.length)}

          <!-- 컨텐츠 -->
          <div class="flex flex-col max-h-[calc(90vh-120px)]">
            ${buildCartList(productList)}
          </div>
          
          <!-- 하단 액션 -->
          <div class="sticky bottom-0 bg-white border-t border-gray-200 p-4">
            <!-- 선택된 아이템 정보 -->
            <!-- 총 금액 -->
            <div class="flex justify-between items-center mb-4">
              <span class="text-lg font-bold text-gray-900">총 금액</span>
              <span class="text-xl font-bold text-blue-600">${buildTotalPrice(productList).toLocaleString()}원</span>
            </div>
            <!-- 액션 버튼들 -->
            <div class="space-y-2">
              <div class="flex gap-2">
                <button id="cart-modal-clear-cart-btn" class="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md
                        hover:bg-gray-700 transition-colors text-sm">
                  전체 비우기
                </button>
                <button id="cart-modal-checkout-btn" class="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md
                        hover:bg-blue-700 transition-colors text-sm">
                  구매하기
                </button>
              </div>
            </div>
          </div>
        </div>        
      </div>
    </div>
  `;
};
