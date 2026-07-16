import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import { filterProducts, paginateProducts } from "./store-utils.js";
import ProductDetail from "./components/ProductDetail.jsx";
import AuthDialog from "./components/AuthDialog.jsx";
import OrderDetail from "./components/OrderDetail.jsx";
import CatalogControls from "./components/CatalogControls.jsx";

const copy = {
  zh: {
    shipping: "订单满 ¥399 享免费配送",
    language: "简体中文",
    search: "搜索",
    nav: ["新品", "女装", "男装", "配饰", "特惠", "关于我们"],
    collection: "2026 夏季系列",
    title: (
      <>
        轻盈夏日
        <br />
        自在有型
      </>
    ),
    intro: (
      <>
        轻松舒适的日常单品，
        <br />
        为每一个自在时刻而生。
      </>
    ),
    shop: "立即选购",
    categories: ["女装", "男装", "包袋", "鞋履", "配饰", "特惠"],
    popular: "人气精选",
    all: "查看全部　→",
    favourite: "收藏",
    services: [
      ["免费配送", "订单满 ¥399"],
      ["轻松退换", "30 天无忧退换"],
      ["安心支付", "加密安全结账"],
      ["客户支持", "随时为您服务"],
    ],
  },
  en: {
    shipping: "Free shipping on orders over ¥399",
    language: "English",
    search: "Search",
    nav: ["New In", "Women", "Men", "Accessories", "Sale", "About Us"],
    collection: "SUMMER 2026",
    title: (
      <>
        Summer essentials
        <br />
        made simple
      </>
    ),
    intro: (
      <>
        Light, comfortable and timeless pieces
        <br />
        for every day.
      </>
    ),
    shop: "Shop now",
    categories: ["Women", "Men", "Bags", "Shoes", "Accessories", "Sale"],
    popular: "Popular picks",
    all: "View all　→",
    favourite: "Add to favourites",
    services: [
      ["Free shipping", "On orders over ¥399"],
      ["Easy returns", "30-day return policy"],
      ["Secure payment", "100% secure checkout"],
      ["Customer support", "We're here to help"],
    ],
  },
};

const productNames = {
  1: ["亚麻短袖衬衫", "Linen short-sleeve shirt"],
  2: ["直筒牛仔裤", "Straight jeans"],
  3: ["纯棉基础 T 恤", "Cotton basic T-shirt"],
  4: ["宽松廓形西装外套", "Oversized blazer"],
  5: ["轻盈棉质连衣裙", "Light cotton dress"],
  6: ["极简白色运动鞋", "Minimal white sneakers"],
  7: ["经典皮质托特包", "Classic leather tote"],
  8: ["迷你斜挎包", "Mini crossbody bag"],
  9: ["柔软乐福鞋", "Soft leather loafers"],
  10: ["细带凉鞋", "Strappy sandals"],
  11: ["简约弧形太阳镜", "Minimal curve sunglasses"],
  12: ["真丝方巾", "Silk square scarf"],
  13: ["垂感半身长裙", "Fluid midi skirt"],
  14: ["针织开衫", "Fine knit cardigan"],
  15: ["轻薄风衣", "Lightweight trench coat"],
  16: ["亚麻立领衬衫", "Linen grandad shirt"],
  17: ["锥形休闲长裤", "Tapered trousers"],
  18: ["简约圆领卫衣", "Minimal crew sweatshirt"],
  19: ["轻量夹克", "Lightweight jacket"],
  20: ["编织腋下包", "Woven shoulder bag"],
  21: ["通勤双肩包", "Commuter backpack"],
  22: ["小号手提包", "Small top-handle bag"],
  23: ["尼龙旅行包", "Nylon travel bag"],
  24: ["复古跑鞋", "Retro runner"],
  25: ["方头芭蕾鞋", "Square-toe ballet flats"],
  26: ["真皮短靴", "Leather ankle boots"],
  27: ["精工腕表", "Classic wristwatch"],
  28: ["羊毛渔夫帽", "Wool bucket hat"],
  29: ["细链项链", "Fine chain necklace"],
  30: ["皮质腰带", "Leather belt"],
};
const legacyCategories = {
  1: "women",
  2: "men",
  3: "men",
  4: "women",
  5: "women",
  6: "shoes",
};
const saleDiscounts = {
  1: 0.8,
  2: 0.85,
  3: 0.75,
  9: 0.8,
  10: 0.7,
  11: 0.75,
  12: 0.8,
  13: 0.85,
  16: 0.8,
  18: 0.75,
  25: 0.8,
  28: 0.7,
  29: 0.8,
  30: 0.75,
};
const variantImages = {
  women: [
    "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=750&q=85",
    "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=750&q=85",
  ],
  men: [
    "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=750&q=85",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=750&q=85",
  ],
  bags: [
    "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=750&q=85",
    "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=750&q=85",
  ],
  shoes: [
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=750&q=85",
    "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=750&q=85",
  ],
  accessories: [
    "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=750&q=85",
    "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=750&q=85",
  ],
};
const navigation = [
  { id: "new", zh: "新品", en: "New in" },
  { id: "women", zh: "女装", en: "Women" },
  { id: "men", zh: "男装", en: "Men" },
  { id: "accessories", zh: "配饰", en: "Accessories" },
  { id: "sale", zh: "特惠", en: "Sale" },
  { id: "about", zh: "关于我们", en: "About us" },
];
const categoryRoutes = ["women", "men", "bags", "shoes", "accessories", "sale"];
const categoryImages = [
  "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=250&q=80",
  "https://images.unsplash.com/photo-1488161628813-04466f872be2?auto=format&fit=crop&w=250&q=80",
  "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=250&q=80",
  "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=250&q=80",
  "https://images.unsplash.com/photo-1523779917675-b6ed3a42a561?auto=format&fit=crop&w=250&q=80",
  "https://images.unsplash.com/photo-1607082349566-187342175e2f?auto=format&fit=crop&w=250&q=80",
];
const heroSlides = [
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=90",
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=90",
  "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=90",
];

const Icon = ({ name, size = 21 }) => {
  const paths = {
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
    truck: (
      <>
        <path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="17" cy="18" r="2" />
      </>
    ),
    return: (
      <>
        <path d="M4 8a8 8 0 1 1-1 7" />
        <path d="M4 3v5h5" />
      </>
    ),
    lock: (
      <>
        <rect x="4" y="9" width="16" height="12" rx="1" />
        <path d="M8 9V6a4 4 0 0 1 8 0v3" />
      </>
    ),
    headset: (
      <>
        <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
        <path d="M4 14h3v5H5a1 1 0 0 1-1-1v-4Zm16 0h-3v5h2a1 1 0 0 0 1-1v-4Z" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
};

function BrandLogo({ onHome }) {
  return (
    <a
      className="brand"
      href="#top"
      onClick={(event) => {
        if (onHome) {
          event.preventDefault();
          onHome();
        }
      }}
      aria-label="Blue Orchid home"
    >
      <svg className="orchid-mark" viewBox="0 0 34 34" aria-hidden="true">
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
  );
}

function App() {
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState("");
  const [priceFilter, setPriceFilter] = useState("all");
  const [stockOnly, setStockOnly] = useState(false);
  const [catalogPageNumber, setCatalogPageNumber] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingCartIndex, setEditingCartIndex] = useState(null);
  const [liked, setLiked] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("blue-orchid-favourites")) || [];
    } catch {
      return [];
    }
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [lang, setLang] = useState(
    () => localStorage.getItem("blue-orchid-language") || "zh",
  );
  const [currency, setCurrency] = useState(
    () => localStorage.getItem("blue-orchid-currency") || "CNY",
  );
  const [eurCnyRate, setEurCnyRate] = useState(
    () => Number(localStorage.getItem("blue-orchid-eur-cny-rate")) || 7.8,
  );
  const [exchangeRateDate, setExchangeRateDate] = useState(
    () => localStorage.getItem("blue-orchid-exchange-rate-date") || "",
  );
  const [activeSlide, setActiveSlide] = useState(0);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authError, setAuthError] = useState("");
  const [authNotice, setAuthNotice] = useState("");
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState("");
  const [developmentVerificationUrl, setDevelopmentVerificationUrl] =
    useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [accountPage, setAccountPage] = useState(
    () => window.location.hash === "#account",
  );
  const [accountTab, setAccountTab] = useState("orders");
  const [accountData, setAccountData] = useState({ orders: [], addresses: [] });
  const [accountNotice, setAccountNotice] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [catalogPage, setCatalogPage] = useState(() =>
    navigation.some((item) => item.id === window.location.hash.slice(1)) &&
    window.location.hash !== "#about"
      ? window.location.hash.slice(1)
      : "",
  );
  const [aboutPage, setAboutPage] = useState(
    () => window.location.hash === "#about",
  );
  const [favouritesPage, setFavouritesPage] = useState(
    () => window.location.hash === "#favourites",
  );
  const [toast, setToast] = useState("");
  const [selectedColors, setSelectedColors] = useState({});
  const [selectedSizes, setSelectedSizes] = useState({});
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("blue-orchid-cart")) || [];
    } catch {
      return [];
    }
  });
  const [cartPage, setCartPage] = useState(
    () => window.location.hash === "#cart",
  );
  const [checkoutStage, setCheckoutStage] = useState("cart");
  const [checkoutAddresses, setCheckoutAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [completedOrder, setCompletedOrder] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const t = copy[lang];
  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then(setProducts)
      .catch(() => {});
  }, []);
  useEffect(() => {
    const report = (payload) =>
      fetch("/api/errors/report", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    const onError = (event) =>
      report({
        message: event.message || "Window error",
        stack: event.error?.stack || "",
        url: window.location.href,
      });
    const onRejection = (event) =>
      report({
        message: String(
          event.reason?.message ||
            event.reason ||
            "Unhandled promise rejection",
        ),
        stack: event.reason?.stack || "",
        url: window.location.href,
      });
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);
  useEffect(() => {
    fetch("/api/exchange-rate")
      .then((response) => {
        if (!response.ok) throw new Error("Exchange rate unavailable");
        return response.json();
      })
      .then((data) => {
        if (!Number.isFinite(Number(data.rate)) || Number(data.rate) <= 0)
          return;
        setEurCnyRate(Number(data.rate));
        setExchangeRateDate(data.date || "");
        localStorage.setItem("blue-orchid-eur-cny-rate", String(data.rate));
        localStorage.setItem("blue-orchid-exchange-rate-date", data.date || "");
      })
      .catch(() => {});
  }, []);
  useEffect(() => {
    localStorage.setItem("blue-orchid-language", lang);
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  }, [lang]);
  useEffect(() => {
    localStorage.setItem("blue-orchid-currency", currency);
  }, [currency]);
  useEffect(() => {
    localStorage.setItem("blue-orchid-favourites", JSON.stringify(liked));
  }, [liked]);
  useEffect(() => {
    localStorage.setItem("blue-orchid-cart", JSON.stringify(cart));
  }, [cart]);
  useEffect(() => {
    if (accountPage) window.history.replaceState(null, "", "#account");
  }, [accountPage]);
  useEffect(() => {
    if (catalogPage) window.history.replaceState(null, "", `#${catalogPage}`);
  }, [catalogPage]);
  useEffect(() => {
    if (!catalogPage) return;
    const scroller = document.querySelector(".catalog-page");
    const toolbar = document.querySelector(".catalog-tools");
    if (!scroller || !toolbar) return;
    const followCatalogScroll = () => {
      toolbar.style.transform = `translate(-50%, ${-scroller.scrollTop}px)`;
    };
    followCatalogScroll();
    scroller.addEventListener("scroll", followCatalogScroll, { passive: true });
    return () => {
      scroller.removeEventListener("scroll", followCatalogScroll);
      toolbar.style.transform = "";
    };
  }, [catalogPage]);
  useEffect(() => {
    if (aboutPage) window.history.replaceState(null, "", "#about");
  }, [aboutPage]);
  useEffect(() => {
    if (favouritesPage) window.history.replaceState(null, "", "#favourites");
  }, [favouritesPage]);
  useEffect(() => {
    if (cartPage) window.history.replaceState(null, "", "#cart");
  }, [cartPage]);
  useEffect(() => {
    if (cartPage) setAboutPage(false);
  }, [cartPage]);
  useEffect(() => {
    if (!selectedProduct) setEditingCartIndex(null);
  }, [selectedProduct]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2400);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const status = new URLSearchParams(window.location.search).get(
      "emailVerified",
    );
    if (!status) return;
    setToast(
      status === "1"
        ? lang === "zh"
          ? "邮箱验证成功，现在可以登录。"
          : "Email verified. You can now sign in."
        : lang === "zh"
          ? "验证链接无效或已过期。"
          : "The verification link is invalid or expired.",
    );
    window.history.replaceState(
      null,
      "",
      window.location.pathname + window.location.hash,
    );
  }, []);
  useEffect(() => {
    const shouldLockScroll = Boolean(
      catalogPage ||
      aboutPage ||
      accountPage ||
      favouritesPage ||
      cartPage ||
      authOpen,
    );
    document.body.style.overflow = shouldLockScroll ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [catalogPage, aboutPage, accountPage, favouritesPage, cartPage, authOpen]);
  useEffect(() => {
    const timer = setInterval(
      () => setActiveSlide((current) => (current + 1) % heroSlides.length),
      5000,
    );
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const input = document.querySelector(".tools .search input");
    if (!input) return;
    const search = (event) => {
      setProductSearch(event.target.value);
      if (event.target.value) openCatalog("new");
    };
    input.addEventListener("input", search);
    return () => input.removeEventListener("input", search);
  }, []);
  const accountRequest = async (path, options = {}) => {
    const response = await fetch(path, {
      ...options,
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", ...options.headers },
    });
    if (response.status === 204) return null;
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Request failed");
    return data;
  };
  useEffect(() => {
    accountRequest("/api/auth/me")
      .then((data) => setAuthUser(data.user))
      .catch(() => setAuthUser(null));
  }, []);
  const loadAccount = async () => {
    try {
      const [orders, addresses] = await Promise.all([
        accountRequest("/api/account/orders"),
        accountRequest("/api/account/addresses"),
      ]);
      setAccountData({ orders: orders.orders, addresses: addresses.addresses });
    } catch (error) {
      setAccountNotice(error.message);
    }
  };
  useEffect(() => {
    if (accountPage && authUser) loadAccount();
  }, [accountPage]);
  useEffect(() => {
    const openOrderDetails = (event) => {
      const row = event.target.closest(".orders-list article");
      if (!row) return;
      const orderId = row.querySelector("span")?.textContent;
      const order = accountData.orders.find((item) => item.id === orderId);
      if (order) setSelectedOrder(order);
    };
    document.addEventListener("click", openOrderDetails);
    return () => document.removeEventListener("click", openOrderDetails);
  }, [accountData.orders]);
  const toggleLike = (id) => {
    if (!authUser) {
      setAuthError(
        lang === "zh"
          ? "请先登录后再收藏商品。"
          : "Please sign in to save favourites.",
      );
      setAuthOpen(true);
      return;
    }
    setLiked((old) => {
      if (old.includes(id)) return old.filter((x) => x !== id);
      setToast(lang === "zh" ? "已添加到收藏" : "Added to favourites");
      return [...old, id];
    });
  };
  const formatPrice = (value) =>
    currency === "CNY" ? `¥${value}` : `€${(value / eurCnyRate).toFixed(2)}`;
  const freeShippingThreshold = currency === "CNY" ? "¥399" : "€50";
  const shippingText =
    lang === "zh"
      ? `订单满 ${freeShippingThreshold} 享免费配送`
      : `Free shipping on orders over ${freeShippingThreshold}`;
  const openAuth = () => {
    if (authUser && cartPage) {
      handleCheckout();
      return;
    }
    setAuthError("");
    setAuthOpen(true);
  };
  const submitAuth = async (event) => {
    event.preventDefault();
    setAuthError("");
    setAuthNotice("");
    setAuthLoading(true);
    const form = new FormData(event.currentTarget);
    const body = {
      email: form.get("email"),
      password: form.get("password"),
      ...(authMode === "register" ? { name: form.get("name") } : {}),
    };
    try {
      const response = await fetch(`/api/auth/${authMode}`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const isJson = response.headers
        .get("content-type")
        ?.includes("application/json");
      const data = isJson ? await response.json() : null;
      if (!isJson)
        throw new Error(
          lang === "zh"
            ? "认证服务尚未启动，请重启开发服务后重试。"
            : "The authentication service is unavailable. Please restart the development server.",
        );
      if (!response.ok) throw new Error(data.message || "Request failed");
      if (authMode === "register" && data.requiresVerification) {
        setPendingVerificationEmail(body.email);
        setDevelopmentVerificationUrl(data.verificationUrl || "");
        setAuthNotice(
          lang === "zh"
            ? "验证邮件已发送，请前往邮箱完成验证后再登录。"
            : "Verification email sent. Verify your address before signing in.",
        );
        setAuthMode("login");
        return;
      }
      localStorage.removeItem("blue-orchid-token");
      localStorage.removeItem("blue-orchid-user");
      setAuthUser(data.user);
      setAuthOpen(false);
      if (cartPage) {
        const addressData = await accountRequest("/api/account/addresses");
        if (addressData.addresses.length) {
          setCheckoutAddresses(addressData.addresses);
          setSelectedAddressId(addressData.addresses[0].id);
          setCheckoutStage("confirm");
        } else
          setToast(
            lang === "zh"
              ? "请先在个人主页添加收货地址。"
              : "Please add a delivery address first.",
          );
      }
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };
  const resendVerification = async () => {
    if (!pendingVerificationEmail) return;
    setAuthLoading(true);
    setAuthError("");
    setAuthNotice("");
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingVerificationEmail }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Request failed");
      setDevelopmentVerificationUrl(data.verificationUrl || "");
      setAuthNotice(
        lang === "zh"
          ? "新的验证邮件已发送。"
          : "A new verification email has been sent.",
      );
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };
  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
    } finally {
      localStorage.removeItem("blue-orchid-token");
      localStorage.removeItem("blue-orchid-user");
      setAuthUser(null);
    }
  };
  const openAccount = () => {
    setAccountPage(true);
    setFavouritesPage(false);
    setCatalogPage("");
    setAboutPage(false);
  };
  const closeAccount = () => {
    setAccountPage(false);
    window.history.replaceState(null, "", window.location.pathname);
  };
  const openCatalog = (id) => {
    setCatalogPage(id === "about" ? "" : id);
    setAboutPage(id === "about");
    setAccountPage(false);
    setFavouritesPage(false);
    setMenuOpen(false);
  };
  const closeCatalog = () => {
    setCatalogPage("");
    setAboutPage(false);
    window.history.replaceState(null, "", window.location.pathname);
  };
  const openFavourites = () => {
    if (!authUser) {
      setAuthError(
        lang === "zh"
          ? "请先登录后查看收藏。"
          : "Please sign in to view favourites.",
      );
      setAuthOpen(true);
      return;
    }
    setFavouritesPage(true);
    setCatalogPage("");
    setAboutPage(false);
    setAccountPage(false);
  };
  const closeFavourites = () => {
    setFavouritesPage(false);
    window.history.replaceState(null, "", window.location.pathname);
  };
  const closeCart = () => {
    setCartPage(false);
    setCheckoutStage("cart");
    setCompletedOrder(null);
    window.history.replaceState(null, "", window.location.pathname);
  };
  const goHome = () => {
    closeCatalog();
    closeAccount();
    closeFavourites();
    closeCart();
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const favouriteProducts = products.filter((product) =>
    liked.includes(product.id),
  );
  const catalogName =
    navigation.find((item) => item.id === catalogPage)?.[lang] ||
    (lang === "zh" ? "商品" : "Products");
  const categoryOf = (product) =>
    product.category || legacyCategories[product.id];
  const selectedColorIndex = (product) => selectedColors[product.id] || 0;
  const variantImage = (product) => {
    const index = selectedColorIndex(product);
    return index === 0
      ? product.image
      : variantImages[categoryOf(product)]?.[
          (index - 1) % variantImages[categoryOf(product)].length
        ] || product.image;
  };
  const selectColor = (productId, index) => {
    setSelectedColors((current) => ({ ...current, [productId]: index }));
    if (editingCartIndex !== null)
      setCart((current) =>
        current.map((item, itemIndex) =>
          itemIndex === editingCartIndex
            ? { ...item, colorIndex: index }
            : item,
        ),
      );
  };
  const addToCart = (product) => {
    if (!authUser) {
      setAuthError(
        lang === "zh"
          ? "请先登录后再加入购物车。"
          : "Please sign in to add items to your bag.",
      );
      setAuthOpen(true);
      return;
    }
    if (!product.inStock) {
      setToast(lang === "zh" ? "该商品暂时缺货" : "This item is out of stock");
      return;
    }
    const size = selectedSizes[product.id] || product.sizes?.[0] || "One size";
    const colorIndex = selectedColorIndex(product);
    if (editingCartIndex !== null) {
      setCart((current) =>
        current.map((item, itemIndex) =>
          itemIndex === editingCartIndex ? { ...item, size, colorIndex } : item,
        ),
      );
      setSelectedProduct(null);
      setEditingCartIndex(null);
      setToast(lang === "zh" ? "商品选项已更新" : "Product options updated");
      return;
    }
    setCart((current) => [
      ...current,
      { productId: product.id, quantity: 1, size, colorIndex },
    ]);
    setToast(lang === "zh" ? "已加入购物车" : "Added to bag");
  };
  const changeCartQuantity = (index, amount) =>
    setCart((current) =>
      current.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        const product = products.find((entry) => entry.id === item.productId);
        return {
          ...item,
          quantity: Math.max(
            1,
            Math.min(10, product?.stock || 10, item.quantity + amount),
          ),
        };
      }),
    );
  useEffect(() => {
    const openProductDetails = (event) => {
      const card = event.target.closest(".card");
      if (!card || event.target.closest("button")) return;
      const title = card.querySelector("h3");
      if (!title) return;
      const productId = Object.keys(productNames).find((id) =>
        productNames[id].some((name) => title.textContent.includes(name)),
      );
      const product = products.find((item) => item.id === Number(productId));
      if (product) setSelectedProduct(product);
    };
    document.addEventListener("click", openProductDetails);
    return () => document.removeEventListener("click", openProductDetails);
  }, [products, lang]);
  const cartItems = cart
    .map((item, index) => ({
      ...item,
      index,
      product: products.find((product) => product.id === item.productId),
    }))
    .filter((item) => item.product);
  useEffect(() => {
    const openCartProduct = (event) => {
      const image = event.target.closest(".cart-list article img");
      if (!image) return;
      const article = image.closest("article");
      const index = [...article.parentElement.children].indexOf(article);
      const item = cartItems[index];
      if (!item) return;
      setEditingCartIndex(item.index);
      setSelectedSizes((current) => ({
        ...current,
        [item.productId]: item.size || item.product.sizes?.[0] || "One size",
      }));
      setSelectedColors((current) => ({
        ...current,
        [item.productId]: Number(item.colorIndex || 0),
      }));
      setSelectedProduct(item.product);
    };
    document.addEventListener("click", openCartProduct);
    return () => document.removeEventListener("click", openCartProduct);
  }, [cartItems]);
  const cartUnitPrice = (product) =>
    saleDiscounts[product.id]
      ? Math.round(product.price * saleDiscounts[product.id])
      : product.price;
  const cartTotal = cartItems.reduce(
    (sum, item) => sum + cartUnitPrice(item.product) * item.quantity,
    0,
  );
  const handleCheckout = async () => {
    if (!authUser) {
      setAuthError(
        lang === "zh" ? "请登录后继续结算。" : "Please sign in to continue.",
      );
      setAuthOpen(true);
      return;
    }
    try {
      const data = await accountRequest("/api/account/addresses");
      if (!data.addresses.length) {
        setToast(
          lang === "zh"
            ? "请先在个人主页添加收货地址。"
            : "Please add a delivery address first.",
        );
        return;
      }
      setCheckoutAddresses(data.addresses);
      setSelectedAddressId((current) =>
        data.addresses.some((address) => address.id === current)
          ? current
          : data.addresses[0].id,
      );
      setCheckoutStage("confirm");
      setCartPage(true);
    } catch (error) {
      setToast(error.message);
    }
  };
  const confirmOrder = async () => {
    if (!selectedAddressId || checkoutLoading) return;
    setCheckoutLoading(true);
    try {
      const data = await accountRequest("/api/account/orders", {
        method: "POST",
        body: JSON.stringify({
          addressId: selectedAddressId,
          items: cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            size: item.size || item.product.sizes?.[0] || "One size",
          })),
        }),
      });
      setCompletedOrder(data.order);
      setCart([]);
      setCheckoutStage("success");
      setTimeout(async () => {
        await loadAccount();
        setCartPage(false);
        setCheckoutStage("cart");
        setAccountTab("orders");
        setAccountPage(true);
        window.history.replaceState(null, "", "#account");
      }, 1800);
    } catch (error) {
      setToast(error.message);
    } finally {
      setCheckoutLoading(false);
    }
  };
  const filteredCatalogProducts = filterProducts(
    products.map((product) => ({
      ...product,
      displayName:
        productNames[product.id]?.[lang === "zh" ? 0 : 1] || product.name,
    })),
    {
      category: catalogPage,
      query: productSearch,
      price: priceFilter,
      stockOnly,
      saleIds: Object.keys(saleDiscounts),
    },
  );
  const catalogPageSize = 8;
  const catalogPagination = paginateProducts(
    filteredCatalogProducts,
    catalogPageNumber,
    catalogPageSize,
  );
  const {
    items: catalogProducts,
    page: visibleCatalogPage,
    pages: catalogPages,
  } = catalogPagination;
  useEffect(() => {
    setCatalogPageNumber(1);
  }, [catalogPage, productSearch, priceFilter, stockOnly]);
  const salePrice = (product) =>
    Math.round(product.price * (saleDiscounts[product.id] || 0.8));
  const saleLabel = (product) =>
    lang === "zh"
      ? `${(saleDiscounts[product.id] || 0.8) * 10}折`
      : `${Math.round((1 - (saleDiscounts[product.id] || 0.8)) * 100)}% OFF`;
  const saveProfile = async (event) => {
    event.preventDefault();
    try {
      const form = new FormData(event.currentTarget);
      const data = await accountRequest("/api/account/profile", {
        method: "PUT",
        body: JSON.stringify({
          name: form.get("name"),
          phone: form.get("phone"),
        }),
      });
      setAuthUser(data.user);
      localStorage.setItem("blue-orchid-user", JSON.stringify(data.user));
      setAccountNotice(lang === "zh" ? "个人信息已保存。" : "Profile saved.");
    } catch (error) {
      setAccountNotice(error.message);
    }
  };
  const addAddress = async (event) => {
    event.preventDefault();
    try {
      const form = new FormData(event.currentTarget);
      const data = await accountRequest("/api/account/addresses", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(form)),
      });
      setAccountData((current) => ({
        ...current,
        addresses: [...current.addresses, data.address],
      }));
      event.currentTarget.reset();
      setAccountNotice(lang === "zh" ? "地址已添加。" : "Address added.");
    } catch (error) {
      setAccountNotice(error.message);
    }
  };
  const deleteAddress = async (id) => {
    try {
      await accountRequest(`/api/account/addresses/${id}`, {
        method: "DELETE",
      });
      setAccountData((current) => ({
        ...current,
        addresses: current.addresses.filter((address) => address.id !== id),
      }));
    } catch (error) {
      setAccountNotice(error.message);
    }
  };
  return (
    <>
      <div className="shipping">
        <span className="shipping-message">{shippingText}</span>
        <div
          className="top-controls"
          aria-label="Language and currency settings"
        >
          <button
            className="text-toggle"
            onClick={() =>
              setLang((current) => (current === "zh" ? "en" : "zh"))
            }
            aria-label="Switch language"
            title="Switch language"
          >
            {lang === "zh" ? "中" : "EN"}
          </button>
          <i></i>
          <button
            className="text-toggle"
            onClick={() =>
              setCurrency((current) => (current === "CNY" ? "EUR" : "CNY"))
            }
            aria-label="Switch currency"
            title={`${lang === "zh" ? "切换货币" : "Switch currency"} · 1 EUR = ${eurCnyRate.toFixed(4)} CNY${exchangeRateDate ? ` · ${exchangeRateDate}` : ""}`}
          >
            {currency}
          </button>
        </div>
      </div>
      <header>
        <BrandLogo onHome={goHome} />
        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          ☰
        </button>
        <nav className={menuOpen ? "open" : ""}>
          {navigation.map((item) => (
            <button onClick={() => openCatalog(item.id)} key={item.id}>
              {item[lang]}
            </button>
          ))}
        </nav>
        <div className="tools">
          <label className="search">
            <Icon name="search" size={18} />
            <input placeholder={t.search} />
          </label>
          <button
            className="account-button"
            onClick={authUser ? openAccount : openAuth}
            aria-label={authUser ? "My account" : "Log in"}
          >
            {authUser ? (
              <span>{authUser.name.slice(0, 1).toUpperCase()}</span>
            ) : (
              <Icon name="user" />
            )}
          </button>
          <button
            onClick={openFavourites}
            aria-label={lang === "zh" ? "收藏" : "Favourites"}
          >
            <Icon name="heart" />
          </button>
          <button
            className="bag"
            onClick={() => {
              setCartPage(true);
              setCatalogPage("");
              setFavouritesPage(false);
              setAccountPage(false);
            }}
          >
            <Icon name="bag" />
            {cart.length > 0 && <b>{cart.length}</b>}
          </button>
        </div>
      </header>
      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <small>{t.collection}</small>
            <h1>{t.title}</h1>
            <p>{t.intro}</p>
            <a href="#popular" className="button">
              {t.shop}
            </a>
          </div>
          <div
            className="hero-photo"
            key={activeSlide}
            style={{ backgroundImage: `url(${heroSlides[activeSlide]})` }}
          ></div>
          <div className="dots">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                className={index === activeSlide ? "active" : ""}
                onClick={() => setActiveSlide(index)}
                aria-label={`Slide ${index + 1}`}
              />
            ))}
          </div>
        </section>
        <section className="categories">
          {categoryImages.map((image, index) => (
            <button
              onClick={() => openCatalog(categoryRoutes[index])}
              key={image}
            >
              <img src={image} alt={t.categories[index]} />
              <span>{t.categories[index]}</span>
            </button>
          ))}
        </section>
        <section id="popular" className="products">
          <div className="section-title">
            <h2>{t.popular}</h2>
            <button onClick={() => openCatalog("new")}>{t.all}</button>
          </div>
          <div className="grid">
            {products.slice(0, 6).map((p) => (
              <article className="card" key={p.id}>
                <div className="product-image">
                  <img
                    src={variantImage(p)}
                    alt={productNames[p.id]?.[lang === "zh" ? 0 : 1] || p.name}
                  />
                  {saleDiscounts[p.id] && (
                    <span className="sale-badge">{saleLabel(p)}</span>
                  )}
                  <button
                    className={liked.includes(p.id) ? "liked" : ""}
                    onClick={() => toggleLike(p.id)}
                    aria-label={t.favourite}
                  >
                    <Icon name="heart" size={20} />
                  </button>
                </div>
                <div className="product-title">
                  <h3>
                    {productNames[p.id]?.[lang === "zh" ? 0 : 1] || p.name}
                  </h3>
                  <button onClick={() => addToCart(p)}>
                    {lang === "zh" ? "加入购物车" : "Add to bag"}
                  </button>
                </div>
                {saleDiscounts[p.id] ? (
                  <p className="sale-price">
                    <s>{formatPrice(p.price)}</s>
                    <strong>{formatPrice(salePrice(p))}</strong>
                  </p>
                ) : (
                  <p>{formatPrice(p.price)}</p>
                )}
                <div className="swatches">
                  {p.colors.map((color, index) => (
                    <button
                      className={
                        selectedColorIndex(p) === index ? "selected" : ""
                      }
                      style={{ background: color }}
                      onClick={() => selectColor(p.id, index)}
                      aria-label={`${lang === "zh" ? "选择颜色" : "Choose colour"} ${index + 1}`}
                      key={color}
                    />
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
      <footer>
        {[
          ["truck", 0],
          ["return", 1],
          ["lock", 2],
          ["headset", 3],
        ].map(([icon, index]) => (
          <div key={icon}>
            <Icon name={icon} />
            <p>
              <strong>{t.services[index][0]}</strong>
              <span>
                {index === 0
                  ? lang === "zh"
                    ? `订单满 ${formatPrice(399)}`
                    : `On orders over ${formatPrice(399)}`
                  : t.services[index][1]}
              </span>
            </p>
          </div>
        ))}
      </footer>
      <CatalogControls
        visible={Boolean(catalogPage)}
        lang={lang}
        query={productSearch}
        price={priceFilter}
        stockOnly={stockOnly}
        hasProducts={filteredCatalogProducts.length > 0}
        page={visibleCatalogPage}
        pages={catalogPages}
        onQuery={setProductSearch}
        onPrice={setPriceFilter}
        onStock={setStockOnly}
        onPage={setCatalogPageNumber}
      />
      <ProductDetail
        product={selectedProduct}
        lang={lang}
        name={
          selectedProduct
            ? productNames[selectedProduct.id]?.[lang === "zh" ? 0 : 1] ||
              selectedProduct.name
            : ""
        }
        image={selectedProduct ? variantImage(selectedProduct) : ""}
        formatPrice={formatPrice}
        selectedColor={
          selectedProduct ? selectedColorIndex(selectedProduct) : 0
        }
        selectedSize={
          selectedProduct
            ? selectedSizes[selectedProduct.id] || selectedProduct.sizes?.[0]
            : ""
        }
        editing={editingCartIndex !== null}
        onClose={() => setSelectedProduct(null)}
        onColor={(index) => selectColor(selectedProduct.id, index)}
        onSize={(size) => {
          setSelectedSizes((current) => ({
            ...current,
            [selectedProduct.id]: size,
          }));
          if (editingCartIndex !== null)
            setCart((current) =>
              current.map((item, itemIndex) =>
                itemIndex === editingCartIndex ? { ...item, size } : item,
              ),
            );
        }}
        onAction={() => addToCart(selectedProduct)}
      />
      {cartPage && (
        <div className="favourites-page checkout-page">
          <section className="favourites-shell checkout-shell">
            {checkoutStage === "success" ? (
              <div className="checkout-success">
                <span>✓</span>
                <p>BLUE ORCHID</p>
                <h1>{lang === "zh" ? "购买成功" : "Order confirmed"}</h1>
                <strong>{completedOrder?.id}</strong>
                <p>
                  {lang === "zh"
                    ? "订单已创建，即将跳转到订单历史。"
                    : "Your order was created. Opening order history…"}
                </p>
              </div>
            ) : (
              <>
                <header className="favourites-heading">
                  <p>BLUE ORCHID</p>
                  <h1>
                    {checkoutStage === "confirm"
                      ? lang === "zh"
                        ? "确认订单"
                        : "Review order"
                      : lang === "zh"
                        ? "购物车"
                        : "Shopping bag"}
                  </h1>
                  <span>
                    {cartItems.reduce((sum, item) => sum + item.quantity, 0)}{" "}
                    {lang === "zh" ? "件商品" : "items"}
                  </span>
                </header>
                {checkoutStage === "confirm" ? (
                  <div className="checkout-review">
                    <section>
                      <h2>{lang === "zh" ? "购买商品" : "Your items"}</h2>
                      <div className="checkout-items">
                        {cartItems.map((item) => (
                          <article key={item.index}>
                            <img src={variantImage(item.product)} alt="" />
                            <div>
                              <strong>
                                {productNames[item.productId]?.[
                                  lang === "zh" ? 0 : 1
                                ] || item.product.name}
                              </strong>
                              <span>
                                {lang === "zh" ? "数量" : "Qty"} ×{" "}
                                {item.quantity}
                              </span>
                            </div>
                            <b>
                              {formatPrice(
                                cartUnitPrice(item.product) * item.quantity,
                              )}
                            </b>
                          </article>
                        ))}
                      </div>
                      <h2>
                        {lang === "zh" ? "选择收货地址" : "Delivery address"}
                      </h2>
                      <div className="checkout-addresses">
                        {checkoutAddresses.map((address) => (
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
                              onChange={() => setSelectedAddressId(address.id)}
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
                      <h2>{lang === "zh" ? "订单汇总" : "Order summary"}</h2>
                      <p>
                        <span>{lang === "zh" ? "商品小计" : "Subtotal"}</span>
                        <strong>{formatPrice(cartTotal)}</strong>
                      </p>
                      <p>
                        <span>{lang === "zh" ? "配送" : "Delivery"}</span>
                        <strong>{lang === "zh" ? "免费" : "Free"}</strong>
                      </p>
                      <div>
                        <span>{lang === "zh" ? "合计" : "Total"}</span>
                        <strong>{formatPrice(cartTotal)}</strong>
                      </div>
                      <button
                        className="confirm-order"
                        onClick={confirmOrder}
                        disabled={!selectedAddressId || checkoutLoading}
                      >
                        {checkoutLoading
                          ? lang === "zh"
                            ? "正在确认…"
                            : "Confirming…"
                          : lang === "zh"
                            ? "确认购买"
                            : "Confirm order"}
                      </button>
                      <button
                        className="back-to-cart"
                        onClick={() => setCheckoutStage("cart")}
                      >
                        {lang === "zh" ? "返回购物车" : "Back to bag"}
                      </button>
                    </aside>
                  </div>
                ) : cartItems.length ? (
                  <>
                    <div className="cart-list">
                      {cartItems.map((item) => (
                        <article key={item.index}>
                          <img src={variantImage(item.product)} alt="" />
                          <div>
                            <strong>
                              {productNames[item.productId]?.[
                                lang === "zh" ? 0 : 1
                              ] || item.product.name}
                            </strong>
                            <p>{formatPrice(cartUnitPrice(item.product))}</p>
                          </div>
                          <div className="quantity-control">
                            <button
                              onClick={() => changeCartQuantity(item.index, -1)}
                            >
                              −
                            </button>
                            <span>{item.quantity}</span>
                            <button
                              onClick={() => changeCartQuantity(item.index, 1)}
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() =>
                              setCart((current) =>
                                current.filter(
                                  (_, index) => index !== item.index,
                                ),
                              )
                            }
                          >
                            {lang === "zh" ? "移除" : "Remove"}
                          </button>
                        </article>
                      ))}
                    </div>
                    <div className="cart-summary">
                      <strong>
                        {lang === "zh" ? "合计" : "Total"}{" "}
                        {formatPrice(cartTotal)}
                      </strong>
                      <button onClick={handleCheckout}>
                        {lang === "zh" ? "去结算" : "Checkout"}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="catalog-empty">
                    <h2>
                      {lang === "zh" ? "购物车为空" : "Your bag is empty"}
                    </h2>
                    <button onClick={goHome}>
                      {lang === "zh" ? "继续选购" : "Continue shopping"}
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      )}
      {favouritesPage && (
        <div className="favourites-page">
          <section className="favourites-shell">
            <header className="favourites-heading">
              <p>BLUE ORCHID</p>
              <h1>{lang === "zh" ? "我的收藏" : "My favourites"}</h1>
              <span>
                {favouriteProducts.length} {lang === "zh" ? "件商品" : "items"}
              </span>
            </header>
            {favouriteProducts.length ? (
              <div className="catalog-grid">
                {favouriteProducts.map((product) => (
                  <article className="card" key={product.id}>
                    <div className="product-image">
                      <img
                        src={variantImage(product)}
                        alt={
                          productNames[product.id]?.[lang === "zh" ? 0 : 1] ||
                          product.name
                        }
                      />
                      <button
                        className="liked"
                        onClick={() => toggleLike(product.id)}
                        aria-label={t.favourite}
                      >
                        <Icon name="heart" size={20} />
                      </button>
                    </div>
                    <div className="product-title">
                      <h3>
                        {productNames[product.id]?.[lang === "zh" ? 0 : 1] ||
                          product.name}
                      </h3>
                      <button onClick={() => addToCart(product)}>
                        {lang === "zh" ? "加入购物车" : "Add to bag"}
                      </button>
                    </div>
                    {saleDiscounts[product.id] ? (
                      <p className="sale-price">
                        <s>{formatPrice(product.price)}</s>
                        <strong>{formatPrice(salePrice(product))}</strong>
                      </p>
                    ) : (
                      <p>{formatPrice(product.price)}</p>
                    )}
                    <div className="swatches">
                      {product.colors.map((color, index) => (
                        <button
                          className={
                            selectedColorIndex(product) === index
                              ? "selected"
                              : ""
                          }
                          style={{ background: color }}
                          onClick={() => selectColor(product.id, index)}
                          aria-label={`${lang === "zh" ? "选择颜色" : "Choose colour"} ${index + 1}`}
                          key={color}
                        />
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="catalog-empty">
                <h2>
                  {lang === "zh" ? "还没有收藏商品" : "No favourites yet"}
                </h2>
                <p>
                  {lang === "zh"
                    ? "点击商品右上角的爱心，将心仪单品保存到这里。"
                    : "Tap the heart on a product to save it here."}
                </p>
                <button onClick={goHome}>
                  {lang === "zh" ? "去逛逛" : "Explore the store"}
                </button>
              </div>
            )}
          </section>
        </div>
      )}
      {catalogPage && (
        <div className="catalog-page">
          <section className="catalog-shell">
            {catalogPage === "about" ? (
              <div className="about-page">
                <p>BLUE ORCHID</p>
                <h1>{lang === "zh" ? "为自在而设计" : "Designed for ease"}</h1>
                <div>
                  <p>
                    {lang === "zh"
                      ? "Blue Orchid 相信风格应当自然、舒适并且历久弥新。我们精心挑选每一件单品，让日常穿搭更轻松。"
                      : "Blue Orchid believes style should feel natural, comfortable and enduring. Every piece is considered to make everyday dressing effortless."}
                  </p>
                  <p>
                    {lang === "zh"
                      ? "从柔软面料到简洁廓形，我们用克制的设计语言，陪伴每一段自由的旅程。"
                      : "From soft fabrics to clean silhouettes, our understated designs are made for every journey you take."}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <header className="catalog-heading">
                  <p>BLUE ORCHID</p>
                  <h1>{catalogName}</h1>
                  <span>
                    {catalogProducts.length}{" "}
                    {lang === "zh" ? "件商品" : "items"}
                  </span>
                </header>
                {catalogProducts.length ? (
                  <div className="catalog-grid">
                    {catalogProducts.map((product) => (
                      <article className="card" key={product.id}>
                        <div className="product-image">
                          <img
                            src={variantImage(product)}
                            alt={
                              productNames[product.id]?.[
                                lang === "zh" ? 0 : 1
                              ] || product.name
                            }
                          />
                          {saleDiscounts[product.id] && (
                            <span className="sale-badge">
                              {saleLabel(product)}
                            </span>
                          )}
                          <button
                            className={
                              liked.includes(product.id) ? "liked" : ""
                            }
                            onClick={() => toggleLike(product.id)}
                            aria-label={t.favourite}
                          >
                            <Icon name="heart" size={20} />
                          </button>
                        </div>
                        <h3>
                          {productNames[product.id]?.[lang === "zh" ? 0 : 1] ||
                            product.name}
                        </h3>
                        {saleDiscounts[product.id] ? (
                          <p className="sale-price">
                            <s>{formatPrice(product.price)}</s>
                            <strong>{formatPrice(salePrice(product))}</strong>
                          </p>
                        ) : (
                          <p>{formatPrice(product.price)}</p>
                        )}
                        <div className="swatches">
                          {product.colors.map((color, index) => (
                            <button
                              className={
                                selectedColorIndex(product) === index
                                  ? "selected"
                                  : ""
                              }
                              style={{ background: color }}
                              onClick={() => selectColor(product.id, index)}
                              aria-label={`${lang === "zh" ? "选择颜色" : "Choose colour"} ${index + 1}`}
                              key={color}
                            />
                          ))}
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="catalog-empty">
                    <h2>
                      {lang === "zh"
                        ? "新品即将上架"
                        : "New pieces are on their way"}
                    </h2>
                    <p>
                      {lang === "zh"
                        ? "请稍后回来查看本系列。"
                        : "Please check back soon for this collection."}
                    </p>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      )}
      {aboutPage && (
        <div className="about-brand-page">
          <article className="about-brand-shell">
            <section className="about-hero">
              <div>
                <p className="about-eyebrow">BLUE ORCHID · EST. 2026</p>
                <h1>
                  {lang === "zh" ? (
                    <>
                      让日常穿着，
                      <br />
                      自然地成为风格
                    </>
                  ) : (
                    <>
                      Everyday ease,
                      <br />
                      distinctive style
                    </>
                  )}
                </h1>
                <p>
                  {lang === "zh"
                    ? "我们以兰花的从容与韧性为灵感，创作轻盈、舒适且经得起时间考验的衣橱单品。"
                    : "Inspired by the quiet strength of the orchid, we create light, comfortable pieces designed to endure."}
                </p>
                <a href="mailto:service@blueorchid.com">
                  {lang === "zh" ? "联系我们" : "Contact us"}　→
                </a>
              </div>
              <img
                src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1200&q=88"
                alt={
                  lang === "zh"
                    ? "Blue Orchid 服装陈列"
                    : "Blue Orchid clothing collection"
                }
              />
            </section>
            <section className="about-story">
              <img
                src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=900&q=88"
                alt={lang === "zh" ? "品牌服装设计" : "Fashion design"}
              />
              <div>
                <p className="about-eyebrow">
                  {lang === "zh" ? "我们的故事" : "OUR STORY"}
                </p>
                <h2>
                  {lang === "zh"
                    ? "少一点喧哗，多一点真正的舒适"
                    : "Less noise, more considered comfort"}
                </h2>
                <p>
                  {lang === "zh"
                    ? "Blue Orchid 始于一个简单的想法：好衣服不该让人费力。我们从面料触感、剪裁比例和真实生活出发，让每件衣服都能轻松融入日常。"
                    : "Blue Orchid began with a simple belief: good clothes should never feel difficult. We start with touch, proportion and real life, making every piece effortless to wear."}
                </p>
                <p>
                  {lang === "zh"
                    ? "我们偏爱克制的色彩、清晰的廓形和能够反复搭配的设计，也认真对待每一道制作细节。"
                    : "We favour restrained colour, clean silhouettes and thoughtful details that work together season after season."}
                </p>
              </div>
            </section>
            <section className="about-values">
              <header>
                <p className="about-eyebrow">
                  {lang === "zh" ? "我们在意的事" : "WHAT MATTERS TO US"}
                </p>
                <h2>
                  {lang === "zh"
                    ? "从一件衣服，开始更好的日常"
                    : "A better everyday starts with one good piece"}
                </h2>
              </header>
              <div>
                <article>
                  <span>01</span>
                  <h3>{lang === "zh" ? "舒适面料" : "Comfort first"}</h3>
                  <p>
                    {lang === "zh"
                      ? "优先选择亲肤、透气和适合长时间穿着的材料。"
                      : "Soft, breathable materials selected for all-day wear."}
                  </p>
                </article>
                <article>
                  <span>02</span>
                  <h3>{lang === "zh" ? "长久设计" : "Made to last"}</h3>
                  <p>
                    {lang === "zh"
                      ? "不过度追逐潮流，让剪裁与配色经得起时间。"
                      : "Timeless cuts and colours that move beyond short-lived trends."}
                  </p>
                </article>
                <article>
                  <span>03</span>
                  <h3>{lang === "zh" ? "贴心服务" : "Human service"}</h3>
                  <p>
                    {lang === "zh"
                      ? "从选购到退换，用清晰、友好的方式回应每个问题。"
                      : "Clear, friendly support from first choice to easy returns."}
                  </p>
                </article>
              </div>
            </section>
            <section className="about-contact">
              <div className="about-contact-image">
                <img
                  src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1000&q=88"
                  alt={
                    lang === "zh" ? "Blue Orchid 门店" : "Blue Orchid studio"
                  }
                />
              </div>
              <div>
                <p className="about-eyebrow">
                  {lang === "zh" ? "客户服务" : "CUSTOMER CARE"}
                </p>
                <h2>
                  {lang === "zh"
                    ? "我们很乐意听到你的声音"
                    : "We'd love to hear from you"}
                </h2>
                <p>
                  {lang === "zh"
                    ? "关于尺码、商品、订单或退换货，如有任何疑问，请联系我们的客服团队。"
                    : "For sizing, products, orders or returns, our customer care team is ready to help."}
                </p>
                <dl>
                  <div>
                    <dt>{lang === "zh" ? "客服邮箱" : "Email"}</dt>
                    <dd>
                      <a href="mailto:service@blueorchid.com">
                        service@blueorchid.com
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt>{lang === "zh" ? "服务热线" : "Phone"}</dt>
                    <dd>
                      <a href="tel:+864008002026">+86 400 800 2026</a>
                    </dd>
                  </div>
                  <div>
                    <dt>{lang === "zh" ? "服务时间" : "Hours"}</dt>
                    <dd>
                      {lang === "zh"
                        ? "周一至周日 09:00–21:00"
                        : "Mon–Sun, 09:00–21:00"}
                    </dd>
                  </div>
                </dl>
                <div className="about-contact-actions">
                  <a href="mailto:service@blueorchid.com">
                    {lang === "zh" ? "发送邮件" : "Send email"}
                  </a>
                  <a href="tel:+864008002026">
                    {lang === "zh" ? "致电客服" : "Call us"}
                  </a>
                </div>
              </div>
            </section>
          </article>
        </div>
      )}
      {toast && (
        <div className="favourite-toast">
          <Icon name="heart" size={17} />
          {toast}
        </div>
      )}
      {authUser && accountPage && (
        <div className="account-page">
          <div className="account-shell">
            <button className="account-close" onClick={closeAccount}>
              ← {lang === "zh" ? "返回商城" : "Back to store"}
            </button>
            <aside className="account-sidebar">
              <p>BLUE ORCHID</p>
              <h2>{lang === "zh" ? "我的账户" : "My account"}</h2>
              <span>{authUser.name}</span>
              <div>
                {[
                  ["orders", lang === "zh" ? "订单历史" : "Order history"],
                  ["addresses", lang === "zh" ? "地址管理" : "Addresses"],
                  ["profile", lang === "zh" ? "个人信息" : "Personal details"],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    className={accountTab === id ? "active" : ""}
                    onClick={() => {
                      setAccountTab(id);
                      setAccountNotice("");
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                className="account-logout"
                onClick={() => {
                  logout();
                  closeAccount();
                }}
              >
                {lang === "zh" ? "退出登录" : "Sign out"}
              </button>
            </aside>
            <section className="account-content">
              {accountNotice && (
                <p className="account-notice">{accountNotice}</p>
              )}
              {accountTab === "orders" && (
                <>
                  <h1>{lang === "zh" ? "订单历史" : "Order history"}</h1>
                  {accountData.orders.length ? (
                    <div className="orders-list">
                      {accountData.orders.map((order) => (
                        <article key={order.id}>
                          <span>{order.id}</span>
                          <strong>{formatPrice(order.total)}</strong>
                          <small>{order.status}</small>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="account-empty">
                      <h3>{lang === "zh" ? "还没有订单" : "No orders yet"}</h3>
                      <p>
                        {lang === "zh"
                          ? "您的订单将在这里显示。"
                          : "Your future orders will appear here."}
                      </p>
                      <button onClick={closeAccount}>
                        {lang === "zh" ? "开始选购" : "Start shopping"}
                      </button>
                    </div>
                  )}
                </>
              )}
              {accountTab === "addresses" && (
                <>
                  <h1>{lang === "zh" ? "地址管理" : "Addresses"}</h1>
                  <div className="address-list">
                    {accountData.addresses.map((address) => (
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
                        <button onClick={() => deleteAddress(address.id)}>
                          {lang === "zh" ? "删除" : "Remove"}
                        </button>
                      </article>
                    ))}
                  </div>
                  <form className="address-form" onSubmit={addAddress}>
                    <h3>
                      {lang === "zh" ? "添加新地址" : "Add a new address"}
                    </h3>
                    <div>
                      <input
                        name="recipient"
                        placeholder={lang === "zh" ? "收件人" : "Recipient"}
                        required
                      />
                      <input
                        name="phone"
                        placeholder={lang === "zh" ? "电话" : "Phone"}
                        required
                      />
                    </div>
                    <input
                      name="line1"
                      placeholder={lang === "zh" ? "详细地址" : "Address line"}
                      required
                    />
                    <div>
                      <input
                        name="city"
                        placeholder={lang === "zh" ? "城市" : "City"}
                        required
                      />
                      <input
                        name="postcode"
                        placeholder={lang === "zh" ? "邮编" : "Postcode"}
                        required
                      />
                    </div>
                    <input
                      name="country"
                      placeholder={
                        lang === "zh" ? "国家/地区" : "Country / region"
                      }
                      required
                    />
                    <button>
                      {lang === "zh" ? "保存地址" : "Save address"}
                    </button>
                  </form>
                </>
              )}
              {accountTab === "profile" && (
                <>
                  <h1>{lang === "zh" ? "个人信息" : "Personal details"}</h1>
                  <form className="profile-form" onSubmit={saveProfile}>
                    <label>
                      {lang === "zh" ? "姓名" : "Name"}
                      <input
                        name="name"
                        defaultValue={authUser.name}
                        required
                        minLength="2"
                      />
                    </label>
                    <label>
                      {lang === "zh" ? "邮箱" : "Email"}
                      <input value={authUser.email} disabled />
                    </label>
                    <label>
                      {lang === "zh" ? "电话" : "Phone"}
                      <input name="phone" defaultValue={authUser.phone} />
                    </label>
                    <button>
                      {lang === "zh" ? "保存更改" : "Save changes"}
                    </button>
                  </form>
                </>
              )}
            </section>
          </div>
        </div>
      )}
      <OrderDetail
        order={selectedOrder}
        lang={lang}
        products={products}
        productNames={productNames}
        formatPrice={formatPrice}
        onClose={() => setSelectedOrder(null)}
      />
      <AuthDialog
        open={authOpen}
        lang={lang}
        mode={authMode}
        loading={authLoading}
        error={authError}
        notice={authNotice}
        email={pendingVerificationEmail}
        verificationUrl={developmentVerificationUrl}
        onClose={() => setAuthOpen(false)}
        onSubmit={submitAuth}
        onResend={resendVerification}
        onSwitch={() => {
          setAuthMode((current) =>
            current === "login" ? "register" : "login",
          );
          setAuthError("");
          setAuthNotice("");
          setDevelopmentVerificationUrl("");
        }}
      />
    </>
  );
}
createRoot(document.getElementById("root")).render(<App />);
