const categoryDetails = {
  women: {
    descriptionZh: '为舒适、行动自如和日常搭配而设计的轻松衣橱单品。',
    descriptionEn: 'An effortless wardrobe piece designed for comfort, movement and everyday versatility.',
    materialsZh: '优质棉麻混纺',
    materialsEn: 'Premium cotton and linen blend',
    sizes: ['XS', 'S', 'M', 'L']
  },
  men: {
    descriptionZh: '剪裁利落、穿着放松且结构耐穿的日常基础单品。',
    descriptionEn: 'A refined everyday essential with a relaxed fit and clean, enduring construction.',
    materialsZh: '负责任采购的棉质混纺',
    materialsEn: 'Responsibly sourced cotton blend',
    sizes: ['S', 'M', 'L', 'XL']
  },
  bags: {
    descriptionZh: '比例考究、收纳合理，适合容纳日常随身物品。',
    descriptionEn: 'A practical, carefully proportioned bag with considered storage for daily essentials.',
    materialsZh: '优质织物与负责任采购的皮革',
    materialsEn: 'Premium textile and responsibly sourced leather',
    sizes: ['One size']
  },
  shoes: {
    descriptionZh: '以舒适为先，结合轻量鞋型、支撑鞋底与经典外观。',
    descriptionEn: 'Comfort-led footwear with a lightweight profile, supportive sole and timeless finish.',
    materialsZh: '皮革与再生橡胶',
    materialsEn: 'Leather and recycled rubber',
    sizes: ['36', '37', '38', '39', '40', '41']
  },
  accessories: {
    descriptionZh: '为简约衣橱增添完整感的精致配饰。',
    descriptionEn: 'A considered finishing touch created to complement an understated wardrobe.',
    materialsZh: '多种优质材料',
    materialsEn: 'Mixed premium materials',
    sizes: ['One size']
  }
}

const categoryVariantImages = {
  women: [
    'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=750&q=85',
    'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=750&q=85'
  ],
  men: [
    'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=750&q=85',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=750&q=85'
  ],
  bags: [
    'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=750&q=85',
    'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=750&q=85'
  ],
  shoes: [
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=750&q=85',
    'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=750&q=85'
  ],
  accessories: [
    'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=750&q=85',
    'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=750&q=85'
  ]
}

const rows = [
  [1, 'women', '亚麻短袖衬衫', 'Linen short-sleeve shirt', 329, 20, ['#eee3d1', '#d69391', '#a8bdcf'], 'https://images.unsplash.com/photo-1598032895397-b9472444bf93?auto=format&fit=crop&w=750&q=85'],
  [2, 'men', '直筒牛仔裤', 'Straight jeans', 399, 15, ['#2e567c', '#9ab8d6'], 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=750&q=85'],
  [3, 'men', '纯棉基础 T 恤', 'Cotton basic T-shirt', 169, 25, ['#141414', '#f4f2eb', '#c9c9c9'], 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=750&q=85'],
  [4, 'women', '宽松廓形西装外套', 'Oversized blazer', 699, null, ['#dfd0b7', '#191919'], 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=750&q=85'],
  [5, 'women', '轻盈棉质连衣裙', 'Light cotton dress', 459, null, ['#ffffff', '#e6b7bf', '#171717'], 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=750&q=85'],
  [6, 'shoes', '极简白色运动鞋', 'Minimal white sneakers', 559, null, ['#fafafa'], 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=750&q=85'],
  [7, 'bags', '经典皮质托特包', 'Classic leather tote', 699, null, ['#b18d68', '#242321'], 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=750&q=85'],
  [8, 'bags', '迷你斜挎包', 'Mini crossbody bag', 459, null, ['#d9c9b4', '#52707e'], 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=750&q=85'],
  [9, 'shoes', '柔软乐福鞋', 'Soft leather loafers', 399, 20, ['#9d7657', '#171717'], 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=750&q=85'],
  [10, 'shoes', '细带凉鞋', 'Strappy sandals', 299, 30, ['#dfd0b7', '#171717'], 'https://images.unsplash.com/photo-1562273138-f46be4ebdf33?auto=format&fit=crop&w=750&q=85'],
  [11, 'accessories', '简约弧形太阳镜', 'Minimal curve sunglasses', 219, 25, ['#1f1f1d', '#b77850'], 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=750&q=85'],
  [12, 'accessories', '真丝方巾', 'Silk square scarf', 189, 20, ['#d29a8b', '#b8c5b2'], 'https://images.unsplash.com/photo-1584030373081-f37b7bb4fa8e?auto=format&fit=crop&w=750&q=85'],
  [13, 'women', '垂感半身长裙', 'Fluid midi skirt', 389, 15, ['#d9d0c3', '#222222'], 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=750&q=85'],
  [14, 'women', '针织开衫', 'Fine knit cardigan', 429, null, ['#e4d7c6', '#87909a'], 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=750&q=85'],
  [15, 'women', '轻薄风衣', 'Lightweight trench coat', 759, null, ['#c6b8a4', '#303537'], 'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=750&q=85'],
  [16, 'men', '亚麻立领衬衫', 'Linen grandad shirt', 359, 20, ['#f0ebe1', '#53616a'], 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=750&q=85'],
  [17, 'men', '锥形休闲长裤', 'Tapered trousers', 449, null, ['#c6b9a5', '#273137'], 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=750&q=85'],
  [18, 'men', '简约圆领卫衣', 'Minimal crew sweatshirt', 379, 25, ['#d2d2cc', '#262626'], 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=750&q=85'],
  [19, 'men', '轻量夹克', 'Lightweight jacket', 629, null, ['#7e8a80', '#1d2220'], 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=750&q=85'],
  [20, 'bags', '编织腋下包', 'Woven shoulder bag', 499, null, ['#c1a179', '#252525'], 'https://images.unsplash.com/photo-1585488434455-255a6d4a9d0b?auto=format&fit=crop&w=750&q=85'],
  [21, 'bags', '通勤双肩包', 'Commuter backpack', 569, null, ['#9d8873', '#252525'], 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=750&q=85'],
  [22, 'bags', '小号手提包', 'Small top-handle bag', 639, null, ['#dac7b2', '#583e32'], 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=750&q=85'],
  [23, 'bags', '尼龙旅行包', 'Nylon travel bag', 429, null, ['#26333a', '#b0a493'], 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=750&q=85'],
  [24, 'shoes', '复古跑鞋', 'Retro runner', 649, null, ['#e6e0d6', '#6c7377'], 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=750&q=85'],
  [25, 'shoes', '方头芭蕾鞋', 'Square-toe ballet flats', 369, 20, ['#e5d5c7', '#282828'], 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=750&q=85'],
  [26, 'shoes', '真皮短靴', 'Leather ankle boots', 729, null, ['#3d3029', '#c1ab90'], 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=750&q=85'],
  [27, 'accessories', '精工腕表', 'Classic wristwatch', 899, null, ['#d8b67a', '#282828'], 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=750&q=85'],
  [28, 'accessories', '羊毛渔夫帽', 'Wool bucket hat', 199, 30, ['#c7b49e', '#343434'], 'https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=750&q=85'],
  [29, 'accessories', '细链项链', 'Fine chain necklace', 259, 20, ['#d5b46f'], 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=750&q=85'],
  [30, 'accessories', '皮质腰带', 'Leather belt', 279, 25, ['#703f2c', '#191919'], 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=750&q=85']
]

export const defaultProductStock = [12, 9, 20, 7, 11, 14, 6, 10, 8, 13, 15, 5, 9, 12, 4, 11, 8, 16, 6, 10, 7, 9, 5, 12, 8, 4, 6, 14, 10, 9]

export const catalogSeed = rows.map(([id, category, nameZh, nameEn, price, salePercent, colors, imageUrl]) => {
  const details = categoryDetails[category]
  const variantImages = categoryVariantImages[category]
  return {
    id,
    category,
    nameZh,
    nameEn,
    price,
    salePercent,
    imageUrl,
    ...details,
    variants: colors.map((colorHex, index) => ({
      id: id * 10 + index + 1,
      code: `BO-${String(id).padStart(3, '0')}-C${String(index + 1).padStart(2, '0')}`,
      nameZh: `配色 ${index + 1}`,
      nameEn: `Colour ${index + 1}`,
      colorHex,
      imageUrl: index === 0 ? imageUrl : variantImages[(index - 1) % variantImages.length],
      position: index
    })),
    sizeOptions: details.sizes.map((label, index) => ({ id: id * 10 + index + 1, label, position: index }))
  }
})
