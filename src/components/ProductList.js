import { ProductItem } from "./product/ProductItem.js";
import { Skeleton } from "./product/Skeleton.js";
import { Loading } from "./product/Loading.js";

export const ProductList = ({ products, pagination, loading }) => {
  console.log("products.length : ", products.length);
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
