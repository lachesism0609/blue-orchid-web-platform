import { orderStatusLabel } from "../store-utils.js";

const tabs = {
  orders: ["订单历史", "Order history"],
  addresses: ["地址管理", "Addresses"],
  profile: ["个人信息", "Personal details"],
};

export default function AccountPage({
  open,
  user,
  lang,
  tab,
  notice,
  data,
  formatPrice,
  onClose,
  onTab,
  onLogout,
  onOrder,
  onDeleteAddress,
  onAddAddress,
  onSaveProfile,
}) {
  if (!open || !user) return null;
  const zh = lang === "zh";
  const label = (key) => tabs[key][zh ? 0 : 1];

  return (
    <div className="account-page">
      <div className="account-shell">
        <button className="account-close" onClick={onClose}>
          ← {zh ? "返回商城" : "Back to store"}
        </button>
        <aside className="account-sidebar">
          <p>BLUE ORCHID</p>
          <h2>{zh ? "我的账户" : "My account"}</h2>
          <span>{user.name}</span>
          <div>
            {Object.keys(tabs).map((id) => (
              <button
                key={id}
                className={tab === id ? "active" : ""}
                onClick={() => onTab(id)}
              >
                {label(id)}
              </button>
            ))}
          </div>
          <button className="account-logout" onClick={onLogout}>
            {zh ? "退出登录" : "Sign out"}
          </button>
        </aside>
        <section className="account-content">
          {notice && <p className="account-notice">{notice}</p>}
          {tab === "orders" && (
            <>
              <h1>{label("orders")}</h1>
              {data.orders.length ? (
                <div className="orders-list">
                  {data.orders.map((order) => (
                    <article
                      key={order.id}
                      onClick={() => onOrder(order)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ")
                          onOrder(order);
                      }}
                      tabIndex="0"
                      role="button"
                    >
                      <span>{order.id}</span>
                      <strong>{formatPrice(order.total)}</strong>
                      <small>{orderStatusLabel(order.status, lang)}</small>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="account-empty">
                  <h3>{zh ? "还没有订单" : "No orders yet"}</h3>
                  <p>
                    {zh
                      ? "您的订单将在这里显示。"
                      : "Your future orders will appear here."}
                  </p>
                  <button onClick={onClose}>
                    {zh ? "开始选购" : "Start shopping"}
                  </button>
                </div>
              )}
            </>
          )}
          {tab === "addresses" && (
            <>
              <h1>{label("addresses")}</h1>
              <div className="address-list">
                {data.addresses.map((address) => (
                  <article key={address.id}>
                    <strong>{address.recipient}</strong>
                    <span>{address.phone}</span>
                    <p>
                      {address.line1}
                      <br />
                      {address.city} {address.postcode}
                      <br />
                      {address.country}
                    </p>
                    <button onClick={() => onDeleteAddress(address.id)}>
                      {zh ? "删除" : "Remove"}
                    </button>
                  </article>
                ))}
              </div>
              <form className="address-form" onSubmit={onAddAddress}>
                <h3>{zh ? "添加新地址" : "Add a new address"}</h3>
                <div>
                  <input
                    name="recipient"
                    placeholder={zh ? "收件人" : "Recipient"}
                    required
                  />
                  <input
                    name="phone"
                    placeholder={zh ? "电话" : "Phone"}
                    required
                  />
                </div>
                <input
                  name="line1"
                  placeholder={zh ? "详细地址" : "Address line"}
                  required
                />
                <div>
                  <input
                    name="city"
                    placeholder={zh ? "城市" : "City"}
                    required
                  />
                  <input
                    name="postcode"
                    placeholder={zh ? "邮编" : "Postcode"}
                    required
                  />
                </div>
                <input
                  name="country"
                  placeholder={zh ? "国家/地区" : "Country / region"}
                  required
                />
                <button>{zh ? "保存地址" : "Save address"}</button>
              </form>
            </>
          )}
          {tab === "profile" && (
            <>
              <h1>{label("profile")}</h1>
              <form className="profile-form" onSubmit={onSaveProfile}>
                <label>
                  {zh ? "姓名" : "Name"}
                  <input
                    name="name"
                    defaultValue={user.name}
                    required
                    minLength="2"
                  />
                </label>
                <label>
                  {zh ? "邮箱" : "Email"}
                  <input value={user.email} disabled />
                </label>
                <label>
                  {zh ? "电话" : "Phone"}
                  <input name="phone" defaultValue={user.phone} />
                </label>
                <button>{zh ? "保存更改" : "Save changes"}</button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
