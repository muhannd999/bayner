import {
  BaynerState,
  ExpenseEntry,
  Ingredient,
  Order,
  OrderStatus,
  RecipeProduct,
  StoreProfile,
} from "./types";

export interface ItemizedCostLine {
  ingredient: Ingredient;
  quantity: number;
  unitCost: number;
  lineCost: number;
}

export interface RecipeFinancials {
  ingredientsCost: number;
  packagingCost: number;
  wasteCost: number;
  laborCost: number;
  overheadCost: number;
  totalDirectCost: number;
  suggestedSellingPrice: number;
  sellingPrice: number;
  platformFeeCost: number;
  netProfit: number;
  actualProfitMarginPercent: number;
  markupPercent: number;
  isLoss: boolean;
  isLowMargin: boolean;
  costPerServing: number;
  itemizedCosts: ItemizedCostLine[];
}

export function calculateIngredientUnitCost(ingredient: Ingredient): number {
  if (!ingredient.packQuantity || ingredient.packQuantity <= 0) return 0;
  return ingredient.packPrice / ingredient.packQuantity;
}

export function calculateRecipeFinancials(
  recipe: RecipeProduct,
  ingredients: Ingredient[]
): RecipeFinancials {
  const ingMap = new Map(ingredients.map((ing) => [ing.id, ing]));

  let ingredientsCost = 0;
  let packagingCost = 0;
  const itemizedCosts: ItemizedCostLine[] = [];

  for (const item of recipe.items) {
    const ing = ingMap.get(item.ingredientId);
    if (!ing || item.quantity <= 0) continue;

    const unitCost = calculateIngredientUnitCost(ing);
    const lineCost = item.quantity * unitCost;

    if (ing.category === "تغليف") {
      packagingCost += lineCost;
    } else {
      ingredientsCost += lineCost;
    }

    itemizedCosts.push({
      ingredient: ing,
      quantity: item.quantity,
      unitCost,
      lineCost,
    });
  }

  const rawMaterialAndPackaging = ingredientsCost + packagingCost;
  const wasteCost = rawMaterialAndPackaging * (recipe.wastePercent / 100);
  const laborCost = recipe.laborHours * recipe.hourlyRate;
  const subtotalCost = rawMaterialAndPackaging + wasteCost + laborCost;
  const overheadCost = subtotalCost * (recipe.overheadPercent / 100);
  const totalDirectCost = subtotalCost + overheadCost;

  const feeRatio = Math.min(Math.max(recipe.platformFeePercent / 100, 0), 0.7);
  const rawSuggested = totalDirectCost * (1 + recipe.targetMarginPercent / 100);
  const suggestedSellingPrice =
    feeRatio > 0 ? Math.ceil(rawSuggested / (1 - feeRatio)) : Math.ceil(rawSuggested);

  const hasCustomOverride =
    typeof recipe.customSellingPrice === "number" &&
    !Number.isNaN(recipe.customSellingPrice) &&
    recipe.customSellingPrice > 0;

  const sellingPrice = hasCustomOverride
    ? recipe.customSellingPrice!
    : suggestedSellingPrice;

  const platformFeeCost = sellingPrice * feeRatio;
  const netProfit = sellingPrice - totalDirectCost - platformFeeCost;
  const actualProfitMarginPercent =
    sellingPrice > 0 ? (netProfit / sellingPrice) * 100 : 0;
  const markupPercent =
    totalDirectCost > 0 ? (netProfit / totalDirectCost) * 100 : 0;

  const servings = recipe.servings > 0 ? recipe.servings : 1;

  return {
    ingredientsCost,
    packagingCost,
    wasteCost,
    laborCost,
    overheadCost,
    totalDirectCost,
    suggestedSellingPrice,
    sellingPrice,
    platformFeeCost,
    netProfit,
    actualProfitMarginPercent,
    markupPercent,
    isLoss: netProfit <= 0,
    isLowMargin: netProfit > 0 && actualProfitMarginPercent < 20,
    costPerServing: totalDirectCost / servings,
    itemizedCosts,
  };
}

export function formatSAR(amount: number, decimals = 0): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(safe);
  return `${formatted} ر.س`;
}

export function formatNumber(value: number, decimals = 0): string {
  const safe = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(safe);
}

export function sanitizeWhatsAppPhone(phone: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  if (digits.startsWith("05") && digits.length === 10) {
    return `966${digits.slice(1)}`;
  }
  if (digits.startsWith("5") && digits.length === 9) {
    return `966${digits}`;
  }
  if (digits.startsWith("00")) {
    return digits.slice(2);
  }
  return digits;
}

export function buildWhatsAppLink(phone: string, message: string): string {
  const cleanPhone = sanitizeWhatsAppPhone(phone);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export function buildWhatsAppOrderMessage(
  order: Order,
  store: StoreProfile
): string {
  const remaining = Math.max(0, order.totalPrice - order.depositAmount);
  const lines = [
    `مرحباً ${store.name} 🎂`,
    `أرغب في تأكيد طلبي رقم: *#${order.orderNumber}*`,
    `• الاسم: ${order.customerName}`,
    `• الصنف: ${order.productName}`,
  ];

  if (order.isCustomCake) {
    if (order.cakeSize) lines.push(`• المقاس: ${order.cakeSize}`);
    if (order.cakeFlavor) lines.push(`• النكهة: ${order.cakeFlavor}`);
    if (order.cakeFilling) lines.push(`• الحشوة: ${order.cakeFilling}`);
    if (order.cakeText) lines.push(`• العبارة: "${order.cakeText}"`);
    if (order.inspirationNote) lines.push(`• ملاحظة التصميم: ${order.inspirationNote}`);
  }

  lines.push(
    `• تاريخ الاستلام: ${order.deliveryDate} (${order.deliveryType})`,
    `• الإجمالي: ${formatSAR(order.totalPrice)}`,
    `• العربون المطلوب: ${formatSAR(order.depositAmount)} (المتبقي عند الاستلام: ${formatSAR(remaining)})`,
    `• التحويل على ${store.bankName}: ${store.iban}`
  );

  return lines.join("\n");
}

export function getOrderStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    new: "طلب جديد",
    awaiting_deposit: "بانتظار العربون",
    preparing: "قيد التحضير",
    ready: "جاهز للاستلام",
    completed: "مكتمل",
    cancelled: "ملغي",
  };
  return labels[status];
}

export function getNextAvailableDates(
  state: BaynerState,
  daysToCheck = 10
): string[] {
  const available: string[] = [];
  const today = new Date();

  for (let i = 1; i <= daysToCheck; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const iso = d.toISOString().split("T")[0];
    if (state.blockedDates.includes(iso)) continue;

    const count = state.orders.filter(
      (o) => o.deliveryDate === iso && o.status !== "cancelled"
    ).length;

    if (count < state.store.dailyCapacity) {
      available.push(iso);
    }
  }

  return available;
}

export function renderTemplateVariables(
  template: string,
  state: BaynerState,
  storeUrl: string
): string {
  const published = state.recipes.filter((r) => r.publishedInMenu);
  const menuList = published
    .map((r) => {
      const fin = calculateRecipeFinancials(r, state.ingredients);
      return `- ${r.name}: ${formatSAR(fin.sellingPrice)}`;
    })
    .join("\n");

  const openDates = getNextAvailableDates(state, 10)
    .slice(0, 4)
    .join(" ، ");

  const minCustomPrice =
    state.customCakeConfig.sizes[0]?.priceAdd ?? 180;

  return template
    .replaceAll("{store_name}", state.store.name)
    .replaceAll("{store_link}", storeUrl)
    .replaceAll("{menu_list}", menuList || "المنيو قيد التحديث")
    .replaceAll("{open_dates}", openDates || "يرجى التواصل لتحديد الموعد")
    .replaceAll("{deposit_percent}", String(state.store.defaultDepositPercent))
    .replaceAll("{bank_name}", state.store.bankName)
    .replaceAll("{iban}", state.store.iban)
    .replaceAll("{city}", state.store.city)
    .replaceAll("{pickup_address}", state.store.pickupAddress)
    .replaceAll("{min_custom_price}", formatSAR(minCustomPrice));
}

export function simulateWhatsAppReply(
  incomingText: string,
  state: BaynerState,
  storeUrl: string
): { matchedRuleName: string; reply: string } {
  const normalized = incomingText.trim().toLowerCase();

  for (const rule of state.whatsappRules) {
    if (!rule.enabled) continue;
    const hit = rule.keywords.some((kw) =>
      normalized.includes(kw.trim().toLowerCase())
    );
    if (hit) {
      let reply = renderTemplateVariables(rule.responseTemplate, state, storeUrl);
      if (rule.attachMenuLink && !reply.includes(storeUrl)) {
        reply += `\n\nرابط الطلب المباشر:\n${storeUrl}`;
      }
      return { matchedRuleName: rule.name, reply };
    }
  }

  const fallback = renderTemplateVariables(
    state.whatsappConfig.welcomeMessage,
    state,
    storeUrl
  );
  return {
    matchedRuleName: "رسالة الترحيب الافتراضية",
    reply: fallback,
  };
}

export interface ShoppingPrepItem {
  ingredient: Ingredient;
  totalQuantity: number;
  estimatedCost: number;
  matchedOrdersCount: number;
}

export interface ShoppingPrepResult {
  items: ShoppingPrepItem[];
  matchedOrders: Order[];
  unmatchedCustomOrders: Order[];
  totalEstimatedCost: number;
}

export function calculateShoppingPrepList(
  orders: Order[],
  recipes: RecipeProduct[],
  ingredients: Ingredient[]
): ShoppingPrepResult {
  const activeUpcoming = orders.filter(
    (o) =>
      o.status === "new" ||
      o.status === "awaiting_deposit" ||
      o.status === "preparing"
  );

  const ingMap = new Map(ingredients.map((i) => [i.id, i]));
  const qtyByIng = new Map<string, { qty: number; orderIds: Set<string> }>();
  const matchedOrders: Order[] = [];
  const unmatchedCustomOrders: Order[] = [];

  for (const order of activeUpcoming) {
    const matchedRecipe = recipes.find(
      (r) =>
        r.name.trim() === order.productName.trim() ||
        order.productName.includes(r.name)
    );

    if (!matchedRecipe) {
      unmatchedCustomOrders.push(order);
      continue;
    }

    matchedOrders.push(order);
    for (const item of matchedRecipe.items) {
      if (item.quantity <= 0 || !ingMap.has(item.ingredientId)) continue;
      const existing = qtyByIng.get(item.ingredientId) ?? {
        qty: 0,
        orderIds: new Set<string>(),
      };
      existing.qty += item.quantity;
      existing.orderIds.add(order.id);
      qtyByIng.set(item.ingredientId, existing);
    }
  }

  const items: ShoppingPrepItem[] = [];
  let totalEstimatedCost = 0;

  for (const [ingredientId, data] of qtyByIng.entries()) {
    const ingredient = ingMap.get(ingredientId);
    if (!ingredient) continue;
    const unitCost = calculateIngredientUnitCost(ingredient);
    const estimatedCost = data.qty * unitCost;
    totalEstimatedCost += estimatedCost;
    items.push({
      ingredient,
      totalQuantity: data.qty,
      estimatedCost,
      matchedOrdersCount: data.orderIds.size,
    });
  }

  items.sort((a, b) => b.estimatedCost - a.estimatedCost);

  return {
    items,
    matchedOrders,
    unmatchedCustomOrders,
    totalEstimatedCost,
  };
}

export function generateFinancialCsv(
  orders: Order[],
  expenses: ExpenseEntry[],
  storeName: string
): string {
  const escapeCsv = (val: string | number) => {
    const str = String(val ?? "");
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replaceAll('"', '""')}"`;
    }
    return str;
  };

  const rows: string[] = [];
  rows.push(`تقرير الأداء المالي - ${storeName}`);
  rows.push("");
  rows.push(
    "النوع,المرجع,التاريخ,التفاصيل,الحالة / الفئة,الإيراد (ر.س),التكلفة / المصروف (ر.س),صافي الأثر (ر.س)"
  );

  for (const o of orders) {
    if (o.status === "cancelled") continue;
    const cost = o.estimatedCost + o.estimatedWaste;
    const net = o.totalPrice - cost;
    rows.push(
      [
        "طلب مبيعات",
        o.orderNumber,
        o.deliveryDate,
        `${o.customerName} - ${o.productName}`,
        getOrderStatusLabel(o.status),
        o.totalPrice.toFixed(2),
        cost.toFixed(2),
        net.toFixed(2),
      ]
        .map(escapeCsv)
        .join(",")
    );
  }

  for (const e of expenses) {
    rows.push(
      [
        "مصروف / هدر",
        e.id,
        e.date,
        e.description,
        e.category,
        "0.00",
        e.amount.toFixed(2),
        (-e.amount).toFixed(2),
      ]
        .map(escapeCsv)
        .join(",")
    );
  }

  return "\uFEFF" + rows.join("\n");
}
