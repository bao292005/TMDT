# Component Inventory

## 1. Tổng quan
Hệ thống UI được tổ chức theo hướng tái sử dụng component, tập trung tại `src/components`.

## 2. Layout Components
- `components/layout/Header.tsx`
  - Thanh điều hướng chính, hiển thị trạng thái user/session.
- `components/layout/Footer.tsx`
  - Footer toàn site.
- `components/layout/storefront-layout.tsx`
  - Shell dùng lại cho `(public)/(auth)/(customer)`.

## 3. UI Primitives
- `components/ui/action-button.tsx`
  - Nút hành động chuẩn hóa variant.
- `components/ui/input.tsx`
  - Input chuẩn cho form.
- `components/ui/feedback-message.tsx`
  - Banner thông báo success/warning/error/info.
- `components/ui/state-panel.tsx`
  - Khối hiển thị loading/empty/error.
- `components/ui/page-shell.tsx`
  - Khung trang chuẩn cho các màn nghiệp vụ.
- `components/ui/ScrollToTop.tsx`
  - Điều hướng UX khi cuộn.

## 4. Feature Components
- `components/features/product-card.tsx`
  - Card sản phẩm dùng cho listing.
- `components/home/banner-slider.tsx`
  - Banner/hero trượt ở trang chủ.
- `components/home/flash-sale.tsx`
  - Section flash sale trang chủ.

## 5. Nhận xét
- Hệ thống đã có bộ primitives đủ cho đa số use case giao diện nghiệp vụ.
- Hướng chuẩn hiện tại là ưu tiên dùng primitives thay vì viết inline UI riêng lẻ ở page/client components.
