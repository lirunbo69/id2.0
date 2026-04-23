import { getPublicShopData } from '@/app/shop-actions';
import ShopPageClient from './ShopPageClient';

type ShopPageProps = {
  params: Promise<{ shopCode: string }>;
  searchParams: Promise<{ category?: string }>;
};

export default async function ShopPage({ params, searchParams }: ShopPageProps) {
  const { shopCode } = await params;
  const { category } = await searchParams;
  const result = await getPublicShopData(shopCode);

  if (!result.ok) {
    return (
      <main style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px 80px' }}>
        <section style={{ padding: 24, borderRadius: 20, border: '1px solid rgba(148,163,184,.14)', background: '#fff' }}>
          <h1 style={{ marginTop: 0, color: '#0f172a' }}>店铺不存在</h1>
          <p style={{ color: '#f87171' }}>{result.message}</p>
        </section>
      </main>
    );
  }

  return (
    <ShopPageClient
      shop={result.shop}
      categories={result.categories}
      products={result.products}
      shopCode={shopCode}
      activeCategory={category || null}
    />
  );
}
