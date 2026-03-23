import { Platform } from 'react-native';
import {
  initConnection,
  endConnection,
  fetchProducts,
  requestPurchase,
  purchaseUpdatedListener,
  purchaseErrorListener,
  finishTransaction,
  getPendingTransactionsIOS,
  getActiveSubscriptions,
  type Purchase,
  type PurchaseError,
} from 'react-native-iap';

export const SUBSCRIPTION_PRODUCT_ID = 'com.thecook.app.premium.monthly';

/** IAP bağlantısını başlat ve bekleyen transaction'ları temizle */
export async function initIAP(): Promise<void> {
  try {
    const result = await initConnection();
    console.log('IAP init success:', result);

    if (Platform.OS === 'ios') {
      try {
        const pending = await getPendingTransactionsIOS();
        console.log('Pending transactions:', pending.length);
        for (const p of pending) {
          await finishTransaction({ purchase: p, isConsumable: false });
        }
      } catch (e) {
        console.warn('Could not clear pending transactions:', e);
      }
    }
  } catch (err) {
    console.warn('IAP init failed:', err);
    throw err;
  }
}

/** IAP bağlantısını kapat */
export async function closeIAP(): Promise<void> {
  try {
    await endConnection();
  } catch (err) {
    console.warn('IAP end failed:', err);
  }
}

/** Mevcut abonelik ürünlerini getir */
export async function fetchSubscriptionProducts() {
  try {
    const products = await fetchProducts({
      skus: [SUBSCRIPTION_PRODUCT_ID],
      type: 'subs',
    });
    return products;
  } catch (err) {
    console.warn('Failed to fetch products:', err);
    return [];
  }
}

/** Abonelik satın alma başlat */
export async function purchaseSubscription(): Promise<void> {
  try {
    await requestPurchase({
      type: 'subs',
      request: {
        apple: { sku: SUBSCRIPTION_PRODUCT_ID },
      },
    });
  } catch (err) {
    console.warn('Purchase failed:', err);
    throw err;
  }
}

/** Purchase listener'ları kur */
export function setupPurchaseListeners(
  onPurchaseComplete: () => void,
  onError: (error: string) => void
): () => void {
  const purchaseListener = purchaseUpdatedListener(
    async (purchase: Purchase) => {
      console.log('purchaseUpdatedListener fired:', purchase.transactionId);
      try {
        await finishTransaction({ purchase, isConsumable: false });
      } catch (err) {
        console.warn('finishTransaction error:', err);
      }
      // Notify caller that a purchase completed — caller should re-check
      // subscription status via checkSubscriptionStatus() instead of
      // blindly setting isPremium=true
      onPurchaseComplete();
    }
  );

  const errorListener = purchaseErrorListener((error: PurchaseError) => {
    if (error.code !== 'E_USER_CANCELLED') {
      onError(error.message ?? 'Satın alma hatası');
    }
  });

  return () => {
    purchaseListener.remove();
    errorListener.remove();
  };
}

/**
 * Apple StoreKit'ten aktif abonelik durumunu kontrol et.
 * Supabase'e bağımlı değil — doğrudan cihazdan sorgular.
 */
export async function checkSubscriptionStatus(): Promise<{
  isPremium: boolean;
  expiresAt: string | null;
}> {
  try {
    const activeSubs = await getActiveSubscriptions([SUBSCRIPTION_PRODUCT_ID]);
    console.log('Active subscriptions:', JSON.stringify(activeSubs));

    const sub = activeSubs.find(s => s.productId === SUBSCRIPTION_PRODUCT_ID);
    if (sub && sub.isActive) {
      const expiresAt = sub.expirationDateIOS
        ? new Date(sub.expirationDateIOS * 1000).toISOString()
        : null;
      return { isPremium: true, expiresAt };
    }

    return { isPremium: false, expiresAt: null };
  } catch (err) {
    console.warn('checkSubscriptionStatus error:', err);
    return { isPremium: false, expiresAt: null };
  }
}
