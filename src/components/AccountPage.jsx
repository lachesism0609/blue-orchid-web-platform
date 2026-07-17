import { orderStatusLabel } from "../store-utils.js";

const tabs = {
  orders: ["订单历史", "Order history"],
  addresses: ["地址管理", "Addresses"],
  profile: ["个人信息", "Personal details"],
  security: ["登录设备", "Login devices"],
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
  onRevokeSession,
  onRevokeOtherSessions,
}) {
  if (!open || !user) return null;
  const zh = lang === "zh";
  const label = (key) => tabs[key][zh ? 0 : 1];
  const formatDate = (value) =>
    value
      ? new Intl.DateTimeFormat(zh ? "zh-CN" : "en-GB", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(value))
      : "—";

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
          {tab === "security" && (
            <>
              <div className="security-heading">
                <div>
                  <h1>{label("security")}</h1>
                  <p>
                    {zh
                      ? "查看当前登录设备，并撤销不再使用的 Session。"
                      : "Review signed-in devices and revoke sessions you no longer use."}
                  </p>
                </div>
                {(data.sessions || []).filter((session) => !session.current)
                  .length > 0 && (
                  <button onClick={onRevokeOtherSessions}>
                    {zh ? "退出其他设备" : "Sign out other devices"}
                  </button>
                )}
              </div>
              <div className="session-list">
                {(data.sessions || []).map((session) => (
                  <article key={session.id}>
                    <div className="session-icon" aria-hidden="true">
                      ◫
                    </div>
                    <div>
                      <strong>{session.device}</strong>
                      {session.current && (
                        <b>{zh ? "当前设备" : "Current device"}</b>
                      )}
                      <span>{session.ipAddress}</span>
                      <small>
                        {zh ? "最近活动" : "Last active"}：
                        {formatDate(session.lastSeenAt)}
                      </small>
                      <small>
                        {zh ? "到期时间" : "Expires"}：
                        {formatDate(session.expiresAt)}
                      </small>
                    </div>
                    <button
                      onClick={() =>
                        onRevokeSession(session.id, session.current)
                      }
                    >
                      {session.current
                        ? zh
                          ? "退出此设备"
                          : "Sign out here"
                        : zh
                          ? "撤销"
                          : "Revoke"}
                    </button>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
