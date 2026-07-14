export default function Footer() {
  return (
    <footer className="mt-auto border-t border-law-navy/10 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8 text-center text-sm text-law-slate">
        <p className="font-serif text-law-navy">Văn phòng Luật — Tư vấn AI</p>
        <p className="mt-2">
          Nội dung AI chỉ mang tính tham khảo, không thay thế tư vấn pháp lý chính thức.
        </p>
        <p className="mt-1 text-xs">© {new Date().getFullYear()} — Mọi quyền được bảo lưu</p>
      </div>
    </footer>
  );
}