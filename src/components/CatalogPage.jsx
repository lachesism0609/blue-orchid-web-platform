import ProductCard from "./ProductCard.jsx";

export default function CatalogPage({
  open,
  title,
  products,
  total,
  lang,
  productNames,
  liked,
  favouriteLabel,
  saleDiscounts,
  formatPrice,
  variantImage,
  selectedColor,
  salePrice,
  saleLabel,
  onOpen,
  onLike,
  onAdd,
  onColor,
}) {
  if (!open) return null;
  return (
    <div className="catalog-page">
      <section className="catalog-shell">
        <header className="catalog-heading">
          <p>BLUE ORCHID</p>
          <h1>{title}</h1>
          <span>
            {total} {lang === "zh" ? "件商品" : "items"}
          </span>
        </header>
        {products.length ? (
          <div className="catalog-grid">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                name={
                  productNames[product.id]?.[lang === "zh" ? 0 : 1] ||
                  product.name
                }
                image={variantImage(product)}
                liked={liked.includes(product.id)}
                favouriteLabel={favouriteLabel}
                saleLabel={saleDiscounts[product.id] ? saleLabel(product) : ""}
                originalPrice={
                  saleDiscounts[product.id] ? formatPrice(product.price) : ""
                }
                currentPrice={formatPrice(
                  saleDiscounts[product.id]
                    ? salePrice(product)
                    : product.price,
                )}
                selectedColor={selectedColor(product)}
                lang={lang}
                onOpen={() => onOpen(product)}
                onLike={() => onLike(product.id)}
                onAdd={() => onAdd(product)}
                onColor={(index) => onColor(product.id, index)}
              />
            ))}
          </div>
        ) : (
          <div className="catalog-empty">
            <h2>
              {lang === "zh" ? "没有符合条件的商品" : "No matching products"}
            </h2>
            <p>
              {lang === "zh"
                ? "请调整搜索或筛选条件。"
                : "Try changing the search or filters."}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
