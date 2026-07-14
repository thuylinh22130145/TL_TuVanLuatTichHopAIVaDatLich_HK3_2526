export default function AdminSectionPage({ eyebrow, title, description, children }) {
  return (
    <div>
      <p className='text-sm font-medium text-law-gold'>{eyebrow}</p>
      <h1 className='mt-1 font-serif text-3xl font-bold text-law-navy'>{title}</h1>
      {description && <p className='mt-2 text-sm text-slate-500'>{description}</p>}
      <div className='mt-6'>{children}</div>
    </div>
  );
}
