export function filterProducts(
  products,
  {
    category = "",
    query = "",
    price = "all",
    stockOnly = false,
    saleIds = [],
  } = {},
) {
  const normalizedQuery = query.trim().toLowerCase();
  const saleSet = new Set(saleIds.map(Number));
  return products.filter((product) => {
    const matchesCategory =
      !category ||
      category === "new" ||
      (category === "sale"
        ? saleSet.has(product.id)
        : product.category === category);
    const searchableName = String(
      product.displayName || product.name || "",
    ).toLowerCase();
    const matchesPrice =
      price === "all" ||
      (price === "under300"
        ? product.price < 300
        : price === "300to600"
          ? product.price >= 300 && product.price <= 600
          : product.price > 600);
    return (
      matchesCategory &&
      (!normalizedQuery || searchableName.includes(normalizedQuery)) &&
      matchesPrice &&
      (!stockOnly || product.inStock)
    );
  });
}

export function paginateProducts(products, requestedPage = 1, pageSize = 8) {
  const pages = Math.max(1, Math.ceil(products.length / pageSize));
  const page = Math.max(1, Math.min(Number(requestedPage) || 1, pages));
  return {
    items: products.slice((page - 1) * pageSize, page * pageSize),
    page,
    pages,
    total: products.length,
  };
}

export function updateCartOptions(cart, index, options) {
  return cart.map((item, itemIndex) =>
    itemIndex === index ? { ...item, ...options } : item,
  );
}

const orderStatusCopy = {
  confirmed: ["已确认", "Confirmed"],
  processing: ["处理中", "Processing"],
  shipped: ["已发货", "Shipped"],
  completed: ["已完成", "Completed"],
  cancelled: ["已取消", "Cancelled"],
  订单已确认: ["已确认", "Confirmed"],
};

export function orderStatusLabel(status, lang = "zh") {
  return orderStatusCopy[status]?.[lang === "zh" ? 0 : 1] || status;
}
