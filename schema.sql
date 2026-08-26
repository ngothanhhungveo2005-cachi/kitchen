-- ============================================================
-- Nhật Ký Bếp — Supabase schema
-- Chạy toàn bộ file này trong Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Bảng hồ sơ người dùng (mở rộng auth.users, lưu vai trò)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'staff' check (role in ('staff', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Ai cũng xem được danh sách hồ sơ khi đã đăng nhập (cần để hiện tên người
-- ghi nhận trong danh sách, và để trang quản lý tài khoản hoạt động).
create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

-- Người dùng có thể tự cập nhật tên hiển thị của mình, nhưng KHÔNG thể tự
-- đổi role của chính mình (chặn bằng cách so sánh role cũ/mới ở trigger bên dưới).
create policy "profiles_update_self"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Admin có thể cập nhật hồ sơ (kể cả role) của bất kỳ ai.
create policy "profiles_update_admin"
  on public.profiles for update
  to authenticated
  using (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  ));

-- Chặn người dùng thường tự phong mình làm admin qua policy "update_self" ở trên.
create or replace function public.prevent_self_role_escalation()
returns trigger as $$
begin
  if new.role <> old.role then
    if not exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
    ) then
      raise exception 'Chỉ quản trị viên mới được đổi quyền tài khoản';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_prevent_self_role_escalation on public.profiles;
create trigger trg_prevent_self_role_escalation
  before update on public.profiles
  for each row execute function public.prevent_self_role_escalation();

-- Tự động tạo hồ sơ (role mặc định 'staff') mỗi khi có tài khoản Auth mới,
-- ví dụ khi admin tạo user trong Dashboard → Authentication → Users.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    'staff'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- 2. Bảng ghi nhận (ảnh nguyên liệu / lưu mẫu)
create table if not exists public.records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  image_path text not null,
  category text not null,
  note text,
  created_at timestamptz not null default now()
);

alter table public.records enable row level security;

create index if not exists records_user_id_idx on public.records(user_id);
create index if not exists records_created_at_idx on public.records(created_at desc);

-- Nhân viên: chỉ thêm và xem ghi nhận của chính mình.
create policy "records_insert_own"
  on public.records for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "records_select_own"
  on public.records for select
  to authenticated
  using (auth.uid() = user_id);

-- Admin: xem, sửa, xoá toàn bộ ghi nhận.
create policy "records_select_admin"
  on public.records for select
  to authenticated
  using (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  ));

create policy "records_delete_admin"
  on public.records for delete
  to authenticated
  using (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  ));


-- 3. Storage bucket lưu ảnh (riêng tư — truy cập qua signed URL)
insert into storage.buckets (id, name, public)
values ('kitchen-photos', 'kitchen-photos', false)
on conflict (id) do nothing;

-- Nhân viên chỉ upload/xem ảnh trong thư mục của chính mình (tên thư mục = user id).
create policy "photos_insert_own_folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'kitchen-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "photos_select_own_folder"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'kitchen-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admin: xem và xoá mọi ảnh trong bucket.
create policy "photos_select_admin"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'kitchen-photos'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "photos_delete_admin"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'kitchen-photos'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ============================================================
-- Xong. Sau khi chạy file này:
-- 1) Tạo tài khoản admin đầu tiên trong Authentication → Users → Add user.
-- 2) Vào Table Editor → profiles, tìm dòng vừa tạo, sửa cột "role" thành 'admin'.
-- ============================================================
