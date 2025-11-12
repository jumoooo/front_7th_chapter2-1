// 주소에서 파라미터 가저오기
export const parseHomeQuery = (defaultLimit = 20) => {
  const searchParams = new URLSearchParams(window.location.search);
  const limitParam = Number(searchParams.get("limit"));
  const limit = Number.isNaN(limitParam) || limitParam <= 0 ? defaultLimit : limitParam;
  const currentParam = Number.parseInt(searchParams.get("current") ?? searchParams.get("page") ?? "1", 10);

  return {
    limit,
    current: Number.isNaN(currentParam) || currentParam <= 0 ? 1 : currentParam,
    search: searchParams.get("search") ?? "",
    category1: searchParams.get("category1") ?? "",
    category2: searchParams.get("category2") ?? "",
    sort: searchParams.get("sort") ?? undefined,
  };
};
