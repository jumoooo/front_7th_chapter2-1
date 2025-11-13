# 커스텀 Hook 기반 상태 관리로 리팩터링 지시서

> 목표: `src/pages/HomePage.js`와 라우터 전반을 `src/lib/hook.js`의 `useState`/`scheduleUpdate` 체계에 맞게 개편한다.

## 1. 컴포넌트 구조 재편

1. `HomePage` 렌더 흐름을 “데이터를 받아 문자열을 반환”하는 패턴에서 **훅을 사용하는 컴포넌트 함수**로 재작성한다.
   - `renderHomePage` 대신 `HomePageComponent(context)` 형태의 함수로 변경한다.
   - 내부에서 `const [products, setProducts] = useState([])` 등 필요한 상태를 선언한다.
   - 함수는 최종 HTML 문자열을 반환한다.
2. 데이터 로딩은 컴포넌트 외부에서 처리하지 말고, 컴포넌트 실행 시 `useEffect`에 해당하는 패턴(예: `scheduleUpdate` 전에 비동기 호출)으로 구현한다.

## 2. 라우터 & 렌더 엔진 조정

1. `src/router/router.js`에서 `routes` 항목을 **컴포넌트 함수**로 정의한다.  
   예: `{ path: "/", component: HomePageComponent }`.
2. `renderRoute`는 컴포넌트 함수를 `renderComponent(() => component({ params }))` 형태로 호출하도록 수정한다.
3. `renderComponent` 실행 결과(HTML)를 루트 DOM에 주입하고, 이전과 동일하게 이벤트 위임 초기화 함수를 호출한다.
4. `scheduleUpdate` 호출 시 `renderComponent`가 동일 컴포넌트를 다시 실행할 수 있도록 `prepareRender`를 해당 컴포넌트 함수에 설정한다.

## 3. DOM 갱신 방식 일원화

1. `productListContainer.innerHTML = ...` 같은 부분 업데이트 로직을 제거한다.
2. 상태가 변경되면 `setState` → `scheduleUpdate` → 컴포넌트 전체가 다시 렌더되는 흐름으로 통일한다.
3. 이벤트 위임은 렌더 직후 한 번만 등록하고, 컴포넌트 재실행 시 기존 리스너를 해제 후 다시 등록하도록 `cleanup` 로직을 유지한다.

## 4. 상태 정의 및 갱신

1. 다음 상태를 각각 `useState`로 관리한다.
   - `products`: 상품 배열
   - `categories`: 카테고리 데이터
   - `pagination`: `{ page, limit, total, hasNext }`
   - `filters`: `{ search, category1, category2, sort }`
   - `isLoading`: 플래그 (무한 스크롤/데이터 요청 중 여부)
2. `loadMore`와 필터 변경 핸들러는 `setProducts`, `setPagination`, `setFilters`, `setIsLoading`을 이용해 상태를 갱신한다.

## 5. URL & 상태 동기화

1. 초기 진입 시 `parseHomeQuery`로 URL에서 필터 상태를 추출하고, 해당 값으로 초기 상태를 설정한다.
2. 상태가 변경될 때마다 `history.replaceState`를 통해 URL을 최신 상태와 맞춘다.
   - 예: `filters`가 바뀌면 `category1`, `category2`, `search`, `sort`를 URL에 반영.
   - `pagination.page`가 바뀌면 `current` 파라미터 업데이트.
3. 브라우저 `popstate` 이벤트가 발생하면 URL을 다시 파싱하여 상태에 반영한다.

## 6. 이벤트 핸들러 리팩터링

1. 카테고리/검색/정렬/개수 변경 핸들러는 상태를 직접 갱신하고, URL 반영은 상태 변화에 따른 사이드 이펙트로 처리한다.
2. 무한 스크롤은 `isLoading`과 `pagination.hasNext` 상태를 사용해 중복 호출을 막고 `setProducts`로 데이터를 누적한다.

## 7. 테스트 & 검증

1. 홈 화면 로딩, 필터 변경, 검색, 무한 스크롤, 뒤로가기 동작을 수동으로 검증한다.
2. 상태가 정상적으로 유지되는지, URL과 화면이 일치하는지 확인한다.

---

### 참고

- 기존 `homeState` 전역 객체는 더 이상 사용하지 않는다.
- `urlUtils.parseHomeQuery`는 그대로 활용하되, 반환 값을 초기 상태 설정에만 사용한다.
- 훅 기반 렌더링으로 넘어가면 에러 핸들링도 컴포넌트 내부에서 상태를 통해 처리해야 한다.
