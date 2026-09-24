import { CONTACT_EMAIL, InfoPage } from "@/components/info-page"

export const metadata = {
  title: "Liên hệ",
  alternates: { canonical: "/contact" },
  description: "Liên hệ đội ngũ hỗ trợ mê nghe truyện qua email.",
}

export default function ContactPage() {
  return (
    <InfoPage title="Liên hệ">
      <section className="space-y-3">
        <p className="leading-7">
          Email:{" "}
          <a className="font-medium underline underline-offset-4 hover:text-primary" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
        </p>
        <p className="leading-7">Mọi câu hỏi, góp ý hoặc thông báo xâm phạm bản quyền vui lòng gửi về email trên.</p>
        <p className="leading-7">Chúng tôi rất hy vọng nhận được sự góp ý từ các bạn để có thể phát triển hơn trong tương lai.</p>
      </section>
    </InfoPage>
  )
}
