"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createInitialBaynerState } from "./seed";
import {
  BaynerState,
  CustomCakeConfig,
  ExpenseEntry,
  Ingredient,
  Order,
  OrderStatus,
  RecipeProduct,
  StoreProfile,
  WebhookLogEntry,
  WhatsAppCloudConfig,
  WhatsAppRule,
} from "./types";

const STORAGE_KEY = "bayner_state_v1";

interface BaynerContextValue {
  state: BaynerState;
  hydrated: boolean;
  addIngredient: (ing: Omit<Ingredient, "id">) => void;
  updateIngredient: (ing: Ingredient) => void;
  deleteIngredient: (id: string) => void;
  saveRecipe: (recipe: RecipeProduct) => void;
  deleteRecipe: (id: string) => void;
  toggleRecipeMenu: (id: string) => void;
  addOrder: (order: Omit<Order, "id" | "orderNumber" | "createdAt">) => Order;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  toggleDepositPaid: (id: string) => void;
  toggleBlockedDate: (isoDate: string) => void;
  updateWhatsAppRule: (rule: WhatsAppRule) => void;
  addWhatsAppRule: (rule: Omit<WhatsAppRule, "id">) => void;
  deleteWhatsAppRule: (id: string) => void;
  updateWhatsAppConfig: (patch: Partial<WhatsAppCloudConfig>) => void;
  updateStoreProfile: (patch: Partial<StoreProfile>) => void;
  updateCustomCakeConfig: (config: CustomCakeConfig) => void;
  addExpense: (expense: Omit<ExpenseEntry, "id">) => void;
  deleteExpense: (id: string) => void;
  addWebhookLog: (log: Omit<WebhookLogEntry, "id">) => void;
  clearWebhookLogs: () => void;
  exportStateJson: () => string;
  importStateJson: (rawJson: string) => boolean;
  resetDemoData: () => void;
}

const BaynerContext = createContext<BaynerContextValue | null>(null);

export function BaynerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<BaynerState>(() =>
    createInitialBaynerState()
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<BaynerState>;
        const defaults = createInitialBaynerState();
        setState({
          ...defaults,
          ...parsed,
          store: { ...defaults.store, ...(parsed.store ?? {}) },
          whatsappConfig: {
            ...defaults.whatsappConfig,
            ...(parsed.whatsappConfig ?? {}),
          },
          customCakeConfig: {
            ...defaults.customCakeConfig,
            ...(parsed.customCakeConfig ?? {}),
          },
          expenses: Array.isArray(parsed.expenses)
            ? parsed.expenses
            : defaults.expenses,
          webhookLogs: Array.isArray(parsed.webhookLogs)
            ? parsed.webhookLogs
            : defaults.webhookLogs,
        });
      }
    } catch {
      // Ignore malformed storage and keep seed state
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota issues
    }
  }, [state, hydrated]);

  const addIngredient = (ing: Omit<Ingredient, "id">) => {
    const id = `ing-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setState((prev) => ({
      ...prev,
      ingredients: [{ ...ing, id }, ...prev.ingredients],
    }));
  };

  const updateIngredient = (ing: Ingredient) => {
    setState((prev) => ({
      ...prev,
      ingredients: prev.ingredients.map((item) =>
        item.id === ing.id ? ing : item
      ),
    }));
  };

  const deleteIngredient = (id: string) => {
    setState((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((item) => item.id !== id),
      recipes: prev.recipes.map((r) => ({
        ...r,
        items: r.items.filter((it) => it.ingredientId !== id),
      })),
    }));
  };

  const saveRecipe = (recipe: RecipeProduct) => {
    setState((prev) => {
      const exists = prev.recipes.some((r) => r.id === recipe.id);
      return {
        ...prev,
        recipes: exists
          ? prev.recipes.map((r) => (r.id === recipe.id ? recipe : r))
          : [recipe, ...prev.recipes],
      };
    });
  };

  const deleteRecipe = (id: string) => {
    setState((prev) => ({
      ...prev,
      recipes: prev.recipes.filter((r) => r.id !== id),
    }));
  };

  const toggleRecipeMenu = (id: string) => {
    setState((prev) => ({
      ...prev,
      recipes: prev.recipes.map((r) =>
        r.id === id ? { ...r, publishedInMenu: !r.publishedInMenu } : r
      ),
    }));
  };

  const addOrder = (
    orderInput: Omit<Order, "id" | "orderNumber" | "createdAt">
  ): Order => {
    const nextNum = 1041 + state.orders.length + Math.floor(Math.random() * 5);
    const created: Order = {
      ...orderInput,
      id: `ord-${Date.now()}`,
      orderNumber: `BN-${nextNum}`,
      createdAt: new Date().toISOString().split("T")[0],
    };

    setState((prev) => ({
      ...prev,
      orders: [created, ...prev.orders],
    }));

    return created;
  };

  const updateOrderStatus = (id: string, status: OrderStatus) => {
    setState((prev) => ({
      ...prev,
      orders: prev.orders.map((o) => (o.id === id ? { ...o, status } : o)),
    }));
  };

  const toggleDepositPaid = (id: string) => {
    setState((prev) => ({
      ...prev,
      orders: prev.orders.map((o) => {
        if (o.id !== id) return o;
        const paid = !o.depositPaid;
        const nextStatus =
          paid && (o.status === "new" || o.status === "awaiting_deposit")
            ? "preparing"
            : o.status;
        return { ...o, depositPaid: paid, status: nextStatus };
      }),
    }));
  };

  const toggleBlockedDate = (isoDate: string) => {
    setState((prev) => {
      const exists = prev.blockedDates.includes(isoDate);
      return {
        ...prev,
        blockedDates: exists
          ? prev.blockedDates.filter((d) => d !== isoDate)
          : [...prev.blockedDates, isoDate],
      };
    });
  };

  const updateWhatsAppRule = (rule: WhatsAppRule) => {
    setState((prev) => ({
      ...prev,
      whatsappRules: prev.whatsappRules.map((r) =>
        r.id === rule.id ? rule : r
      ),
    }));
  };

  const addWhatsAppRule = (rule: Omit<WhatsAppRule, "id">) => {
    const id = `rule-${Date.now()}`;
    setState((prev) => ({
      ...prev,
      whatsappRules: [...prev.whatsappRules, { ...rule, id }],
    }));
  };

  const deleteWhatsAppRule = (id: string) => {
    setState((prev) => ({
      ...prev,
      whatsappRules: prev.whatsappRules.filter((r) => r.id !== id),
    }));
  };

  const updateWhatsAppConfig = (patch: Partial<WhatsAppCloudConfig>) => {
    setState((prev) => ({
      ...prev,
      whatsappConfig: { ...prev.whatsappConfig, ...patch },
    }));
  };

  const updateStoreProfile = (patch: Partial<StoreProfile>) => {
    setState((prev) => ({
      ...prev,
      store: { ...prev.store, ...patch },
    }));
  };

  const updateCustomCakeConfig = (customCakeConfig: CustomCakeConfig) => {
    setState((prev) => ({
      ...prev,
      customCakeConfig,
    }));
  };

  const addExpense = (expense: Omit<ExpenseEntry, "id">) => {
    const id = `exp-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    setState((prev) => ({
      ...prev,
      expenses: [{ ...expense, id }, ...prev.expenses],
    }));
  };

  const deleteExpense = (id: string) => {
    setState((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((e) => e.id !== id),
    }));
  };

  const addWebhookLog = (log: Omit<WebhookLogEntry, "id">) => {
    const id = `wh-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    setState((prev) => ({
      ...prev,
      webhookLogs: [{ ...log, id }, ...prev.webhookLogs].slice(0, 40),
    }));
  };

  const clearWebhookLogs = () => {
    setState((prev) => ({ ...prev, webhookLogs: [] }));
  };

  const exportStateJson = () => JSON.stringify(state, null, 2);

  const importStateJson = (rawJson: string): boolean => {
    try {
      const parsed = JSON.parse(rawJson) as Partial<BaynerState>;
      if (!parsed || typeof parsed !== "object" || !parsed.store) return false;
      const defaults = createInitialBaynerState();
      setState({
        ...defaults,
        ...parsed,
        store: { ...defaults.store, ...(parsed.store ?? {}) },
        whatsappConfig: {
          ...defaults.whatsappConfig,
          ...(parsed.whatsappConfig ?? {}),
        },
        customCakeConfig: {
          ...defaults.customCakeConfig,
          ...(parsed.customCakeConfig ?? {}),
        },
        expenses: Array.isArray(parsed.expenses)
          ? parsed.expenses
          : defaults.expenses,
        webhookLogs: Array.isArray(parsed.webhookLogs)
          ? parsed.webhookLogs
          : defaults.webhookLogs,
      });
      return true;
    } catch {
      return false;
    }
  };

  const resetDemoData = () => {
    const fresh = createInitialBaynerState();
    setState(fresh);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    } catch {
      // ignore
    }
  };

  return (
    <BaynerContext.Provider
      value={{
        state,
        hydrated,
        addIngredient,
        updateIngredient,
        deleteIngredient,
        saveRecipe,
        deleteRecipe,
        toggleRecipeMenu,
        addOrder,
        updateOrderStatus,
        toggleDepositPaid,
        toggleBlockedDate,
        updateWhatsAppRule,
        addWhatsAppRule,
        deleteWhatsAppRule,
        updateWhatsAppConfig,
        updateStoreProfile,
        updateCustomCakeConfig,
        addExpense,
        deleteExpense,
        addWebhookLog,
        clearWebhookLogs,
        exportStateJson,
        importStateJson,
        resetDemoData,
      }}
    >
      {children}
    </BaynerContext.Provider>
  );
}

export function useBayner(): BaynerContextValue {
  const ctx = useContext(BaynerContext);
  if (!ctx) {
    throw new Error("useBayner must be used inside BaynerProvider");
  }
  return ctx;
}
