import { CartItem } from "./CartItem.js";
export const CartContent = (productList) => {
  return /*html*/ `
    <!-- 전체 선택 섹션 -->
    <div class="p-4 border-b border-gray-200 bg-gray-50">
      <label class="flex items-center text-sm text-gray-700">
        <input type="checkbox" id="cart-modal-select-all-checkbox" class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-2">
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
  `;
};
