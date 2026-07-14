import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <section className="relative -mx-4 -my-8 flex min-h-[calc(100vh-184px)] items-center overflow-hidden bg-law-navy px-4 py-16 sm:-mx-6 sm:px-8 lg:-mx-8 lg:px-0">
      <img
        src="/legal-ai-hero.png"
        alt="Luật sư tư vấn cùng công nghệ AI"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-law-navy via-law-navy/95 to-law-navy/40" />

      <div className="relative mx-auto flex w-full max-w-7xl items-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-3xl space-y-6 text-white sm:max-w-2xl lg:max-w-xl">
          <p className="mb-5 inline-flex rounded-full border border-law-gold/40 bg-law-gold/10 px-4 py-2 text-sm font-medium text-law-gold">
            Văn phòng Luật • Tư vấn hỗ trợ bởi AI
          </p>
          <h1 className="font-sans text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
            Hiểu vấn đề pháp lý,
            <span className="block text-law-gold">vững bước cùng bạn.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-white/85 sm:text-lg">
            Nhận định hướng pháp lý ban đầu nhanh chóng, rõ ràng và riêng tư.
            Khi cần, chúng tôi kết nối bạn với luật sư phù hợp để tư vấn chuyên sâu.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Link to="/tu-van" className="btn-primary inline-flex items-center justify-center px-6 py-3 text-base text-center">
              Bắt đầu tư vấn
            </Link>
            <Link
              to="/dang-ky-luat-su"
              className="inline-flex items-center justify-center rounded-lg border border-law-gold/40 bg-law-gold/10 px-6 py-3 text-base font-medium text-law-gold transition hover:bg-law-gold/15"
            >
              Đăng ký luật sư
            </Link>
          </div>

          <div className="mt-10 grid gap-3 text-sm text-white/75 sm:grid-cols-3">
            <span className="inline-flex items-center gap-2">✓ Dễ hiểu</span>
            <span className="inline-flex items-center gap-2">✓ Bảo mật thông tin</span>
            <span className="inline-flex items-center gap-2">✓ Kết nối luật sư khi cần</span>
          </div>
        </div>
      </div>
    </section>
  );
}