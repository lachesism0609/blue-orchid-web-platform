export default function CartPage({
  open,
  stage,
  completedOrder,
  lang,
  items,
  addresses,
  selectedAddressId,
  loading,
  total,
  formatPrice,
  itemImage,
  itemName,
  unitPrice,
  onAddress,
  onConfirm,
  onBack,
  onEdit,
  onQuantity,
  onRemove,
  onCheckout,
  onHome,
}) {
  if (!open) return null;

  const zh = lang === "zh";
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  if (stage === "success") {
    return (
      <div className="favourites-page checkout-page">
        <section className="favourites-shell checkout-shell">
          <div className="checkout-success">
            <span>✓</span>
            <p>BLUE ORCHID</p>
            <h1>{zh ? "购买成功" : "Order confirmed"}</h1>
            <strong>{completedOrder?.id}</strong>
            <p>
              {zh
                ? "订单已创建，即将跳转到订单历史。"
                : "Your order was created. Opening order history…"}
            </p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="favourites-page checkout-page">
      <section className="favourites-shell checkout-shell">
        <header className="favourites-heading">
          <p>BLUE ORCHID</p>
          <h1>
            {stage === "confirm"
              ? zh
                ? "确认订单"
                : "Review order"
              : zh
                ? "购物车"
                : "Shopping bag"}
          </h1>
          <span>
            {itemCount} {zh ? "件商品" : "items"}
          </span>
        </header>

        {stage === "confirm" ? (
          <div className="checkout-review">
            <section>
              <h2>{zh ? "购买商品" : "Your items"}</h2>
              <div className="checkout-items">
                {items.map((item) => (
                  <article key={item.index}>
                    <img src={itemImage(item)} alt={itemName(item)} />
                    <div>
                      <strong>{itemName(item)}</strong>
                      <span>
                        {zh ? "数量" : "Qty"} × {item.quantity}
                      </span>
                      <small>{item.size}</small>
                    </div>
                    <b>
                      {formatPrice(unitPrice(item.product) * item.quantity)}
                    </b>
                  </article>
                ))}
              </div>
              <h2>{zh ? "选择收货地址" : "Delivery address"}</h2>
              <div className="checkout-addresses">
                {addresses.map((address) => (
                  <label
                    className={
                      selectedAddressId === address.id ? "selected" : ""
                    }
                    key={address.id}
                  >
                    <input
                      type="radio"
                      name="checkout-address"
                      checked={selectedAddressId === address.id}
                      onChange={() => onAddress(address.id)}
                    />
                    <strong>{address.recipient}</strong>
                    <span>{address.phone}</span>
                    <p>
                      {address.line1}
                      <br />
                      {address.city} {address.postcode}
                      <br />
                      {address.country}
                    </p>
                  </label>
                ))}
              </div>
            </section>
            <aside>
              <h2>{zh ? "订单汇总" : "Order summary"}</h2>
              <p>
                <span>{zh ? "商品小计" : "Subtotal"}</span>
                <strong>{formatPrice(total)}</strong>
              </p>
              <p>
                <span>{zh ? "配送" : "Delivery"}</span>
                <strong>{zh ? "免费" : "Free"}</strong>
              </p>
              <div>
                <span>{zh ? "合计" : "Total"}</span>
                <strong>{formatPrice(total)}</strong>
              </div>
              <button
                className="confirm-order"
                onClick={onConfirm}
                disabled={!selectedAddressId || loading}
              >
                {loading
                  ? zh
                    ? "正在确认…"
                    : "Confirming…"
                  : zh
                    ? "确认购买"
                    : "Confirm order"}
              </button>
              <button className="back-to-cart" onClick={onBack}>
                {zh ? "返回购物车" : "Back to bag"}
              </button>
            </aside>
          </div>
        ) : items.length ? (
          <>
            <div className="cart-list">
              {items.map((item) => (
                <article key={item.index}>
                  <button
                    className="cart-product-link"
                    onClick={() => onEdit(item)}
                    aria-label={
                      zh
                        ? "查看并编辑商品选项"
                        : "View and edit product options"
                    }
                  >
                    <img src={itemImage(item)} alt={itemName(item)} />
                  </button>
                  <div>
                    <strong>{itemName(item)}</strong>
                    <p>{formatPrice(unitPrice(item.product))}</p>
                    <small>{item.size}</small>
                  </div>
                  <div className="quantity-control">
                    <button onClick={() => onQuantity(item.index, -1)}>
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button onClick={() => onQuantity(item.index, 1)}>+</button>
                  </div>
                  <button onClick={() => onRemove(item.index)}>
                    {zh ? "移除" : "Remove"}
                  </button>
                </article>
              ))}
            </div>
            <div className="cart-summary">
              <strong>
                {zh ? "合计" : "Total"} {formatPrice(total)}
              </strong>
              <button onClick={onCheckout}>{zh ? "去结算" : "Checkout"}</button>
            </div>
          </>
        ) : (
          <div className="catalog-empty">
            <h2>{zh ? "购物车为空" : "Your bag is empty"}</h2>
            <button onClick={onHome}>
              {zh ? "继续选购" : "Continue shopping"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
