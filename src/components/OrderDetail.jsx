import { orderStatusLabel } from "../store-utils.js";

export default function OrderDetail({
  order,
  lang,
  products,
  productNames,
  formatPrice,
  onClose,
}) {
  if (!order) return null;
  const date = order.createdAt
    ? new Intl.DateTimeFormat(lang === "zh" ? "zh-CN" : "en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(order.createdAt))
    : "—";
  return (
    <div className="order-detail-backdrop" onMouseDown={onClose}>
      <section
        className="order-detail"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="order-detail-close" onClick={onClose}>
          ×
        </button>
        <p className="auth-kicker">BLUE ORCHID</p>
        <div className="order-detail-heading">
          <div>
            <h2>{lang === "zh" ? "订单详情" : "Order details"}</h2>
            <span>{order.id}</span>
          </div>
          <strong>{orderStatusLabel(order.status, lang)}</strong>
        </div>
        <div className="order-meta">
          <p>
            <span>{lang === "zh" ? "下单时间" : "Order date"}</span>
            <strong>{date}</strong>
          </p>
          <p>
            <span>{lang === "zh" ? "订单总额" : "Order total"}</span>
            <strong>{formatPrice(order.total)}</strong>
          </p>
        </div>
        <h3>{lang === "zh" ? "商品明细" : "Items"}</h3>
        <div className="order-detail-items">
          {(order.items || []).map((item, index) => (
            <article key={`${item.productId}-${index}`}>
              <img
                src={
                  products.find((product) => product.id === item.productId)
                    ?.image || ""
                }
                alt=""
              />
              <div>
                <strong>
                  {productNames[item.productId]?.[lang === "zh" ? 0 : 1] ||
                    item.name}
                </strong>
                <span>
                  {lang === "zh" ? "数量" : "Qty"} × {item.quantity} ·{" "}
                  {item.variantName || (lang === "zh" ? "默认款式" : "Default")}
                  {" · "}
                  {item.size || "One size"}
                </span>
              </div>
              <p>
                <span>
                  {formatPrice(item.unitPrice)} × {item.quantity}
                </span>
                <strong>{formatPrice(item.unitPrice * item.quantity)}</strong>
              </p>
            </article>
          ))}
        </div>
        {order.address && (
          <>
            <h3>{lang === "zh" ? "收货地址" : "Delivery address"}</h3>
            <address>
              <strong>{order.address.recipient}</strong>
              <span>{order.address.phone}</span>
              <p>
                {order.address.line1}
                <br />
                {order.address.city} {order.address.postcode}
                <br />
                {order.address.country}
              </p>
            </address>
          </>
        )}
      </section>
    </div>
  );
}
