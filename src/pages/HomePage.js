import { PageLayout } from "./PageLayout";
import { SearchForm, ProductList } from "../components";
import { getCategories, getProducts } from "../api/productApi.js";
import { parseHomeQuery } from "../utils/urlUtils.js";
import { useState } from "../lib/hook.js";

import { cartStore } from "../store/cartStore.js";
import { ModalShell } from "../components/modal/ModalShell.js";
const DEFAULT_LIMIT = 20;
let cachedCategories = null;

// ✅ 런타임 공유 객체: 훅에서 접근할 setter/상태와 플래그를 모아둔다
const runtime = {
  setFilters: null,
  setPagination: null,
  setProducts: null,
  setCategories: null,
  setSelectProductList: null,
  setIsLoading: null,
  setError: null,

  filters: null,
  pagination: null,
  products: null,
  categories: null,
  selectProductList: null,
  error: null,

  isLoading: false,
  isInitializing: false,
  isLoadingMore: false,
  lastKnownSearch: "",
  reobserveSentinel: null,

  unMount: null,
  cartUnsubscribe: null,
  isCartSubscribed: false,
  cartSyncHandler: null,
  isCartModalOpen: false,
};

const buildPageView = (state) => {
  // ✅ 상태를 기반으로 화면 전체 HTML을 구성한다
  const { filters, pagination, products, categories, selectProductList, loading, error } = state;
  return /*html*/ `
  <div
    id="home-page"
    data-current-page="${pagination.page}"
    data-has-next="${pagination.hasNext ? "true" : "false"}"
  >
    ${PageLayout({
      children: `
        ${SearchForm({ filters, pagination, categories, loading })}
        ${error ? `<div class="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">${error}</div>` : ""}
        <div data-product-list>
          ${ProductList({ products, pagination, loading })}
        </div>
      `,
    })}
    ${ModalShell({ productList: selectProductList })}
  </div>
  `;
};

const mountHomePage = () => {
  // ✅ HomePage가 실제 DOM에 마운트될 때 단 한 번 실행되는 로직
  const root = document.getElementById("root");
  if (!root) return () => {};

  runtime.unMount?.();
  runtime.unMount = null;

  const handleProductCardClick = (event) => {
    // ✅ 상품 카드를 클릭하면 상세 페이지로 이동한다
    if (event.target.closest(".add-to-cart-btn")) return;
    const card = event.target.closest(".product-card");
    if (!card) return;
    window.navigate(`/products/${card.dataset.productId}`);
  };

  const handleCategoryClick = (event) => {
    // ✅ 카테고리 관련 버튼이 클릭됐는지 검사하고 URL을 갱신한다
    const resetButton = event.target.closest("[data-breadcrumb='reset']");
    if (resetButton) {
      const resetUrl = new URL(window.location.href);
      resetUrl.searchParams.delete("category1");
      resetUrl.searchParams.delete("category2");
      resetUrl.searchParams.set("current", "1");
      window.navigate(`${resetUrl.pathname}${resetUrl.search}`);
      return;
    }

    const firstDepthButton = event.target.closest(".category1-filter-btn");
    if (firstDepthButton) {
      const firstUrl = new URL(window.location.href);
      firstUrl.searchParams.set("category1", firstDepthButton.dataset.category1 ?? "");
      firstUrl.searchParams.delete("category2");
      firstUrl.searchParams.delete("search");
      firstUrl.searchParams.set("current", "1");
      window.navigate(`${firstUrl.pathname}${firstUrl.search}`);
      return;
    }

    const breadcrumbCategory1 = event.target.closest("[data-breadcrumb='category1']");
    if (breadcrumbCategory1) {
      const breadcrumbUrl = new URL(window.location.href);
      breadcrumbUrl.searchParams.set("category1", breadcrumbCategory1.dataset.category1 ?? "");
      breadcrumbUrl.searchParams.delete("category2");
      breadcrumbUrl.searchParams.set("current", "1");
      window.navigate(`${breadcrumbUrl.pathname}${breadcrumbUrl.search}`);
      return;
    }

    const breadcrumbCategory2 = event.target.closest("[data-breadcrumb='category2']");
    if (breadcrumbCategory2) {
      const breadcrumbUrl = new URL(window.location.href);
      const breadcrumbCat1 = breadcrumbCategory2.dataset.category1 ?? "";
      const breadcrumbCat2 = breadcrumbCategory2.dataset.category2 ?? "";
      if (breadcrumbCat1) breadcrumbUrl.searchParams.set("category1", breadcrumbCat1);
      if (breadcrumbCat2) {
        breadcrumbUrl.searchParams.set("category2", breadcrumbCat2);
      } else {
        breadcrumbUrl.searchParams.delete("category2");
      }
      breadcrumbUrl.searchParams.set("current", "1");
      window.navigate(`${breadcrumbUrl.pathname}${breadcrumbUrl.search}`);
      return;
    }

    const button = event.target.closest(".category2-filter-btn");
    // ✅ 2차 카테고리 버튼을 선택하면 검색어를 초기화하고 URL을 변경한다
    if (!button) return;
    const currentUrl = new URL(window.location.href);
    const category1 = button.dataset.category1 ?? "";
    const category2 = button.dataset.category2 ?? "";
    if (category1) currentUrl.searchParams.set("category1", category1);
    if (category2) {
      currentUrl.searchParams.set("category2", category2);
    } else {
      currentUrl.searchParams.delete("category2");
    }
    currentUrl.searchParams.delete("search");
    currentUrl.searchParams.set("current", "1");
    window.navigate(`${currentUrl.pathname}${currentUrl.search}`);
  };

  const handleLimitChange = (event) => {
    // ✅ 페이지당 노출 개수 변경 시 첫 페이지로 이동한다
    if (event.target.id !== "limit-select") return;
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set("limit", event.target.value);
    currentUrl.searchParams.set("current", "1");
    window.navigate(`${currentUrl.pathname}${currentUrl.search}`);
  };

  const handleSortChange = (event) => {
    // ✅ 정렬 옵션을 변경하면 첫 페이지부터 다시 조회한다
    if (event.target.id !== "sort-select") return;
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set("sort", event.target.value);
    currentUrl.searchParams.set("current", "1");
    window.navigate(`${currentUrl.pathname}${currentUrl.search}`);
  };

  const handleSearchSubmit = (event) => {
    // ✅ 검색어 입력 후 제출하면 쿼리를 치환한다
    const searchForm = event.target.closest("form[data-search-form]");
    if (!searchForm) return;
    event.preventDefault();

    const formData = new FormData(searchForm);
    const searchKeyword = (formData.get("search") ?? "").toString().trim();
    const currentUrl = new URL(window.location.href);

    if (searchKeyword) {
      currentUrl.searchParams.set("search", searchKeyword);
    } else {
      currentUrl.searchParams.delete("search");
    }
    currentUrl.searchParams.set("current", "1");

    window.navigate(`${currentUrl.pathname}${currentUrl.search}`);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        // ✅ sentinel이 화면 근처로 오면 다음 페이지를 요청한다
        if (!entry.isIntersecting) return;
        if (!runtime.pagination?.hasNext) return;
        requestLoadMore();
      });
    },
    { rootMargin: "200px" },
  );

  const observeSentinel = () => {
    observer.disconnect();
    const sentinel = root.querySelector("[data-observer-target]");
    if (sentinel) observer.observe(sentinel);
  };

  // 장바구니 모달 열기
  const handleCartModal = (event) => {
    if (event.target.closest(".cart-item-remove-btn")) return;
    const modal = document.querySelector(".cart-modal");
    if (!modal) return;

    const openButton = event.target.closest("#cart-icon-btn");
    const closeButton = event.target.closest("#cart-modal-close-btn");
    const overlayClicked = event.target.closest(".cart-modal-overlay");

    if (openButton) {
      modal.classList.remove("hidden");
      runtime.isCartModalOpen = true;
      return;
    }

    if (closeButton || overlayClicked) {
      modal.classList.add("hidden");
      runtime.isCartModalOpen = false;
    }
  };

  // ✅ 장바구니 상품에서 삭제 버튼을 클릭하면 장바구니에서 제거한다
  const handleRemoveCartItem = (event) => {
    const removeButton = event.target.closest(".cart-item-remove-btn");
    if (!removeButton) return;

    event.preventDefault();
    event.stopPropagation();

    const { productId } = removeButton.dataset;
    if (!productId) return;

    runtime.setSelectProductList?.((prev) => {
      if (!Array.isArray(prev)) return [];
      return prev.filter((item) => item.productId !== productId);
    });

    cartStore.removeItem(productId);
  };

  // ✅ 상품 카드에서 장바구니 버튼을 클릭하면 장바구니에 추가한다
  const handleAddToCartFromList = (event) => {
    const addButton = event.target.closest(".add-to-cart-btn");
    if (!addButton) return;
    event.preventDefault();
    const card = addButton.closest(".product-card");
    if (!card) return;

    const productId = addButton.dataset.productId ?? card.dataset.productId;
    if (!productId) return;

    const titleElement = card.querySelector(".product-info h3");
    const priceElement = card.querySelector(".product-info + p") ?? card.querySelector(".product-info p:last-child");
    const imageElement = card.querySelector("img");

    const title = titleElement?.textContent?.trim() ?? "";
    const priceText = priceElement?.textContent?.replace(/[^0-9]/g, "") ?? "0";
    const image = imageElement?.getAttribute("src") ?? "";

    const price = Number(priceText) || 0;

    runtime.setSelectProductList?.((prev) => {
      const baseList = Array.isArray(prev) ? prev : [];
      const targetIndex = baseList.findIndex((item) => item.productId === productId);
      if (targetIndex >= 0) {
        return baseList.map((item, index) =>
          index === targetIndex
            ? {
                ...item,
                quantity: (item.quantity ?? 0) + 1,
              }
            : item,
        );
      }
      return [
        ...baseList,
        {
          productId,
          title,
          image,
          price,
          quantity: 1,
        },
      ];
    });

    cartStore.addItem(
      {
        productId,
        title,
        image,
        lprice: price,
      },
      1,
    );
  };

  root.addEventListener("click", handleProductCardClick);
  root.addEventListener("click", handleCategoryClick);
  root.addEventListener("click", handleAddToCartFromList);
  root.addEventListener("change", handleLimitChange);
  root.addEventListener("change", handleSortChange);
  root.addEventListener("submit", handleSearchSubmit);
  root.addEventListener("click", handleCartModal);
  root.addEventListener("click", handleRemoveCartItem);

  runtime.reobserveSentinel = () => {
    window.requestAnimationFrame(() => observeSentinel());
  };
  runtime.reobserveSentinel();

  if (runtime.isCartModalOpen) {
    const modal = document.querySelector(".cart-modal");
    if (modal) modal.classList.remove("hidden");
  }

  const unMount = () => {
    root.removeEventListener("click", handleProductCardClick);
    root.removeEventListener("click", handleCategoryClick);
    root.removeEventListener("click", handleAddToCartFromList);
    root.removeEventListener("change", handleLimitChange);
    root.removeEventListener("change", handleSortChange);
    root.removeEventListener("submit", handleSearchSubmit);
    root.removeEventListener("click", handleCartModal);
    root.removeEventListener("click", handleRemoveCartItem);
    observer.disconnect();
    runtime.reobserveSentinel = null;
    if (runtime.unMount === unMount) runtime.unMount = null;
    const modal = document.querySelector(".cart-modal");
    if (modal && !runtime.isCartModalOpen) modal.classList.add("hidden");
    runtime.cartUnsubscribe?.();
    runtime.cartUnsubscribe = null;
    runtime.isCartSubscribed = false;
  };

  runtime.unMount = unMount;
  return unMount;
};

export const HomePageComponent = () => {
  // ✅ URL 쿼리를 참고해 훅 초기값을 준비한다
  const homeQuery = parseHomeQuery(DEFAULT_LIMIT);
  const initialFilters = {
    search: homeQuery.search ?? "",
    category1: homeQuery.category1 ?? "",
    category2: homeQuery.category2 ?? "",
    sort: homeQuery.sort ?? "",
  };
  const initialPagination = {
    page: homeQuery.current ?? 1,
    limit: homeQuery.limit ?? DEFAULT_LIMIT,
    total: 0,
    hasNext: false,
  };

  const [filters, setFilters] = useState(initialFilters);
  const [pagination, setPagination] = useState(initialPagination);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [selectProductList, setSelectProductList] = useState(cartStore.getState());

  runtime.setFilters = setFilters;
  runtime.setPagination = setPagination;
  runtime.setProducts = setProducts;
  runtime.setCategories = setCategories;
  runtime.setSelectProductList = setSelectProductList;
  runtime.setIsLoading = setIsLoading;
  runtime.setError = setError;

  runtime.filters = filters;
  runtime.pagination = pagination;
  runtime.products = products;
  runtime.categories = categories;
  runtime.selectProductList = selectProductList;
  runtime.isLoading = isLoading;
  runtime.error = error;

  if (!runtime.isCartSubscribed) {
    runtime.cartSyncHandler ??= (nextCartItems) => {
      if (!Array.isArray(nextCartItems)) {
        runtime.setSelectProductList?.([]);
        return;
      }

      const prevItems = runtime.selectProductList ?? [];
      const isSameLength = prevItems.length === nextCartItems.length;
      let isShallowEqual = isSameLength;

      if (isSameLength) {
        for (let index = 0; index < nextCartItems.length; index += 1) {
          const currentItem = nextCartItems[index];
          const prevItem = prevItems[index];
          if (!prevItem || prevItem.productId !== currentItem.productId || prevItem.quantity !== currentItem.quantity) {
            isShallowEqual = false;
            break;
          }
        }
      }

      if (isShallowEqual) return;

      const snapshot = nextCartItems.map((item) => ({ ...item }));
      runtime.setSelectProductList?.(snapshot);
    };
    runtime.cartUnsubscribe = cartStore.subscribe(runtime.cartSyncHandler);
    runtime.isCartSubscribed = true;
  }

  const currentSearch = window.location.search;
  // ✅ 뒤로가기 등으로 URL이 바뀌면 다시 초기화하도록 플래그를 조정
  if (runtime.lastKnownSearch !== currentSearch && hasInitialized) {
    setHasInitialized(false);
  }

  if (!hasInitialized) {
    // ✅ 처음 렌더되거나 URL이 변경된 직후 데이터를 재요청한다
    runtime.lastKnownSearch = currentSearch;
    setHasInitialized(true);
    setFilters(initialFilters);
    setPagination(initialPagination);
    setProducts([]);
    setCategories({});
    setError(null);
    loadInitialData(buildProductQuery(initialFilters, initialPagination));
  }

  runtime.reobserveSentinel?.();

  return buildPageView({
    filters,
    pagination,
    categories,
    products,
    selectProductList,
    loading: isLoading,
    error,
  });
};

const ensureCategories = async () => {
  // ✅ 카테고리 데이터를 한 번만 요청하고 결과를 캐시한다
  if (cachedCategories) return cachedCategories;
  try {
    cachedCategories = await getCategories();
    return cachedCategories;
  } catch (error) {
    cachedCategories = null;
    throw error;
  }
};

const normalizeFilters = (query, productFilters) => {
  // ✅ URL 쿼리와 서버 응답을 병합해 일관된 필터 상태를 만든다
  return {
    search: query.search ?? productFilters?.search ?? "",
    category1: query.category1 ?? productFilters?.category1 ?? "",
    category2: query.category2 ?? productFilters?.category2 ?? "",
    sort: query.sort ?? productFilters?.sort ?? "",
  };
};

const normalizePagination = (query, productPagination) => {
  // ✅ URL 정보와 API 응답을 기준으로 페이지 정보를 통일한다
  const fallbackPage = query.current ?? 1;
  const fallbackLimit = query.limit ?? DEFAULT_LIMIT;
  return {
    page: productPagination?.page ?? productPagination?.current ?? fallbackPage,
    limit: productPagination?.limit ?? fallbackLimit,
    total: productPagination?.total ?? 0,
    hasNext: Boolean(productPagination?.hasNext ?? false),
  };
};

const buildProductQuery = (filters, paginationOverride) => {
  // ✅ 현재 상태를 기반으로 product API 요청 파라미터를 구성한다
  const pagination = paginationOverride ?? runtime.pagination ?? {};
  const query = {
    limit: pagination.limit ?? DEFAULT_LIMIT,
    current: pagination.page ?? 1,
  };

  if (filters?.search) query.search = filters.search;
  if (filters?.category1) query.category1 = filters.category1;
  if (filters?.category2) query.category2 = filters.category2;
  if (filters?.sort) query.sort = filters.sort;

  return query;
};

const updateCurrentPageInUrl = (page) => {
  // ✅ 무한 스크롤 등으로 페이지가 바뀌면 URL도 함께 갱신한다
  const url = new URL(window.location.href);
  url.searchParams.set("current", String(page));
  window.history.replaceState({}, "", `${url.pathname}${url.search}`);
  runtime.lastKnownSearch = window.location.search;
};

const loadInitialData = async (query) => {
  // ✅ 초기 렌더 또는 URL 변경 시 데이터를 다시 불러온다
  if (runtime.isInitializing) return;
  runtime.isInitializing = true;
  runtime.setIsLoading?.(true);
  runtime.setError?.(null);

  try {
    const [productData, categories] = await Promise.all([getProducts(query), ensureCategories()]);
    const normalizedFilters = normalizeFilters(query, productData?.filters);
    const normalizedPagination = normalizePagination(query, productData?.pagination);
    const currentPage = normalizedPagination.page ?? 1;
    const currentProducts = productData?.products ?? [];

    let aggregatedProducts = currentProducts;

    if (currentPage > 1) {
      aggregatedProducts = [];
      for (let pageNumber = 1; pageNumber <= currentPage; pageNumber += 1) {
        if (pageNumber === currentPage) {
          aggregatedProducts.push(...currentProducts);
          continue;
        }

        try {
          const pageQuery = buildProductQuery(normalizedFilters, {
            ...normalizedPagination,
            page: pageNumber,
          });
          const pageData = await getProducts(pageQuery);
          aggregatedProducts.push(...(pageData?.products ?? []));
        } catch (error) {
          console.error(`페이지 ${pageNumber} 데이터 로딩 실패`, error);
        }
      }
    }

    const maximumItems = (normalizedPagination.limit ?? DEFAULT_LIMIT) * currentPage;

    runtime.setFilters?.(normalizedFilters);
    runtime.setPagination?.(normalizedPagination);
    runtime.setProducts?.(aggregatedProducts.slice(0, maximumItems));
    runtime.setCategories?.(categories ?? {});
  } catch (error) {
    console.error("홈 페이지 로딩 실패", error);
    runtime.setError?.("상품을 불러오지 못했습니다.");
  } finally {
    runtime.setIsLoading?.(false);
    runtime.isInitializing = false;
  }
};

const requestLoadMore = () => {
  // ✅ sentinel이 감지되면 다음 페이지 데이터를 요청한다
  if (runtime.isLoadingMore || runtime.isInitializing) return;

  const filters = runtime.filters ?? {};
  const pagination = runtime.pagination ?? { page: 1, limit: DEFAULT_LIMIT, hasNext: false };
  if (!pagination.hasNext) return;

  const nextPage = (pagination.page ?? 1) + 1;
  const nextQuery = buildProductQuery(filters, { ...pagination, page: nextPage });

  runtime.isLoadingMore = true;

  getProducts(nextQuery)
    .then((data) => {
      const nextProducts = data?.products ?? [];
      const incomingPagination = normalizePagination(nextQuery, data?.pagination);

      if (nextProducts.length > 0) {
        runtime.setProducts?.((prev) => [...prev, ...nextProducts]);
      }

      runtime.setPagination?.((prev) => ({
        ...prev,
        page: incomingPagination.page,
        limit: incomingPagination.limit,
        total: incomingPagination.total ?? prev.total ?? 0,
        hasNext: nextProducts.length > 0 ? incomingPagination.hasNext : false,
      }));

      updateCurrentPageInUrl(incomingPagination.page);
    })
    .catch((error) => {
      console.error("추가 상품 로딩 실패", error);
      runtime.setError?.("추가 상품을 불러오지 못했습니다.");
    })
    .finally(() => {
      runtime.isLoadingMore = false;
    });
};

HomePageComponent.mount = mountHomePage;
