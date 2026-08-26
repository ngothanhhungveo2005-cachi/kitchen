# Nhật Ký Bếp

Web app cho phép nhân viên bếp chụp ảnh nguyên liệu nhận vào / mẫu lưu ngay
trên điện thoại hoặc máy tính, dữ liệu đồng bộ tức thì lên đám mây. Quản trị
viên xem được toàn bộ dữ liệu và quản lý tài khoản nhân viên.

- Mỗi nhân viên có **1 tài khoản riêng** (email + mật khẩu), chỉ thấy ghi
  nhận của chính mình.
- **Admin** thấy và quản lý toàn bộ dữ liệu + phân quyền tài khoản.
- Chạy trên trình duyệt — không cần cài app, dùng được trên điện thoại và
  máy tính, dữ liệu tự đồng bộ hai chiều (không cần "gửi qua lại").

Công nghệ: React + Vite (giao diện) và [Supabase](https://supabase.com)
(đăng nhập, cơ sở dữ liệu, lưu trữ ảnh — miễn phí cho quy mô một bếp/nhà hàng).

---

## 1. Tạo backend Supabase (khoảng 5 phút)

1. Vào [supabase.com](https://supabase.com) → tạo tài khoản miễn phí → **New project**.
2. Đặt tên project (vd: `bep-nha-hang`), chọn mật khẩu database, chọn region gần Việt Nam (Singapore).
3. Chờ project khởi tạo xong (~2 phút). Vào **SQL Editor** ở thanh bên.
4. Mở file [`supabase/schema.sql`](./supabase/schema.sql) trong repo này, copy toàn bộ nội dung,
   dán vào SQL Editor, bấm **Run**. Lệnh này tạo:
   - Bảng `profiles` (tài khoản + vai trò `staff`/`admin`)
   - Bảng `records` (ghi nhận ảnh nguyên liệu)
   - Bucket lưu ảnh `kitchen-photos` (riêng tư, chỉ xem qua link có chữ ký)
   - Toàn bộ luật bảo mật (RLS) để nhân viên chỉ thấy dữ liệu của mình, admin thấy hết
5. Vào **Project Settings → API**. Lấy 2 giá trị:
   - `Project URL` → dùng cho `VITE_SUPABASE_URL`
   - `anon public` key → dùng cho `VITE_SUPABASE_ANON_KEY`
   (Đây là khoá công khai an toàn để đưa vào code phía trình duyệt — bảo mật thật sự nằm ở RLS đã tạo ở bước trên.)

## 2. Tạo tài khoản admin đầu tiên

1. Vào **Authentication → Users → Add user** → nhập email + mật khẩu cho chính bạn → **Create user**.
2. Vào **Table Editor → profiles**, tìm dòng vừa tạo (trigger đã tự tạo sẵn), sửa cột `role` từ `staff` thành `admin`.
3. Từ nay, mỗi khi cần thêm nhân viên mới: **Authentication → Users → Add user** là xong — họ tự có tài khoản với quyền `staff`, không cần chạy code gì thêm.

## 3. Chạy thử ở máy tính (không bắt buộc, nhưng nên làm trước khi deploy)

```bash
npm install
cp .env.example .env
# Mở .env, dán VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY vừa lấy ở bước 1
npm run dev
```

Mở link hiện ra (thường là `http://localhost:5173`), đăng nhập bằng tài khoản admin vừa tạo.

## 4. Đưa lên GitHub + xuất bản (miễn phí, có sẵn link truy cập từ điện thoại và máy tính)

Bạn đã có repo/tài khoản GitHub sẵn, nên chỉ cần:

```bash
git init
git add .
git commit -m "Khoi tao Nhat Ky Bep"
git branch -M main
git remote add origin <URL repo GitHub của bạn>
git push -u origin main
```

Sau đó bật xuất bản tự động bằng GitHub Pages:

1. Trong repo trên GitHub → **Settings → Secrets and variables → Actions → New repository secret**,
   thêm 2 secret:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   (dùng đúng 2 giá trị lấy ở bước 1)
2. Vào **Settings → Pages** → mục "Build and deployment" → **Source** chọn **GitHub Actions**.
3. Mỗi lần bạn `git push` lên nhánh `main`, workflow có sẵn ở
   [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml) sẽ tự build và xuất bản.
   Sau lần push đầu tiên, vào tab **Actions** để xem tiến trình; xong xuôi, link app sẽ hiện ở
   **Settings → Pages** (dạng `https://<username>.github.io/<tên-repo>/`).

Link này dùng được y hệt trên điện thoại lẫn máy tính — mở bằng trình duyệt, đăng nhập bằng
tài khoản được cấp, dữ liệu đồng bộ ngay lập tức vì cùng đọc/ghi vào Supabase.

> Mẹo: trên điện thoại, sau khi mở link, dùng "Thêm vào Màn hình chính" (Add to Home Screen)
> của trình duyệt để có icon dùng như một app riêng.

### Lựa chọn khác thay vì GitHub Pages

Nếu muốn tên miền gọn hơn hoặc build nhanh hơn, có thể deploy qua
[Vercel](https://vercel.com) hoặc [Netlify](https://netlify.com): import thẳng repo GitHub,
khai báo 2 biến môi trường như trên, họ tự build. Cả hai đều có gói miễn phí đủ dùng.

---

## Cấu trúc quyền hạn

| Việc | Nhân viên | Admin |
|---|---|---|
| Chụp & lưu ghi nhận | ✅ (của mình) | ✅ |
| Xem ghi nhận của mình | ✅ | ✅ |
| Xem ghi nhận của người khác | ❌ | ✅ |
| Xoá ghi nhận | ❌ | ✅ |
| Đổi quyền tài khoản (staff ↔ admin) | ❌ | ✅ |

Toàn bộ giới hạn trên được áp dụng ở tầng cơ sở dữ liệu (Row Level Security),
không chỉ ở giao diện — nên kể cả khi có ai đó can thiệp trực tiếp vào API,
họ vẫn không lấy được dữ liệu ngoài quyền hạn.

## Cấu trúc thư mục

```
src/
  lib/            Kết nối Supabase, quản lý phiên đăng nhập
  pages/Login.jsx Trang đăng nhập
  components/
    CaptureForm.jsx    Form chụp & lưu ảnh
    RecordList.jsx     Danh sách ghi nhận (có bộ lọc)
    UserManagement.jsx Trang admin quản lý quyền tài khoản
  App.jsx         Điều hướng theo tab + theo quyền
supabase/schema.sql   Toàn bộ schema + bảo mật, chạy 1 lần trong Supabase
```
