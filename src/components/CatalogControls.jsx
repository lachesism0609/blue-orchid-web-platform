export default function CatalogControls({
  visible,
  lang,
  query,
  price,
  stockOnly,
  hasProducts,
  page,
  pages,
  onQuery,
  onPrice,
  onStock,
  onPage,
}) {
  if (!visible) return null;
  return (
    <>
      <div className="catalog-tools">
        <label>
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4 4" />
          </svg>
          <input
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder={lang === "zh" ? "搜索商品" : "Search products"}
          />
        </label>
        <select value={price} onChange={(event) => onPrice(event.target.value)}>
          <option value="all">
            {lang === "zh" ? "全部价格" : "All prices"}
          </option>
          <option value="under300">
            {lang === "zh" ? "低于 ¥300" : "Under ¥300"}
          </option>
          <option value="300to600">¥300–¥600</option>
          <option value="over600">
            {lang === "zh" ? "高于 ¥600" : "Over ¥600"}
          </option>
        </select>
        <label className="stock-filter">
          <input
            type="checkbox"
            checked={stockOnly}
            onChange={(event) => onStock(event.target.checked)}
          />
          {lang === "zh" ? "仅看有货" : "In stock only"}
        </label>
      </div>
      {hasProducts && (
        <div className="catalog-pagination">
          <button
            disabled={page === 1}
            onClick={() => onPage(Math.max(1, page - 1))}
          >
            ←
          </button>
          <span>
            {page} / {pages}
          </span>
          <button
            disabled={page === pages}
            onClick={() => onPage(Math.min(pages, page + 1))}
          >
            →
          </button>
        </div>
      )}
    </>
  );
}
