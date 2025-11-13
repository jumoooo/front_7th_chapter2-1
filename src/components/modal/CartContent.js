import { CartItem } from "./CartItem.js";

const buildTotalPrice = (productList) => {
  return Number(productList.reduce((acc, product) => acc + product.price * product.quantity, 0)).toLocaleString();
};
export const CartContent = (productList) => {
  const isAllChecked =
    Array.isArray(productList) && productList.length > 0
      ? productList.every((product) => Boolean(product.checked))
      : false;

  // 선택된 상품 개수
  const isCheckedCount = productList.filter((product) => Boolean(product.checked)).length;
  return /*html*/ `
  <div class="flex flex-col max-h-[calc(90vh-120px)]">
    <!-- 전체 선택 섹션 -->
    <div class="p-4 border-b border-gray-200 bg-gray-50">
      <label class="flex items-center text-sm text-gray-700">
        <input type="checkbox" id="cart-modal-select-all-checkbox" class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-2" ${isAllChecked ? 'checked=""' : ""}>
        전체선택 (${productList.length}개)
      </label>
    </div>
    <!-- 아이템 목록 -->
    <div class="flex-1 overflow-y-auto">
      <div class="p-4 space-y-4">
        <!-- 아이템 -->
        ${productList.map((product) => CartItem(product)).join("")}
      </div>
    </div>
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
        ${
          isCheckedCount > 0
            ? /*html*/ `
            <button id="cart-modal-remove-selected-btn" class="w-full bg-red-600 text-white py-2 px-4 rounded-md
                       hover:bg-red-700 transition-colors text-sm">
              선택한 상품 삭제 (${isCheckedCount}개)
            </button>
        `
            : ""
        }
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
  `;
};
