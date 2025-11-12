import { navigate, renderRoute } from "./router/router.js";

window.navigate = navigate;

const enableMocking = () =>
  import("./mocks/browser.js").then(({ worker }) =>
    worker.start({
      onUnhandledRequest: "bypass",
    }),
  );

// const bindGlobalEvents = () => {
//   if (isListenerBound) return;

//   // 제품 카드 클릭
//   addEvent(".product-card", "click", (element) => {
//     const productId = element.dataset.productId;
//     if (!productId) return;
//     navigate(`/products/${productId}`);
//   });

//   // 카테고리 버튼 클릭(1차)
//   addEvent(".category2-filter-btn", "click", (element) => {
//     const currentUrl = new URL(window.location.href);
//     const categoryValue = element.dataset.category1 ?? "";
//     currentUrl.searchParams.set("category1", categoryValue);
//     currentUrl.searchParams.delete("category2");
//     navigate(`${currentUrl.pathname}${currentUrl.search}`);
//   });

//   // 표시 갯수 변경
//   addEvent("#limit-select", "change", (element) => {
//     const selectedValue = element.value;
//     const currentUrl = new URL(window.location.href);
//     currentUrl.searchParams.set("limit", selectedValue);
//     navigate(`${currentUrl.pathname}${currentUrl.search}`);
//   });

//   // data-link attribute를 통한 SPA 네비게이션
//   addEvent("[data-link]", "click", (element, event) => {
//     event.preventDefault();
//     const href = element.getAttribute("href") ?? element.dataset.href;
//     if (!href) return;
//     navigate(href);
//   });

//   // 에러 페이지에서 홈으로 이동
//   addEvent('[data-action="go-home"]', "click", () => {
//     navigate("/");
//   });

//   isListenerBound = true;
// };

const main = () => {
  renderRoute();
};

// 애플리케이션 시작
if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}
