export type IngredientCategory = "مقادير" | "تغليف" | "إضافات";
export type IngredientUnit = "جم" | "مل" | "حبة";

export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  packPrice: number;
  packQuantity: number;
  unit: IngredientUnit;
}

export interface RecipeItem {
  ingredientId: string;
  quantity: number;
}

export type RecipeCategory = "كيك مناسبات" | "حلى وبوكسات" | "ميني كيك";

export interface RecipeProduct {
  id: string;
  name: string;
  category: RecipeCategory;
  description: string;
  servings: number;
  items: RecipeItem[];
  laborHours: number;
  hourlyRate: number;
  overheadPercent: number;
  wastePercent: number;
  platformFeePercent: number;
  targetMarginPercent: number;
  customSellingPrice?: number;
  publishedInMenu: boolean;
  accentColor: string;
}

export type OrderStatus =
  | "new"
  | "awaiting_deposit"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";

export type DeliveryType = "استلام" | "توصيل";

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryDate: string; // YYYY-MM-DD
  deliveryType: DeliveryType;
  productName: string;
  isCustomCake: boolean;
  cakeSize?: string;
  cakeFlavor?: string;
  cakeFilling?: string;
  cakeText?: string;
  inspirationNote?: string;
  referenceImageDataUrl?: string;
  totalPrice: number;
  estimatedCost: number;
  estimatedWaste: number;
  depositAmount: number;
  depositPaid: boolean;
  status: OrderStatus;
  createdAt: string;
}

export interface WhatsAppRule {
  id: string;
  name: string;
  keywords: string[];
  responseTemplate: string;
  enabled: boolean;
  attachMenuLink: boolean;
}

export interface WhatsAppCloudConfig {
  mode: "smart_bridge" | "cloud_api";
  phoneNumberId: string;
  wabaId: string;
  accessToken: string;
  verifyToken: string;
  autoReplyEnabled: boolean;
  welcomeMessage: string;
  lastTestStatus?: "idle" | "success" | "error";
  lastTestedAt?: string;
}

export interface CustomCakeOption {
  id: string;
  label: string;
  priceAdd: number;
  subtitle?: string;
}

export interface CustomCakeConfig {
  sizes: CustomCakeOption[];
  flavors: CustomCakeOption[];
  fillings: CustomCakeOption[];
}

export interface StoreProfile {
  name: string;
  slug: string;
  ownerName: string;
  whatsappNumber: string;
  city: string;
  iban: string;
  bankName: string;
  dailyCapacity: number;
  defaultDepositPercent: number;
  instagramHandle: string;
  pickupAddress: string;
}

export type ExpenseCategory =
  | "مشتريات خامات"
  | "تغليف"
  | "إعلانات وتسويق"
  | "توصيل"
  | "هدر وتلف فعلي"
  | "تشغيل ومرافق";

export interface ExpenseEntry {
  id: string;
  date: string; // YYYY-MM-DD
  category: ExpenseCategory;
  description: string;
  amount: number;
  note?: string;
}

export interface WebhookLogEntry {
  id: string;
  timestamp: string;
  direction: "incoming" | "outgoing";
  from: string;
  body: string;
  matchedIntent: string;
  status: string;
}

export interface BaynerState {
  store: StoreProfile;
  ingredients: Ingredient[];
  recipes: RecipeProduct[];
  orders: Order[];
  blockedDates: string[];
  whatsappRules: WhatsAppRule[];
  whatsappConfig: WhatsAppCloudConfig;
  customCakeConfig: CustomCakeConfig;
  expenses: ExpenseEntry[];
  webhookLogs: WebhookLogEntry[];
}
