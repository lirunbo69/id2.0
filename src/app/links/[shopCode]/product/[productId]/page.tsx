import { getPublicProductDetail } from '@/app/shop-actions';

import ProductPageClient from './ProductPageClient';

type ProductPageProps = {
  params: Promise<{ shopCode: string; productId: string }>;
};

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { shopCode, productId } = await params;
  const result = await getPublicProductDetail(shopCode, productId);

  if (!result.ok) {
    return <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 80px' }}><section style={cardStyle}><h1 style={{ marginTop: 0 }}>商品不存在</h1><p style={{ color: '#fca5a5' }}>{result.message}</p></section></main>;
  }

  const { shop, product } = result;

  return (
    <ProductPageClient
      shopCode={shop.shop_code}
      shopName={shop.name}
      product={product}
    />
  );
}

const cardStyle: React.CSSProperties = { padding: 28, borderRadius: 24, border: '1px solid var(--border)', background: 'var(--card)' };
