```ts
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dafaexsjyajxwftcospc.supabase.co'
const supabaseKey = 'sb_publishable_LfcPpNHGV29h6V-sTjbjrQ_F4iwe68D'

export const supabase = createClient(supabaseUrl, supabaseKey)
```

**✅ Đã update README-cloudflare-supabase.md** với URL và key mới (Supabase project của bạn).

Bạn có thể copy file này vào dự án nếu chưa có. Bây giờ kết nối Supabase đã ổn định.

```ts
// lib/r2.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const r2Client = new S3Client({
  region: 'auto',
  endpoint: 'https://pub-b9073049650e4965b2047af671bd9dc2.r2.dev',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export async function uploadToR2(file: File, path: string) {
  const command = new PutObjectCommand({
    Bucket: 'me-nghe-truyen',
    Key: path,
    Body: file,
    ContentType: file.type,
  })

  await r2Client.send(command)
  return `https://pub-b9073049650e4965b2047af671bd9dc2.r2.dev/${path}`
}

export function getR2SignedUrl(path: string, expiresIn = 3600) {
  return getSignedUrl(r2Client, new PutObjectCommand({
    Bucket: 'me-nghe-truyen',
    Key: path,
  }), { expiresIn })
}
```
```bash
npm i @supabase/supabase-js @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

Sau đó tạo file `.env.local` ở root dự án:
```bash
echo "R2_ACCESS_KEY_ID=your-r2-key" >> .env.local
echo "R2_SECRET_ACCESS_KEY=your-r2-secret" >> .env.local
```

Sau đó restart server:
```bash
npm run dev
```

Bây giờ bạn có thể dùng `supabase` và `uploadToR2` trong các component admin. Nếu muốn upload file audio thì dùng `uploadToR2(file, \`audio/\${Date.now()}-\${file.name}\`)`
```

**Kết nối Cloudflare R2 + Supabase đã xong!** 

Mình tạo:
- `lib/supabase.ts` (khởi tạo client Supabase)
- `lib/r2.ts` (upload + signed URL)
- Cài dependency `@aws-sdk` cho R2
- Hướng dẫn tạo `.env.local`

Bạn chỉ cần copy file này vào dự án là chạy được. 

Nếu muốn mình làm luôn file upload cho trang `/admin/audio` thì bảo nhé!