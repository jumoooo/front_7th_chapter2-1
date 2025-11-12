import { ProductItem } from "./ProductItem.js";

const Skeleton = () => {
  return /*html*/ `
    <!-- 로딩 스켈레톤 -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-pulse">
      <div class="aspect-square bg-gray-200"></div>
      <div class="p-3">
        <div class="h-4 bg-gray-200 rounded mb-2"></div>
        <div class="h-3 bg-gray-200 rounded w-2/3 mb-2"></div>
        <div class="h-5 bg-gray-200 rounded w-1/2 mb-3"></div>
        <div class="h-8 bg-gray-200 rounded"></div>
      </div>
    </div>
  `;
};

const Loading = () => {
  return /*html*/ `
    <div class="text-center py-4">
      <div class="inline-flex items-center">
        <svg class="animate-spin h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-sm text-gray-600">상품을 불러오는 중...</span>
      </div>
    </div>
  `;
};

export const ProductList = ({ products, pagination, loading }) => {
  return /*html*/ `
    <!-- 상품 목록 -->
    <div class="mb-6">
      <div>
        ${
          loading
            ? /*html*/ `
              <!-- 상품 그리드 -->
              <div class="grid grid-cols-2 gap-4 mb-6" id="products-grid">
                <!-- 로딩 스켈레톤 -->
                ${Skeleton().repeat(4)}
              </div>
              <!-- 로딩 메시지 -->
              ${Loading()}`
            : /*html*/ `
              <!-- 상품 개수 정보 -->
              <div class="mb-4 text-sm text-gray-600">
                총 <span class="font-medium text-gray-900">${pagination.total}개</span>의 상품
              </div>
              <!-- 상품 그리드 -->
              <div class="grid grid-cols-2 gap-4 mb-6" id="products-grid">
                ${products.map(ProductItem).join("")}
              </div>

              <div class="text-center py-4 text-sm text-gray-500 " data-observer-target>
                모든 상품을 확인했습니다
              </div>
              `
        }
      </div>
    </div>
  `;
};
