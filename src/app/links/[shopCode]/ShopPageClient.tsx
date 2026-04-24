'use client';

import Link from 'next/link';
import { useMemo, useState, useRef, useEffect } from 'react';

type Shop = {
  id: string;
  shop_code: string;
  name: string;
  intro: string | null;
  announcement: string | null;
  contact_qq: string | null;
  contact_wechat: string | null;
  contact_telegram: string | null;
  customer_service_url: string | null;
  is_open: boolean;
  status: string;
  rating: number;
  order_count: number;
  logo_url: string | null;
  banner_url: string | null;
};

type Category = { id: string; name: string; sort_order: number };
type Product = {
  id: string;
  name: string;
  subtitle: string | null;
  price: number;
  stock_count: number;
  sold_count: number;
  summary: string | null;
  cover_url: string | null;
  category_id: string | null;
  delivery_type: string;
  need_contact: boolean;
  need_remark: boolean;
};

type Props = {
  shop: Shop;
  categories: Category[];
  products: Product[];
  shopCode: string;
  activeCategory: string | null;
};

export default function ShopPageClient({ shop, categories, products, shopCode, activeCategory }: Props) {
  const [search, setSearch] = useState('');
  const [showContact, setShowContact] = useState(false);
  const productRefs = useRef<Record<string, HTMLAnchorElement | null>>({});

  useEffect(() => {
    const prev = document.documentElement.getAttribute('data-theme');
    document.documentElement.setAttribute('data-theme', 'light');
    return () => {
      document.documentElement.setAttribute('data-theme', prev || 'dark');
    };
  }, []);

  const filteredProducts = useMemo(() => (
    activeCategory
      ? products.filter((p) => p.category_id === activeCategory)
      : products
  ), [activeCategory, products]);

  const displayProducts = useMemo(() => (
    search.trim()
      ? filteredProducts.filter((p) =>
          p.name.toLowerCase().includes(search.trim().toLowerCase()) ||
          (p.subtitle || '').toLowerCase().includes(search.trim().toLowerCase()) ||
          (p.summary || '').toLowerCase().includes(search.trim().toLowerCase())
        )
      : filteredProducts
  ), [filteredProducts, search]);

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const keyword = search.trim().toLowerCase();
    if (!keyword) return;
    const match = filteredProducts.find(
      (p) =>
        p.name.toLowerCase().includes(keyword) ||
        (p.subtitle || '').toLowerCase().includes(keyword) ||
        (p.summary || '').toLowerCase().includes(keyword),
    );
    if (match && productRefs.current[match.id]) {
      productRefs.current[match.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  const isAuto = (t: string) => ['card_key', 'account_password', 'link', 'custom_text'].includes(t);
  const lowStock = (count: number) => count <= 5;

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: '16px 12px 80px' }}>
      <header style={headerStyle}>
        <Link href="/" style={brandStyle}>
          <span style={brandMarkStyle}>
            <span style={brandMStyle}>M</span>
            <span style={brandTStyle}>T</span>
          </span>
          <span style={{ display: 'grid', gap: 1 }}>
            <span style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>MT虚拟商品自动发货系统</span>
            <span style={{ fontSize: 11, color: '#64748b' }}>Mtgo旗下产品</span>
          </span>
        </Link>
      </header>

      <section style={shopInfoCardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: '0 0 6px', fontSize: 24, color: '#0f172a' }}>{shop.name}</h1>
            <p style={{ margin: 0, color: '#64748b', fontSize: 14, lineHeight: 1.7 }}>{shop.intro || '商家暂未填写店铺简介。'}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={statusPill(shop.is_open)}>{shop.is_open ? '营业中' : '暂停营业'}</span>
            <span style={tagPillStyle}>7×24自动发货</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
          <Link href="/order/query" style={actionBtnOutlineStyle}>查询订单</Link>
          <button type="button" onClick={() => setShowContact(!showContact)} style={actionBtnSolidStyle}>
            {showContact ? '收起客服信息' : '联系商家客服'}
          </button>
        </div>
        {showContact && (
          <div style={contactDropdownStyle}>
            <ContactRow label="QQ" value={shop.contact_qq} />
            <ContactRow label="微信" value={shop.contact_wechat} />
            <ContactRow label="Telegram" value={shop.contact_telegram} />
            {shop.customer_service_url && (
              <a href={shop.customer_service_url} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontSize: 14, marginTop: 4 }}>打开客服链接</a>
            )}
          </div>
        )}
        {shop.announcement && (
          <div style={announcementStyle}>
            <strong style={{ fontSize: 13, color: '#0f172a' }}>店铺公告</strong>
            <div style={{ color: '#475569', fontSize: 13, lineHeight: 1.7, marginTop: 4 }}>{shop.announcement}</div>
          </div>
        )}
      </section>

      <form onSubmit={handleSearch} style={searchBarStyle}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索商品..."
          style={searchInputStyle}
        />
        <button type="submit" style={searchBtnStyle}>搜索</button>
      </form>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>商品分类</h2>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href={`/links/${shopCode}`} style={catPill(!activeCategory)}>全部 ({products.length})</Link>
          {categories.map((c) => (
            <Link key={c.id} href={`/links/${shopCode}?category=${c.id}`} style={catPill(activeCategory === c.id)}>{c.name}</Link>
          ))}
        </div>
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>选择商品</h2>
        <div style={{ display: 'grid', gap: 14 }}>
          {displayProducts.length ? displayProducts.map((p) => (
            <Link
              key={p.id}
              href={`/links/${shopCode}/product/${p.id}`}
              ref={(el) => { productRefs.current[p.id] = el; }}
              style={productRowStyle}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>{p.name}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                  {isAuto(p.delivery_type) && <span style={autoTagStyle}>自动发货</span>}
                  {lowStock(p.stock_count) && <span style={lowStockTagStyle}>库存少量</span>}
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>¥{Number(p.price).toFixed(2)}</div>
              </div>
              <div style={productThumbStyle}>
                <span style={thumbLetterStyle}>{p.name.slice(0, 2)}</span>
              </div>
            </Link>
          )) : (
            <div style={{ padding: 20, color: '#64748b', textAlign: 'center' }}>
              {search.trim() ? `没有找到包含"${search.trim()}"的商品` : '当前分类下暂无商品。'}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function ContactRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: '1px solid rgba(148,163,184,.10)' }}>
      <span style={{ color: '#64748b', fontSize: 14 }}>{label}</span>
      <span style={{ color: '#0f172a', fontWeight: 700, fontSize: 14, textAlign: 'right', wordBreak: 'break-all' }}>{value || '-'}</span>
    </div>
  );
}

function statusPill(isOpen: boolean): React.CSSProperties {
  return {
    display: 'inline-flex', padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700,
    background: isOpen ? 'rgba(16,185,129,.12)' : 'rgba(148,163,184,.14)',
    color: isOpen ? '#059669' : '#64748b',
  };
}

function catPill(active: boolean): React.CSSProperties {
  return {
    display: 'inline-flex', padding: '8px 14px', borderRadius: 999, fontSize: 13, fontWeight: 700, textDecoration: 'none',
    background: active ? 'rgba(79,70,229,.10)' : '#fff',
    color: active ? '#4338ca' : '#334155',
    border: `1px solid ${active ? 'rgba(99,102,241,.18)' : 'rgba(148,163,184,.16)'}`,
  };
}

const headerStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', marginBottom: 14, padding: '8px 0' };
const brandStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' };
const brandMarkStyle: React.CSSProperties = { width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#2563eb,#4f46e5)', display: 'grid', placeItems: 'center', position: 'relative', overflow: 'hidden', boxShadow: '0 10px 22px rgba(59,130,246,.20)', flexShrink: 0 };
const brandMStyle: React.CSSProperties = { position: 'absolute', left: 7, top: 6, fontSize: 18, fontWeight: 900, color: '#fff' };
const brandTStyle: React.CSSProperties = { position: 'absolute', right: 7, bottom: 5, fontSize: 19, fontWeight: 900, color: 'rgba(255,255,255,.92)' };

const shopInfoCardStyle: React.CSSProperties = { padding: 18, borderRadius: 20, background: '#fff', border: '1px solid rgba(148,163,184,.14)', boxShadow: '0 8px 24px rgba(15,23,42,.04)', marginBottom: 14 };

const tagPillStyle: React.CSSProperties = { display: 'inline-flex', padding: '6px 12px', borderRadius: 999, background: 'rgba(59,130,246,.08)', color: '#2563eb', fontSize: 12, fontWeight: 700 };

const actionBtnOutlineStyle: React.CSSProperties = { flex: 1, textAlign: 'center', padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(148,163,184,.18)', background: '#fff', color: '#0f172a', fontWeight: 700, fontSize: 14, textDecoration: 'none', cursor: 'pointer' };
const actionBtnSolidStyle: React.CSSProperties = { flex: 1, padding: '10px 14px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#2563eb,#4f46e5)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' };

const contactDropdownStyle: React.CSSProperties = { marginTop: 12, padding: 14, borderRadius: 14, background: 'rgba(248,250,252,.95)', border: '1px solid rgba(148,163,184,.12)' };

const announcementStyle: React.CSSProperties = { marginTop: 12, padding: 12, borderRadius: 14, background: 'linear-gradient(180deg,rgba(239,246,255,.7),rgba(255,255,255,.9))', border: '1px solid rgba(147,197,253,.18)' };

const searchBarStyle: React.CSSProperties = { display: 'flex', gap: 10, marginBottom: 14 };
const searchInputStyle: React.CSSProperties = { flex: 1, padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(148,163,184,.18)', background: '#fff', color: '#0f172a', fontSize: 14 };
const searchBtnStyle: React.CSSProperties = { padding: '12px 18px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#2563eb,#4f46e5)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' };

const sectionStyle: React.CSSProperties = { marginBottom: 18 };
const sectionTitleStyle: React.CSSProperties = { margin: '0 0 12px', fontSize: 18, fontWeight: 800, color: '#0f172a', paddingLeft: 10, borderLeft: '3px solid #2563eb' };

const productRowStyle: React.CSSProperties = { display: 'flex', gap: 16, alignItems: 'center', padding: 16, borderRadius: 18, background: '#fff', border: '1px solid rgba(148,163,184,.12)', boxShadow: '0 6px 18px rgba(15,23,42,.03)', textDecoration: 'none' };
const productThumbStyle: React.CSSProperties = { width: 64, height: 64, borderRadius: 14, background: 'linear-gradient(135deg,rgba(148,163,184,.08),rgba(99,102,241,.08))', display: 'grid', placeItems: 'center', flexShrink: 0 };
const thumbLetterStyle: React.CSSProperties = { fontSize: 20, fontWeight: 800, color: '#4f46e5' };

const autoTagStyle: React.CSSProperties = { display: 'inline-flex', padding: '4px 8px', borderRadius: 6, background: 'rgba(59,130,246,.08)', color: '#2563eb', fontSize: 12, fontWeight: 700 };
const lowStockTagStyle: React.CSSProperties = { display: 'inline-flex', padding: '4px 8px', borderRadius: 6, background: 'rgba(239,68,68,.08)', color: '#ef4444', fontSize: 12, fontWeight: 700 };
