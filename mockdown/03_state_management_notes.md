# 홈 페이지 상태 관리 구조 정리

## 1. 데이터 집합 상태

- 상품 목록과 카테고리, 페이지네이션 정보는 현재 `homeState` 객체로 직접 갱신하고 있음.
- React라면 `useState`로 선언하고 `setProducts`, `setCategories`, `setPagination` 호출만으로 렌더를 유발했을 부분.
- 현재 구조에서는 DOM을 수동으로 교체하기 때문에 상태 → UI 동기화를 직접 작성해야 함.

## 2. 페이징 & 로딩 상태

- `currentPage`, `hasNextPage`, `isLoading`이 지역 변수로 유지되며 무한 스크롤 제어에 사용됨.
- React라면 `const [page, setPage] = useState(1)`처럼 관리하고, 상태 변경 시점에 따라 사이드이펙트를 `useEffect`로 처리했을 것.
- 지금은 URL 및 DOM을 직접 조작하며, 상태와 뷰 로직이 밀접하게 연결되어 있음.

## 3. 필터/검색 상태

- 필터(검색어, 카테고리, 정렬)는 URL 쿼리를 단일 소스로 삼고 `parseHomeQuery`로 재구성함.
- React에서는 `useState`로 필터 값을 보관한 뒤, 값 변경 시 `useEffect`로 API를 다시 호출하는 패턴이 일반적.
- 현재 구조는 URL이 곧 상태라는 전제에서 동작하기 때문에, 상태 갱신 시 마다 새 URL과 렌더링을 수동 처리해야 함.

## 4. 정리 ✨

- `useState`가 있었다면 각 책임을 독립된 상태로 선언하고, 값 변경 후 렌더링을 React에 위임했을 것.
- 지금 구조는 라우터/렌더 엔진을 커스텀으로 구현해 상태와 DOM을 직접 연결하고 있으며, 이는 현 구조의 제약이자 설계 의도임.
