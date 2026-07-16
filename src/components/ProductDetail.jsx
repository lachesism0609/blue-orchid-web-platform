export default function ProductDetail({
  product,
  lang,
  name,
  image,
  formatPrice,
  selectedColor,
  selectedSize,
  editing,
  onClose,
  onColor,
  onSize,
  onAction,
}) {
  if (!product) return null;
  return (
    <div className="product-detail-backdrop" onClick={onClose}>
      <article
        className="product-detail"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="product-detail-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <img src={image} alt={name} />
        <div>
          <p className="about-eyebrow">BLUE ORCHID</p>
          <h2>{name}</h2>
          {product.salePrice ? (
            <p className="sale-price">
              <s>{formatPrice(product.price)}</s>
              <strong>{formatPrice(product.salePrice)}</strong>
            </p>
          ) : (
            <strong>{formatPrice(product.price)}</strong>
          )}
          <p>
            {lang === "zh"
              ? "以舒适、轻盈与日常实穿为核心设计的经典单品。"
              : product.description}
          </p>
          <dl>
            <div>
              <dt>{lang === "zh" ? "材质" : "Materials"}</dt>
              <dd>{product.materials}</dd>
            </div>
            <div>
              <dt>{lang === "zh" ? "尺码" : "Sizes"}</dt>
              <dd>
                {product.sizes?.map((size) => (
                  <button
                    type="button"
                    className={selectedSize === size ? "selected" : ""}
                    onClick={() => onSize(size)}
                    key={size}
                  >
                    {size}
                  </button>
                ))}
              </dd>
            </div>
            <div>
              <dt>{lang === "zh" ? "库存" : "Availability"}</dt>
              <dd>
                {product.inStock
                  ? `${product.stock} ${lang === "zh" ? "件有货" : "in stock"}`
                  : lang === "zh"
                    ? "暂时缺货"
                    : "Out of stock"}
              </dd>
            </div>
          </dl>
          <div className="swatches">
            {product.colors.map((color, index) => (
              <button
                type="button"
                className={selectedColor === index ? "selected" : ""}
                style={{ background: color }}
                onClick={() => onColor(index)}
                aria-label={`${lang === "zh" ? "款式" : "Colour"} ${index + 1}`}
                key={color}
              />
            ))}
          </div>
          <button
            className="detail-add"
            disabled={!product.inStock}
            onClick={onAction}
          >
            {editing
              ? lang === "zh"
                ? "保存选择"
                : "Save options"
              : product.inStock
                ? lang === "zh"
                  ? "加入购物车"
                  : "Add to bag"
                : lang === "zh"
                  ? "暂时缺货"
                  : "Out of stock"}
          </button>
        </div>
      </article>
    </div>
  );
}
