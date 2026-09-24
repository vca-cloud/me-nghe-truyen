import { BrandName, ContactLink, InfoPage } from "@/components/info-page"

export const metadata = {
  title: "Điều khoản sử dụng",
  alternates: { canonical: "/terms" },
  description: "Điều khoản sử dụng, miễn trừ trách nhiệm và bảo vệ bản quyền (DMCA) của mê nghe truyện.",
}

export default function TermsPage() {
  return (
    <InfoPage title="Điều khoản sử dụng">
      <section className="space-y-4">
        <p className="leading-7">Chào mừng bạn đến với <BrandName />. Khi truy cập và trải nghiệm dịch vụ trên website, bạn đồng ý tuân thủ các quy định dưới đây:</p>
        <ul className="list-disc space-y-3 pl-5 leading-7">
          <li><strong>Quyền sử dụng:</strong> Website cung cấp nội dung audio miễn phí cho mục đích giải trí cá nhân. Nghiêm cấm mọi hành vi sao chép, thương mại hóa hoặc tự ý phân phối lại nội dung khi chưa có sự chấp thuận.</li>
          <li><strong>Quy tắc ứng xử:</strong> Không sử dụng website vào các mục đích phi pháp, phát tán phần mềm độc hại, can thiệp vào hệ thống hoặc xâm phạm quyền lợi của người dùng khác.</li>
          <li><strong>Bảo mật tài khoản:</strong> Bạn có trách nhiệm tự bảo vệ thông tin đăng nhập và chịu trách nhiệm cho các hoạt động phát sinh từ tài khoản của mình.</li>
          <li><strong>Liên kết thứ ba:</strong> Website có thể chứa quảng cáo hoặc đường dẫn đến các trang web khác. Chúng tôi không kiểm soát và không chịu trách nhiệm về nội dung hay chính sách bảo mật của các bên này.</li>
          <li><strong>Giới hạn trách nhiệm:</strong> Dịch vụ được vận hành trên nguyên tắc “sẵn có”. Chúng tôi không bảo đảm hệ thống hoạt động hoàn toàn không ngắt quãng và không chịu trách nhiệm đối với các rủi ro, thiệt hại phát sinh từ việc sử dụng website.</li>
          <li><strong>Thay đổi điều khoản:</strong> Quy định này có thể được điều chỉnh bất kỳ lúc nào và có hiệu lực ngay khi công bố trên website.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Miễn trừ trách nhiệm</h2>
        <p className="leading-7">Các nội dung nghe trên website chỉ mang tính chất giải trí. Chúng tôi có sử dụng A.I (có bản quyền thương mại) để hỗ trợ sáng tác, tạo dựng audio/video.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Bảo vệ bản quyền (DMCA)</h2>
        <p className="leading-7">Chúng tôi tôn trọng quyền sở hữu trí tuệ của các tác giả và chủ sở hữu. Nhưng trong quá trình AI hỗ trợ sáng tạo, có thể vô tình trùng lặp ý tưởng. Nếu phát hiện bất kỳ nội dung nào trên <BrandName /> xâm phạm bản quyền của bạn, vui lòng gửi thông báo qua email tại <ContactLink />, kèm:</p>
        <ul className="list-disc space-y-3 pl-5 leading-7">
          <li>Thông tin liên lạc của chủ sở hữu hoặc đại diện hợp pháp.</li>
          <li>Mô tả tác phẩm và liên kết (URL) chính xác của nội dung vi phạm trên website.</li>
          <li>Bằng chứng chứng minh quyền sở hữu hợp pháp.</li>
        </ul>
        <p className="leading-7">Ngay khi tiếp nhận thông tin hợp lệ, chúng tôi sẽ kiểm tra và tiến hành xử lý/gỡ bỏ nội dung trong vòng 48 đến 72 giờ làm việc.</p>
      </section>
    </InfoPage>
  )
}
