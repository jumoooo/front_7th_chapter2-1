## Plan

- Step 1: Convert HomePage default export into a hook-based component function (e.g., HomePageComponent) that uses useState for filters, pagination, products, categories, loading, and error.
- Step 2: Implement data fetching logic inside the component using helper functions, reusing parseHomeQuery and getProducts/getCategories while keeping functionality unchanged.
- Step 3: Replace direct DOM manipulations with state updates and rely on renderComponent for re-rendering; ensure event handlers update state and URL, and return mount cleanup for IntersectionObserver and delegated events.
