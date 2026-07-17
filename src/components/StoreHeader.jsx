const ToolIcon = ({ name }) => (
  <svg
    width="21"
    height="21"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {
      {
        search: (
          <>
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4 4" />
          </>
        ),
        user: (
          <>
            <circle cx="12" cy="8" r="4" />
            <path d="M4.5 21c.7-4 3.3-6 7.5-6s6.8 2 7.5 6" />
          </>
        ),
        heart: (
          <path d="M20.8 4.8a5.5 5.5 0 0 0-7.8 0L12 5.9l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.9-8.4a5.5 5.5 0 0 0-.1-7.8Z" />
        ),
        bag: (
          <>
            <path d="M4 8h16l-1 13H5L4 8Z" />
            <path d="M8 9V6a4 4 0 0 1 8 0v3" />
          </>
        ),
        admin: (
          <>
            <rect x="4" y="5" width="16" height="14" rx="2" />
            <path d="M8 9h8M8 13h5" />
          </>
        ),
      }[name]
    }
  </svg>
);

export default function StoreHeader({
  shippingText,
  lang,
  currency,
  rate,
  rateDate,
  navigation,
  menuOpen,
  searchPlaceholder,
  searchValue,
  user,
  cartCount,
  onLanguage,
  onCurrency,
  onSearch,
  onHome,
  onMenu,
  onNavigate,
  onAdmin,
  onAccount,
  onFavourites,
  onCart,
}) {
  return (
    <>
      <div className="shipping">
        <span className="shipping-message">{shippingText}</span>
        <div
          className="top-controls"
          aria-label="Language and currency settings"
        >
          <button className="text-toggle" onClick={onLanguage}>
            {lang === "zh" ? "中" : "EN"}
          </button>
          <i />
          <button
            className="text-toggle"
            onClick={onCurrency}
            title={`1 EUR = ${rate.toFixed(4)} CNY${rateDate ? ` · ${rateDate}` : ""}`}
          >
            {currency}
          </button>
        </div>
      </div>
      <header>
        <a
          className="brand"
          href="#top"
          onClick={(event) => {
            event.preventDefault();
            onHome();
          }}
          aria-label="Blue Orchid home"
        >
          <svg className="orchid-mark" viewBox="0 0 34 34">
            <path d="M17 17.2C11.7 16.7 7.4 13.4 8.2 8.6c.6-3.3 4-4.2 6.2-2.1 1.6 1.6 2.2 5.1 2.6 10.7Z" />
            <path d="M17 17.2c.6-5.2 2.4-9.1 4.6-10.8 2.5-1.9 5.5-.7 5.8 2.4.5 4.6-4.3 7.6-10.4 8.4Z" />
            <path d="M17 17.2c-2.2 4.8-6.1 6.8-8.7 4.9-2.4-1.8-.7-5.3 2.2-5.8 1.7-.3 4 .2 6.5.9Z" />
            <path d="M17 17.2c2.5 4.9 6.3 6.8 8.8 4.7 2.1-1.8.6-5-2.3-5.6-1.8-.3-4.1.1-6.5.9Z" />
            <circle cx="17" cy="17.2" r="2.4" />
            <path className="stem" d="M17 19.5c0 4.1-1.3 6.6-4.3 8.4" />
          </svg>
          <span>
            <b>blue</b>
            <em>orchid</em>
          </span>
        </a>
        <button className="hamburger" onClick={onMenu}>
          ☰
        </button>
        <nav className={menuOpen ? "open" : ""}>
          {navigation.map((item) => (
            <button onClick={() => onNavigate(item.id)} key={item.id}>
              {item[lang]}
            </button>
          ))}
        </nav>
        <div className="tools">
          <label className="search">
            <ToolIcon name="search" />
            <input
              value={searchValue}
              onChange={(event) => onSearch(event.target.value)}
              placeholder={searchPlaceholder}
            />
          </label>
          {user?.role === "admin" && (
            <button
              className="admin-button"
              onClick={onAdmin}
              title={lang === "zh" ? "管理后台" : "Administration"}
              aria-label={lang === "zh" ? "管理后台" : "Administration"}
            >
              <ToolIcon name="admin" />
            </button>
          )}
          <button className="account-button" onClick={onAccount}>
            {user ? (
              <span>{user.name.slice(0, 1).toUpperCase()}</span>
            ) : (
              <ToolIcon name="user" />
            )}
          </button>
          {user && (
            <>
              <button onClick={onFavourites}>
                <ToolIcon name="heart" />
              </button>
              <button className="bag" onClick={onCart}>
                <ToolIcon name="bag" />
                {cartCount > 0 && <b>{cartCount}</b>}
              </button>
            </>
          )}
        </div>
      </header>
    </>
  );
}
