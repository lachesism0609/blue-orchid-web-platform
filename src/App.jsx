import { useEffect, useState } from "react";
import { filterProducts, paginateProducts } from "./store-utils.js";
import ProductDetail from "./components/ProductDetail.jsx";
import AuthDialog from "./components/AuthDialog.jsx";
import OrderDetail from "./components/OrderDetail.jsx";
import CatalogControls from "./components/CatalogControls.jsx";
import StoreHeader from "./components/StoreHeader.jsx";
import HomePage from "./components/HomePage.jsx";
import FavouritesPage from "./components/FavouritesPage.jsx";
import CatalogPage from "./components/CatalogPage.jsx";
import AboutPage from "./components/AboutPage.jsx";
import CartPage from "./components/CartPage.jsx";
import AccountPage from "./components/AccountPage.jsx";
import Toast from "./components/Toast.jsx";

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

export default function App() {
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
  const variantImage = (product, colorIndex) => {
    const index = colorIndex ?? selectedColorIndex(product);
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
  const cartItems = cart
    .map((item, index) => ({
      ...item,
      index,
      product: products.find((product) => product.id === item.productId),
    }))
    .filter((item) => item.product);
  const editCartItem = (item) => {
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
      <StoreHeader
        shippingText={shippingText}
        lang={lang}
        currency={currency}
        rate={eurCnyRate}
        rateDate={exchangeRateDate}
        navigation={navigation}
        menuOpen={menuOpen}
        searchPlaceholder={t.search}
        searchValue={productSearch}
        user={authUser}
        cartCount={cart.length}
        onLanguage={() =>
          setLang((current) => (current === "zh" ? "en" : "zh"))
        }
        onCurrency={() =>
          setCurrency((current) => (current === "CNY" ? "EUR" : "CNY"))
        }
        onSearch={(value) => {
          setProductSearch(value);
          if (value) openCatalog("new");
        }}
        onHome={goHome}
        onMenu={() => setMenuOpen((current) => !current)}
        onNavigate={openCatalog}
        onAccount={authUser ? openAccount : openAuth}
        onFavourites={openFavourites}
        onCart={() => {
          setCartPage(true);
          setCatalogPage("");
          setFavouritesPage(false);
          setAccountPage(false);
        }}
      />
      <HomePage
        copy={t}
        lang={lang}
        slides={heroSlides}
        activeSlide={activeSlide}
        categoryImages={categoryImages}
        categoryRoutes={categoryRoutes}
        products={products}
        productNames={productNames}
        liked={liked}
        saleDiscounts={saleDiscounts}
        formatPrice={formatPrice}
        variantImage={variantImage}
        selectedColor={selectedColorIndex}
        salePrice={salePrice}
        saleLabel={saleLabel}
        onSlide={setActiveSlide}
        onCategory={openCatalog}
        onAll={() => openCatalog("new")}
        onOpen={setSelectedProduct}
        onLike={toggleLike}
        onAdd={addToCart}
        onColor={selectColor}
      />
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
        onClose={() => {
          setSelectedProduct(null);
          setEditingCartIndex(null);
        }}
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
      <CartPage
        open={cartPage}
        stage={checkoutStage}
        completedOrder={completedOrder}
        lang={lang}
        items={cartItems}
        addresses={checkoutAddresses}
        selectedAddressId={selectedAddressId}
        loading={checkoutLoading}
        total={cartTotal}
        formatPrice={formatPrice}
        itemImage={(item) => variantImage(item.product, item.colorIndex)}
        itemName={(item) =>
          productNames[item.productId]?.[lang === "zh" ? 0 : 1] ||
          item.product.name
        }
        unitPrice={cartUnitPrice}
        onAddress={setSelectedAddressId}
        onConfirm={confirmOrder}
        onBack={() => setCheckoutStage("cart")}
        onEdit={editCartItem}
        onQuantity={changeCartQuantity}
        onRemove={(index) =>
          setCart((current) =>
            current.filter((_, itemIndex) => itemIndex !== index),
          )
        }
        onCheckout={handleCheckout}
        onHome={goHome}
      />
      <FavouritesPage
        open={favouritesPage}
        products={favouriteProducts}
        lang={lang}
        productNames={productNames}
        liked={liked}
        favouriteLabel={t.favourite}
        saleDiscounts={saleDiscounts}
        formatPrice={formatPrice}
        variantImage={variantImage}
        selectedColor={selectedColorIndex}
        salePrice={salePrice}
        saleLabel={saleLabel}
        onOpen={setSelectedProduct}
        onLike={toggleLike}
        onAdd={addToCart}
        onColor={selectColor}
        onHome={goHome}
      />
      <CatalogPage
        open={Boolean(catalogPage)}
        title={catalogName}
        products={catalogProducts}
        total={filteredCatalogProducts.length}
        lang={lang}
        productNames={productNames}
        liked={liked}
        favouriteLabel={t.favourite}
        saleDiscounts={saleDiscounts}
        formatPrice={formatPrice}
        variantImage={variantImage}
        selectedColor={selectedColorIndex}
        salePrice={salePrice}
        saleLabel={saleLabel}
        onOpen={setSelectedProduct}
        onLike={toggleLike}
        onAdd={addToCart}
        onColor={selectColor}
      />
      <AboutPage open={aboutPage} lang={lang} />
      <Toast message={toast} />
      <AccountPage
        open={accountPage}
        user={authUser}
        lang={lang}
        tab={accountTab}
        notice={accountNotice}
        data={accountData}
        formatPrice={formatPrice}
        onClose={closeAccount}
        onTab={(tabId) => {
          setAccountTab(tabId);
          setAccountNotice("");
        }}
        onLogout={() => {
          logout();
          closeAccount();
        }}
        onOrder={setSelectedOrder}
        onDeleteAddress={deleteAddress}
        onAddAddress={addAddress}
        onSaveProfile={saveProfile}
      />
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
