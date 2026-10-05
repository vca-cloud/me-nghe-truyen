# me-nghe-truyen

## Tổng quan

`me-nghe-truyen` (https://menghetruyen.com) là ứng dụng web nghe truyện audio bằng Next.js App Router. Nội dung và hoạt động lưu trên Supabase (Postgres, Auth, RLS); audio/ảnh bìa là URL công khai trên Cloudflare R2 (hiện dán thủ công, host `r2.dev`). Doanh thu từ link affiliate Shopee: người nghe phải bấm link trước khi nghe trọn truyện.

Chủ dự án không phải lập trình viên: tự làm mọi việc có thể; bước nào cần họ (dashboard Supabase/Vercel/Cloudflare, push, thử trên điện thoại) thì hướng dẫn từng cú bấm bằng tiếng Việt. Họ tự push bằng VS Code (Source Control → Sync Changes) vì shell không có quyền GitHub.

## Nguyên tắc bắt buộc

- Không đưa secret thật vào source, tài liệu, log hoặc client bundle. `SUPABASE_SERVICE_ROLE_KEY` chỉ dùng phía server.
- Dữ liệu member phải lấy user từ session server (`auth.getUser()`), không tin `user_id` do client gửi.
- Favorites và listening history được bảo vệ bằng RLS theo `auth.uid() = user_id`.
- Khi sửa schema Supabase, tạo/cập nhật migration trong `supabase/migrations/`; SQL do chủ dự án chạy trong Supabase SQL Editor (không có quyền chạy SQL từ máy). Kiểm tra bảng/hàm tồn tại trên production trước khi dựa vào nó.
- Không gọi một thay đổi local là đã push GitHub/deploy Vercel nếu chưa thấy lệnh tương ứng thành công (kiểm tra `git status -sb` và deployment trên Vercel).
- Khi đề cập code trong tài liệu hoặc review, dùng đường dẫn file tương đối và xác minh file còn tồn tại.
- Route admin mới (`/api/admin/*`, `/api/backup`) phải gọi `hasAdminSession()` từ `lib/admin-auth.ts` ở đầu mỗi handler (kiểm tra chữ ký cookie + staff còn tồn tại và không bị khóa); `proxy.ts` chỉ kiểm tra chữ ký và không bảo vệ API.
- Tham số `next` sau đăng nhập luôn đi qua `getSafeNextPath` (`lib/site-url.ts`), chặn `//`, `\` và ký tự điều khiển.
- **Tên thương hiệu:** xem mục Theme — quy định bắt buộc.

## Lệnh và công nghệ

- Next.js `16.3.4` App Router (`proxy.ts` thay `middleware`), React `19.2.8`, TypeScript
- Tailwind CSS v4, shadcn/ui/Base UI, `lucide-react`
- Supabase `@supabase/supabase-js` + `@supabase/ssr`
- `sonner` toast, `recharts` biểu đồ admin, ESLint
- Google tag GA4 `G-E8PSHLWY5E` đặt một lần trong `app/layout.tsx` bằng `next/script`; tự tắt (`ga-disable-…`) khi hostname khác `menghetruyen.com` hoặc path bắt đầu `/admin`. Không thêm tag thứ hai.
- Chưa gắn Google AdSense (để dành cho site mexemtruyen); không tự thêm script AdSense/`ads.txt` nếu chưa được yêu cầu.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build production + kiểm tra TypeScript
npm run start    # chạy build production
npm run lint     # ESLint — phải 0 error
```

Biến môi trường (`.env.local` local, Vercel Environment Variables production; không ghi giá trị thật vào repo):

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_SESSION_SECRET=        # ký cookie admin, cookie mở khóa audio, salt visitor_hash (đã đặt trên Vercel)
NEXT_PUBLIC_R2_PUBLIC_URL=
NEXT_PUBLIC_SITE_URL=https://menghetruyen.com
CLOUDFLARE_API_TOKEN=        # chỉ quyền Account Analytics: Read (đã đặt trên Vercel)
CLOUDFLARE_ACCOUNT_ID=       # (đã đặt trên Vercel)
R2_BUCKET_NAME=              # tùy chọn; bỏ trống = cộng mọi bucket
# USAGE_LIMIT_* ghi đè hạn mức gói Free (xem app/api/admin/usage/route.ts)
```

## Cấu trúc và route

```text
app/
├── page.tsx                         # Trang chủ (server, ISR 60s) → components/home-page.tsx (client)
├── about/, privacy/, terms/, contact/  # 4 trang pháp lý (khung InfoPage)
├── account/page.tsx                 # Trang thành viên, yêu cầu đăng nhập
├── login/page.tsx / signup/page.tsx
├── auth/callback/route.ts           # Đổi OAuth code lấy session
├── track/[slug]/page.tsx            # Track theo slugify(title), fallback ID; ISR 60s; không tìm thấy → redirect("/")
├── track/[slug]/opengraph-image.tsx # Ảnh chia sẻ theo truyện
├── [...slug]/page.tsx               # URL không khớp route nào → redirect 307 về "/"
├── not-found.tsx                    # notFound() còn lại → redirect về "/"
├── sitemap.ts, robots.ts            # /sitemap.xml (trang tĩnh + mọi track), /robots.txt (chặn /admin, /api/, /account, /auth/)
├── favicon.ico, icon.svg, apple-icon.tsx  # Icon tai nghe (nền #154B95, quai trắng, tai #EE4D2D)
├── opengraph-image.tsx              # Ảnh chia sẻ mặc định (lib/og-card.tsx, font assets/fonts/BeVietnamPro-Bold.ttf, OFL)
├── admin/{login,analytics,audio,affiliate,users,staffs,categories,settings}/
└── api/
    ├── home-stories/                # Danh sách truyện cho trang chủ (không có audio_url)
    ├── track-audio/                 # Link audio của truyện: preview=1 hoặc cookie mở khóa
    ├── increment-views/             # +1 real_views qua RPC record_story_listen
    ├── affiliate-events/            # Ghi lượt hiển thị popup (impression)
    ├── affiliate-links/{active,preview}/, affiliate-links/[id]/click/  # click: đếm + ghi event + set cookie mở khóa
    ├── account/profile/, favorites/, listening-history/, sync-user/
    ├── admin/{login,logout,db,analytics,usage,stories,staffs,users}/, admin/users/sync/
    └── backup/

components/
├── header.tsx, footer.tsx, audio-card.tsx, info-page.tsx (InfoPage, BrandName, ContactLink, CONTACT_EMAIL)
├── home-page.tsx, continue-listening.tsx, login-form.tsx, signup-form.tsx, theme-toggle.tsx
├── AffiliateModal.tsx, image-with-fallback.tsx, account/account-page.tsx
├── track/{player,episode-list,track-actions,track-experience}.tsx
├── admin/                           # admin-shell, action-buttons, audio-form-dialog, affiliate-manager,
│                                    # category-manager, import-stories-dialog, affiliate-funnel,
│                                    # detailed-report, system-usage
└── ui/                              # shadcn/ui primitives

lib/
├── supabase.ts (Episode, PublicEpisode, toPublicEpisodes, getEpisodes), supabase-client.ts, supabase-server.ts
├── admin-session.ts (ký/đọc cookie), admin-auth.ts (hasAdminSession, createServiceDb), admin-db.ts (adminWrite)
├── password.ts (scrypt), request-ip.ts, visitor.ts (visitor_hash), audio-unlock.ts (cookie mnt_unlock)
├── home-stories.ts, track-data.ts, story-views.ts, duration.ts, import-stories.ts, slug.ts, utils.ts (formatDateVN)
├── analytics.ts (trackEvent → gtag), local-progress.ts, og-card.tsx, site-url.ts, signup-validation.ts, sync-admin-user.ts
├── affiliate-api.ts, category-data.ts, category-options.ts, categories.ts
└── social-proof.ts                  # không được import ở đâu

proxy.ts                             # Chỉ bảo vệ trang /admin/* (trừ /admin/login); KHÔNG bảo vệ /api/*
scripts/hash-staff-passwords.ts      # Băm mật khẩu staff còn plaintext (npx tsx --env-file=.env.local …)
scripts/lock-staffs-rls.mjs          # Script cũ khóa RLS staff
```

## Trang chủ và lượt nghe

`app/page.tsx` là server component (`revalidate = 60`) gọi `getHomeStories()` (service role, chỉ cột cần, không có `audio_url`) rồi truyền `initialStories` cho `components/home-page.tsx`. Client tìm kiếm theo tiêu đề/tác giả/thể loại/mô tả, lọc thể loại, phân trang 6 truyện; chỉ gọi lại `/api/home-stories` (ISR 60s) khi tab focus/visible hoặc khi server không lấy được dữ liệu. Danh sách theo `id DESC`. Khu **Được nghe nhiều** sort theo:

```text
total views = real_views + base_fake_views
```

`base_fake_views` có thể fallback từ `plays` legacy; `plays` không cộng thêm. Mọi nơi hiển thị/tính view dùng `lib/story-views.ts`; đổi mô hình thì rà soát trang chủ, track và admin analytics cùng lúc. Không tự đồng bộ ngược giá trị view.

`real_views` tăng qua `/api/increment-views` (gọi khi bấm link affiliate) → RPC `record_story_listen`: chống trùng 30 phút theo IP + truyện, ghi `listener_logs`, cộng nguyên tử. `listener_logs` chỉ có dữ liệu từ 2026-09-24 (trước đó bảng chưa tồn tại trên production).

Social proof "Đang nghe" là mô phỏng phía client trong `components/home-page.tsx` (localStorage, ngẫu nhiên 5–85, timer ±5). Không mô tả là số user thật.

## Theme và UI

Palette trong [app/globals.css](app/globals.css): nền light `#D4EEED`, nền dark `#102D54`, chữ/xanh đậm `#154B95`, xanh nhạt `#9ECDDD`, xanh trung gian `#689EC2`/`#2D74A8`, cam `#EE4D2D` (cũng là màu Shopee). Token: light `--foreground #154B95`, `--muted-foreground #2D74A8`; dark `--foreground #D4EEED`. Lưu ý dark `--card` vẫn là mint sáng (#D4EEE4) với chữ #154B95 — đừng đặt `text-foreground` lên `bg-card` ở dark mode. `ThemeToggle` áp class `dark` lên `<html>` (localStorage `theme`).

**Quy định bắt buộc:** tên thương hiệu luôn viết thường **mê nghe truyện**, in đậm, "mê" màu `#EE4D2D`, "nghe truyện" theo `text-foreground` (tự đổi sáng/tối) — giống logo trong `components/header.tsx`. Mọi UI hiển thị tên thương hiệu dùng `<BrandName />` (`components/info-page.tsx`, không set cỡ chữ, kế thừa từ chỗ chứa). UI của site dùng token theme/palette thương hiệu có biến thể `dark:`, không hard-code `bg-white`/`text-gray-*`.

Biểu đồ admin: không dùng hai trục Y, tắt animation (`isAnimationActive={false}`, nhãn LabelList chỉ hiện sau animation), màu `#EE4D2D`/`#2D74A8` (đã qua validator tương phản/mù màu), thể loại dùng thanh ngang.

## Trang thông tin, SEO và domain

- Footer có 4 link pháp lý theo yêu cầu Google: `/about`, `/privacy`, `/terms` (Điều khoản, Miễn trừ trách nhiệm, DMCA), `/contact`. Email hỗ trợ `metruyensupportteam@gmail.com` là hằng `CONTACT_EMAIL` duy nhất; trang khác link sang `/contact` bằng `<ContactLink />`.
- Layout đặt `metadataBase = getSiteUrl()` và title template `%s | mê nghe truyện`; page con chỉ đặt tên trang. Track có title/description riêng, canonical, OG/Twitter, JSON-LD `AudioObject`, ảnh OG tự vẽ.
- Domain chuẩn `https://menghetruyen.com` (apex là Production, `www` redirect 308 về apex). DNS quản lý tại P.A Việt Nam (không phải Cloudflare). Google Search Console đã xác minh domain bằng TXT.
- Vercel project `me-nghe-truyen-new-1` (team VCA, Hobby), Functions region `sin1` gần Supabase `ap-southeast-1` — không đổi về `iad1`.
- Login/signup dùng `NEXT_PUBLIC_SITE_URL` cho callback. Supabase Auth: Site URL `https://menghetruyen.com`, redirect `https://menghetruyen.com/auth/callback` và `http://localhost:3000/auth/callback`. `/account` redirect guest tới `/login?next=/account`.
- `/api/account/profile` chỉ trả id/email/created_at/metadata an toàn. `/api/sync-user` lấy user từ session server (bỏ qua body); `/api/admin/users/sync` cần admin.

## Track, affiliate và player

`app/track/[slug]/page.tsx`: thông tin truyện, total views, thể loại, link **Đọc truyện chữ** (`text_url`, trống thì về track hiện tại), player, danh sách tập. URL từ `slugify(title)` hoặc ID (production có thể không có cột `stories.slug`). ISR 60s; `generateStaticParams` build sẵn 12 truyện nhiều view nhất. `lib/track-data.ts` (`getTrackData`, React `cache`) dùng chung cho page, `generateMetadata`, `opengraph-image`. Không `select("*")` toàn bảng, không đọc cookies trong page (phá ISR). Ảnh bìa qua `ImageWithFallback` (host R2 → `next/image`, host khác → `<img loading="lazy">`).

Luồng nghe (`components/track/track-experience.tsx` + `player.tsx` + `AffiliateModal.tsx`):

1. HTML/RSC không chứa link audio: page truyền `toPublicEpisodes(episodes)`.
2. Bấm Phát lần đầu → lấy link qua `GET /api/track-audio?storyId=&preview=1` → **nghe thử 60 giây không thông báo** (không hiện đếm ngược hay chữ "nghe thử"). Player đếm thời gian nghe thật (bỏ qua tua, chia tốc độ phát); đủ 60s thì dừng, gửi GA `preview_end`, mở popup.
3. Popup không có nút đóng/"Để sau". Sau khi hết nghe thử, mọi click trên trang mở lại popup (cố ý, để tối đa lượt bấm). Chọn tập khác trong lúc còn nghe thử thì được.
4. Bấm "NGHE NGAY – MIỄN PHÍ" → mở Shopee tab mới, `POST /api/affiliate-links/[id]/click` (body `storyId`: đếm click, ghi `affiliate_events`, set cookie ký `mnt_unlock` 6 giờ cho truyện) + `/api/increment-views` → nghe tiếp đúng chỗ dừng.
5. **Không ghi nhớ** mở khóa/nghe thử giữa các lần vào trang (cố ý). Cookie `mnt_unlock` chỉ để `/api/track-audio` (không có `preview=1`) trả link.

Popup: tên truyện + tập, tiêu đề "Nghe miễn phí, chỉ cần 1 chạm", `<BrandName />`, "không cần mua gì" tô `#EE4D2D`, đoạn mô tả căn đều (điện thoại: dòng cuối căn trái; `sm+`: 2 dòng cân bằng + `text-align-last: justify`), 3 dòng ✓, sản phẩm thu nhỏ "Gợi ý hôm nay" (lấy `title` của link affiliate). Dùng `bg-background`/`text-foreground`/`text-muted-foreground`.

Chống tải (mức 1): link không có trong HTML, player chặn chuột phải/nhấn giữ, `controlsList=nodownload`. Giới hạn: vì có nghe thử, ai mở DevTools vẫn thấy link `r2.dev` cố định; anon key vẫn đọc được `episodes.audio_url` qua Supabase REST. Chặn triệt để cần "mức 2" (bucket private + URL ký có hạn, cần R2 Access Key) — chưa làm.

`AudioPlayer`: `<audio>` thật, tua ±10s, tốc độ 0.75x–2x, hẹn giờ tắt (15/30/60 phút hoặc hết tập), Media Session (màn hình khóa/tai nghe). **Không tự chuyển tập/truyện** khi hết tập (TrackExperience truyền `onEnded`). Tiến độ: user đăng nhập đọc/ghi `/api/listening-history` (ghi khi bắt đầu, thưa khi nghe, flush khi pause, completed khi hết); mọi lần lưu cũng ghi `localStorage` `mnt-progress:<storyId>:<episodeId|0>` và guest khôi phục từ đó. Không gọi API ở mọi `timeupdate`. Trang chủ có **Nghe tiếp** (`continue-listening.tsx`) cho user đăng nhập.

GA events: `audio_play` (có cờ `preview`), `audio_complete`, `preview_end`, `sleep_timer_set`, `affiliate_impression`, `affiliate_click`. GA đếm lượt truy cập web; dashboard admin đếm lượt nghe/popup — hai nơi luôn khác nhau.

## Account member

`components/account/account-page.tsx` có ba tab: Hồ sơ, Audio đã lưu (`GET /api/favorites`), Lịch sử nghe (`GET /api/listening-history`). `/api/favorites` hỗ trợ GET list/check, POST upsert, DELETE theo `storyId`. `/api/listening-history` hỗ trợ GET/PUT, validate số không âm, giới hạn progress theo duration, upsert theo user/story/episode. Không giả định `stories.slug` trong query. Guest gọi hai API này nhận 401 (bình thường, thấy trong console).

Signup (`components/signup-form.tsx`, `lib/signup-validation.ts`): tiếng Việt, kiểm tra họ tên, email (chặn Gmail ≥3 dấu chấm — kiểu bot), mật khẩu ≥8 có chữ + số, không khoảng trắng, honeypot `website`; không có session (Confirm email bật) thì hiện màn hình "kiểm tra email". Supabase Auth đã đặt mật khẩu tối thiểu 8, Letters and digits.

## Admin

Đăng nhập tại `/admin/login`; trang `/admin/*` được `proxy.ts` bảo vệ bằng cookie `admin_session` (hết hạn 7 ngày). Mật khẩu staff băm scrypt (`lib/password.ts`), login khóa 15 phút sau 5 lần sai (bộ nhớ instance), khóa/xóa staff thu hồi quyền API ngay. Đăng xuất gọi `POST /api/admin/logout`. Mọi thao tác ghi truyện/tập/import/thể loại/affiliate đi qua `adminWrite()` → `POST /api/admin/db` (chỉ 4 bảng `ADMIN_WRITABLE_TABLES`, update/delete bắt buộc `match`, service role); UI admin chỉ đọc bằng anon client. Ngày hiển thị dạng `dd/mm/yyyy` giờ VN (`formatDateVN`).

| Route | Chức năng |
| --- | --- |
| `/admin/audio` | CRUD truyện/tập, import CSV/JSON |
| `/admin/analytics` | Dashboard (mô tả dưới) |
| `/admin/affiliate` | Link affiliate (`title` hiện ở "Gợi ý hôm nay" trong popup — nên đặt tên sản phẩm) |
| `/admin/categories` | Thể loại |
| `/admin/users` | Directory `admin_users`, sync user Auth |
| `/admin/staffs` | Quản trị viên (có cột Ngày tạo) |
| `/admin/settings` | Cài đặt/backup |

Dashboard `/admin/analytics` (`app/api/admin/analytics/route.ts`, đọc toàn bộ `listener_logs`/`affiliate_events` phân trang rồi lọc kỳ trong bộ nhớ):

1. **Tổng quan** (toàn thời gian): truyện, tập, thành viên, `real_views`, `base_fake_views`, tổng click (kèm click TB/lượt nghe — không dùng % vì luôn ≥100%). **Lượt nghe theo kỳ** (bộ lọc ngày): lượt nghe, người nghe (IP), tỷ lệ nghe lại, đang nghe thực (15 phút), click trong kỳ, "Đang nghe (mô phỏng)" ghi rõ là số ngẫu nhiên.
2. **Biểu đồ**: lượt nghe theo ngày (giờ VN, điền ngày trống), lượt nghe thực và số truyện theo thể loại (thanh ngang).
3. **Bảng top** truyện và link.
4. **Affiliate** (`affiliate-funnel.tsx`): popup hiển thị (chống trùng 1 phút), click (chống trùng 10 phút), tỷ lệ chuyển đổi, theo ngày/truyện/link. Dữ liệu từ 2026-09-26.
5. **Báo cáo chi tiết** (`detailed-report.tsx`): theo tháng (tháng đang diễn ra so với **cùng số ngày đầu** tháng trước), hiệu quả thể loại xếp theo **lượt nghe TB mỗi truyện** với nhãn "Được yêu thích"/"Ít được chuộng" (top/bottom 3 khi ≥6 thể loại), tỷ lệ click theo truyện (chỉ xếp hạng khi ≥10 lần hiển thị).
6. **Tài nguyên hệ thống** (`system-usage.tsx` → `GET /api/admin/usage`, cache 1 giờ, `?refresh=1`): Supabase qua RPC `admin_system_usage` + MAU ước tính; R2 qua Cloudflare GraphQL (`r2StorageAdaptiveGroups`, `r2OperationsAdaptiveGroups`, Class A/B theo `actionType`), env được `trim()` và lỗi quyền có chẩn đoán. Egress Supabase và băng thông Vercel không có API công khai → chỉ gắn link.

Nút/nhãn "Khóa" nếu còn trong UI chưa phải cơ chế phân quyền nội dung hoàn chỉnh.

## Import và duration

`lib/import-stories.ts` parse JSON lồng và CSV (parser stateful, hỗ trợ dấu phẩy, ngoặc kép, newline trong field). File mẫu [public/mau-import-truyen.csv](public/mau-import-truyen.csv):

```text
title,author,genre,description,cover_url,text_url,status,episode_number,episode_title,audio_url,duration
```

`components/admin/import-stories-dialog.tsx` gom dòng theo story chuẩn hóa; story trùng title/slug được **update** metadata (giữ ID và view), xóa/reinsert episode. Duration episode chuẩn hóa bằng `lib/duration.ts`; duration story là tổng các tập, hiển thị `HH:MM:SS` qua `formatClockDuration`.

## Supabase schema và migration

Thứ tự trong `supabase/migrations/` (tất cả đã chạy trên production; riêng `20250910` chưa từng chạy và được `20250915` bù):

- `20250906_create_stories_table.sql` … `20250913_create_member_account_tables.sql` (stories, slug, view counts, episodes, admin tables, affiliate_links, listener_logs, staff password/RLS, text_url, favorites/listening_history)
- `20250914_lock_public_writes.sql` — anon/authenticated chỉ SELECT trên stories/episodes/categories/affiliate_links
- `20250915_record_story_listen.sql` — tạo `listener_logs` nếu thiếu + hàm `record_story_listen` (service_role)
- `20250916_affiliate_events_and_usage.sql` — bảng `affiliate_events` (impression/click, `visitor_hash` = SHA-256 IP+secret) + hàm `admin_system_usage()` (service_role)

RLS production: `admin_users` chỉ service_role; `staffs` API disabled; `favorites`/`listening_history` theo user; nội dung công khai chỉ SELECT. Khi sửa unique/upsert cho row có `episode_id NULL`, lưu ý unique index cho phép nhiều NULL.

## Bảo mật đã xử lý (2026-09-24 → 10-06)

- API admin đều kiểm tra `hasAdminSession()`; `ADMIN_SESSION_SECRET` riêng trên Vercel; open redirect `/\evil.com` đã chặn.
- Ghi admin qua `/api/admin/db`, RLS khóa ghi công khai.
- Security headers trong `next.config.ts` (X-Frame-Options DENY, `frame-ancestors 'none'`, nosniff, Referrer-Policy, Permissions-Policy).
- Chống spam: view 30 phút/IP+truyện, click 10 phút/IP+link, impression 1 phút; preview Shopee chỉ nhận `https` `shopee.vn`, `*.shopee.vn`, `shp.ee`.
- 5 tài khoản bot (Gmail nhiều dấu chấm, chưa xác nhận) đã xóa 2026-09-26; Confirm email + yêu cầu mật khẩu bật trên Supabase. Nếu bot quay lại: thêm CAPTCHA (Cloudflare Turnstile).

## Known limitations và kiểm thử

- Audio/cover dán URL công khai `r2.dev` (giới hạn tốc độ, không dành cho production); chưa upload thẳng lên R2 từ form; 15 truyện chưa có ảnh bìa. Audio MP3 ~125 kbps — nén 64 kbps mono sẽ giảm ~50% dung lượng (đề xuất, chưa làm).
- Chưa có playlist, shuffle, tự chuyển tập, merge tiến độ guest lên server sau login.
- Cần kiểm thử thủ công trên điện thoại: màn hình khóa, hẹn giờ tắt, nghe thử 60s → popup → nghe tiếp.
- Trước khi hoàn tất: `npm run build`, `npm run lint` (0 error; còn ~27 warning cũ), `git diff --check`. Với react-hooks `set-state-in-effect`: tải dữ liệu lúc mount bằng hàm fetch thuần + `.then(setState)`, reset state theo prop bằng điều chỉnh trong render.
- Kiểm thử UI bằng `puppeteer-core` + Chrome cài sẵn (cài vào scratchpad, không thêm vào `package.json`); chặn `/api/increment-views`, `/api/affiliate-events`, đổi click sang link id không tồn tại (`999999`) để không làm bẩn số liệu thật. Ký cookie admin thử bằng `createAdminSession(email staff thật)` qua `npx tsx`.
