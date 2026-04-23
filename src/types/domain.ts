export type Role = 'buyer' | 'merchant' | 'merchant_staff' | 'admin' | 'super_admin';

export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'delivering'
  | 'delivered'
  | 'delivery_failed'
  | 'refund_pending'
  | 'refunded'
  | 'closed'
  | 'risk_review';

export type DeliveryType = 'card_key' | 'account_password' | 'link' | 'custom_text' | 'manual';
