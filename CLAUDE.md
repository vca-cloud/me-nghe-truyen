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

## Lệnh và công nghệ

- Next.js `16.3.4` App Router, React `19.2.8`, TypeScript
- Tailwind CSS v4, shadcn/ui/Base UI, `lucide-react`
- Supabase `@supabase/supabase-js` + `@supabase/ssr` cho Postgres, Auth, RLS và SSR cookie
- Cloudflare R2 qua URL công khai
- `sonner` toast, `recharts` analytics, ESLint
- Google tag GA4 `G-E8PSHLWY5E` chỉ đặt một lần trong `app/layout.tsx` bằng `next/script` (`afterInteractive`); không thêm tag thứ hai ở page/layout con

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
├── page.tsx                         # Trang chủ
├── about/page.tsx                   # Read me, điều khoản, bảo mật, DMCA
├── account/page.tsx                 # Trang thành viên, yêu cầu đăng nhập
├── login/page.tsx / signup/page.tsx
├── auth/callback/route.ts           # Đổi OAuth code lấy session
├── track/[slug]/page.tsx            # Track theo slugify(title), fallback ID
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
├── header.tsx, footer.tsx, audio-card.tsx
├── login-form.tsx, signup-form.tsx, theme-toggle.tsx
├── AffiliateModal.tsx, image-with-fallback.tsx
├── account/account-page.tsx
├── admin/                             # shell, CRUD, form và import
├── track/{player,episode-list,track-actions,track-experience}.tsx
└── ui/                                # shadcn/ui primitives

lib/
├── supabase.ts, supabase-client.ts, supabase-server.ts
├── admin-session.ts, sync-admin-user.ts
├── story-views.ts, social-proof.ts, duration.ts, import-stories.ts
└── slug.ts, category-options.ts, categories.ts, utils.ts

middleware.ts                          # bảo vệ /admin/*, trừ /admin/login
scripts/lock-staffs-rls.mjs            # script khóa RLS staff bằng service role
```

## Trang chủ và view

`app/page.tsx` lấy `/api/home-stories`, tìm kiếm theo tiêu đề/tác giả/thể loại/mô tả, lọc category và phân trang 6 truyện. API lấy `stories` theo `id DESC`, nên danh sách audio phía dưới là mới nhất trước. Khu **Được nghe nhiều** tạo bản sao và sort giảm dần theo:

```text
total views = real_views + base_fake_views
```

`base_fake_views` có thể fallback từ `plays` legacy ở lớp normalize/API; `plays` không được cộng thêm nếu đã dùng `base_fake_views`. Không tự đồng bộ ngược các giá trị view trừ khi code/migration nói rõ.

`real_views` được tăng bởi `/api/increment-views` sau luồng mở khóa audio và ghi `listener_logs` theo IP. Analytics phải dùng cùng mô hình tổng view; khi thay đổi mô hình cần rà soát `lib/story-views.ts`, trang chủ, track và admin analytics cùng lúc.

Social proof “Đang nghe” là mô phỏng phía client, không phải telemetry realtime. `app/page.tsx` giữ map theo story trong `localStorage`; code hiện khởi tạo số khoảng 5–85 và cập nhật theo timer hiện tại. Không mô tả đây là số user thật.

## Theme và UI

Palette trong [app/globals.css](app/globals.css): nền light `#D4EEED`, nền dark `#102D54`, xanh đậm/chữ card `#154B95`, xanh nhạt `#9ECDDD`, xanh trung gian `#689EC2`/`#2D74A8`, cam `#EE4D2D`. `ThemeToggle` áp class `dark` lên `<html>` và lưu lựa chọn trong localStorage. Chữ trên card mint phải đủ tương phản; ưu tiên `#154B95` cho tiêu đề, mô tả, thể loại, số tập và duration.

## Domain và Auth redirect

Domain production chuẩn là `https://menghetruyen.com`. Login/signup dùng `NEXT_PUBLIC_SITE_URL` để tạo callback URL ổn định, thay vì phụ thuộc vào domain preview Vercel:

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

Admin đăng nhập riêng tại `/admin/login`; `/admin/*` được middleware bảo vệ bằng cookie `admin_session`. Các module hiện có:

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

Migration member tạo `favorites` (khóa ghép user/story) và `listening_history` (FK story/episode, progress, duration, completed, timestamp), index và RLS. Khi sửa unique/upsert cho row story-level có `episode_id NULL`, phải lưu ý PostgreSQL unique index cho phép nhiều NULL và cần thiết kế khóa/constraint phù hợp.

## Known limitations và kiểm thử

- Audio/cover hiện dán URL công khai, chưa upload trực tiếp lên R2 từ form.
- Playlist, hẹn giờ, shuffle và merge local progress guest sau login chưa có nghiệp vụ.
- Social proof không phản ánh người nghe realtime.
- Cần kiểm thử guest redirect, favorite add/remove, history ngay khi Play, restore progress, nhiều episode và RLS isolation giữa hai user trên Supabase thật.
- Trước khi hoàn tất thay đổi chạy `npm run build`, `npm run lint` và `git diff --check`.
- Next.js 16 có cảnh báo convention `middleware` deprecated, đề xuất `proxy`; chỉ chuyển khi có task riêng và kiểm tra lại middleware bảo vệ admin.
