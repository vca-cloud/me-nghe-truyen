# me-nghe-truyen

## Tổng quan

`me-nghe-truyen` là ứng dụng web nghe truyện audio bằng Next.js App Router. Đây là ứng dụng đã kết nối dữ liệu thật: nội dung và hoạt động được lưu trên Supabase, còn audio/ảnh bìa dùng URL công khai (hiện nhập thủ công) trên Cloudflare R2.

## Nguyên tắc bắt buộc

- Không đưa secret thật vào source, tài liệu, log hoặc client bundle. `SUPABASE_SERVICE_ROLE_KEY` chỉ dùng phía server.
- Dữ liệu member phải lấy user từ session server (`auth.getUser()`), không tin `user_id` do client gửi.
- Favorites và listening history được bảo vệ bằng RLS theo `auth.uid() = user_id`.
- Khi sửa schema Supabase, tạo/cập nhật migration trong `supabase/migrations/` và chạy trên đúng project trước khi kiểm thử production.
- Không gọi một thay đổi local là đã push GitHub/deploy Vercel nếu chưa thấy lệnh tương ứng thành công.
- Khi đề cập code trong tài liệu hoặc review, dùng đường dẫn file tương đối và xác minh file còn tồn tại.
- Route admin mới (`/api/admin/*`, `/api/backup`) phải gọi `hasAdminSession()` từ `lib/admin-auth.ts` ở đầu mỗi handler (kiểm tra chữ ký cookie + staff còn tồn tại và không bị khóa); middleware chỉ kiểm tra chữ ký và không bảo vệ API. Mật khẩu staff băm scrypt qua `lib/password.ts`; login tự băm lại mật khẩu cũ dạng plaintext và khóa 15 phút sau 5 lần sai (theo IP và email, bộ đếm trong bộ nhớ instance). Session ký bằng `ADMIN_SESSION_SECRET` (đã đặt trên Vercel), hết hạn sau 7 ngày theo `issuedAt`.
- Tham số `next` sau đăng nhập luôn đi qua `getSafeNextPath` (`lib/site-url.ts`), chặn `//`, `\` và ký tự điều khiển.

## Lệnh và công nghệ

- Next.js `16.3.4` App Router, React `19.2.8`, TypeScript
- Tailwind CSS v4, shadcn/ui/Base UI, `lucide-react`
- Supabase `@supabase/supabase-js` + `@supabase/ssr` cho Postgres, Auth, RLS và SSR cookie
- Cloudflare R2 qua URL công khai
- `sonner` toast, `recharts` analytics, ESLint
- Google tag GA4 `G-E8PSHLWY5E` chỉ đặt một lần trong `app/layout.tsx` bằng `next/script` (`afterInteractive`); không thêm tag thứ hai ở page/layout con
- Chưa gắn Google AdSense (chủ dự án để dành cho site mexemtruyen); không tự thêm script AdSense/`ads.txt` nếu chưa được yêu cầu

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build production + kiểm tra TypeScript
npm run start    # chạy build production
npm run lint     # ESLint
```

Biến môi trường trong `.env.local` (không ghi giá trị thật vào repo):

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_SESSION_SECRET=
NEXT_PUBLIC_R2_PUBLIC_URL=
NEXT_PUBLIC_SITE_URL=https://menghetruyen.com
```

## Cấu trúc và route

```text
app/
├── page.tsx                         # Trang chủ (server, ISR 60s) → components/home-page.tsx (client)
├── about/page.tsx                   # Giới thiệu: tiện ích giải trí, sứ mệnh, tầm nhìn
├── privacy/page.tsx                 # Chính sách bảo mật
├── terms/page.tsx                   # Điều khoản sử dụng, miễn trừ trách nhiệm, DMCA
├── contact/page.tsx                 # Liên hệ (email hỗ trợ trong components/info-page.tsx)
├── account/page.tsx                 # Trang thành viên, yêu cầu đăng nhập
├── login/page.tsx / signup/page.tsx
├── auth/callback/route.ts           # Đổi OAuth code lấy session
├── track/[slug]/page.tsx            # Track theo slugify(title), fallback ID; ISR 60s; không tìm thấy → redirect("/")
├── [...slug]/page.tsx               # URL không khớp route nào → redirect 307 về "/"
├── not-found.tsx                    # notFound() còn lại → redirect về "/"
├── admin/{login,analytics,audio,affiliate,users,staffs,categories,settings}/
└── api/
    ├── home-stories/route.ts
    ├── increment-views/route.ts
    ├── account/profile/route.ts
    ├── favorites/route.ts
    ├── listening-history/route.ts
    ├── sync-user/route.ts
    ├── affiliate-links/{active,preview}/route.ts
    ├── affiliate-links/[id]/click/route.ts
    ├── admin/{login,analytics,stories,staffs,users}/route.ts
    ├── admin/users/sync/route.ts
    └── backup/route.ts

components/
├── header.tsx, footer.tsx, audio-card.tsx, info-page.tsx, home-page.tsx
├── login-form.tsx, signup-form.tsx, theme-toggle.tsx
├── AffiliateModal.tsx, image-with-fallback.tsx
├── account/account-page.tsx
├── admin/                             # admin-shell, admin-stats, action-buttons, audio-form(-dialog),
│                                      # affiliate-manager, category-manager, import-stories-dialog
├── track/{player,episode-list,track-actions,track-experience}.tsx
└── ui/                                # shadcn/ui primitives

lib/
├── supabase.ts, supabase-client.ts, supabase-server.ts
├── admin-session.ts, sync-admin-user.ts, site-url.ts
├── story-views.ts, duration.ts, import-stories.ts, home-stories.ts
├── affiliate-api.ts, category-data.ts, category-options.ts, categories.ts
├── slug.ts, utils.ts
└── social-proof.ts, audio-api.ts      # hiện không được import ở đâu

middleware.ts                          # chỉ bảo vệ trang /admin/*, trừ /admin/login; KHÔNG bảo vệ /api/*
scripts/lock-staffs-rls.mjs            # script khóa RLS staff bằng service role
```

## Trang chủ và view

`app/page.tsx` là server component (`revalidate = 60`) gọi `getHomeStories()` trong `lib/home-stories.ts` (service role, chỉ chọn cột cần, chuẩn hóa duration/slug/view) rồi truyền `initialStories` cho `components/home-page.tsx` (client). Client tìm kiếm theo tiêu đề/tác giả/thể loại/mô tả, lọc category, phân trang 6 truyện và chỉ gọi lại `/api/home-stories` (cũng ISR 60s, dùng chung hàm) khi tab focus/visible hoặc khi server không lấy được dữ liệu. Danh sách theo `id DESC`, mới nhất trước. Khu **Được nghe nhiều** tạo bản sao và sort giảm dần theo:

```text
total views = real_views + base_fake_views
```

`base_fake_views` có thể fallback từ `plays` legacy ở lớp normalize/API; `plays` không được cộng thêm nếu đã dùng `base_fake_views`. Không tự đồng bộ ngược các giá trị view trừ khi code/migration nói rõ.

`real_views` được tăng bởi `/api/increment-views` sau luồng mở khóa audio và ghi `listener_logs` theo IP. Analytics phải dùng cùng mô hình tổng view; khi thay đổi mô hình cần rà soát `lib/story-views.ts`, trang chủ, track và admin analytics cùng lúc.

Social proof “Đang nghe” là mô phỏng phía client, không phải telemetry realtime. Logic nằm trực tiếp trong `components/home-page.tsx` (không dùng `lib/social-proof.ts`): giữ map theo story trong `localStorage`, khởi tạo ngẫu nhiên 5–85 và timer đổi ±5, kẹp trong 5–85. Không mô tả đây là số user thật.

## Theme và UI

Palette trong [app/globals.css](app/globals.css): nền light `#D4EEED`, nền dark `#102D54`, xanh đậm/chữ card `#154B95`, xanh nhạt `#9ECDDD`, xanh trung gian `#689EC2`/`#2D74A8`, cam `#EE4D2D`. `ThemeToggle` áp class `dark` lên `<html>` và lưu lựa chọn trong localStorage. Chữ trên card mint phải đủ tương phản; ưu tiên `#154B95` cho tiêu đề, mô tả, thể loại, số tập và duration.

Tên thương hiệu luôn viết thường **mê nghe truyện**, in đậm, "mê" màu `#EE4D2D`, "nghe truyện" theo `text-foreground` (tự đổi sáng/tối) — giống logo trong `components/header.tsx`. Trong nội dung trang dùng `<BrandName />` từ `components/info-page.tsx`; component không set cỡ chữ nên kế thừa từ heading/đoạn văn chứa nó.

## Trang thông tin và footer

Footer (`components/footer.tsx`) có 4 link pháp lý theo yêu cầu Google: `/about` (Giới thiệu), `/privacy` (Chính sách bảo mật), `/terms` (Điều khoản sử dụng, Miễn trừ trách nhiệm, DMCA), `/contact` (Liên hệ). Cả 4 trang dùng khung `InfoPage`; email hỗ trợ `metruyensupportteam@gmail.com` là hằng `CONTACT_EMAIL` duy nhất trong `components/info-page.tsx`, các trang khác link sang `/contact` qua `<ContactLink />` thay vì lặp email.

## Domain và Auth redirect

Domain production chuẩn là `https://menghetruyen.com`. Vercel project: `me-nghe-truyen-new-1` (team VCA); Functions region `sin1` để gần Supabase `ap-southeast-1` (Singapore) — không đổi về `iad1`. Login/signup dùng `NEXT_PUBLIC_SITE_URL` để tạo callback URL ổn định, thay vì phụ thuộc vào domain preview Vercel:

```bash
NEXT_PUBLIC_SITE_URL=https://menghetruyen.com
```

Khi đổi domain, cập nhật một lần trong Vercel Environment Variables và thêm domain/callback tương ứng trong Supabase Auth URL Configuration. Supabase nên có Site URL `https://menghetruyen.com` và redirect `https://menghetruyen.com/auth/callback`; giữ thêm `http://localhost:3000/auth/callback` cho local. `lib/site-url.ts` cũng chặn `next` không phải đường dẫn nội bộ để tránh open redirect.

- `app/auth/callback/route.ts` đổi OAuth code lấy session rồi redirect.
- Supabase Redirect URL phải bao gồm origin thực tế, ví dụ `http://localhost:3000/auth/callback`.
- `/account` redirect guest tới `/login?next=/account`; bookmark track redirect guest tới login với `next` là track hiện tại.
- `components/header.tsx` hiển thị avatar/tên hoặc initials và menu link tài khoản, audio đã lưu, lịch sử nghe, đăng xuất.
- `/api/account/profile` chỉ trả id/email/created_at/user metadata an toàn; không trả token hay mật khẩu.
- `/api/sync-user` và `/api/admin/users/sync` phục vụ đồng bộ user theo các luồng hiện có; không dùng chúng để bypass RLS.

## Track, affiliate và player

`app/track/[slug]/page.tsx` hiển thị thông tin truyện, total views, thể loại, link **Đọc truyện chữ**, player và danh sách tập. `text_url` được dùng khi có giá trị; khi trống, link đọc fallback về track hiện tại. URL track tạo từ `slugify(title)` hoặc ID vì production có thể không có cột `stories.slug`.

Trang track là ISR on-demand (`revalidate = 60` + `generateStaticParams` trả `[]`): lần đầu render rồi cache. Dữ liệu lấy 2 bước: (1) danh sách nhẹ `LIST_COLUMNS` để tìm story theo ID/slug và tính trước/sau/liên quan, (2) song song `select("*")` story + `getEpisodes`. Không `select("*")` toàn bảng, không đọc cookies/session trong page (sẽ phá ISR); dữ liệu theo user nằm ở client component. Lượt nghe trên trang có thể trễ tối đa 60s.

Ảnh bìa dùng `ImageWithFallback`: URL thuộc host `NEXT_PUBLIC_R2_PUBLIC_URL` đi qua `next/image` (khai báo `images.remotePatterns` trong `next.config.ts`), host khác dùng `<img loading="lazy">` để không vỡ ảnh dán thủ công.

`TrackExperience`/`AffiliateModal` yêu cầu hoàn tất affiliate trước khi phát. Link active lấy từ `/api/affiliate-links/active`; click ghi qua `/api/affiliate-links/[id]/click`; preview dùng `/api/affiliate-links/preview`.

`AudioPlayer` dùng `<audio>` thật, tua, tốc độ 0.75x–2x và tự chuyển tập. Với user đã đăng nhập, player:

- đọc row tương ứng từ `/api/listening-history?storyId=&episodeId=`;
- khôi phục tiến độ chưa completed sau metadata;
- ghi một row khi bắt đầu phát, cập nhật thưa khi đang nghe và flush khi pause;
- ghi completed khi audio kết thúc hoặc đạt ngưỡng code quy định.

Không gọi API ở mọi `timeupdate`. Guest chưa có đồng bộ tiến độ server; nếu bổ sung local progress/merge sau login phải giữ key ổn định theo story/episode.

## Account member

`components/account/account-page.tsx` có ba tab:

- Hồ sơ: email, tên/avatar metadata và tháng tham gia.
- Audio đã lưu: dữ liệu từ `GET /api/favorites`, link về track.
- Lịch sử nghe: dữ liệu từ `GET /api/listening-history`, tập, progress, completed và lần nghe cuối.

`/api/favorites` lấy user từ server session, hỗ trợ GET list/check, POST upsert và DELETE theo `storyId`. `/api/listening-history` hỗ trợ GET và PUT, validate ID/số không âm, giới hạn progress theo duration và upsert theo user/story/episode. Quan hệ query không được yêu cầu các cột không tồn tại trong production (đặc biệt không giả định `stories.slug`).

## Admin

Admin đăng nhập riêng tại `/admin/login`; trang `/admin/*` được middleware bảo vệ bằng cookie `admin_session`. Mọi thao tác ghi truyện/tập/import/thể loại/affiliate đi qua `adminWrite()` (`lib/admin-db.ts`) → `POST /api/admin/db` (kiểm tra `hasAdminSession()`, chỉ cho 4 bảng `ADMIN_WRITABLE_TABLES`, update/delete bắt buộc có `match`, dùng service role). Không ghi bằng anon client ở UI admin; client chỉ đọc. Các module hiện có:

| Route | Chức năng |
| --- | --- |
| `/admin/audio` | CRUD truyện/tập, import CSV/JSON |
| `/admin/analytics` | Analytics lượt nghe |
| `/admin/affiliate` | Link affiliate và click |
| `/admin/categories` | Thể loại |
| `/admin/users` | Directory `admin_users`, sync user Auth |
| `/admin/staffs` | Quản trị viên, mật khẩu và RLS |
| `/admin/settings` | Cài đặt/backup |

Nút/nhãn “Khóa” nếu còn trong UI chưa được xem là cơ chế phân quyền nội dung hoàn chỉnh; không quảng bá là đã triển khai nếu chưa có API và enforcement tương ứng.

## Import và duration

`lib/import-stories.ts` parse JSON lồng và CSV. CSV parser là stateful, hỗ trợ dấu phẩy, dấu ngoặc kép và newline bên trong field. File mẫu là [public/mau-import-truyen.csv](public/mau-import-truyen.csv), có header:

```text
title,author,genre,description,cover_url,text_url,status,episode_number,episode_title,audio_url,duration
```

`components/admin/import-stories-dialog.tsx` gom các dòng theo story chuẩn hóa. Story trùng title/slug được **update** metadata, giữ ID và view fields, xóa/reinsert danh sách episode để tiếp nhận thay đổi; không bỏ qua mù quáng. `text_url` tùy chọn. Duration episode được parse/chuẩn hóa bằng `lib/duration.ts`; duration story là tổng các episode và hiển thị dạng `HH:MM:SS` qua `formatClockDuration`. Form admin audio cũng đọc/ghi `text_url`.

## Supabase schema và migration

Chạy theo thứ tự các file trong `supabase/migrations/`:

- `20250906_create_stories_table.sql`
- `20250907_add_story_slug.sql`
- `20250907_add_view_counts.sql`
- `20250907_allow_story_writes.sql`
- `20250907_create_episodes.sql`
- `20250908_create_admin_tables.sql`
- `20250909_create_affiliate_links.sql`
- `20250910_create_listener_logs.sql`
- `20250911_add_staff_password.sql`
- `20250911_lock_staffs_rls.sql`
- `20250912_add_story_text_url.sql`
- `20250913_create_member_account_tables.sql`
- `20250914_lock_public_writes.sql` — anon/authenticated chỉ SELECT trên stories/episodes/categories/affiliate_links
- `20250915_record_story_listen.sql` — hàm `record_story_listen` (service_role) chống trùng IP + cộng `real_views` nguyên tử; `/api/increment-views` tự fallback cách cũ nếu hàm chưa có

Migration member tạo `favorites` (khóa ghép user/story) và `listening_history` (FK story/episode, progress, duration, completed, timestamp), index và RLS. Khi sửa unique/upsert cho row story-level có `episode_id NULL`, phải lưu ý PostgreSQL unique index cho phép nhiều NULL và cần thiết kế khóa/constraint phù hợp.

## Nợ bảo mật (rà soát 2026-09-23/24)

Đã xử lý 2026-09-24:

- 4 route service role thiếu kiểm tra session nay gọi `hasAdminSession()`; `/api/sync-user` lấy user từ session server; open redirect `/\evil.com`; session hết hạn 7 ngày; `ADMIN_SESSION_SECRET` đặt trên Vercel.
- Ghi admin chuyển sang `/api/admin/db`; đã chạy `20250914_lock_public_writes.sql` trên production (anon INSERT bị RLS chặn, UPDATE không ảnh hưởng dòng nào).
- Mật khẩu staff băm scrypt (cả 2 staff đã băm 2026-09-24), giới hạn đăng nhập sai, khóa staff thu hồi quyền API ngay. Script `scripts/hash-staff-passwords.ts` băm mật khẩu còn plaintext nếu có.
- Security headers trong `next.config.ts` (X-Frame-Options DENY, `frame-ancestors 'none'`, nosniff, Referrer-Policy, Permissions-Policy).
- `/api/increment-views` không cộng lại trong 30 phút cho cùng IP + truyện (dựa `listener_logs`), không trả IP; `/api/affiliate-links/[id]/click` chặn click lặp 10 phút theo IP + link (bộ nhớ instance); preview chỉ nhận `https` host `shopee.vn`, `*.shopee.vn`, `shp.ee`.

Còn lại:

- Chống bot đăng ký: Confirm email đã bật từ trước. Form signup (`lib/signup-validation.ts`) kiểm tra họ tên, email (chặn Gmail ≥3 dấu chấm), mật khẩu ≥8 ký tự có chữ + số, không khoảng trắng, honeypot `website`, và hiện màn hình "kiểm tra email" khi chưa có session. Bot gọi thẳng Supabase Auth API vẫn vượt qua được form: cần đặt yêu cầu mật khẩu trong Supabase Auth và CAPTCHA (Turnstile) nếu còn bot.

## Known limitations và kiểm thử

- Audio/cover hiện dán URL công khai, chưa upload trực tiếp lên R2 từ form.
- Playlist, hẹn giờ, shuffle và merge local progress guest sau login chưa có nghiệp vụ.
- Social proof không phản ánh người nghe realtime.
- Cần kiểm thử guest redirect, favorite add/remove, history ngay khi Play, restore progress, nhiều episode và RLS isolation giữa hai user trên Supabase thật.
- Trước khi hoàn tất thay đổi chạy `npm run build`, `npm run lint` và `git diff --check`. `npm run lint` toàn repo hiện có sẵn 18 lỗi cũ (chủ yếu admin, `app/page.tsx`, `header.tsx`, `theme-toggle.tsx`); tối thiểu phải `npx eslint <file đã sửa>` sạch và không tăng số lỗi.
- Next.js 16 có cảnh báo convention `middleware` deprecated, đề xuất `proxy`; chỉ chuyển khi có task riêng và kiểm tra lại middleware bảo vệ admin.
