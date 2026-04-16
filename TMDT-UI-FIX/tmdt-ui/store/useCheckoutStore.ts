import { create } from 'zustand';

interface CheckoutState {
  shippingMethod: string;
  paymentMethod: string;
  appliedVoucher: { code: string; discount: number } | null;
  shippingFee: number;
  
  setShippingMethod: (method: string, fee: number) => void;
  setPaymentMethod: (method: string) => void;
  applyVoucher: (code: string, discount: number) => void;
  removeVoucher: () => void;
  reset: () => void;
}

export const useCheckoutStore = create<CheckoutState>((set) => ({
  shippingMethod: 'GHN',
  paymentMethod: 'VNPAY',
  appliedVoucher: null,
  shippingFee: 35000, // Default fee

  setShippingMethod: (method, fee) => set({ shippingMethod: method, shippingFee: fee }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  applyVoucher: (code, discount) => set({ appliedVoucher: { code, discount } }),
  removeVoucher: () => set({ appliedVoucher: null }),
  
  reset: () => set({
    shippingMethod: 'GHN',
    paymentMethod: 'VNPAY',
    appliedVoucher: null,
    shippingFee: 35000
  }),
}));