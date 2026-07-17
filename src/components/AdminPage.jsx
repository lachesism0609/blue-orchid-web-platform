import { useMemo, useState } from "react";
import { orderStatusLabel } from "../store-utils.js";

const tabs = {
  products: ["商品与库存", "Products & inventory"],
  orders: ["订单管理", "Order management"],
};

const statusOptions = [
  "confirmed",
  "processing",
  "shipped",
  "completed",
  "cancelled",
];

const categories = ["women", "men", "bags", "shoes", "accessories"];

function productPayload(form, product) {
  const data = new FormData(form);
  return {
    category: data.get("category"),
    nameZh: data.get("nameZh"),
    nameEn: data.get("nameEn"),
    descriptionZh: data.get("descriptionZh"),
    descriptionEn: data.get("descriptionEn"),
    materialsZh: data.get("materialsZh"),
    materialsEn: data.get("materialsEn"),
    price: Number(data.get("price")),
    salePercent: data.get("salePercent") || null,
    imageUrl: data.get("imageUrl"),
    active: data.get("active") === "on",
    ...(product
      ? {}
      : {
          sizes: data.get("sizes"),
          stock: Number(data.get("stock")),
          variantNameZh: data.get("variantNameZh"),
          variantNameEn: data.get("variantNameEn"),
          colorHex: data.get("colorHex"),
          variantImageUrl: data.get("variantImageUrl"),
        }),
  };
}

function ProductFields({ product, zh }) {
  return (
    <div className="admin-form-grid">
      <label>
        {zh ? "分类" : "Category"}
        <select name="category" defaultValue={product?.category || "women"}>
          {categories.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </select>
      </label>
      <label>
        {zh ? "人民币价格" : "Price in CNY"}
        <input
          name="price"
          type="number"
          min="0"
          step="1"
          defaultValue={product?.price || 0}
          required
        />
      </label>
      <label>
        {zh ? "中文名称" : "Chinese name"}
        <input name="nameZh" defaultValue={product?.nameZh || ""} required />
      </label>
      <label>
        {zh ? "英文名称" : "English name"}
        <input name="nameEn" defaultValue={product?.nameEn || ""} required />
      </label>
      <label className="admin-wide">
        {zh ? "中文描述" : "Chinese description"}
        <textarea
          name="descriptionZh"
          defaultValue={product?.descriptionZh || ""}
          required
        />
      </label>
      <label className="admin-wide">
        {zh ? "英文描述" : "English description"}
        <textarea
          name="descriptionEn"
          defaultValue={product?.descriptionEn || ""}
          required
        />
      </label>
      <label>
        {zh ? "中文面料" : "Chinese materials"}
        <input
          name="materialsZh"
          defaultValue={product?.materialsZh || ""}
          required
        />
      </label>
      <label>
        {zh ? "英文面料" : "English materials"}
        <input
          name="materialsEn"
          defaultValue={product?.materialsEn || ""}
          required
        />
      </label>
      <label className="admin-wide">
        {zh ? "商品主图 URL" : "Product image URL"}
        <input name="imageUrl" defaultValue={product?.image || ""} required />
      </label>
      <label>
        {zh ? "折扣百分比" : "Discount percent"}
        <input
          name="salePercent"
          type="number"
          min="1"
          max="99"
          placeholder={zh ? "不打折请留空" : "Leave blank for full price"}
          defaultValue={product?.salePercent ?? ""}
        />
      </label>
      <label className="admin-checkbox">
        <input
          name="active"
          type="checkbox"
          defaultChecked={product?.active ?? true}
        />
        {zh ? "在商城显示" : "Visible in store"}
      </label>
      {!product && (
        <>
          <label>
            {zh ? "尺码（逗号分隔）" : "Sizes (comma separated)"}
            <input name="sizes" defaultValue="S, M, L" required />
          </label>
          <label>
            {zh ? "每个尺码初始库存" : "Initial stock per size"}
            <input
              name="stock"
              type="number"
              min="0"
              defaultValue="5"
              required
            />
          </label>
          <label>
            {zh ? "款式中文名" : "Chinese style name"}
            <input name="variantNameZh" defaultValue="默认款" required />
          </label>
          <label>
            {zh ? "款式英文名" : "English style name"}
            <input name="variantNameEn" defaultValue="Default" required />
          </label>
          <label>
            {zh ? "颜色值" : "Colour hex"}
            <input name="colorHex" defaultValue="#d8d4cc" required />
          </label>
          <label>
            {zh ? "款式图片 URL" : "Style image URL"}
            <input
              name="variantImageUrl"
              placeholder={
                zh ? "留空则使用商品主图" : "Blank uses product image"
              }
            />
          </label>
        </>
      )}
    </div>
  );
}

function ProductEditor({ product, zh, busy, onSave, onVariant, onSku }) {
  return (
    <section className="admin-editor">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSave(productPayload(event.currentTarget, product));
        }}
      >
        <div className="admin-editor-heading">
          <div>
            <p className="auth-kicker">PRODUCT #{product.id}</p>
            <h2>{zh ? "编辑商品" : "Edit product"}</h2>
          </div>
          <img src={product.image} alt="" />
        </div>
        <ProductFields product={product} zh={zh} />
        <button className="admin-primary" disabled={busy}>
          {zh ? "保存商品信息" : "Save product"}
        </button>
      </form>

      <div className="admin-subsection">
        <h3>{zh ? "款式" : "Styles"}</h3>
        {product.variants.map((variant) => (
          <form
            className="admin-variant-row"
            key={variant.id}
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              onVariant(variant.id, {
                nameZh: data.get("nameZh"),
                nameEn: data.get("nameEn"),
                colorHex: data.get("colorHex"),
                imageUrl: data.get("imageUrl"),
              });
            }}
          >
            <img src={variant.image} alt="" />
            <input name="nameZh" defaultValue={variant.nameZh} required />
            <input name="nameEn" defaultValue={variant.nameEn} required />
            <input name="colorHex" defaultValue={variant.color} required />
            <input name="imageUrl" defaultValue={variant.image} required />
            <button disabled={busy}>{zh ? "保存" : "Save"}</button>
          </form>
        ))}
      </div>

      <div className="admin-subsection">
        <h3>{zh ? "SKU 库存" : "SKU inventory"}</h3>
        <div className="admin-sku-grid">
          {product.skus.map((sku) => {
            const variant = product.variants.find(
              (entry) => entry.id === sku.variantId,
            );
            return (
              <form
                key={sku.id}
                onSubmit={(event) => {
                  event.preventDefault();
                  const stock = Number(
                    new FormData(event.currentTarget).get("stock"),
                  );
                  onSku(sku.id, stock);
                }}
              >
                <span>{sku.sku}</span>
                <small>
                  {zh ? variant?.nameZh : variant?.nameEn} · {sku.size}
                </small>
                <input
                  name="stock"
                  type="number"
                  min="0"
                  defaultValue={sku.stock}
                  aria-label={zh ? "库存" : "Stock"}
                />
                <button disabled={busy}>{zh ? "更新" : "Update"}</button>
              </form>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function AdminPage({
  open,
  user,
  lang,
  products,
  orders,
  orderTotal,
  loading,
  onClose,
  onReload,
  onCreate,
  onUpdateProduct,
  onUpdateVariant,
  onUpdateSku,
  onUpdateOrder,
}) {
  const zh = lang === "zh";
  const [tab, setTab] = useState("products");
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const filteredProducts = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return products.filter((product) =>
      `${product.id} ${product.nameZh} ${product.nameEn} ${product.category}`
        .toLowerCase()
        .includes(needle),
    );
  }, [products, query]);
  if (!open || user?.role !== "admin") return null;
  const editingProduct = products.find((product) => product.id === editingId);
  const lowStock = products.filter((product) => product.stock < 10).length;
  const activeProducts = products.filter((product) => product.active).length;

  const run = async (action, message) => {
    setBusy(true);
    setNotice("");
    try {
      await action();
      setNotice(message);
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-shell">
        <aside className="admin-sidebar">
          <p>BLUE ORCHID</p>
          <h1>{zh ? "管理后台" : "Administration"}</h1>
          <span>{user.email}</span>
          <nav>
            {Object.keys(tabs).map((key) => (
              <button
                key={key}
                className={tab === key ? "active" : ""}
                onClick={() => {
                  setTab(key);
                  setEditingId(null);
                  setCreating(false);
                }}
              >
                {tabs[key][zh ? 0 : 1]}
              </button>
            ))}
          </nav>
          <button className="admin-back" onClick={onClose}>
            ← {zh ? "返回商城" : "Back to store"}
          </button>
        </aside>

        <main className="admin-content">
          <div className="admin-topline">
            <div>
              <p className="auth-kicker">CONTROL CENTRE</p>
              <h1>{tabs[tab][zh ? 0 : 1]}</h1>
            </div>
            <div className="admin-top-actions">
              {editingProduct && (
                <button
                  type="button"
                  className="admin-list-back"
                  onClick={() => setEditingId(null)}
                >
                  <span aria-hidden="true">←</span>
                  {zh ? "返回商品列表" : "Back to products"}
                </button>
              )}
              <button onClick={onReload} disabled={loading}>
                {loading
                  ? zh
                    ? "加载中…"
                    : "Loading…"
                  : zh
                    ? "刷新数据"
                    : "Refresh"}
              </button>
            </div>
          </div>
          {notice && <p className="admin-notice">{notice}</p>}
          <div className="admin-metrics">
            <article>
              <span>{zh ? "商品" : "Products"}</span>
              <strong>{products.length}</strong>
              <small>{activeProducts} active</small>
            </article>
            <article>
              <span>{zh ? "低库存商品" : "Low stock"}</span>
              <strong>{lowStock}</strong>
              <small>&lt; 10 units</small>
            </article>
            <article>
              <span>{zh ? "订单" : "Orders"}</span>
              <strong>{orderTotal}</strong>
              <small>{zh ? "全部订单" : "All orders"}</small>
            </article>
          </div>

          {tab === "products" && (
            <>
              {creating ? (
                <section className="admin-editor">
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      run(
                        async () => {
                          await onCreate(productPayload(event.currentTarget));
                          setCreating(false);
                        },
                        zh ? "商品已创建。" : "Product created.",
                      );
                    }}
                  >
                    <div className="admin-editor-heading">
                      <div>
                        <p className="auth-kicker">NEW PRODUCT</p>
                        <h2>{zh ? "创建商品" : "Create product"}</h2>
                      </div>
                      <button type="button" onClick={() => setCreating(false)}>
                        ×
                      </button>
                    </div>
                    <ProductFields zh={zh} />
                    <button className="admin-primary" disabled={busy}>
                      {zh ? "创建商品" : "Create product"}
                    </button>
                  </form>
                </section>
              ) : editingProduct ? (
                <ProductEditor
                  product={editingProduct}
                  zh={zh}
                  busy={busy}
                  onSave={(payload) =>
                    run(
                      () => onUpdateProduct(editingProduct.id, payload),
                      zh ? "商品信息已保存。" : "Product saved.",
                    )
                  }
                  onVariant={(id, payload) =>
                    run(
                      () => onUpdateVariant(id, payload),
                      zh ? "款式已更新。" : "Style updated.",
                    )
                  }
                  onSku={(id, stock) =>
                    run(
                      () => onUpdateSku(id, stock),
                      zh ? "库存已更新。" : "Inventory updated.",
                    )
                  }
                />
              ) : (
                <>
                  <div className="admin-toolbar">
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder={
                        zh ? "搜索商品名称或编号" : "Search name or ID"
                      }
                    />
                    <button onClick={() => setCreating(true)}>
                      + {zh ? "新增商品" : "Add product"}
                    </button>
                  </div>
                  <div className="admin-product-table">
                    {filteredProducts.map((product) => (
                      <article key={product.id}>
                        <img src={product.image} alt="" />
                        <div>
                          <strong>
                            {zh ? product.nameZh : product.nameEn}
                          </strong>
                          <span>
                            #{product.id} · {product.category}
                          </span>
                        </div>
                        <span>¥{product.price}</span>
                        <span>
                          {product.stock} {zh ? "件" : "units"}
                        </span>
                        <b className={product.active ? "active" : "inactive"}>
                          {product.active
                            ? zh
                              ? "上架"
                              : "Active"
                            : zh
                              ? "下架"
                              : "Hidden"}
                        </b>
                        <button onClick={() => setEditingId(product.id)}>
                          {zh ? "管理" : "Manage"}
                        </button>
                      </article>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {tab === "orders" && (
            <div className="admin-order-list">
              {orders.length ? (
                orders.map((order) => (
                  <article key={order.id}>
                    <button
                      className="admin-order-summary"
                      onClick={() =>
                        setExpandedOrder(
                          expandedOrder === order.id ? null : order.id,
                        )
                      }
                    >
                      <span>
                        <strong>{order.id}</strong>
                        <small>
                          {order.customer.name} · {order.customer.email}
                        </small>
                      </span>
                      <span>{new Date(order.createdAt).toLocaleString()}</span>
                      <b>¥{order.total}</b>
                    </button>
                    <form
                      className="admin-order-status"
                      onSubmit={(event) => {
                        event.preventDefault();
                        const status = new FormData(event.currentTarget).get(
                          "status",
                        );
                        run(
                          () => onUpdateOrder(order.id, status),
                          zh ? "订单状态已更新。" : "Order status updated.",
                        );
                      }}
                    >
                      <select name="status" defaultValue={order.status}>
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {orderStatusLabel(status, lang)}
                          </option>
                        ))}
                      </select>
                      <button disabled={busy}>
                        {zh ? "保存状态" : "Save status"}
                      </button>
                    </form>
                    {expandedOrder === order.id && (
                      <div className="admin-order-detail">
                        <div>
                          {order.items.map((item, index) => (
                            <p key={`${item.productId}-${index}`}>
                              <span>
                                {item.name} · {item.variantName} · {item.size}
                              </span>
                              <strong>
                                {item.quantity} × ¥{item.unitPrice}
                              </strong>
                            </p>
                          ))}
                        </div>
                        <address>
                          <strong>{order.address?.recipient}</strong>
                          <span>{order.address?.phone}</span>
                          <p>
                            {order.address?.line1}, {order.address?.city}{" "}
                            {order.address?.postcode}, {order.address?.country}
                          </p>
                        </address>
                      </div>
                    )}
                  </article>
                ))
              ) : (
                <div className="account-empty">
                  <h3>{zh ? "暂无订单" : "No orders yet"}</h3>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
