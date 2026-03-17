// Shared dimension filter config for all member module pages
export const MEMBER_DIMENSION_FIELDS = [
  {
    id: 'category',
    label: '商品分類',
    options: [
      { id: 'fish_oil', label: '魚油' },
      { id: 'bitter_melon', label: '苦瓜胜肽' },
      { id: 'meal_pack', label: '大餐包' },
      { id: 'probiotic', label: '益生菌' },
      { id: 'collagen', label: '膠原蛋白' },
      { id: 'vitamin_c', label: '維生素C' },
      { id: 'calcium', label: '鈣片' },
    ],
  },
  {
    id: 'product',
    label: '商品ID',
    options: [
      { id: 'P1001', label: 'P1001 魚油膠囊' },
      { id: 'P1002', label: 'P1002 苦瓜胜肽錠' },
      { id: 'P1003', label: 'P1003 大餐包組合' },
      { id: 'P1004', label: 'P1004 益生菌粉' },
      { id: 'P1005', label: 'P1005 膠原蛋白飲' },
      { id: 'P1006', label: 'P1006 維生素C發泡錠' },
      { id: 'P1007', label: 'P1007 高鈣鎂片' },
      { id: 'P1008', label: 'P1008 葉黃素膠囊' },
      { id: 'P1009', label: 'P1009 薑黃萃取' },
      { id: 'P1010', label: 'P1010 葡萄籽精華' },
      { id: 'P1011', label: 'P1011 輔酶Q10' },
      { id: 'P1012', label: 'P1012 紅麴納豆' },
    ],
  },
  {
    id: 'sku',
    label: 'SKU ID',
    options: Array.from({ length: 20 }, (_, i) => ({
      id: `SKU-${String.fromCharCode(65 + i)}`,
      label: `SKU-${String.fromCharCode(65 + i)}`,
    })),
  },
  {
    id: 'gender',
    label: '性別',
    options: [{ id: 'female', label: '女性' }, { id: 'male', label: '男性' }],
  },
  {
    id: 'age',
    label: '年齡',
    options: [
      { id: '18-24', label: '18–24' },
      { id: '25-34', label: '25–34' },
      { id: '35-44', label: '35–44' },
      { id: '45-54', label: '45–54' },
      { id: '55+', label: '55+' },
    ],
  },
  {
    id: 'tier',
    label: '會員階級',
    options: ['一般', '銅', '銀', '金', '鑽石'].map(t => ({ id: t, label: t })),
  },
];
