import { PageLayout } from "./PageLayout";
import { SearchForm, ProductList } from "../components";
import { getCategories, getProducts } from "../api/productApi.js";
import ErrorPage from "./ErrorPage.js";
import { ProductItem } from "../components/ProductItem.js";

const DEFAULT_LIMIT = 20;
let cachedCategories = null;

const ensureCategories = async () => {
  if (cachedCategories) return cachedCategories;
  try {
    cachedCategories = await getCategories();
    return cachedCategories;
  } catch (error) {
    cachedCategories = null;
    throw error;
  }
};

// 주소에서 파라미터 가저오기
const parseHomeQuery = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const limitParam = Number(searchParams.get("limit"));
  const limit = Number.isNaN(limitParam) || limitParam <= 0 ? DEFAULT_LIMIT : limitParam;

  return {
    limit,
    search: searchParams.get("search") ?? "",
    category1: searchParams.get("category1") ?? "",
    category2: searchParams.get("category2") ?? "",
    sort: searchParams.get("sort") ?? undefined,
  };
};

export const renderHomePage = async () => {
  const homeQuery = parseHomeQuery();

  try {
    const [productData, categories] = await Promise.all([getProducts(homeQuery), ensureCategories()]);
    console.log("productData", productData);
    const normalizedFilters = {
      search: homeQuery.search,
      category1: homeQuery.category1,
      category2: homeQuery.category2,
      sort: homeQuery.sort ?? productData.filters?.sort ?? undefined,
    };

    const normalizedPagination = {
      ...productData.pagination,
      // limit: homeQuery.limit,
      page: productData.pagination?.page ?? productData.pagination?.current ?? 1,
    };

    return {
      html: buildPageView({
        ...productData,
        filters: { ...productData.filters, ...normalizedFilters },
        pagination: normalizedPagination,
        categories: categories ?? {},
        loading: false,
      }),
      init: bindEvents,
    };
  } catch (error) {
    console.error("홈 페이지 로딩 실패", error);
    return ErrorPage();
  }
};

const bindEvents = () => {
  const root = document.getElementById("root");
  if (!root) return;

  const sentinel = root.querySelector("[data-observer-target]");
  if (!sentinel) return;

  let isLoading = false;
  const pageContainer = root.querySelector("#home-page");
  let currentPage = Number.parseInt(pageContainer?.dataset.currentPage ?? "1", 10);
  let hasNextPage = pageContainer?.dataset.hasNext === "true";

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        // 옵저버 언제 작동 되냐
        if (!entry.isIntersecting || isLoading || !hasNextPage) return;
        loadMore();
      });
    },
    { rootMargin: "200px" },
  );

  observer.observe(sentinel);

  const loadMore = async () => {
    isLoading = true;
    try {
      const nextPage = currentPage + 1;
      const query = { ...parseHomeQuery(), page: nextPage };
      const data = await getProducts(query);

      const grid = root.querySelector("#products-grid");
      grid.insertAdjacentHTML("beforeend", data.products.map(ProductItem).join(""));

      currentPage = nextPage;
      hasNextPage = data.pagination?.hasNext ?? false;
      if (!hasNextPage) observer.disconnect();
    } catch (error) {
      console.error("추가 상품 로딩 실패", error);
      observer.disconnect();
    } finally {
      isLoading = false;
    }
  };

  const handleProductCardClick = (event) => {
    const card = event.target.closest(".product-card");
    if (!card) return;
    window.navigate(`/products/${card.dataset.productId}`);
  };

  const handleCategoryClick = (event) => {
    const button = event.target.closest(".category2-filter-btn");
    if (!button) return;
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set("category1", button.dataset.category1 ?? "");
    currentUrl.searchParams.delete("category2");
    window.navigate(`${currentUrl.pathname}${currentUrl.search}`);
  };

  const handleLimitChange = (event) => {
    if (event.target.id !== "limit-select") return;
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set("limit", event.target.value);
    window.navigate(`${currentUrl.pathname}${currentUrl.search}`);
  };

  root.addEventListener("click", handleProductCardClick);
  root.addEventListener("click", handleCategoryClick);
  root.addEventListener("change", handleLimitChange);

  return () => {
    root.removeEventListener("click", handleProductCardClick);
    root.removeEventListener("click", handleCategoryClick);
    root.removeEventListener("change", handleLimitChange);
    observer.disconnect();
  };
};

const buildPageView = (state) => {
  const { filters, pagination, products, categories, loading } = state;

  return /*html*/ `
  <div id="home-page" data-current-page="${pagination.page}" data-has-next="${pagination.hasNext}">
    ${PageLayout({
      children: `
        ${SearchForm({ filters, pagination, categories, loading })}
        ${ProductList({ products, pagination, loading })}
      `,
    })}
  </div>
  `;
};
