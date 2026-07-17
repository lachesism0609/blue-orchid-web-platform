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
import AdminPage from "./components/AdminPage.jsx";
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
  const productNames = Object.fromEntries(
    products.map((product) => [
      product.id,
      [product.nameZh || product.name, product.nameEn || product.name],
    ]),
  );
  const saleDiscounts = Object.fromEntries(
    products
      .filter((product) => product.salePercent !== null)
      .map((product) => [product.id, (100 - product.salePercent) / 100]),
  );
  const [productSearch, setProductSearch] = useState("");
  const [priceFilter, setPriceFilter] = useState("all");
  const [stockOnly, setStockOnly] = useState(false);
  const [catalogPageNumber, setCatalogPageNumber] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingCartIndex, setEditingCartIndex] = useState(null);
  const [liked, setLiked] = useState([]);
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
  const [authResolved, setAuthResolved] = useState(false);
  const [accountPage, setAccountPage] = useState(
    () => window.location.hash === "#account",
  );
  const [accountTab, setAccountTab] = useState("orders");
  const [accountData, setAccountData] = useState({ orders: [], addresses: [] });
  const [accountNotice, setAccountNotice] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [adminPage, setAdminPage] = useState(
    () => window.location.hash === "#admin",
  );
  const [adminProducts, setAdminProducts] = useState([]);
  const [adminOrders, setAdminOrders] = useState([]);
  const [adminOrderTotal, setAdminOrderTotal] = useState(0);
  const [adminLoading, setAdminLoading] = useState(false);
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
  const [cart, setCart] = useState([]);
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
    localStorage.removeItem("blue-orchid-favourites");
    localStorage.removeItem("blue-orchid-cart");
  }, []);
  useEffect(() => {
    if (accountPage) window.history.replaceState(null, "", "#account");
  }, [accountPage]);
  useEffect(() => {
    if (adminPage) window.history.replaceState(null, "", "#admin");
  }, [adminPage]);
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
      adminPage ||
      favouritesPage ||
      cartPage ||
      authOpen,
    );
    document.body.style.overflow = shouldLockScroll ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [
    catalogPage,
    aboutPage,
    accountPage,
    adminPage,
    favouritesPage,
    cartPage,
    authOpen,
  ]);
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
      .catch(() => setAuthUser(null))
      .finally(() => setAuthResolved(true));
  }, []);
  useEffect(() => {
    if (!authResolved || authUser || (!cartPage && !favouritesPage)) return;
    setCartPage(false);
    setFavouritesPage(false);
    setCheckoutStage("cart");
    setCompletedOrder(null);
    if (["#cart", "#favourites"].includes(window.location.hash)) {
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}`,
      );
    }
  }, [authResolved, authUser, cartPage, favouritesPage]);
  useEffect(() => {
    if (!authUser) {
      setLiked([]);
      setCart([]);
      return;
    }
    let cancelled = false;
    accountRequest("/api/account/store-state")
      .then((data) => {
        if (cancelled) return;
        setLiked(data.favourites || []);
        setCart(data.cart || []);
      })
      .catch((error) => {
        if (!cancelled) setToast(error.message);
      });
    return () => {
      cancelled = true;
    };
  }, [authUser?.id]);
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
  const loadAdmin = async () => {
    if (authUser?.role !== "admin") return;
    setAdminLoading(true);
    try {
      const [productData, orderData] = await Promise.all([
        accountRequest("/api/admin/products"),
        accountRequest("/api/admin/orders?limit=100"),
      ]);
      setAdminProducts(productData.products || []);
      setAdminOrders(orderData.orders || []);
      setAdminOrderTotal(orderData.pagination?.total || 0);
    } catch (error) {
      setToast(error.message);
    } finally {
      setAdminLoading(false);
    }
  };
  const reloadStoreProducts = async () => {
    const response = await fetch("/api/products");
    if (!response.ok)
      throw new Error("Unable to reload the product catalogue.");
    setProducts(await response.json());
  };
  useEffect(() => {
    if (adminPage && authUser?.role === "admin") loadAdmin();
    if (adminPage && authUser && authUser.role !== "admin") {
      setAdminPage(false);
      setToast(
        lang === "zh"
          ? "此账号没有管理员权限。"
          : "This account does not have administrator access.",
      );
    }
  }, [adminPage, authUser?.id, authUser?.role]);

  const adminAction = async (path, method, body) => {
    const data = await accountRequest(path, {
      method,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    await Promise.all([loadAdmin(), reloadStoreProducts()]);
    return data;
  };
  const toggleLike = async (id) => {
    if (!authUser) {
      setAuthError(
        lang === "zh"
          ? "请先登录后再收藏商品。"
          : "Please sign in to save favourites.",
      );
      setAuthOpen(true);
      return;
    }
    const adding = !liked.includes(id);
    try {
      const data = await accountRequest(`/api/account/favourites/${id}`, {
        method: adding ? "PUT" : "DELETE",
      });
      setLiked(data.favourites || []);
      setCart(data.cart || []);
      if (adding)
        setToast(lang === "zh" ? "已添加到收藏" : "Added to favourites");
    } catch (error) {
      setToast(error.message);
    }
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
    setAdminPage(false);
    setFavouritesPage(false);
    setCatalogPage("");
    setAboutPage(false);
  };
  const closeAccount = () => {
    setAccountPage(false);
    window.history.replaceState(null, "", window.location.pathname);
  };
  const openAdmin = () => {
    if (authUser?.role !== "admin") return;
    setAdminPage(true);
    setAccountPage(false);
    setCatalogPage("");
    setAboutPage(false);
    setFavouritesPage(false);
    setCartPage(false);
  };
  const closeAdmin = () => {
    setAdminPage(false);
    window.history.replaceState(null, "", window.location.pathname);
  };
  const openCatalog = (id) => {
    setCatalogPage(id === "about" ? "" : id);
    setAboutPage(id === "about");
    setAccountPage(false);
    setAdminPage(false);
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
    setAdminPage(false);
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
    closeAdmin();
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
  const selectedColorIndex = (product) => selectedColors[product.id] || 0;
  const variantImage = (product, colorIndex) => {
    const index = colorIndex ?? selectedColorIndex(product);
    return product.variants?.[index]?.image || product.image;
  };
  const variantStock = (product, colorIndex, size) => {
    const variant = product.variants?.[Number(colorIndex || 0)];
    return (
      product.skus?.find(
        (sku) => sku.variantId === variant?.id && sku.size === size,
      )?.stock ?? 0
    );
  };
  const selectColor = (productId, index) => {
    setSelectedColors((current) => ({ ...current, [productId]: index }));
  };
  const addToCart = async (product) => {
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
    if (variantStock(product, colorIndex, size) < 1) {
      setToast(
        lang === "zh"
          ? "所选款式和尺码暂时缺货"
          : "This style and size is out of stock",
      );
      return;
    }
    try {
      const editingItem =
        editingCartIndex === null ? null : cart[editingCartIndex];
      const data = await accountRequest(
        editingItem
          ? `/api/account/cart/${editingItem.id}`
          : "/api/account/cart",
        {
          method: editingItem ? "PUT" : "POST",
          body: JSON.stringify({
            productId: product.id,
            variantId: product.variants?.[colorIndex]?.id,
            size,
            quantity: editingItem?.quantity || 1,
          }),
        },
      );
      setCart(data.cart || []);
      setLiked(data.favourites || liked);
      if (editingItem) {
        setSelectedProduct(null);
        setEditingCartIndex(null);
        setToast(lang === "zh" ? "商品选项已更新" : "Product options updated");
      } else setToast(lang === "zh" ? "已加入购物车" : "Added to bag");
    } catch (error) {
      setToast(error.message);
    }
  };
  const changeCartQuantity = async (index, amount) => {
    const item = cart[index];
    if (!item) return;
    const product = products.find((entry) => entry.id === item.productId);
    const available = product
      ? variantStock(product, item.colorIndex, item.size)
      : 0;
    const quantity = Math.max(
      1,
      Math.min(10, available, item.quantity + amount),
    );
    if (quantity === item.quantity) return;
    try {
      const data = await accountRequest(`/api/account/cart/${item.id}`, {
        method: "PUT",
        body: JSON.stringify({ quantity }),
      });
      setCart(data.cart || []);
    } catch (error) {
      setToast(error.message);
    }
  };
  const removeCartItem = async (index) => {
    const item = cart[index];
    if (!item) return;
    try {
      const data = await accountRequest(`/api/account/cart/${item.id}`, {
        method: "DELETE",
      });
      setCart(data.cart || []);
    } catch (error) {
      setToast(error.message);
    }
  };
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
  const cartUnitPrice = (product) => product.salePrice ?? product.price;
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
  const salePrice = (product) => product.salePrice ?? product.price;
  const saleLabel = (product) =>
    lang === "zh"
      ? `${(100 - product.salePercent) / 10}折`
      : `${product.salePercent}% OFF`;
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
        onAdmin={openAdmin}
        onAccount={authUser ? openAccount : openAuth}
        onFavourites={openFavourites}
        onCart={() => {
          if (!authUser) return;
          setCartPage(true);
          setCatalogPage("");
          setFavouritesPage(false);
          setAccountPage(false);
          setAdminPage(false);
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
        }}
        onAction={() => addToCart(selectedProduct)}
      />
      <CartPage
        open={Boolean(authUser && cartPage)}
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
        onRemove={removeCartItem}
        onCheckout={handleCheckout}
        onHome={goHome}
      />
      <FavouritesPage
        open={Boolean(authUser && favouritesPage)}
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
      <AdminPage
        open={adminPage}
        user={authUser}
        lang={lang}
        products={adminProducts}
        orders={adminOrders}
        orderTotal={adminOrderTotal}
        loading={adminLoading}
        onClose={closeAdmin}
        onReload={loadAdmin}
        onCreate={(payload) =>
          adminAction("/api/admin/products", "POST", payload)
        }
        onUpdateProduct={(id, payload) =>
          adminAction(`/api/admin/products/${id}`, "PUT", payload)
        }
        onUpdateVariant={(id, payload) =>
          adminAction(`/api/admin/variants/${id}`, "PUT", payload)
        }
        onUpdateSku={(id, stock) =>
          adminAction(`/api/admin/skus/${id}`, "PUT", { stock })
        }
        onUpdateOrder={(id, status) =>
          adminAction(`/api/admin/orders/${encodeURIComponent(id)}`, "PUT", {
            status,
          })
        }
      />
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
