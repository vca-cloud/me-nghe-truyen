# Tài liệu cũ — không dùng cho cấu hình hiện tại

Tài liệu này được giữ lại để tham chiếu lịch sử nhưng **không còn phản ánh repository hiện tại**.

- Supabase client hiện dùng các biến môi trường `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY`; không hard-code URL hoặc key trong source/tài liệu.
- Repository hiện không có `lib/r2.ts`, không dùng `uploadToR2()` và `package.json` không cài AWS SDK cho upload trực tiếp.
- Admin audio hiện nhập URL công khai của audio/cover; chưa upload file trực tiếp lên Cloudflare R2.
- Không copy các đoạn mã hoặc giá trị credential từ file này vào ứng dụng.

Xem [README.md](README.md) để biết cấu hình hiện tại, bao gồm domain production, `NEXT_PUBLIC_SITE_URL`, Supabase Auth redirect và các biến môi trường hợp lệ.
