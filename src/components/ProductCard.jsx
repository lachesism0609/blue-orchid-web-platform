export default function ProductCard({
  product,
  name,
  image,
  liked,
  favouriteLabel,
  saleLabel,
  originalPrice,
  currentPrice,
  selectedColor,
  lang,
  onOpen,
  onLike,
  onAdd,
  onColor,
}) {
  const runWithoutOpening = (event, action) => {
    event.stopPropagation();
    action();
  };

  return (
    <article className="card" onClick={onOpen}>
      <div className="product-image">
        <img src={image} alt={name} />
        {saleLabel && <span className="sale-badge">{saleLabel}</span>}
        <button
          className={liked ? "liked" : ""}
          onClick={(event) => runWithoutOpening(event, onLike)}
          aria-label={favouriteLabel}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M20.8 4.8a5.5 5.5 0 0 0-7.8 0L12 5.9l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.9-8.4a5.5 5.5 0 0 0-.1-7.8Z" />
          </svg>
        </button>
      </div>
      <div className="product-title">
        <h3>{name}</h3>
        <button
          onClick={(event) => runWithoutOpening(event, onAdd)}
          disabled={!product.inStock}
        >
          {product.inStock
            ? lang === "zh"
              ? "加入购物车"
              : "Add to bag"
            : lang === "zh"
              ? "缺货"
              : "Out of stock"}
        </button>
      </div>
      {originalPrice ? (
        <p className="sale-price">
          <s>{originalPrice}</s>
          <strong>{currentPrice}</strong>
        </p>
      ) : (
        <p>{currentPrice}</p>
      )}
      <div className="swatches">
        {product.colors.map((color, index) => (
          <button
            type="button"
            className={selectedColor === index ? "selected" : ""}
            style={{ background: color }}
            onClick={(event) => runWithoutOpening(event, () => onColor(index))}
            aria-label={`${lang === "zh" ? "选择颜色" : "Choose colour"} ${index + 1}`}
            key={`${color}-${index}`}
          />
        ))}
      </div>
    </article>
  );
}
