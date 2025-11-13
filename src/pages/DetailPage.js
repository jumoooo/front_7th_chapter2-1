import { DetailLayout } from "./DetailLayout";
import { getProduct, getProducts } from "../api/productApi.js";
import { useState } from "../lib/hook.js";
import { navigate } from "../router/router.js";
import { cartStore } from "../store/cartStore.js";

import { ProductDetailLoading } from "../components/productDetail/ProductDetailLoading.js";
import { ProductBreadcrumb } from "../components/productDetail/ProductBreadcrumb.js";
import { ProductDetailInfo } from "../components/productDetail/ProductDetailInfo.js";
import { RelatedProductsList } from "../components/productDetail/RelatedProductsList.js";

const runtime = {
  setMainProductState: null, // 상품 상세 상태 설정 핸들러
  mainProductState: null, // 상품 상세 상태

  isFetching: false, // 데이터 로딩 여부
  unMount: null, // 컴포넌트 언마운트 핸들러
  setProductQty: null, // 수량 설정 핸들러
  productQty: 1, // 수량 상태
};

const buildPageView = (state) => {
  const { loading, product, relatedProducts, error, productQty } = state;
  if (error) throw new Error(error);
  const safeProduct = product ?? {};

  return DetailLayout({
    children: loading
      ? ProductDetailLoading()
      : /*html*/ `
      <main class="max-w-md mx-auto px-4 py-4">
        <!-- 브레드크럼 -->
        ${ProductBreadcrumb(safeProduct)}
        <!-- 상품 상세 정보 -->
        <div class="bg-white rounded-lg shadow-sm mb-6">
          <!-- 상품 정보 -->
          ${ProductDetailInfo(safeProduct)}
          <!-- 수량 선택 및 액션 -->
          <div class="border-t border-gray-200 p-4">
            <div class="flex items-center justify-between mb-4">
              <span class="text-sm font-medium text-gray-900">수량</span>
              <div class="flex items-center">
                <button id="quantity-decrease" class="w-8 h-8 flex items-center justify-center border border-gray-300
                   rounded-l-md bg-gray-50 hover:bg-gray-100">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path>
                  </svg>
                </button>
                <input type="number" id="quantity-input" value="${productQty ?? 1}" min="1" max="107" class="w-16 h-8 text-center text-sm border-t border-b border-gray-300
                  focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                <button id="quantity-increase" class="w-8 h-8 flex items-center justify-center border border-gray-300
                   rounded-r-md bg-gray-50 hover:bg-gray-100">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                  </svg>
                </button>
              </div>
            </div>
            <!-- 액션 버튼 -->
            <button id="add-to-cart-btn" data-product-id="${safeProduct.productId ?? ""}" class="w-full bg-blue-600 text-white py-3 px-4 rounded-md
                 hover:bg-blue-700 transition-colors font-medium">
              장바구니 담기
            </button>
          </div>
        </div>
        <!-- 상품 목록으로 이동 -->
        <div class="mb-6">
          <button class="block w-full text-center bg-gray-100 text-gray-700 py-3 px-4 rounded-md
            hover:bg-gray-200 transition-colors go-to-product-list">
            상품 목록으로 돌아가기
          </button>
        </div>
        <!-- 관련 상품 -->
        <div class="bg-white rounded-lg shadow-sm">
          <div class="p-4 border-b border-gray-200">
            <h2 class="text-lg font-bold text-gray-900">관련 상품</h2>
            <p class="text-sm text-gray-600">같은 카테고리의 다른 상품들</p>
          </div>
          <!-- 관련 상품 목록 -->
          ${relatedProducts ? RelatedProductsList(relatedProducts) : ""}
        </div>
      </main>
    `,
  });
};

const mountDetailPage = () => {
  const $root = document.getElementById("root");
  if (!$root) return () => {};

  // 중복 이벤트 핸들러 초기화
  runtime.unMount?.();
  runtime.unMount = null;

  const handleProductCardClick = (event) => {
    // 관련 상품 클릭
    const item = event.target.closest(".related-product-card");
    if (!item) return;
    const productId = item.dataset.productId;
    if (productId) {
      navigate(`/products/${productId}`);
    }
  };

  const handleCategoryClick = (event) => {
    // 상부 카테고리 클릭
    const item = event.target.closest(".breadcrumb-link");
    if (!item) return;
    const currentCategory1 = runtime.mainProductState?.product?.category1 ?? "";
    const category1 = item.dataset.category1 ?? currentCategory1;
    const category2 = item.dataset.category2 ?? "";
    if (category2) {
      navigate(`/?category1=${category1}&category2=${category2}`);
    }
    if (category1) {
      navigate(`/?category1=${category1}`);
    }
  };

  const handleGoToProductListClick = (event) => {
    // 상품 목록으로 돌아가기
    const item = event.target.closest(".go-to-product-list");
    if (!item) return;

    const currentCategory1 = runtime.mainProductState?.product?.category1 ?? "";
    const currentCategory2 = runtime.mainProductState?.product?.category2 ?? "";
    navigate(`/?category1=${currentCategory1}&category2=${currentCategory2}`);
  };

  const handelQuantityClick = (event) => {
    // 수량 '-', '+' 버튼 클릭
    const clickedButton = event.target.closest("#quantity-increase, #quantity-decrease");
    if (!clickedButton) return;

    // 어떤 버튼인지에 따라 증감 값 계산
    const quantityDiff = clickedButton.id === "quantity-increase" ? 1 : -1;
    const currentQty = runtime.productQty ?? 1;
    const nextQty = Math.max(1, currentQty + quantityDiff);
    runtime.productQty = nextQty;
    runtime.setProductQty?.(nextQty);
  };

  const handleAddToCartClick = (event) => {
    const button = event.target.closest("#add-to-cart-btn");
    if (!button) return;
    const product = runtime.mainProductState?.product;
    if (!product) return;
    const quantity = runtime.productQty ?? 1;
    cartStore.addItem(product, quantity);
  };

  $root.addEventListener("click", handleProductCardClick);
  $root.addEventListener("click", handleCategoryClick);
  $root.addEventListener("click", handleGoToProductListClick);
  $root.addEventListener("click", handelQuantityClick);
  $root.addEventListener("click", handleAddToCartClick);
  const unMount = () => {
    $root.removeEventListener("click", handleProductCardClick);
    $root.removeEventListener("click", handleCategoryClick);
    $root.removeEventListener("click", handleGoToProductListClick);
    $root.removeEventListener("click", handelQuantityClick);
    $root.removeEventListener("click", handleAddToCartClick);
    if (runtime.unMount === unMount) runtime.unMount = null;
  };

  runtime.unMount = unMount;
  return unMount;
};

export const DetailPageComponent = (context = {}) => {
  const productId = context?.params?.id;
  if (!productId) {
    console.warn("상품 ID가 제공되지 않았습니다.");
    throw new Error("상품 ID가 제공되지 않았습니다.");
  }

  const [mainProductState, setMainProductState] = useState({
    loading: true,
    product: null,
    relatedProducts: null,
    error: null,
  });

  const [productQty, setProductQty] = useState(1);

  runtime.setMainProductState = setMainProductState;
  runtime.mainProductState = mainProductState;
  runtime.setProductQty = setProductQty;
  runtime.productQty = productQty;

  if (!runtime.isFetching && mainProductState.loading) {
    runtime.isFetching = true;
    fetchProduct(productId).finally(() => {
      runtime.isFetching = false;
    });
  }
  const props = {
    ...mainProductState,
    productQty,
  };
  return buildPageView(props);
};

const fetchProduct = async (productId) => {
  runtime.productQty = 1;
  runtime.setProductQty?.(1);
  runtime.setMainProductState?.(() => ({
    loading: true,
    product: null,
    relatedProducts: null,
    error: null,
  }));

  try {
    const product = await getProduct(productId);
    const res_products = await getProducts({ category2: product.category2 });
    const relatedProducts = res_products.products.filter((item) => item.productId !== product.productId);
    runtime.setMainProductState?.(() => ({
      loading: false,
      product,
      relatedProducts,
      error: null,
    }));
  } catch (error) {
    console.error("상품 상세 로딩 실패", error);
    runtime.setMainProductState?.(() => ({
      loading: false,
      product: null,
      relatedProducts: null,
      error: "상품을 불러오지 못했습니다.",
    }));
  }
};

DetailPageComponent.mount = mountDetailPage;
