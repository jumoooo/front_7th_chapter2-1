import { getCategories, getProduct, getProducts } from "./api/productApi.js";
import { useState } from "./lib/hook.js";
import { DetailPage } from "./pages/DetailPage.js";
import { HomePage } from "./pages/HomePage.js";
import { renderComponent } from "./renderEngine.js";

const enableMocking = () =>
  import("./mocks/browser.js").then(({ worker }) =>
    worker.start({
      onUnhandledRequest: "bypass",
    }),
  );

const push = (path) => {
  history.pushState(null, null, path);
};

//--------------------------------
// 이벤트 리스너 바인딩 여부
let isListenerBound = false;

const render = async () => {
  const $root = document.querySelector("#root");

  if (location.pathname === "/") {
    $root.innerHTML = await HomePage({ loading: true });
    const data = await getProducts();
    $root.innerHTML = await HomePage({ ...data, loading: false });

    // 카테고리 상태 선언
    const [categories, setCategories] = useState([]);

    if (categories.length === 0) {
      const fetchedCategories = await getCategories();
      setCategories(fetchedCategories);
    }

    if (!isListenerBound) {
      document.body.addEventListener("click", (event) => {
        const card = event.target.closest(".product-card");
        if (!card) return;

        push(`/products/${card.dataset.productId}`);
        renderComponent(render);
      });
      isListenerBound = true;
    }
  } else {
    $root.innerHTML = await DetailPage({ loading: true });
    const productId = location.pathname.split("/").pop();
    const data = await getProduct(productId);
    $root.innerHTML = await DetailPage({ loading: false, product: data });
  }
};

window.addEventListener("popstate", () => renderComponent(render));

const main = () => {
  renderComponent(render);
};

// 애플리케이션 시작
if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}
