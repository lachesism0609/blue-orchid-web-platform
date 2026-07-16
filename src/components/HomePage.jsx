import ProductCard from "./ProductCard.jsx";

export default function HomePage({
  copy,
  lang,
  slides,
  activeSlide,
  categoryImages,
  categoryRoutes,
  products,
  productNames,
  liked,
  saleDiscounts,
  formatPrice,
  variantImage,
  selectedColor,
  salePrice,
  saleLabel,
  onSlide,
  onCategory,
  onAll,
  onOpen,
  onLike,
  onAdd,
  onColor,
}) {
  return (
    <>
      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <small>{copy.collection}</small>
            <h1>{copy.title}</h1>
            <p>{copy.intro}</p>
            <a href="#popular" className="button">
              {copy.shop}
            </a>
          </div>
          <div
            className="hero-photo"
            key={activeSlide}
            style={{ backgroundImage: `url(${slides[activeSlide]})` }}
          />
          <div className="dots">
            {slides.map((_, index) => (
              <button
                key={index}
                className={index === activeSlide ? "active" : ""}
                onClick={() => onSlide(index)}
                aria-label={`Slide ${index + 1}`}
              />
            ))}
          </div>
        </section>
        <section className="categories">
          {categoryImages.map((image, index) => (
            <button
              onClick={() => onCategory(categoryRoutes[index])}
              key={image}
            >
              <img src={image} alt={copy.categories[index]} />
              <span>{copy.categories[index]}</span>
            </button>
          ))}
        </section>
        <section id="popular" className="products">
          <div className="section-title">
            <h2>{copy.popular}</h2>
            <button onClick={onAll}>{copy.all}</button>
          </div>
          <div className="grid">
            {products.slice(0, 6).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                name={
                  productNames[product.id]?.[lang === "zh" ? 0 : 1] ||
                  product.name
                }
                image={variantImage(product)}
                liked={liked.includes(product.id)}
                favouriteLabel={copy.favourite}
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
        </section>
      </main>
      <footer>
        {copy.services.map(([title, caption], index) => (
          <div key={title}>
            <span className="footer-icon" aria-hidden="true">
              {["↗", "↩", "▣", "◉"][index]}
            </span>
            <p>
              <strong>{title}</strong>
              <span>
                {index === 0
                  ? lang === "zh"
                    ? `订单满 ${formatPrice(399)}`
                    : `On orders over ${formatPrice(399)}`
                  : caption}
              </span>
            </p>
          </div>
        ))}
      </footer>
    </>
  );
}
