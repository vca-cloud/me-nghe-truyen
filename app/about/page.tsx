import { BrandName, InfoPage } from "@/components/info-page"

export const metadata = {
  title: "Giới thiệu",
  alternates: { canonical: "/about" },
  description: "Tiện ích giải trí, sứ mệnh và tầm nhìn của mê nghe truyện.",
}

export default function AboutPage() {
  return (
    <InfoPage title={<>Giới thiệu <BrandName /></>}>

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
        <p className="leading-7">Thực hiện hệ thống nghe - nhìn về các thể loại truyện tranh và truyện chữ.</p>
      </section>
    </InfoPage>
  )
}
