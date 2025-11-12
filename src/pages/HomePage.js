import { PageLayout } from "./PageLayout";
import { SearchForm, ProductList } from "../components";
import { getCategories, getProducts } from "../api/productApi.js";
import { parseHomeQuery } from "../utils/urlUtils.js";

const DEFAULT_LIMIT = 20;
let cachedCategories = null;

const homeState = {
  filters: {},
  pagination: {
    page: 1,
    limit: DEFAULT_LIMIT,
    total: 0,
    hasNext: false,
  },
  products: [],
  categories: {},
};

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

export const renderHomePage = async () => {
  const homeQuery = parseHomeQuery(DEFAULT_LIMIT);

  try {
    const [productData, categories] = await Promise.all([getProducts(homeQuery), ensureCategories()]);
    const normalizedFilters = {
      search: homeQuery.search,
      category1: homeQuery.category1,
      category2: homeQuery.category2,
      sort: homeQuery.sort ?? productData.filters?.sort ?? undefined,
    };

    const normalizedPagination = {
      ...productData.pagination,
      page: productData.pagination?.page ?? productData.pagination?.current ?? 1,
    };

    homeState.products = productData.products ?? [];
    homeState.pagination = {
      ...homeState.pagination,
      ...normalizedPagination,
    };
    homeState.filters = { ...productData.filters, ...normalizedFilters };
    homeState.categories = categories ?? {};

    return {
      html: buildPageView({
        filters: homeState.filters,
        pagination: homeState.pagination,
        categories: homeState.categories,
        products: homeState.products,
        loading: false,
      }),
      init: bindEvents,
    };
  } catch (error) {
    console.error("홈 페이지 로딩 실패", error);
    throw new Error("홈 페이지 로딩 실패");
  }
};

const bindEvents = () => {
  const root = document.getElementById("root");
  if (!root) return;

  const pageContainer = root.querySelector("#home-page");
  if (!pageContainer) return;

  let sentinel = pageContainer.querySelector("[data-observer-target]");
  if (!sentinel) return;

  const productListContainer = pageContainer.querySelector("[data-product-list]");
  if (!productListContainer) return;

  let isLoading = false;
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
      const query = { ...parseHomeQuery(DEFAULT_LIMIT), current: nextPage };
      const data = await getProducts(query);
      const nextProducts = data.products ?? [];

      if (nextProducts.length === 0) {
        hasNextPage = false;
        pageContainer.dataset.hasNext = "false";
        observer.disconnect();
        return;
      }

      homeState.products = [...homeState.products, ...nextProducts];
      homeState.pagination = {
        ...homeState.pagination,
        ...data.pagination,
        page: data.pagination?.page ?? nextPage,
      };
      currentPage = homeState.pagination.page ?? nextPage;
      hasNextPage = data.pagination?.hasNext ?? false;

      const url = new URL(window.location.href);
      url.searchParams.set("current", String(currentPage));
      window.history.replaceState({}, "", `${url.pathname}${url.search}`);

      productListContainer.innerHTML = ProductList({
        products: homeState.products,
        pagination: homeState.pagination,
        loading: false,
      });

      pageContainer.dataset.currentPage = String(currentPage);
      pageContainer.dataset.hasNext = hasNextPage ? "true" : "false";

      observer.disconnect();
      if (hasNextPage) {
        sentinel = pageContainer.querySelector("[data-observer-target]");
        if (sentinel) {
          observer.observe(sentinel);
        }
      }
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
    if (event.target.id !== "limit-select") return;
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set("limit", event.target.value);
    currentUrl.searchParams.set("current", "1");
    window.navigate(`${currentUrl.pathname}${currentUrl.search}`);
  };

  const handleSortChange = (event) => {
    if (event.target.id !== "sort-select") return;
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set("sort", event.target.value);
    currentUrl.searchParams.set("current", "1");
    window.navigate(`${currentUrl.pathname}${currentUrl.search}`);
  };

  const handleSearchSubmit = (event) => {
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

  root.addEventListener("click", handleProductCardClick);
  root.addEventListener("click", handleCategoryClick);
  root.addEventListener("change", handleLimitChange);
  root.addEventListener("change", handleSortChange);
  root.addEventListener("submit", handleSearchSubmit);

  return () => {
    root.removeEventListener("click", handleProductCardClick);
    root.removeEventListener("click", handleCategoryClick);
    root.removeEventListener("change", handleLimitChange);
    root.removeEventListener("change", handleSortChange);
    root.removeEventListener("submit", handleSearchSubmit);
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
        <div data-product-list>
          ${ProductList({ products, pagination, loading })}
        </div>
      `,
    })}
  </div>
  `;
};
