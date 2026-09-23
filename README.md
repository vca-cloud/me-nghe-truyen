# mê nghe truyện

Ứng dụng web nghe truyện audio bằng tiếng Việt. Người dùng có thể tìm kiếm và lọc truyện, nghe từng tập từ URL công khai trên Cloudflare R2, lưu audio yêu thích và theo dõi lịch sử nghe. Dữ liệu nội dung, tài khoản và các hoạt động liên quan được lưu trên Supabase.

## Tính năng

- Trang chủ lấy truyện thật từ bảng `stories`, tìm kiếm theo tiêu đề/tác giả/thể loại/mô tả, lọc thể loại và phân trang.
- Khu **Được nghe nhiều** xếp hạng theo tổng `real_views + base_fake_views`; danh sách audio bên dưới giữ thứ tự mới nhất từ API (`id` giảm dần).
- Trang track phát audio thật, chọn tập, tua, đổi tốc độ 0.75x–2x và tự chuyển tập trước/sau.
- Modal affiliate mở liên kết Shopee trước khi phát audio; lượt mở khóa được ghi nhận qua API.
- Lượt nghe hiển thị gồm lượt thực và lượt ảo. Lượt thực tăng khi người dùng mở khóa audio; `plays` chỉ là dữ liệu legacy/fallback.
- Link **Đọc truyện chữ** dùng `stories.text_url`; nếu chưa có link thì trở về URL track hiện tại.
- Đăng nhập/đăng ký bằng email và mật khẩu hoặc Google OAuth qua Supabase Auth.
- Trang thành viên `/account`: hồ sơ, audio đã lưu và lịch sử nghe. Nút bookmark trên trang track kết nối với favorites của user hiện tại.
- Khi bắt đầu phát, player ghi lịch sử nghe; trong lúc nghe, khi tạm dừng và khi kết thúc sẽ cập nhật tiến độ. Tiến độ chưa hoàn thành được khôi phục khi mở lại tập.
- Khu quản trị riêng cho truyện/tập, import CSV/JSON, affiliate, analytics, thể loại, thành viên, staff và cài đặt.
- Giao diện light/dark theo palette thương hiệu; ảnh bìa có fallback icon Headphones.

## Công nghệ

- Next.js 16.3.4 App Router
- React 19.2.8 và TypeScript
- Tailwind CSS v4, shadcn/ui, Base UI và `lucide-react`
- Supabase JS/SSR: Postgres, Auth, RLS và session cookie
- Cloudflare R2 cho URL công khai của audio/ảnh bìa
- Sonner cho thông báo và Recharts cho analytics
- Google Analytics 4 (Google tag `G-E8PSHLWY5E`) gắn một lần trong `app/layout.tsx` qua `next/script`

## Chạy local

Yêu cầu Node.js tương thích với Next.js hiện tại và npm.

```bash
npm install
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000). Các lệnh khác:

```bash
npm run build    # build production và kiểm tra TypeScript
npm run start    # chạy bản production đã build
npm run lint     # ESLint
```

## Biến môi trường

Tạo `.env.local` ở thư mục gốc. Không commit file này và không đưa service-role key lên trình duyệt.

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_SESSION_SECRET=
NEXT_PUBLIC_R2_PUBLIC_URL=
NEXT_PUBLIC_SITE_URL=https://menghetruyen.com
```

`SUPABASE_SERVICE_ROLE_KEY` chỉ dùng ở server/API quản trị. `ADMIN_SESSION_SECRET` nên là chuỗi bí mật riêng, đủ dài; nếu bỏ trống code có fallback không phù hợp cho production. `NEXT_PUBLIC_R2_PUBLIC_URL` được dùng bởi các tiện ích tạo URL R2 nếu cần.

## Domain và deployment

Domain production chuẩn của ứng dụng là `https://menghetruyen.com`. Vercel nên được cấu hình domain này ở **Settings → Domains**, đồng thời đặt:

```bash
NEXT_PUBLIC_SITE_URL=https://menghetruyen.com
```

Sau khi deploy, dùng một origin chuẩn duy nhất cho các redirect Auth. Google/Supabase OAuth phải có các URL sau trong Supabase Dashboard → Authentication → URL Configuration:

```text
Site URL: https://menghetruyen.com
Redirect URLs:
https://menghetruyen.com/auth/callback
http://localhost:3000/auth/callback
```

Các form login/signup và redirect sau khi đăng nhập lấy origin từ `NEXT_PUBLIC_SITE_URL`, nên không redirect người dùng về URL preview Vercel. Code cũng chặn hostname Vercel preview và fallback an toàn về `https://menghetruyen.com` nếu biến môi trường bị thiếu hoặc sai. Khi chạy local, chỉ dùng origin local nếu `NEXT_PUBLIC_SITE_URL` là localhost hoặc để trống. Nếu đổi domain trong tương lai, chỉ cần cập nhật domain ở Vercel, `NEXT_PUBLIC_SITE_URL` trong Vercel Environment Variables và danh sách URL trong Supabase; không hard-code domain ở từng component.

## Supabase

Chạy toàn bộ migration trong `supabase/migrations/` theo thứ tự thời gian trên đúng project Supabase trước khi dùng production. Các migration bao gồm:

- Bảng `stories`, `episodes` và slug.
- Cột/công thức view (`real_views`, `base_fake_views`) và quyền ghi story.
- Bảng admin/staff, affiliate links và `listener_logs`.
- Cột `stories.text_url` trong `20250912_add_story_text_url.sql`.
- Bảng `favorites` và `listening_history`, index, khóa ngoại và RLS trong `20250913_create_member_account_tables.sql`.

Sau khi chạy migration, nếu Supabase báo lỗi schema cache, kiểm tra migration đã chạy trên đúng project/schema `public` và chờ PostgREST cập nhật schema. RLS của dữ liệu member chỉ cho phép user hiện tại đọc/ghi hàng có `user_id = auth.uid()`.

## Auth và OAuth

Đăng nhập thành viên ở `/login`, đăng ký ở `/signup`. Trong Supabase Dashboard, thêm callback URL cho từng origin sử dụng, tối thiểu khi chạy local:

```text
http://localhost:3000/auth/callback
```

Google OAuth quay về `/auth/callback` rồi redirect về trang chủ. Khi truy cập `/account` lúc chưa đăng nhập, ứng dụng chuyển đến `/login?next=/account`. Khi bấm lưu audio lúc chưa đăng nhập, ứng dụng chuyển về login với đường dẫn track để có thể quay lại sau đăng nhập.

## Quản trị và import

Đăng nhập quản trị tại `/admin/login`. Middleware bảo vệ các route `/admin/*` ngoại trừ trang login. Admin audio hỗ trợ CRUD truyện/tập và import CSV hoặc JSON.

CSV có thể dùng mẫu [public/mau-import-truyen.csv](public/mau-import-truyen.csv), với các cột:

```text
title,author,genre,description,cover_url,text_url,status,episode_number,episode_title,audio_url,duration
```

Parser hỗ trợ giá trị CSV có dấu phẩy hoặc xuống dòng bên trong dấu ngoặc kép. Các dòng cùng truyện được gom theo tiêu đề/slug chuẩn hóa. Nếu truyện đã tồn tại, import cập nhật metadata, giữ ID và các chỉ số view, rồi thay danh sách episode theo dữ liệu import thay vì bỏ qua bản ghi trùng. `text_url` là tùy chọn.

Các trang admin hiện có:

- `/admin/analytics`
- `/admin/audio`
- `/admin/affiliate`
- `/admin/categories`
- `/admin/settings`
- `/admin/staffs`
- `/admin/users`

## Route chính và API

Trang công khai:

- `/` — trang chủ
- `/track/[slug]` — chi tiết truyện, cũng fallback theo ID
- `/login`, `/signup`, `/auth/callback`
- `/about` — Giới thiệu: tiện ích giải trí, sứ mệnh, tầm nhìn
- `/privacy` — Chính sách bảo mật
- `/terms` — Điều khoản sử dụng, miễn trừ trách nhiệm, bảo vệ bản quyền DMCA
- `/contact` — Liên hệ qua email metruyensupportteam@gmail.com
- `/account` — khu vực thành viên

API công khai/thành viên:

- `/api/home-stories`
- `/api/increment-views`
- `/api/affiliate-links/active`
- `/api/affiliate-links/[id]/click`
- `/api/affiliate-links/preview`
- `/api/account/profile`
- `/api/favorites` — GET/POST/DELETE
- `/api/listening-history` — GET/PUT
- `/api/sync-user`

API quản trị/hệ thống:

- `/api/admin/login`
- `/api/admin/analytics`
- `/api/admin/stories`
- `/api/admin/staffs`
- `/api/admin/users`
- `/api/admin/users/sync`
- `/api/backup`

## Ghi chú triển khai

- Các URL audio và cover hiện được nhập dưới dạng URL công khai; form chưa upload trực tiếp lên R2.
- Push GitHub và deploy Vercel là các bước riêng; chỉ xem là đã triển khai sau khi xác nhận lệnh push/deploy thành công.
- Không lưu mật khẩu hoặc service-role key trong dữ liệu ứng dụng hay tài liệu.
- Social proof “Đang nghe” là số mô phỏng phía trình duyệt, không phải số người nghe realtime từ server; giá trị được giữ trong khoảng hiển thị do code quy định và lưu trong `localStorage`.
- Playlist, hẹn giờ, shuffle và đồng bộ tiến độ guest sau khi đăng nhập chưa có nghiệp vụ riêng.
- Nút khóa trong một số giao diện admin chưa phải là cơ chế phân quyền nội dung hoàn chỉnh.
- Next.js 16 hiện cảnh báo convention `middleware` deprecated và đề xuất chuyển sang `proxy`; cảnh báo này chưa ảnh hưởng build hiện tại.

## Palette

Palette thương hiệu chính: nền mint `#D4EEED`, xanh nhạt `#9ECDDD`, xanh `#689EC2`/`#2D74A8`, xanh đậm `#154B95` và cam `#EE4D2D`. Chữ trên card nền mint dùng `#154B95` để giữ tương phản ở cả light và dark mode.
