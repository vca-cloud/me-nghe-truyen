import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export const metadata = {
  title: "Read me | Mê nghe truyện",
  description: "Thông tin, điều khoản sử dụng, chính sách bảo mật và bản quyền của Mê nghe truyện.",
}

const contactEmail = "venturecreativeagency@gmail.com"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto w-full max-w-4xl px-4 py-10 md:px-8">
        <article className="space-y-10 text-foreground">
          <header className="space-y-4">
            <h1 className="text-3xl font-bold tracking-tight text-[#EE4D2D]">MÊ NGHE TRUYỆN</h1>
            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">Tiện ích giải trí</h2>
              <ul className="list-disc space-y-2 pl-5 leading-7">
                <li>Có thể chọn thể loại để có thể lựa chọn nhiều thể loại cùng lúc.</li>
                <li>Điều chỉnh tốc độ theo ý muốn, danh sách dễ sử dụng.</li>
                <li>Giao diện đơn giản, sang trọng, điểm nhấn bắt mắt.</li>
                <li>Nhấp vào là nghe. Hoàn toàn không thu phí nghe audio.</li>
              </ul>
            </section>
          </header>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">Sứ mệnh</h2>
            <p className="leading-7">Tạo ra những giây phút thư giãn tuyệt vời.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">Tầm nhìn</h2>
            <p className="leading-7">Thực hiện hệ thống nghe - nhìn về các thể loại truyện tranh và truyện chữ.</p>
          </section>

          <p className="leading-7">
            Khi sử dụng dịch vụ của chúng tôi để trải nghiệm video, mặc định bạn sẽ đồng ý với điều khoản và chính sách của chúng tôi như sau:
          </p>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">ĐIỀU KHOẢN SỬ DỤNG</h2>
            <p className="leading-7">Chào mừng bạn đến với Mê Nghe Truyện. Khi truy cập và trải nghiệm dịch vụ trên website, bạn đồng ý tuân thủ các quy định dưới đây:</p>
            <ul className="list-disc space-y-3 pl-5 leading-7">
              <li><strong>Quyền sử dụng:</strong> Website cung cấp nội dung audio miễn phí cho mục đích giải trí cá nhân. Nghiêm cấm mọi hành vi sao chép, thương mại hóa hoặc tự ý phân phối lại nội dung khi chưa có sự chấp thuận.</li>
              <li><strong>Quy tắc ứng xử:</strong> Không sử dụng website vào các mục đích phi pháp, phát tán phần mềm độc hại, can thiệp vào hệ thống hoặc xâm phạm quyền lợi của người dùng khác.</li>
              <li><strong>Bảo mật tài khoản:</strong> Bạn có trách nhiệm tự bảo vệ thông tin đăng nhập và chịu trách nhiệm cho các hoạt động phát sinh từ tài khoản của mình.</li>
              <li><strong>Liên kết thứ ba:</strong> Website có thể chứa quảng cáo hoặc đường dẫn đến các trang web khác. Chúng tôi không kiểm soát và không chịu trách nhiệm về nội dung hay chính sách bảo mật của các bên này.</li>
              <li><strong>Giới hạn trách nhiệm:</strong> Dịch vụ được vận hành trên nguyên tắc “sẵn có”. Chúng tôi không bảo đảm hệ thống hoạt động hoàn toàn không ngắt quãng và không chịu trách nhiệm đối với các rủi ro, thiệt hại phát sinh từ việc sử dụng website.</li>
              <li><strong>Thay đổi điều khoản:</strong> Quy định này có thể được điều chỉnh bất kỳ lúc nào và có hiệu lực ngay khi công bố trên website.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">CHÍNH SÁCH BẢO MẬT</h2>
            <p className="leading-7">Mê Nghe Truyện cam kết tôn trọng và bảo vệ thông tin riêng tư của người dùng.</p>
            <ul className="list-disc space-y-3 pl-5 leading-7">
              <li><strong>Thu thập dữ liệu:</strong> Thông tin đăng ký gồm email và tên tài khoản khi bạn chủ động đăng ký. Dữ liệu tự động gồm địa chỉ IP, loại thiết bị, trình duyệt, lịch sử nghe và thao tác trên trang thông qua Cookie và công cụ đo lường.</li>
              <li><strong>Mục đích sử dụng:</strong> Duy trì vận hành, tối ưu trải nghiệm cá nhân, phân tích lưu lượng truy cập và hiển thị quảng cáo phù hợp để duy trì nền tảng miễn phí.</li>
              <li><strong>Quảng cáo Google AdSense &amp; Bên thứ ba:</strong> Google và các đối tác sử dụng Cookie để phân phối quảng cáo dựa trên lịch sử truy cập của bạn. Bạn có thể tùy chỉnh hoặc tắt quảng cáo cá nhân hóa tại Cài đặt quảng cáo của Google hoặc truy cập <a className="underline underline-offset-4 hover:text-primary" href="https://www.aboutads.info/choices">www.aboutads.info/choices</a>. Tìm hiểu cách Google xử lý dữ liệu tại <a className="underline underline-offset-4 hover:text-primary" href="https://policies.google.com/technologies/partner-sites">policies.google.com/technologies/partner-sites</a>.</li>
              <li><strong>Chia sẻ dữ liệu:</strong> Chúng tôi không kinh doanh thông tin cá nhân. Dữ liệu chỉ được chia sẻ cho các đối tác hạ tầng, đối tác quảng cáo hoặc khi có yêu cầu hợp pháp từ cơ quan chức năng.</li>
              <li><strong>Quyền lợi &amp; Yêu cầu:</strong> Bạn có quyền yêu cầu trích xuất, chỉnh sửa hoặc xóa dữ liệu cá nhân bất kỳ lúc nào bằng cách liên hệ qua email của Mê Nghe Truyện ở bên dưới.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">MIỄN TRỪ TRÁCH NHIỆM &amp; BẢN QUYỀN</h2>
            <h3 className="text-xl font-semibold">Miễn trừ trách nhiệm</h3>
            <p className="leading-7">Các nội dung nghe trên website chỉ mang tính chất giải trí. Chúng tôi có sử dụng A.I (có bản quyền thương mại) để hỗ trợ sáng tác, tạo dựng audio/video.</p>
            <h3 className="text-xl font-semibold">Bảo vệ bản quyền (DMCA)</h3>
            <p className="leading-7">Chúng tôi tôn trọng quyền sở hữu trí tuệ của các tác giả và chủ sở hữu. Nhưng trong quá trình AI hỗ trợ sáng tạo, có thể vô tình trùng lặp ý tưởng. Nếu phát hiện bất kỳ nội dung nào trên Mê Nghe Truyện xâm phạm bản quyền của bạn, vui lòng gửi thông báo đến email của Mê Nghe Truyện ở bên dưới, kèm:</p>
            <ul className="list-disc space-y-3 pl-5 leading-7">
              <li>Thông tin liên lạc của chủ sở hữu hoặc đại diện hợp pháp.</li>
              <li>Mô tả tác phẩm và liên kết (URL) chính xác của nội dung vi phạm trên website.</li>
              <li>Bằng chứng chứng minh quyền sở hữu hợp pháp.</li>
            </ul>
            <p className="leading-7">Ngay khi tiếp nhận thông tin hợp lệ, chúng tôi sẽ kiểm tra và tiến hành xử lý/gỡ bỏ nội dung trong vòng 48 đến 72 giờ làm việc.</p>
          </section>

          <section className="space-y-3 border-t pt-6">
            <p className="leading-7">Mọi câu hỏi hoặc góp ý, xâm phạm bản quyền vui lòng gửi email đến: <a className="font-medium underline underline-offset-4 hover:text-primary" href={`mailto:${contactEmail}`}>{contactEmail}</a>.</p>
            <p className="leading-7">Chúng tôi rất hy vọng nhận được sự góp ý từ các bạn để có thể phát triển hơn trong tương lai.</p>
          </section>
        </article>
      </main>
      <Footer />
    </div>
  )
}
