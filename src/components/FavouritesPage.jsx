import ProductCard from "./ProductCard.jsx";

export default function FavouritesPage({
  open,
  products,
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
  onHome,
}) {
  if (!open) return null;
  return (
    <div className="favourites-page">
      <section className="favourites-shell">
        <header className="favourites-heading">
          <p>BLUE ORCHID</p>
          <h1>{lang === "zh" ? "我的收藏" : "My favourites"}</h1>
          <span>
            {products.length} {lang === "zh" ? "件商品" : "items"}
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
            <h2>{lang === "zh" ? "还没有收藏商品" : "No favourites yet"}</h2>
            <p>
              {lang === "zh"
                ? "点击商品右上角的爱心，将心仪单品保存到这里。"
                : "Tap the heart on a product to save it here."}
            </p>
            <button onClick={onHome}>
              {lang === "zh" ? "去逛逛" : "Explore the store"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
