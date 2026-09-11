# me-nghe-truyen

## Tổng quan

`me-nghe-truyen` là ứng dụng web nghe truyện audio, xây bằng Next.js App Router. Dự án đã vượt giai đoạn wireframe: trang chủ, trang chi tiết, đăng nhập/đăng ký và khu vực quản trị đều đọc/ghi dữ liệu thật từ Supabase. File audio và ảnh bìa dùng URL công khai trên Cloudflare R2.

Mã nguồn nằm trực tiếp tại thư mục gốc repository.

## Yêu cầu và mục đích

Mục tiêu hiện tại là vận hành nền tảng nghe truyện với dữ liệu thật, không còn chỉ kiểm tra layout:

- Trang chủ lấy danh sách truyện từ bảng `stories`, hỗ trợ tìm kiếm, lọc thể loại và phân trang.
- Trang chi tiết phát audio thật, chọn tập, khóa nội dung bằng modal affiliate Shopee trước khi nghe.
- Người dùng đăng nhập bằng email/mật khẩu hoặc Google OAuth (Supabase Auth).
- Admin quản lý truyện, tập, thể loại, thành viên, quản trị viên, affiliate Shopee, analytics và cài đặt.
- Lượt nghe hiển thị thống nhất: lượt thực (`real_views`) + lượt ảo (`base_fake_views`); `real_views` được khởi tạo/đồng bộ từ `plays`, sau đó tăng khi người dùng mở khóa audio. `plays` chỉ là dữ liệu legacy, không được cộng thêm lần nữa.
- Khu “Được nghe nhiều” xếp hạng giảm dần theo tổng lượt nghe; số thứ tự 1 là truyện có tổng cao nhất.
- Số người đang nghe là social proof riêng từng truyện, dao động nhẹ trong khoảng 15–85 và lưu ở trình duyệt.
- Giao diện light/dark theo palette thương hiệu; chữ trên card sáng (nền mint) luôn dùng `#154B95` để đủ tương phản.
- Thời lượng ở trang chủ và Admin Audio lấy từ `stories.duration`, hiển thị thống nhất dạng `HH:MM:SS`.

## Công nghệ

- Next.js `16.3.4` (App Router)
- React `19.2.8`
- TypeScript
- Tailwind CSS v4
- shadcn/ui + `lucide-react`
- Supabase (`@supabase/supabase-js`, `@supabase/ssr`) — Auth, Postgres, session cookie
- Cloudflare R2 — lưu file audio/cover qua URL công khai
- `sonner` — toast
- `recharts` — biểu đồ analytics
- ESLint

Lệnh trong [package.json](package.json):

```bash
npm run dev      # server phát triển
npm run build    # build production, kiểm tra TypeScript
npm run start    # chạy bản production
npm run lint     # ESLint
```

Biến môi trường chính (`.env.local`):

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_SESSION_SECRET=
```

## Cấu trúc thư mục

```text
app/
├── globals.css
├── layout.tsx
├── page.tsx                      # Trang chủ (dữ liệu Supabase)
├── login/page.tsx
├── signup/page.tsx
├── auth/callback/route.ts        # OAuth Google callback
├── track/[slug]/page.tsx         # Chi tiết truyện (slug hoặc id)
├── admin/
│   ├── login/page.tsx            # Đăng nhập quản trị (session riêng)
│   ├── analytics/page.tsx
│   ├── audio/page.tsx
│   ├── affiliate/page.tsx
│   ├── users/page.tsx
│   ├── staffs/page.tsx
│   ├── categories/page.tsx
│   └── settings/page.tsx
└── api/
    ├── increment-views/route.ts
    ├── admin/login/route.ts
    ├── admin/analytics/route.ts
    ├── affiliate-links/...
    └── backup/route.ts

components/
├── header.tsx                    # Logo, search, theme, avatar user
├── audio-card.tsx
├── login-form.tsx / signup-form.tsx
├── theme-toggle.tsx              # Light/dark, lưu localStorage
├── AffiliateModal.tsx            # Khóa phát = click affiliate
├── image-with-fallback.tsx
├── admin/                        # Shell, form audio, affiliate, category...
├── track/
│   ├── player.tsx
│   ├── episode-list.tsx
│   └── track-experience.tsx      # Player + tập + modal affiliate
└── ui/                           # shadcn/ui

lib/
├── supabase.ts                   # Browser/anon client + Episode helpers
├── supabase-client.ts            # createBrowserClient (SSR cookie)
├── admin-session.ts              # Cookie HMAC cho admin
├── social-proof.ts               # Random người đang nghe
├── slug.ts / duration.ts / categories.ts
└── utils.ts

middleware.ts                     # Bảo vệ /admin/* trừ /admin/login
```

Route chi tiết dùng `[slug]`, không còn `[id]`. URL dạng `/track/me-nghe-truyen-audio-01`; vẫn fallback tìm theo `id` nếu slug không khớp.

## Palette và theme

Token CSS trong [app/globals.css](app/globals.css):

| Token | Light | Dark |
| --- | --- | --- |
| Nền trang | `#D4EEED` | `#102D54` |
| Chữ chính | `#154B95` | `#D4EEED` |
| Card | `#F7FCFC` / chữ `#154B95` | `#D4EEE4` / chữ `#154B95` |
| Primary | `#154B95` | `#9ECDDD` |
| Muted | `#9ECDDD` / `#2D74A8` | `#2D74A8` / `#D4EEED` |

[components/theme-toggle.tsx](components/theme-toggle.tsx) gắn class `dark` lên `<html>`, đọc `localStorage` và `prefers-color-scheme`. Header trang nghe có nút Sun/Moon; khu admin không dùng toggle này.

Quy ước contrast trên card mint (cả light lẫn dark): tiêu đề, mô tả, thể loại, số tập, thời lượng player dùng `#154B95` — không dùng `text-muted-foreground` vì dark token `#D4EEED` trùng nền card.

Logo header: chữ “mê” màu cam Shopee `#EE4D2D`.

## Các màn hình

### Trang chủ — [app/page.tsx](app/page.tsx)

1. Header toàn chiều rộng.
2. Tìm kiếm (gợi ý theo tiêu đề) và bộ lọc thể loại từ bảng categories.
3. Khu “Được nghe nhiều”.
4. Danh sách audio, phân trang 6 truyện/trang.
5. Lượt nghe = `real_views + base_fake_views` (fallback `plays`).
6. Số người đang nghe: mỗi `storyId` một số riêng, cập nhật ±1–3 mỗi 5–10 giây, kẹp 15–85, lưu `localStorage`.

### Header — [components/header.tsx](components/header.tsx)

Logo, ô tìm kiếm, `ThemeToggle`, trạng thái user. User Google hiện avatar + tên (`user_metadata.full_name` / `name` / email); không có ảnh thì hiện initials. Nút đăng xuất gọi `supabase.auth.signOut()`.

### Login / Signup

- [components/login-form.tsx](components/login-form.tsx): `signInWithPassword` và `signInWithOAuth({ provider: "google" })`, `redirectTo` = `/auth/callback`.
- [components/signup-form.tsx](components/signup-form.tsx): tương tự, có Google.
- [app/auth/callback/route.ts](app/auth/callback/route.ts): `exchangeCodeForSession`, set cookie SSR, redirect về `/`.

Lỗi thường gặp: `error_code=bad_oauth_state` khi state OAuth hết hạn/mất cookie (mở tab cũ, domain Redirect URL trên Supabase chưa khai báo `http://localhost:3000/auth/callback`).

### Trang chi tiết — [app/track/[slug]/page.tsx](app/track/[slug]/page.tsx)

Layout hai cột: sidebar thông tin + player/tập/truyện liên quan.

- [components/track/track-experience.tsx](components/track/track-experience.tsx): khóa phát cho đến khi user hoàn tất affiliate; sau unlock tự play.
- [components/track/player.tsx](components/track/player.tsx): `<audio>` thật, tua, tốc độ 0.75x–2x, cover hoặc icon Headphones. Thời lượng hai đầu thanh tiến độ: `text-[#154B95]`.
- [components/track/episode-list.tsx](components/track/episode-list.tsx): danh sách tập; tiêu đề dòng là `Tập {n}` + `episode.title` (tránh lặp “Tập 1: Tập 1” nếu title đã chứa “Tập 1”).
- Truyện liên quan: tiêu đề / thể loại / mô tả trên card mint luôn `#154B95`.

### Admin

Đăng nhập riêng tại `/admin/login` → `/api/admin/login` tạo cookie HMAC (`admin_session`). [middleware.ts](middleware.ts) chặn mọi `/admin/*` trừ login.

| Route | Việc |
| --- | --- |
| `/admin/analytics` | Dashboard lượt nghe, biểu đồ |
| `/admin/audio` | CRUD truyện + tập, import, khóa |
| `/admin/affiliate` | Link Shopee, bật/tắt, đếm click |
| `/admin/users` | Thành viên (`admin_users`) |
| `/admin/staffs` | Quản trị viên, đổi mật khẩu |
| `/admin/categories` | Thể loại |
| `/admin/settings` | Cài đặt |

[components/admin/admin-shell.tsx](components/admin/admin-shell.tsx): sidebar cố định, không có nút theme.

## Dữ liệu và API

Bảng chính trên Supabase: `stories`, `episodes`, `admin_users`, affiliate links, `listener_logs`.

Lượt nghe:

- Ảo: `base_fake_views` hoặc `plays` do admin nhập.
- Thật: `real_views`, tăng qua [app/api/increment-views/route.ts](app/api/increment-views/route.ts) (service role), ghi `listener_logs` theo IP.
- Trang chủ và admin analytics phải cùng công thức `real + fake`.

Affiliate: modal lấy link đang bật từ `/api/affiliate-links/active`; click ghi nhận qua `/api/affiliate-links/[id]/click` rồi mở khóa player.

## Kết quả hiện tại

Build gần nhất (`npm run build`) thành công. Route Next.js nhận diện:

```text
/  /login  /signup  /track/[slug]
/admin/login  /admin/analytics  /admin/audio  /admin/affiliate
/admin/users  /admin/staffs  /admin/categories  /admin/settings
/auth/callback
/api/increment-views  /api/admin/login  /api/admin/analytics
/api/affiliate-links/...  /api/backup
```

Cảnh báo Next.js 16: convention `middleware` đang deprecated, đề xuất chuyển sang `proxy` (`npx @next/codemod@canary middleware-to-proxy`).

## Hướng dẫn phát triển

1. `npm install`
2. Điền `.env.local`
3. `npm run dev` → [http://localhost:3000](http://localhost:3000)
4. Admin: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
5. Thêm shadcn: `npx shadcn@latest add <component>`
6. Component dùng chung trong `components/`, shadcn trong `components/ui/`, alias `@/*`
7. Sau thay đổi giao diện/API: `npm run build`

Trên Supabase Auth, Redirect URL phải gồm origin đang chạy, ví dụ `http://localhost:3000/auth/callback`.

## Phạm vi chưa / còn dở

- Theme: toggle đã có, nhưng một số chữ trên card/player dark mode vẫn dễ trùng nền mint — đang vá từng chỗ bằng `#154B95`.
- Google user chưa sync tự động sang `admin_users` (trang Thành viên đọc bảng này, không đọc `auth.users`).
- Yêu thích, playlist, hẹn giờ, shuffle chưa có nghiệp vụ.
- Player chưa lưu tiến độ nghe giữa các phiên.
- Upload file trực tiếp lên R2 từ form admin: hiện dán URL công khai.
- Accessibility, SEO, loading/error production chưa tối ưu.
- Next.js 16 cảnh báo đổi `middleware` → `proxy`.
