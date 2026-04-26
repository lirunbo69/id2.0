'use client';

import { useEffect, useMemo, useState } from 'react';

type CoverImageUploadFieldProps = {
  existingCoverUrl?: string | null;
};

type UsageGuideImagesUploadFieldProps = {
  existingUsageGuide?: string | null;
};

function extractMarkdownImageUrls(markdown: string | null | undefined) {
  if (!markdown) return [];
  const matches = markdown.match(/!\[[^\]]*\]\(([^)]+)\)/g) || [];
  return matches
    .map((item) => {
      const result = item.match(/!\[[^\]]*\]\(([^)]+)\)/);
      return result?.[1]?.trim() || '';
    })
    .filter(Boolean);
}

export function CoverImageUploadField({ existingCoverUrl }: CoverImageUploadFieldProps) {
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (coverPreview) {
        URL.revokeObjectURL(coverPreview);
      }
    };
  }, [coverPreview]);

  const displayUrl = coverPreview || existingCoverUrl || '';

  return (
    <label style={{ display: 'grid', gap: 8 }}>
      <span>封面图片（仅上传）</span>
      <input
        name="coverFile"
        type="file"
        accept="image/*"
        style={inputStyle}
        onChange={(e) => {
          const file = e.currentTarget.files?.[0];
          if (!file) return;
          setCoverPreview((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return URL.createObjectURL(file);
          });
        }}
      />
      {displayUrl ? (
        <img src={displayUrl} alt="封面预览" style={previewStyle} />
      ) : (
        <div style={placeholderStyle}>未上传封面图</div>
      )}
    </label>
  );
}

export function UsageGuideImagesUploadField({ existingUsageGuide }: UsageGuideImagesUploadFieldProps) {
  const existingUrls = useMemo(() => extractMarkdownImageUrls(existingUsageGuide), [existingUsageGuide]);
  const [usagePreviews, setUsagePreviews] = useState<string[]>([]);

  useEffect(() => {
    return () => {
      usagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [usagePreviews]);

  const displayUrls = usagePreviews.length ? usagePreviews : existingUrls;

  return (
    <label style={{ display: 'grid', gap: 8 }}>
      <span>使用说明图片（仅上传）</span>
      <input
        name="usageGuideImages"
        type="file"
        accept="image/*"
        multiple
        style={inputStyle}
        onChange={(e) => {
          const files = Array.from(e.currentTarget.files || []);
          setUsagePreviews((prev) => {
            prev.forEach((url) => URL.revokeObjectURL(url));
            return files.map((file) => URL.createObjectURL(file));
          });
        }}
      />
      {displayUrls.length ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
          {displayUrls.map((url, index) => (
            <img key={`${url}-${index}`} src={url} alt={`使用说明图片${index + 1}`} style={usagePreviewStyle} />
          ))}
        </div>
      ) : (
        <div style={placeholderStyle}>未上传使用说明图片</div>
      )}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 12,
  border: '1px solid rgba(148,163,184,.16)',
  background: 'rgba(255,255,255,.03)',
  color: 'var(--foreground)',
};

const previewStyle: React.CSSProperties = {
  width: '100%',
  maxHeight: 220,
  objectFit: 'contain',
  borderRadius: 12,
  border: '1px solid rgba(148,163,184,.16)',
  background: 'transparent',
};

const usagePreviewStyle: React.CSSProperties = {
  width: '100%',
  height: 120,
  objectFit: 'cover',
  borderRadius: 10,
  border: '1px solid rgba(148,163,184,.16)',
  background: 'transparent',
};

const placeholderStyle: React.CSSProperties = {
  padding: 12,
  borderRadius: 10,
  border: '1px dashed rgba(148,163,184,.3)',
  color: 'var(--muted)',
  fontSize: 13,
};
