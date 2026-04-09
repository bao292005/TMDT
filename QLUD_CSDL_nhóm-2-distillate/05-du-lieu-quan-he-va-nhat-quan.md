## Context
- This section covers mô hình dữ liệu, quan hệ, và kiểm soát nhất quán. Part 5 of 5 from QLUD_CSDL_nhóm 2.docx.

## Thực thể chính
- User, Product, ProductVariant, Category, Cart, CartItem, Order, OrderItem, PaymentTransaction, FinancialTransaction, Shipment, AuditLog.

## Quan hệ chính
- User-Order: 1-n; User-FinancialTransaction: 1-n.
- Product-ProductVariant: 1-n; Order-OrderItem: 1-n.
- Order liên kết PaymentTransaction và Shipment (tracking_number).
- CartItem tham chiếu ProductVariant và chuyển hóa thành OrderItem khi checkout.

## Quy tắc nhất quán dữ liệu
- Reserve stock ngay lúc tạo đơn để giảm oversell.
- Đồng bộ trạng thái đơn giữa thanh toán, kho, vận chuyển bằng event/callback.
- Lưu cache trạng thái vận chuyển để chống gián đoạn API ngoài.
- Ghi audit trail cho tác vụ quản trị nhạy cảm.

## Tích hợp và ETL
- Nguồn dữ liệu phân tán: cổng thanh toán, kho, vận chuyển.
- ETL cần đảm bảo chuẩn hóa mã giao dịch, thời gian, trạng thái để báo cáo tài chính chính xác.
