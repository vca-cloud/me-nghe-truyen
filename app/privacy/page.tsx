import { BrandName, ContactLink, InfoPage } from "@/components/info-page"

export const metadata = {
  title: "Chính sách bảo mật | mê nghe truyện",
  description: "Cách mê nghe truyện thu thập, sử dụng và bảo vệ thông tin của người dùng.",
}

export default function PrivacyPage() {
  return (
    <InfoPage title="Chính sách bảo mật">
      <section className="space-y-4">
        <p className="leading-7"><BrandName /> cam kết tôn trọng và bảo vệ thông tin riêng tư của người dùng.</p>
        <ul className="list-disc space-y-3 pl-5 leading-7">
          <li><strong>Thu thập dữ liệu:</strong> Thông tin đăng ký gồm email và tên tài khoản khi bạn chủ động đăng ký. Dữ liệu tự động gồm địa chỉ IP, loại thiết bị, trình duyệt, lịch sử nghe và thao tác trên trang thông qua Cookie và công cụ đo lường.</li>
          <li><strong>Mục đích sử dụng:</strong> Duy trì vận hành, tối ưu trải nghiệm cá nhân, phân tích lưu lượng truy cập và hiển thị quảng cáo phù hợp để duy trì nền tảng miễn phí.</li>
          <li><strong>Quảng cáo Google AdSense &amp; Bên thứ ba:</strong> Google và các đối tác sử dụng Cookie để phân phối quảng cáo dựa trên lịch sử truy cập của bạn. Bạn có thể tùy chỉnh hoặc tắt quảng cáo cá nhân hóa tại Cài đặt quảng cáo của Google hoặc truy cập <a className="underline underline-offset-4 hover:text-primary" href="https://www.aboutads.info/choices">www.aboutads.info/choices</a>. Tìm hiểu cách Google xử lý dữ liệu tại <a className="underline underline-offset-4 hover:text-primary" href="https://policies.google.com/technologies/partner-sites">policies.google.com/technologies/partner-sites</a>.</li>
          <li><strong>Chia sẻ dữ liệu:</strong> Chúng tôi không kinh doanh thông tin cá nhân. Dữ liệu chỉ được chia sẻ cho các đối tác hạ tầng, đối tác quảng cáo hoặc khi có yêu cầu hợp pháp từ cơ quan chức năng.</li>
          <li><strong>Quyền lợi &amp; Yêu cầu:</strong> Bạn có quyền yêu cầu trích xuất, chỉnh sửa hoặc xóa dữ liệu cá nhân bất kỳ lúc nào bằng cách liên hệ qua email tại <ContactLink />.</li>
        </ul>
      </section>
    </InfoPage>
  )
}
