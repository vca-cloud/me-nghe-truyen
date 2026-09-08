import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export const metadata = {
  title: "Về chúng tôi | mê nghe truyện",
  description: "Giới thiệu nền tảng mê nghe truyện — nghe audio miễn phí, đơn giản, tiện dụng.",
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto w-full max-w-3xl px-4 py-10 md:px-8">
        <article className="space-y-8 text-foreground">
          <header className="space-y-3">
            <h1 className="text-3xl font-bold tracking-tight">Về mê nghe truyện</h1>
            <p className="text-base leading-7">
              mê nghe truyện là nền tảng nghe audio trực tuyến miễn phí, đơn giản, tiện dụng, không cần đăng nhập.
            </p>
          </header>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">Tiện ích giải trí</h2>
            <ul className="list-disc space-y-2 pl-5 leading-7">
              <li>Có thể chọn thể loại để có thể lựa chọn nhiều thể loại cùng lúc.</li>
              <li>Điều chỉnh tốc độ theo ý muốn, danh sách dễ sử dụng.</li>
              <li>Giao diện đơn giản, sang trọng, điểm nhấn bắt mắt.</li>
              <li>Nhấp vào là nghe. Hoàn toàn không thu phí nghe audio.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">Sứ mệnh</h2>
            <p className="leading-7">Tạo ra những giây phút thư giãn tuyệt vời.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">Tầm nhìn</h2>
            <p className="leading-7">
              Thực hiện hệ thống nghe - nhìn về các thể loại truyện tranh và truyện chữ.
            </p>
          </section>

          <section className="space-y-3">
            <p className="leading-7">
              Mọi câu hỏi hoặc góp ý, vui lòng gửi email đến:{" "}
              <a
                href="mailto:venturecreativeagency@gmail.com"
                className="font-medium underline underline-offset-4 hover:text-primary"
              >
                venturecreativeagency@gmail.com
              </a>
              . Chúng tôi rất hy vọng nhận được sự góp ý từ các bạn để có thể phát triển hơn trong tương lai.
            </p>
            <p className="leading-7">
              Khi sử dụng dịch vụ của chúng tôi để trải nghiệm video, mặc định bạn sẽ đồng ý với{" "}
              <a href="/privacy" className="font-medium underline underline-offset-4 hover:text-primary">
                chính sách bảo mật
              </a>{" "}
              của chúng tôi.
            </p>
          </section>
        </article>
      </main>
      <Footer />
    </div>
  )
}
