import { Platform } from 'react-native';
import {
  initConnection,
  endConnection,
  getSubscriptions,
  requestPurchase,
  purchaseUpdatedListener,
  purchaseErrorListener,
  finishTransaction,
  type ProductPurchase,
  type SubscriptionPurchase,
  type PurchaseError,
} from 'react-native-iap';
import { supabase } from '../auth/supabase';

// Apple App Store Connect'te tanımlayacağın product ID
export const SUBSCRIPTION_PRODUCT_ID = 'com.thecook.app.premium.monthly';

const subscriptionSkus = [SUBSCRIPTION_PRODUCT_ID];

/** IAP bağlantısını başlat */
export async function initIAP(): Promise<void> {
  try {
    const result = await initConnection();
    console.log('IAP init success:', result);
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
export async function fetchSubscriptions() {
  try {
    console.log('Fetching subscriptions for SKUs:', subscriptionSkus);
    const subs = await getSubscriptions({ skus: subscriptionSkus });
    console.log('Subscriptions fetched:', JSON.stringify(subs));
    return subs;
  } catch (err) {
    console.warn('Failed to fetch subscriptions:', err);
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

/** Receipt'i backend'e gönderip doğrulat */
export async function verifyReceipt(
  receipt: string,
  productId: string
): Promise<{ valid: boolean; status: string; expiresAt: string | null }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const { data, error } = await supabase.functions.invoke('verify-receipt', {
    body: {
      receipt,
      platform: Platform.OS as 'ios' | 'android',
      productId,
    },
  });

  if (error) throw error;
  return data;
}

/** Purchase listener'ları kur — başarılı satın almada receipt doğrula */
export function setupPurchaseListeners(
  onSuccess: (isPremium: boolean) => void,
  onError: (error: string) => void
): () => void {
  const purchaseListener = purchaseUpdatedListener(
    async (purchase: ProductPurchase | SubscriptionPurchase) => {
      const receipt = purchase.transactionReceipt;
      if (!receipt) return;

      try {
        const result = await verifyReceipt(receipt, purchase.productId);
        await finishTransaction({ purchase, isConsumable: false });
        onSuccess(result.valid);
      } catch (err) {
        onError(err instanceof Error ? err.message : 'Doğrulama başarısız');
      }
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

/** Kullanıcının mevcut abonelik durumunu Supabase'den al */
export async function getSubscriptionStatus(): Promise<{
  isPremium: boolean;
  expiresAt: string | null;
}> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { isPremium: false, expiresAt: null };

  const { data } = await supabase
    .from('subscriptions')
    .select('status, expires_at')
    .eq('user_id', session.user.id)
    .single();

  if (!data) return { isPremium: false, expiresAt: null };

  return {
    isPremium: data.status === 'active',
    expiresAt: data.expires_at,
  };
}
