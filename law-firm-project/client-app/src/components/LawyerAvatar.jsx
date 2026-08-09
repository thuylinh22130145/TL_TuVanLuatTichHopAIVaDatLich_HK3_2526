import { useEffect, useState } from 'react';

function initials(name) {
  const parts = String(name || 'Luật sư').trim().split(/\s+/).filter(Boolean);
  return parts.slice(-2).map((part) => part[0]).join('').toUpperCase() || 'LS';
}

export default function LawyerAvatar({ lawyer, className = '', imageClassName = '' }) {
  const name = lawyer?.name || lawyer?.full_name || 'Luật sư';
  const source = lawyer?.avatar || lawyer?.avatar_url || null;
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [source]);

  return (
    <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-law-navy/10 font-serif font-semibold text-law-navy ${className}`}>
      {source && !failed ? (
        <img
          src={source}
          alt={`Ảnh đại diện của ${name}`}
          className={`h-full w-full object-cover ${imageClassName}`}
          onError={() => setFailed(true)}
        />
      ) : (
        <span aria-label={`Chưa có ảnh đại diện của ${name}`}>{initials(name)}</span>
      )}
    </div>
  );
}
