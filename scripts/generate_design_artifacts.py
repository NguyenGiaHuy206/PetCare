from __future__ import annotations

import textwrap
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "se104-design"
IMG_DIR = OUT / "images"
UML_DIR = OUT / "uml"

FONT = "C:/Windows/Fonts/arial.ttf"
FONT_BOLD = "C:/Windows/Fonts/arialbd.ttf"


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    path = FONT_BOLD if bold and Path(FONT_BOLD).exists() else FONT
    return ImageFont.truetype(path, size)


F_TITLE = font(24, True)
F_HEAD = font(18, True)
F_BODY = font(15)
F_SMALL = font(13)


COLORS = {
    "bg": "#f8fafc",
    "box": "#ffffff",
    "actor": "#ecfeff",
    "process": "#eef2ff",
    "store": "#fef9c3",
    "external": "#f0fdf4",
    "line": "#334155",
    "muted": "#64748b",
    "title": "#0f172a",
}


USE_CASES = [
    {
        "id": "UC-01",
        "name": "Đăng ký tài khoản",
        "actor": "Khách",
        "process": "1.0 Đăng ký tài khoản",
        "input": "Thông tin đăng ký: họ tên, email, mật khẩu",
        "stores": ["D1 Người dùng"],
        "output": "Tài khoản mới, thông báo đăng ký thành công/lỗi",
        "participants": ["Khách", "Register UI", "Auth API", "AuthService", "UserRepo", "PostgreSQL"],
        "messages": [
            ("Khách", "Register UI", "Nhập họ tên, email, mật khẩu"),
            ("Register UI", "Auth API", "POST /auth/register"),
            ("Auth API", "AuthService", "validate + hash password"),
            ("AuthService", "UserRepo", "kiểm tra email tồn tại"),
            ("UserRepo", "PostgreSQL", "SELECT users WHERE email"),
            ("AuthService", "UserRepo", "tạo User"),
            ("UserRepo", "PostgreSQL", "INSERT users"),
            ("Auth API", "Register UI", "UserResponse/thông báo lỗi"),
        ],
    },
    {
        "id": "UC-02",
        "name": "Đăng nhập hệ thống",
        "actor": "Khách hàng/Admin",
        "process": "2.0 Xác thực đăng nhập",
        "input": "Email, mật khẩu",
        "stores": ["D1 Người dùng", "D2 Phiên/JWT phía client"],
        "output": "Access token, refresh token, vai trò truy cập",
        "participants": ["Người dùng", "Login UI", "Auth API", "AuthService", "UserRepo", "PostgreSQL"],
        "messages": [
            ("Người dùng", "Login UI", "Nhập email/mật khẩu"),
            ("Login UI", "Auth API", "POST /auth/login"),
            ("Auth API", "AuthService", "xác thực thông tin"),
            ("AuthService", "UserRepo", "tìm user theo email"),
            ("UserRepo", "PostgreSQL", "SELECT users"),
            ("AuthService", "AuthService", "verify password + tạo JWT"),
            ("Auth API", "Login UI", "TokenResponse"),
            ("Login UI", "Người dùng", "Chuyển hướng theo role"),
        ],
    },
    {
        "id": "UC-03",
        "name": "Quản lý hồ sơ người dùng",
        "actor": "Khách hàng/Admin",
        "process": "3.0 Cập nhật hồ sơ",
        "input": "SĐT, địa chỉ, avatar, mật khẩu mới hoặc vai trò",
        "stores": ["D1 Người dùng", "D3 Tập tin ảnh/S3"],
        "output": "Thông tin hồ sơ đã cập nhật",
        "participants": ["Người dùng", "Profile/Admin UI", "Users/Admin API", "UserRepo", "PostgreSQL", "Storage API"],
        "messages": [
            ("Người dùng", "Profile/Admin UI", "Xem/sửa hồ sơ"),
            ("Profile/Admin UI", "Users/Admin API", "GET/PUT /users/me hoặc /admin/users"),
            ("Users/Admin API", "UserRepo", "kiểm tra quyền + cập nhật"),
            ("UserRepo", "PostgreSQL", "UPDATE/SELECT users"),
            ("Profile/Admin UI", "Storage API", "upload avatar nếu có"),
            ("Users/Admin API", "Profile/Admin UI", "UserResponse"),
        ],
    },
    {
        "id": "UC-04",
        "name": "Quản lý thú cưng",
        "actor": "Khách hàng",
        "process": "4.0 Quản lý hồ sơ thú cưng",
        "input": "Tên, loài, giống, cân nặng, ghi chú, ảnh",
        "stores": ["D4 Thú cưng", "D3 Tập tin ảnh/S3"],
        "output": "Danh sách/hồ sơ thú cưng được cập nhật",
        "participants": ["Khách hàng", "Pet UI", "Pets API", "PetService", "PetRepo", "PostgreSQL", "Storage API"],
        "messages": [
            ("Khách hàng", "Pet UI", "Thêm/sửa/xóa thú cưng"),
            ("Pet UI", "Storage API", "upload ảnh nếu có"),
            ("Pet UI", "Pets API", "POST/PUT/DELETE /pets"),
            ("Pets API", "PetService", "validate ownership + dữ liệu"),
            ("PetService", "PetRepo", "lưu thay đổi"),
            ("PetRepo", "PostgreSQL", "INSERT/UPDATE/DELETE pets"),
            ("Pets API", "Pet UI", "PetResponse/danh sách"),
        ],
    },
    {
        "id": "UC-05",
        "name": "Xem danh sách dịch vụ",
        "actor": "Khách/Khách hàng",
        "process": "5.0 Tra cứu dịch vụ",
        "input": "Từ khóa, danh mục dịch vụ",
        "stores": ["D5 Sản phẩm/Dịch vụ", "D6 Danh mục"],
        "output": "Danh sách dịch vụ, giá, thời lượng",
        "participants": ["Người xem", "ServiceList UI", "Products API", "ProductRepo", "PostgreSQL"],
        "messages": [
            ("Người xem", "ServiceList UI", "Mở trang dịch vụ/tìm kiếm"),
            ("ServiceList UI", "Products API", "GET /products?kind=service"),
            ("Products API", "ProductRepo", "lọc dịch vụ đang có"),
            ("ProductRepo", "PostgreSQL", "SELECT products/categories"),
            ("Products API", "ServiceList UI", "Danh sách dịch vụ"),
        ],
    },
    {
        "id": "UC-06",
        "name": "Quản lý dịch vụ",
        "actor": "Admin",
        "process": "6.0 Quản trị dịch vụ",
        "input": "Tên, mô tả, giá, thời lượng, trạng thái/danh mục",
        "stores": ["D5 Sản phẩm/Dịch vụ", "D6 Danh mục"],
        "output": "Dịch vụ được thêm/sửa/xóa",
        "participants": ["Admin", "ServiceForm UI", "Products/Categories API", "ProductRepo", "PostgreSQL"],
        "messages": [
            ("Admin", "ServiceForm UI", "Nhập thông tin dịch vụ"),
            ("ServiceForm UI", "Products/Categories API", "POST/PUT/DELETE"),
            ("Products/Categories API", "Products/Categories API", "kiểm tra role admin"),
            ("Products/Categories API", "ProductRepo", "lưu cấu hình dịch vụ"),
            ("ProductRepo", "PostgreSQL", "INSERT/UPDATE/DELETE products/categories"),
            ("Products/Categories API", "ServiceForm UI", "ProductResponse"),
        ],
    },
    {
        "id": "UC-07",
        "name": "Đặt lịch dịch vụ",
        "actor": "Khách hàng",
        "process": "7.0 Đặt lịch chăm sóc",
        "input": "Thú cưng, dịch vụ, ngày giờ, ghi chú",
        "stores": ["D4 Thú cưng", "D7 Lịch hẹn", "D8 Thông báo"],
        "output": "Booking mới và thông báo xác nhận",
        "participants": ["Khách hàng", "Booking UI", "Bookings API", "BookingService", "PetRepo", "BookingRepo", "NotificationService"],
        "messages": [
            ("Khách hàng", "Booking UI", "Chọn pet, dịch vụ, ngày giờ"),
            ("Booking UI", "Bookings API", "GET /bookings/availability"),
            ("Bookings API", "BookingService", "kiểm tra slot trống"),
            ("Booking UI", "Bookings API", "POST /bookings"),
            ("Bookings API", "PetRepo", "xác minh thú cưng thuộc user"),
            ("Bookings API", "BookingRepo", "INSERT bookings"),
            ("Bookings API", "NotificationService", "tạo thông báo xác nhận"),
            ("Bookings API", "Booking UI", "BookingResponse"),
        ],
    },
    {
        "id": "UC-08",
        "name": "Quản lý nhật ký chăm sóc",
        "actor": "Khách hàng/Admin",
        "process": "8.0 Quản lý nhật ký chăm sóc",
        "input": "Hoạt động, thời gian, ghi chú, hình ảnh",
        "stores": ["D4 Thú cưng", "D9 Nhật ký chăm sóc", "D3 Tập tin ảnh/S3"],
        "output": "Nhật ký chăm sóc được xem/cập nhật",
        "participants": ["Người dùng", "CareLog UI", "CareLogs API", "CareLogService", "CareLogRepo", "PostgreSQL", "Storage API"],
        "messages": [
            ("Người dùng", "CareLog UI", "Xem/tạo/sửa nhật ký"),
            ("CareLog UI", "Storage API", "upload ảnh nếu có"),
            ("CareLog UI", "CareLogs API", "GET/POST/PUT/DELETE /care-logs"),
            ("CareLogs API", "CareLogService", "kiểm tra quyền truy cập pet"),
            ("CareLogService", "CareLogRepo", "truy vấn/lưu nhật ký"),
            ("CareLogRepo", "PostgreSQL", "SELECT/INSERT/UPDATE care_logs"),
            ("CareLogs API", "CareLog UI", "CareLogResponse"),
        ],
    },
    {
        "id": "UC-09",
        "name": "Mua sắm sản phẩm",
        "actor": "Khách/Khách hàng",
        "process": "9.0 Tra cứu sản phẩm",
        "input": "Từ khóa, danh mục, sản phẩm cần xem",
        "stores": ["D5 Sản phẩm/Dịch vụ", "D6 Danh mục"],
        "output": "Danh sách/chi tiết sản phẩm, trạng thái tồn kho",
        "participants": ["Người xem", "Shop UI", "Products API", "ProductRepo", "PostgreSQL"],
        "messages": [
            ("Người xem", "Shop UI", "Lọc/xem chi tiết sản phẩm"),
            ("Shop UI", "Products API", "GET /products?kind=shop"),
            ("Products API", "ProductRepo", "lọc sản phẩm/danh mục"),
            ("ProductRepo", "PostgreSQL", "SELECT products/categories"),
            ("Products API", "Shop UI", "ProductResponse + tồn kho"),
        ],
    },
    {
        "id": "UC-10",
        "name": "Quản lý giỏ hàng",
        "actor": "Khách hàng",
        "process": "10.0 Cập nhật giỏ hàng",
        "input": "Sản phẩm, số lượng thêm/sửa/xóa",
        "stores": ["D5 Sản phẩm/Dịch vụ", "D10 Giỏ hàng"],
        "output": "Giỏ hàng và tổng tiền mới",
        "participants": ["Khách hàng", "Cart UI", "Carts API", "CartService", "ProductRepo", "CartRepo", "PostgreSQL"],
        "messages": [
            ("Khách hàng", "Cart UI", "Thêm/sửa/xóa sản phẩm"),
            ("Cart UI", "Carts API", "POST/PATCH/DELETE /carts/items"),
            ("Carts API", "CartService", "kiểm tra tồn kho"),
            ("CartService", "ProductRepo", "lấy giá/tồn kho"),
            ("CartService", "CartRepo", "lưu cart_items"),
            ("CartRepo", "PostgreSQL", "UPSERT/DELETE cart_items"),
            ("Carts API", "Cart UI", "CartResponse + total"),
        ],
    },
    {
        "id": "UC-11",
        "name": "Tạo đơn hàng",
        "actor": "Khách hàng",
        "process": "11.0 Tạo đơn hàng",
        "input": "Giỏ hàng, địa chỉ, ghi chú, phí vận chuyển, phương thức thanh toán",
        "stores": ["D10 Giỏ hàng", "D11 Đơn hàng", "D5 Sản phẩm/Dịch vụ"],
        "external": ["GHN Shipping API"],
        "output": "Mã đơn hàng, tổng tiền, trạng thái chờ thanh toán/COD",
        "participants": ["Khách hàng", "Checkout UI", "Shipping API", "Orders API", "OrderService", "CartRepo", "OrderRepo", "PostgreSQL"],
        "messages": [
            ("Khách hàng", "Checkout UI", "Nhập địa chỉ giao hàng"),
            ("Checkout UI", "Shipping API", "POST /shipping/quote"),
            ("Checkout UI", "Orders API", "POST /orders"),
            ("Orders API", "OrderService", "tạo order từ cart"),
            ("OrderService", "CartRepo", "đọc giỏ hàng hiện tại"),
            ("OrderService", "OrderRepo", "tạo order/order_items + trừ tồn"),
            ("OrderRepo", "PostgreSQL", "INSERT orders/order_items"),
            ("Orders API", "Checkout UI", "CheckoutResponse"),
        ],
    },
    {
        "id": "UC-12",
        "name": "Thanh toán đơn hàng",
        "actor": "Khách hàng",
        "process": "12.0 Xử lý thanh toán",
        "input": "Mã đơn hàng, phương thức thanh toán, callback giao dịch",
        "stores": ["D11 Đơn hàng", "D8 Thông báo"],
        "external": ["VNPAY"],
        "output": "Trạng thái thanh toán đã cập nhật",
        "participants": ["Khách hàng", "Payment UI", "Orders API", "VNPAY Service", "VNPAY", "Payments API", "OrderRepo", "NotificationService"],
        "messages": [
            ("Khách hàng", "Payment UI", "Chọn thanh toán VNPAY"),
            ("Payment UI", "Orders API", "POST /orders/{id}/pay"),
            ("Orders API", "VNPAY Service", "tạo payment URL"),
            ("VNPAY Service", "VNPAY", "redirect thanh toán"),
            ("VNPAY", "Payments API", "GET /payments/vnpay/return"),
            ("Payments API", "OrderRepo", "cập nhật payment_status/status"),
            ("Payments API", "NotificationService", "thông báo kết quả"),
            ("Payments API", "Payment UI", "redirect /payment/success|failed"),
        ],
    },
    {
        "id": "UC-13",
        "name": "Xem và xử lý thông báo",
        "actor": "Khách hàng/Admin",
        "process": "13.0 Quản lý thông báo",
        "input": "Yêu cầu xem, đánh dấu đã đọc, xóa thông báo",
        "stores": ["D8 Thông báo"],
        "output": "Danh sách thông báo, trạng thái đã đọc",
        "participants": ["Người dùng", "Notification UI", "Notifications API", "NotificationService", "NotificationRepo", "PostgreSQL"],
        "messages": [
            ("Người dùng", "Notification UI", "Mở biểu tượng chuông"),
            ("Notification UI", "Notifications API", "GET /notifications"),
            ("Notifications API", "NotificationRepo", "lọc theo user"),
            ("NotificationRepo", "PostgreSQL", "SELECT notifications"),
            ("Người dùng", "Notification UI", "Đánh dấu đọc/xóa"),
            ("Notification UI", "Notifications API", "PUT /read hoặc DELETE"),
            ("Notifications API", "NotificationRepo", "UPDATE/DELETE notifications"),
            ("Notifications API", "Notification UI", "NotificationResponse"),
        ],
    },
    {
        "id": "UC-14",
        "name": "Quản lý báo cáo thống kê",
        "actor": "Admin",
        "process": "14.0 Lập báo cáo thống kê",
        "input": "Khoảng thời gian, loại báo cáo doanh thu/booking",
        "stores": ["D7 Lịch hẹn", "D11 Đơn hàng", "D5 Sản phẩm/Dịch vụ"],
        "output": "Biểu đồ, bảng chi tiết, file Excel/PDF",
        "participants": ["Admin", "Reports UI", "Reports API", "ReportService", "OrderRepo", "BookingRepo", "PostgreSQL"],
        "messages": [
            ("Admin", "Reports UI", "Chọn khoảng thời gian"),
            ("Reports UI", "Reports API", "GET /reports/revenue|bookings"),
            ("Reports API", "ReportService", "tổng hợp số liệu"),
            ("ReportService", "OrderRepo", "doanh thu/đơn hàng"),
            ("ReportService", "BookingRepo", "lượt đặt lịch"),
            ("OrderRepo", "PostgreSQL", "SELECT orders/order_items"),
            ("BookingRepo", "PostgreSQL", "SELECT bookings"),
            ("Reports API", "Reports UI", "dataset biểu đồ/bảng"),
        ],
    },
]


SYSTEM_DIAGRAMS = {
    "system-architecture": {
        "title": "Sơ đồ kiến trúc hệ thống PetCare",
        "kind": "component",
        "boxes": [
            ("Người dùng\nBrowser", 70, 120, 170, 90, "actor"),
            ("React + Vite Frontend\nRoutes, Pages, Services", 300, 95, 240, 140, "process"),
            ("FastAPI Backend\nRouters, Middleware, Services", 610, 95, 260, 140, "process"),
            ("PostgreSQL\nUsers, Pets, Products,\nBookings, Orders", 960, 65, 230, 180, "store"),
            ("AWS S3\nẢnh thú cưng/sản phẩm", 610, 330, 240, 90, "external"),
            ("GHN API\nĐịa chỉ + phí ship", 905, 305, 220, 90, "external"),
            ("VNPAY\nThanh toán", 905, 430, 220, 90, "external"),
        ],
        "arrows": [
            (240, 165, 300, 165, "HTTP"),
            (540, 165, 610, 165, "REST API"),
            (870, 165, 960, 165, "ORM"),
            (740, 235, 730, 330, "presign/upload"),
            (870, 170, 905, 350, "shipping"),
            (870, 170, 905, 475, "payment"),
        ],
        "plantuml": """@startuml
title Sơ đồ kiến trúc hệ thống PetCare
actor "Người dùng" as User
node "Browser" {
  component "React + Vite Frontend\\nPages, Routes, API Client" as FE
}
node "Backend Container" {
  component "FastAPI App" as API
  component "Routers" as Routers
  component "Services" as Services
  component "Repositories" as Repos
}
database "PostgreSQL" as DB
cloud "AWS S3" as S3
cloud "GHN API" as GHN
cloud "VNPAY" as VNPAY
User --> FE
FE --> API : HTTP/JSON
API --> Routers
Routers --> Services
Services --> Repos
Repos --> DB : SQLAlchemy async
Services --> S3 : presigned upload/image
Services --> GHN : shipping quote/address
Services --> VNPAY : payment URL/callback
@enduml
""",
    },
    "backend-layering": {
        "title": "Sơ đồ phân lớp backend",
        "kind": "component",
        "boxes": [
            ("api\nFastAPI routers\nrequest/response", 100, 90, 250, 110, "process"),
            ("schemas\nPydantic DTO", 440, 90, 220, 110, "external"),
            ("services\nBusiness rules", 100, 280, 250, 110, "process"),
            ("persistence.repositories\nData access", 440, 280, 250, 110, "process"),
            ("persistence.models\nSQLAlchemy ORM", 780, 280, 250, 110, "store"),
            ("middleware\nlogging/error/CORS", 780, 90, 250, 110, "external"),
        ],
        "arrows": [
            (225, 200, 225, 280, "calls"),
            (350, 145, 440, 145, "validate"),
            (350, 335, 440, 335, "uses"),
            (690, 335, 780, 335, "maps"),
            (780, 145, 660, 145, "cross-cutting"),
        ],
        "plantuml": """@startuml
title Sơ đồ phân lớp backend PetCare
package api {
  [auth.py]
  [users.py]
  [pets.py]
  [bookings.py]
  [orders.py]
  [reports.py]
}
package schemas {
  [Pydantic Request/Response]
}
package services {
  [AuthService]
  [PetService]
  [BookingService]
  [OrderService]
  [ReportService]
}
package persistence {
  [Repositories] --> [SQLAlchemy Models]
}
[api] --> [schemas]
[api] --> [services]
[services] --> [Repositories]
[Repositories] --> [SQLAlchemy Models]
@enduml
""",
    },
    "data-model": {
        "title": "Mô hình dữ liệu mức khái niệm",
        "kind": "component",
        "boxes": [
            ("users", 80, 80, 170, 80, "store"),
            ("pets", 360, 80, 170, 80, "store"),
            ("bookings", 640, 80, 170, 80, "store"),
            ("care_logs", 360, 240, 170, 80, "store"),
            ("products", 80, 430, 170, 80, "store"),
            ("categories", 360, 430, 170, 80, "store"),
            ("carts/cart_items", 640, 300, 180, 90, "store"),
            ("orders/order_items", 640, 480, 190, 90, "store"),
            ("notifications", 80, 240, 190, 80, "store"),
        ],
        "arrows": [
            (250, 120, 360, 120, "1-n"),
            (530, 120, 640, 120, "1-n"),
            (445, 160, 445, 240, "1-n"),
            (175, 160, 175, 240, "1-n"),
            (530, 470, 80, 470, "1-n"),
            (250, 470, 360, 470, "n-1"),
            (250, 120, 640, 345, "1-1"),
            (730, 390, 735, 480, "checkout"),
        ],
        "plantuml": """@startuml
title Mô hình dữ liệu mức khái niệm
entity users
entity pets
entity products
entity categories
entity bookings
entity care_logs
entity carts
entity cart_items
entity orders
entity order_items
entity notifications
users ||--o{ pets
users ||--o{ bookings
users ||--o{ care_logs
users ||--o{ orders
users ||--o{ notifications
users ||--|| carts
pets ||--o{ bookings
pets ||--o{ care_logs
categories ||--o{ products
carts ||--o{ cart_items
products ||--o{ cart_items
orders ||--o{ order_items
products ||--o{ order_items
@enduml
""",
    },
}


SEQUENCE_GROUPS = [
    {
        "id": "SEQ-01",
        "name": "Đăng ký / Đăng nhập",
        "file": "seq-auth-register-login",
        "participants": ["Người dùng", "Giao diện", "Hệ thống", "Authentication", "Cơ sở dữ liệu"],
        "messages": [
            ("Người dùng", "Giao diện", "Chọn Đăng ký hoặc Đăng nhập"),
            ("Giao diện", "Hệ thống", "Gửi thông tin tài khoản"),
            ("Hệ thống", "Authentication", "Kiểm tra định dạng và chính sách bảo mật"),
            ("Authentication", "Cơ sở dữ liệu", "Tra cứu email/tài khoản"),
            ("Cơ sở dữ liệu", "Authentication", "Trả thông tin tài khoản nếu có"),
            ("Authentication", "Authentication", "Nhánh Đăng ký: email chưa tồn tại -> mã hóa mật khẩu"),
            ("Authentication", "Cơ sở dữ liệu", "Lưu tài khoản mới"),
            ("Authentication", "Authentication", "Nhánh Đăng nhập: xác thực mật khẩu -> tạo token"),
            ("Authentication", "Hệ thống", "Trả kết quả xác thực"),
            ("Hệ thống", "Giao diện", "Thông báo lỗi hoặc chuyển vào trang theo vai trò"),
        ],
        "plantuml": """@startuml
title SEQ-01 - Đăng ký / Đăng nhập
actor "Người dùng" as User
boundary "Giao diện" as UI
control "Hệ thống" as System
control "Authentication" as Auth
database "Cơ sở dữ liệu" as DB
User -> UI : Chọn Đăng ký hoặc Đăng nhập
UI -> System : Gửi thông tin tài khoản
System -> Auth : Kiểm tra định dạng và chính sách bảo mật
Auth -> DB : Tra cứu email/tài khoản
DB --> Auth : Thông tin tài khoản nếu có
alt Đăng ký
  Auth -> Auth : Kiểm tra email chưa tồn tại
  Auth -> Auth : Mã hóa mật khẩu
  Auth -> DB : Lưu tài khoản mới
  DB --> Auth : Lưu thành công
  Auth --> System : Đăng ký thành công
else Đăng nhập
  Auth -> Auth : Xác thực mật khẩu
  Auth -> Auth : Tạo token và xác định vai trò
  Auth --> System : Token/Role hoặc lỗi
end
System --> UI : Kết quả xử lý
UI --> User : Thông báo hoặc chuyển trang
@enduml
""",
    },
    {
        "id": "SEQ-02",
        "name": "Quản lý hồ sơ người dùng",
        "file": "seq-user-profile",
        "participants": ["Người dùng/Admin", "Giao diện", "Hệ thống", "Authentication", "Cơ sở dữ liệu", "Lưu trữ ảnh"],
        "messages": [
            ("Người dùng/Admin", "Giao diện", "Xem hoặc chỉnh sửa hồ sơ"),
            ("Giao diện", "Hệ thống", "Gửi thông tin hồ sơ"),
            ("Hệ thống", "Authentication", "Kiểm tra phiên đăng nhập và quyền"),
            ("Hệ thống", "Lưu trữ ảnh", "Tải avatar nếu có"),
            ("Hệ thống", "Cơ sở dữ liệu", "Cập nhật users"),
            ("Cơ sở dữ liệu", "Hệ thống", "Thông tin hồ sơ mới"),
            ("Hệ thống", "Giao diện", "Trả kết quả cập nhật"),
        ],
    },
    {
        "id": "SEQ-03",
        "name": "Quản lý thú cưng / Nhật ký chăm sóc",
        "file": "seq-pet-care-log",
        "participants": ["Khách hàng", "Giao diện", "Hệ thống", "Authentication", "Cơ sở dữ liệu", "Lưu trữ ảnh"],
        "messages": [
            ("Khách hàng", "Giao diện", "Thêm/sửa thú cưng hoặc xem nhật ký"),
            ("Giao diện", "Hệ thống", "Gửi thông tin thú cưng/nhật ký"),
            ("Hệ thống", "Authentication", "Xác nhận chủ sở hữu dữ liệu"),
            ("Hệ thống", "Lưu trữ ảnh", "Lưu ảnh thú cưng/ảnh nhật ký nếu có"),
            ("Hệ thống", "Cơ sở dữ liệu", "Ghi/đọc pets và care_logs"),
            ("Cơ sở dữ liệu", "Hệ thống", "Dữ liệu đã cập nhật"),
            ("Hệ thống", "Giao diện", "Hiển thị hồ sơ hoặc nhật ký chăm sóc"),
        ],
    },
    {
        "id": "SEQ-04",
        "name": "Tra cứu / Quản lý dịch vụ và sản phẩm",
        "file": "seq-catalog-service-product",
        "participants": ["Khách/Admin", "Giao diện", "Hệ thống", "Authentication", "Cơ sở dữ liệu"],
        "messages": [
            ("Khách/Admin", "Giao diện", "Xem danh sách, tìm kiếm hoặc cập nhật catalog"),
            ("Giao diện", "Hệ thống", "Gửi yêu cầu tra cứu/quản lý"),
            ("Hệ thống", "Authentication", "Nếu là thao tác quản lý: kiểm tra quyền Admin"),
            ("Hệ thống", "Cơ sở dữ liệu", "Đọc/ghi products và categories"),
            ("Cơ sở dữ liệu", "Hệ thống", "Danh sách hoặc bản ghi đã cập nhật"),
            ("Hệ thống", "Giao diện", "Hiển thị dịch vụ/sản phẩm hoặc thông báo lỗi"),
        ],
    },
    {
        "id": "SEQ-05",
        "name": "Đặt lịch dịch vụ",
        "file": "seq-booking",
        "participants": ["Khách hàng", "Giao diện", "Hệ thống", "Authentication", "Cơ sở dữ liệu", "Thông báo"],
        "messages": [
            ("Khách hàng", "Giao diện", "Chọn thú cưng, dịch vụ, ngày giờ"),
            ("Giao diện", "Hệ thống", "Gửi yêu cầu đặt lịch"),
            ("Hệ thống", "Authentication", "Kiểm tra đăng nhập và quyền với thú cưng"),
            ("Hệ thống", "Cơ sở dữ liệu", "Kiểm tra slot trống và dữ liệu thú cưng"),
            ("Cơ sở dữ liệu", "Hệ thống", "Kết quả kiểm tra"),
            ("Hệ thống", "Cơ sở dữ liệu", "Nếu hợp lệ: lưu booking"),
            ("Hệ thống", "Thông báo", "Tạo thông báo xác nhận"),
            ("Hệ thống", "Giao diện", "Hiển thị booking hoặc yêu cầu chọn giờ khác"),
        ],
    },
    {
        "id": "SEQ-06",
        "name": "Giỏ hàng / Tạo đơn hàng / Thanh toán",
        "file": "seq-cart-order-payment",
        "participants": ["Khách hàng", "Giao diện", "Hệ thống", "Authentication", "Cơ sở dữ liệu", "Đơn vị vận chuyển", "Cổng thanh toán", "Thông báo"],
        "messages": [
            ("Khách hàng", "Giao diện", "Cập nhật giỏ hàng và chọn thanh toán"),
            ("Giao diện", "Hệ thống", "Gửi sản phẩm, số lượng, địa chỉ, phương thức thanh toán"),
            ("Hệ thống", "Authentication", "Kiểm tra phiên đăng nhập"),
            ("Hệ thống", "Cơ sở dữ liệu", "Kiểm tra tồn kho và đọc giỏ hàng"),
            ("Hệ thống", "Đơn vị vận chuyển", "Lấy phí vận chuyển nếu giao hàng"),
            ("Hệ thống", "Cơ sở dữ liệu", "Tạo đơn hàng và chi tiết đơn hàng"),
            ("Hệ thống", "Hệ thống", "Nhánh COD: giữ trạng thái cod_pending"),
            ("Hệ thống", "Cổng thanh toán", "Nhánh VNPAY: chuyển hướng thanh toán"),
            ("Cổng thanh toán", "Hệ thống", "Callback kết quả giao dịch"),
            ("Hệ thống", "Cơ sở dữ liệu", "Cập nhật trạng thái thanh toán/đơn hàng"),
            ("Hệ thống", "Thông báo", "Tạo thông báo kết quả đơn hàng"),
            ("Hệ thống", "Giao diện", "Hiển thị trạng thái thành công/thất bại"),
        ],
        "plantuml": """@startuml
title SEQ-06 - Giỏ hàng / Tạo đơn hàng / Thanh toán
actor "Khách hàng" as User
boundary "Giao diện" as UI
control "Hệ thống" as System
control "Authentication" as Auth
database "Cơ sở dữ liệu" as DB
queue "Đơn vị vận chuyển" as Ship
control "Cổng thanh toán" as Pay
queue "Thông báo" as Noti
User -> UI : Cập nhật giỏ hàng và chọn thanh toán
UI -> System : Sản phẩm, số lượng, địa chỉ, phương thức thanh toán
System -> Auth : Kiểm tra phiên đăng nhập
Auth --> System : Hợp lệ/không hợp lệ
System -> DB : Kiểm tra tồn kho và đọc giỏ hàng
DB --> System : Thông tin giỏ hàng
System -> Ship : Lấy phí vận chuyển
Ship --> System : Phí vận chuyển
System -> DB : Tạo đơn hàng và chi tiết đơn hàng
DB --> System : Mã đơn hàng
alt Thanh toán COD
  System -> DB : Cập nhật trạng thái cod_pending
  System -> Noti : Tạo thông báo đặt hàng
else Thanh toán VNPAY
  System -> Pay : Tạo giao dịch và chuyển hướng
  Pay --> System : Callback kết quả giao dịch
  System -> DB : Cập nhật trạng thái thanh toán
  System -> Noti : Tạo thông báo kết quả thanh toán
end
System --> UI : Trạng thái đơn hàng/thanh toán
UI --> User : Hiển thị kết quả
@enduml
""",
    },
    {
        "id": "SEQ-07",
        "name": "Xem và xử lý thông báo",
        "file": "seq-notification",
        "participants": ["Người dùng/Admin", "Giao diện", "Hệ thống", "Authentication", "Cơ sở dữ liệu"],
        "messages": [
            ("Người dùng/Admin", "Giao diện", "Mở danh sách thông báo"),
            ("Giao diện", "Hệ thống", "Yêu cầu xem/đánh dấu đã đọc/xóa"),
            ("Hệ thống", "Authentication", "Kiểm tra phiên và phạm vi dữ liệu"),
            ("Hệ thống", "Cơ sở dữ liệu", "Đọc/cập nhật notifications"),
            ("Cơ sở dữ liệu", "Hệ thống", "Danh sách thông báo mới"),
            ("Hệ thống", "Giao diện", "Hiển thị trạng thái thông báo"),
        ],
    },
    {
        "id": "SEQ-08",
        "name": "Quản lý báo cáo thống kê",
        "file": "seq-report",
        "participants": ["Admin", "Giao diện", "Hệ thống", "Authentication", "Cơ sở dữ liệu", "Xuất báo cáo"],
        "messages": [
            ("Admin", "Giao diện", "Chọn khoảng thời gian và loại báo cáo"),
            ("Giao diện", "Hệ thống", "Gửi yêu cầu lập báo cáo"),
            ("Hệ thống", "Authentication", "Kiểm tra quyền Admin"),
            ("Hệ thống", "Cơ sở dữ liệu", "Tổng hợp orders, bookings, products"),
            ("Cơ sở dữ liệu", "Hệ thống", "Dữ liệu thống kê"),
            ("Hệ thống", "Xuất báo cáo", "Tạo bảng/biểu đồ/file nếu người dùng xuất"),
            ("Hệ thống", "Giao diện", "Hiển thị báo cáo hoặc thông báo không có dữ liệu"),
        ],
    },
]


def wrap_label(draw: ImageDraw.ImageDraw, text: str, max_width: int, fnt: ImageFont.FreeTypeFont) -> list[str]:
    lines: list[str] = []
    for para in text.split("\n"):
        current = ""
        for word in para.split():
            candidate = (current + " " + word).strip()
            if draw.textbbox((0, 0), candidate, font=fnt)[2] <= max_width:
                current = candidate
            else:
                if current:
                    lines.append(current)
                current = word
        if current:
            lines.append(current)
    return lines


def draw_box(draw: ImageDraw.ImageDraw, xy: tuple[int, int, int, int], text: str, fill: str, outline: str = "#475569", title: bool = False) -> None:
    draw.rounded_rectangle(xy, radius=12, fill=fill, outline=outline, width=2)
    x1, y1, x2, y2 = xy
    fnt = F_HEAD if title else F_BODY
    lines = wrap_label(draw, text, x2 - x1 - 22, fnt)
    total_h = len(lines) * (fnt.size + 4)
    y = y1 + max(10, ((y2 - y1) - total_h) // 2)
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=fnt)
        draw.text((x1 + (x2 - x1 - (bbox[2] - bbox[0])) / 2, y), line, font=fnt, fill=COLORS["title"])
        y += fnt.size + 4


def crop_to_content(img: Image.Image, bg: str, padding: int = 16) -> Image.Image:
    bg_img = Image.new(img.mode, img.size, bg)
    bbox = ImageChops.difference(img, bg_img).getbbox()
    if not bbox:
        return img
    left = max(0, bbox[0] - padding)
    top = max(0, bbox[1] - padding)
    right = min(img.width, bbox[2] + padding)
    bottom = min(img.height, bbox[3] + padding)
    return img.crop((left, top, right, bottom))


def arrow(draw: ImageDraw.ImageDraw, start: tuple[int, int], end: tuple[int, int], label: str = "") -> None:
    draw.line([start, end], fill=COLORS["line"], width=2)
    ex, ey = end
    sx, sy = start
    dx = 1 if ex >= sx else -1
    dy = 1 if ey >= sy else -1
    if abs(ex - sx) >= abs(ey - sy):
        pts = [(ex, ey), (ex - 12 * dx, ey - 6), (ex - 12 * dx, ey + 6)]
    else:
        pts = [(ex, ey), (ex - 6, ey - 12 * dy), (ex + 6, ey - 12 * dy)]
    draw.polygon(pts, fill=COLORS["line"])
    if label:
        mx, my = (sx + ex) // 2, (sy + ey) // 2
        box = draw.textbbox((0, 0), label, font=F_SMALL)
        draw.rectangle((mx - 4, my - 13, mx + (box[2] - box[0]) + 4, my + 6), fill=COLORS["bg"])
        draw.text((mx, my - 12), label, font=F_SMALL, fill=COLORS["muted"])


READ_ONLY_UCS = {"UC-02", "UC-05", "UC-09", "UC-14"}


def dfd_flows(uc: dict) -> list[tuple[str, str]]:
    stores = ", ".join(uc.get("stores", [])) or "Không có"
    external = ", ".join(uc.get("external", []))
    d3 = f"Dữ liệu hiện có trong bộ nhớ phụ: {stores}"
    if external:
        d3 += f"; dữ liệu tích hợp ngoài: {external}"
    d4 = "Không có" if uc["id"] in READ_ONLY_UCS else f"Dữ liệu cần lưu/cập nhật vào bộ nhớ phụ: {stores}"
    return [
        ("D1", uc["input"]),
        ("D2", "Yêu cầu thực hiện chức năng từ giao diện/thiết bị nhập."),
        ("D3", d3),
        ("D4", d4),
        ("D5", uc["output"]),
        ("D6", "Thông báo kết quả xử lý: thành công hoặc lỗi tương ứng."),
    ]


def algorithm_rule(uc: dict) -> str:
    rules = {
        "UC-01": "Email chưa tồn tại, mật khẩu hợp lệ và thông tin bắt buộc đã nhập đủ?",
        "UC-02": "Email có tồn tại, mật khẩu khớp và tài khoản được phép truy cập?",
        "UC-03": "Người dùng có quyền cập nhật hồ sơ và dữ liệu đúng định dạng?",
        "UC-04": "Thú cưng thuộc đúng chủ sở hữu và thông tin bắt buộc hợp lệ?",
        "UC-05": "Bộ lọc/từ khóa hợp lệ và dịch vụ đang được công khai?",
        "UC-06": "Admin có quyền quản lý và giá/thời lượng dịch vụ hợp lệ?",
        "UC-07": "Khách hàng có thú cưng hợp lệ, dịch vụ tồn tại và slot còn trống?",
        "UC-08": "Người dùng có quyền xem/cập nhật nhật ký của thú cưng?",
        "UC-09": "Sản phẩm thuộc danh mục hợp lệ và còn trạng thái hiển thị?",
        "UC-10": "Sản phẩm tồn tại, số lượng hợp lệ và không vượt tồn kho?",
        "UC-11": "Giỏ hàng có sản phẩm, địa chỉ giao hàng hợp lệ và tồn kho đủ?",
        "UC-12": "Đơn hàng tồn tại, còn chờ thanh toán và phản hồi cổng thanh toán hợp lệ?",
        "UC-13": "Thông báo thuộc đúng người dùng và thao tác đọc/xóa hợp lệ?",
        "UC-14": "Admin có quyền xem báo cáo và khoảng thời gian hợp lệ?",
    }
    return rules.get(uc["id"], "Dữ liệu đầu vào hợp lệ và người dùng có quyền thao tác?")


def dfd_algorithm(uc: dict) -> list[str]:
    actor = uc["actor"]
    stores = ", ".join(uc.get("stores", [])) or "bộ nhớ phụ"
    write_step = (
        "Nếu chức năng làm thay đổi dữ liệu, ghi D4 vào bộ nhớ phụ."
        if uc["id"] not in READ_ONLY_UCS
        else "Không ghi dữ liệu mới vào bộ nhớ phụ."
    )
    external_step = ""
    if uc.get("external"):
        external_step = f" Nếu cần, trao đổi dữ liệu với hệ thống ngoài ({', '.join(uc['external'])})."
    return [
        f"B1: Nhận D1 từ người dùng ({actor}).",
        "B2: Tiếp nhận D2 từ thiết bị nhập/giao diện.",
        f"B3: Kết nối bộ nhớ phụ và đọc D3 ({stores}).",
        f"B4: Kiểm tra quy định nghiệp vụ: {algorithm_rule(uc)}",
        "B5: Nếu không thỏa mãn điều kiện ở B4, trả D6 (báo lỗi) và đi đến bước B9.",
        f"B6: Thực hiện xử lý chính của chức năng `{uc['name']}`. {write_step}{external_step}",
        "B7: Trả D5 cho thiết bị xuất và trả D6 (thông báo thành công).",
        "B8: Đóng kết nối bộ nhớ phụ.",
        "B9: Kết thúc.",
    ]


def draw_minimal_arrow(draw: ImageDraw.ImageDraw, start: tuple[int, int], end: tuple[int, int], label: str, label_pos: tuple[int, int]) -> None:
    arrow(draw, start, end, "")
    draw.text(label_pos, label, font=F_BODY, fill=COLORS["title"])


def save_dfd(uc: dict) -> None:
    img = Image.new("RGB", (1000, 650), "#ffffff")
    draw = ImageDraw.Draw(img)

    actor_box = (420, 95, 580, 145)
    input_box = (90, 285, 250, 335)
    output_box = (750, 285, 910, 335)
    process_oval = (390, 255, 610, 365)

    draw.rectangle(actor_box, fill="#ffffff", outline="#334155", width=2)
    draw_box(draw, input_box, "Thiết bị nhập", "#ffffff", outline="#334155")
    draw_box(draw, output_box, "Thiết bị xuất", "#ffffff", outline="#334155")
    draw.ellipse(process_oval, fill="#ffffff", outline="#334155", width=2)

    process_lines = wrap_label(draw, uc["process"].split(" ", 1)[-1], 170, F_BODY)
    y = 292 if len(process_lines) == 1 else 280
    for line in process_lines:
        bbox = draw.textbbox((0, 0), line, font=F_BODY)
        draw.text((500 - (bbox[2] - bbox[0]) / 2, y), line, font=F_BODY, fill=COLORS["title"])
        y += 21

    draw.text((462, 112), "Người dùng", font=F_BODY, fill=COLORS["title"])
    draw.line((360, 460, 640, 460), fill="#334155", width=2)
    draw.line((360, 515, 640, 515), fill="#334155", width=2)
    draw.text((455, 478), "Bộ nhớ phụ", font=F_BODY, fill=COLORS["title"])

    draw_minimal_arrow(draw, (500, 145), (500, 255), "D1", (468, 190))
    draw_minimal_arrow(draw, (540, 255), (540, 145), "D6", (560, 190))
    draw_minimal_arrow(draw, (250, 310), (390, 310), "D2", (312, 282))
    draw_minimal_arrow(draw, (610, 310), (750, 310), "D5", (675, 282))
    draw_minimal_arrow(draw, (455, 460), (455, 365), "D3", (420, 410))
    draw_minimal_arrow(draw, (545, 365), (545, 460), "D4", (562, 410))

    crop_to_content(img, "#ffffff", padding=16).save(IMG_DIR / f"dfd-{uc['id'].lower()}.png")


def plantuml_dfd(uc: dict) -> str:
    process = uc["process"].split(" ", 1)[-1]
    return f"""@startuml
title {uc['id']} - DFD: {uc['name']}
rectangle "Người dùng" as User
rectangle "Thiết bị nhập" as Input
usecase "{process}" as Process
rectangle "Thiết bị xuất" as Output
database "Bộ nhớ phụ" as Storage
User --> Process : D1
Process --> User : D6
Input --> Process : D2
Process --> Output : D5
Storage --> Process : D3
Process --> Storage : D4
@enduml
"""


def save_sequence(uc: dict) -> None:
    participants = uc["participants"]
    messages = uc["messages"]
    width = max(1280, 190 * len(participants) + 180)
    height = 180 + 58 * len(messages)
    img = Image.new("RGB", (width, height), COLORS["bg"])
    draw = ImageDraw.Draw(img)
    margin = 115
    xs = [margin + i * ((width - margin * 2) // (len(participants) - 1 or 1)) for i in range(len(participants))]
    y0 = 90
    y_end = height - 40
    for x, p in zip(xs, participants):
        text_w = draw.textbbox((0, 0), p, font=F_BODY)[2]
        half_w = max(68, min(105, text_w // 2 + 18))
        draw_box(draw, (x - half_w, y0, x + half_w, y0 + 50), p, COLORS["process"])
        draw.line((x, y0 + 50, x, y_end), fill="#94a3b8", width=1)
    lookup = dict(zip(participants, xs))
    y = 170
    for idx, (src, dst, msg) in enumerate(messages, 1):
        sx, dx = lookup[src], lookup[dst]
        arrow(draw, (sx, y), (dx, y), f"{idx}. {msg}")
        y += 58
    filename = uc.get("file", f"seq-{uc['id'].lower()}")
    crop_to_content(img, COLORS["bg"], padding=12).save(IMG_DIR / f"{filename}.png")


def plantuml_sequence(uc: dict) -> str:
    if uc.get("plantuml"):
        return uc["plantuml"]
    aliases = {p: f"P{i}" for i, p in enumerate(uc["participants"], 1)}
    parts = "\n".join([f'participant "{p}" as {aliases[p]}' for p in uc["participants"]])
    msgs = "\n".join([f'{aliases[s]} -> {aliases[d]} : {m}' for s, d, m in uc["messages"]])
    return f"""@startuml
title {uc['id']} - Sequence Diagram: {uc['name']}
{parts}
{msgs}
@enduml
"""


def save_component_diagram(name: str, spec: dict) -> None:
    img = Image.new("RGB", (1280, 650), COLORS["bg"])
    draw = ImageDraw.Draw(img)
    draw.text((40, 28), spec["title"], font=F_TITLE, fill=COLORS["title"])
    for text, x, y, w, h, typ in spec["boxes"]:
        draw_box(draw, (x, y, x + w, y + h), text, COLORS[typ], title=True)
    for x1, y1, x2, y2, label in spec["arrows"]:
        arrow(draw, (x1, y1), (x2, y2), label)
    img.save(IMG_DIR / f"{name}.png")


def write_report() -> None:
    md: list[str] = []
    md.append("# IV. MÔ HÌNH HÓA YÊU CẦU CHỨC NĂNG\n")
    md.append("## 2. Mô hình hóa theo Chức năng (DFD - Data Flow Diagram)\n")
    md.append("Sử dụng DFD để mô hình hóa chi tiết 14 nghiệp vụ cốt lõi của hệ thống PetCare. Mỗi sơ đồ thể hiện tác nhân, tiến trình xử lý, kho dữ liệu và dữ liệu trả về.\n")
    for i, uc in enumerate(USE_CASES, 1):
        uc_key = uc["id"].lower()
        md.append(f"### 2.{i}. {uc['name']}\n")
        md.append("#### Sơ đồ luồng dữ liệu\n")
        md.append(f"![{uc['id']} DFD](images/dfd-{uc_key}.png)\n")
        md.append("#### ⮚ Mô tả luồng dữ liệu\n")
        for code, desc in dfd_flows(uc):
            md.append(f"- {code}: {desc}\n")
        md.append("#### ⮚ Thuật toán\n")
        for step in dfd_algorithm(uc):
            md.append(f"- {step}\n")
        md.append("#### Mã PlantUML\n")
        md.append(f"```plantuml\n{plantuml_dfd(uc)}```\n")
    md.append("## 4. Sơ đồ Tuần tự (Sequence Diagram)\n")
    md.append("Sequence Diagram thể hiện tương tác theo thời gian ở mức phân tích thiết kế. Các đối tượng được mô hình hóa theo vai trò nghiệp vụ như `Giao diện`, `Hệ thống`, `Authentication`, `Cơ sở dữ liệu` và hệ thống ngoài khi cần. Các use case liên quan được gộp thành một sequence để thể hiện rõ nhánh xử lý.\n")
    for i, seq in enumerate(SEQUENCE_GROUPS, 1):
        md.append(f"### 4.{i}. {seq['name']}\n")
        md.append(f"![{seq['id']} Sequence](images/{seq['file']}.png)\n")
        md.append("#### Mã PlantUML\n")
        md.append(f"```plantuml\n{plantuml_sequence(seq)}```\n")
    md.append("# V. THIẾT KẾ HỆ THỐNG\n")
    md.append("## 1. Kiến trúc hệ thống\n")
    md.append("Hệ thống PetCare được xây dựng theo mô hình Client-Server. Frontend React/Vite chịu trách nhiệm giao diện và điều hướng; Backend FastAPI xử lý API, xác thực, nghiệp vụ và tích hợp ngoài; PostgreSQL lưu trữ dữ liệu nghiệp vụ. Kiến trúc hiện tại là modular monolith theo lớp, dễ triển khai bằng Docker Compose và vẫn tách rõ các module nghiệp vụ.\n")
    md.append("### 1.1. Sơ đồ kiến trúc\n")
    md.append("![Sơ đồ kiến trúc](images/system-architecture.png)\n")
    md.append("```plantuml\n" + SYSTEM_DIAGRAMS["system-architecture"]["plantuml"] + "```\n")
    md.append("### 1.2. Phân lớp backend\n")
    md.append("![Phân lớp backend](images/backend-layering.png)\n")
    md.append("```plantuml\n" + SYSTEM_DIAGRAMS["backend-layering"]["plantuml"] + "```\n")
    md.append("## 2. Thiết kế thành phần\n")
    md.append("- Frontend: `pages` hiển thị màn hình, `services` gọi HTTP API, `contexts/AuthContext` quản lý phiên đăng nhập, `ProtectedRoute` kiểm soát truy cập.\n")
    md.append("- Backend API: các router `auth`, `users`, `pets`, `products`, `bookings`, `care_logs`, `carts`, `orders`, `payments`, `reports`, `notifications`, `admin`.\n")
    md.append("- Service layer: xử lý quy tắc nghiệp vụ như xác thực, kiểm tra quyền sở hữu thú cưng, kiểm tra slot đặt lịch, tính tổng giỏ hàng, tạo đơn hàng, tạo URL thanh toán, tổng hợp báo cáo.\n")
    md.append("- Repository layer: truy vấn và cập nhật dữ liệu qua SQLAlchemy async ORM.\n")
    md.append("- Tích hợp ngoài: S3 lưu ảnh, GHN lấy địa chỉ/phí vận chuyển, VNPAY xử lý thanh toán trực tuyến.\n")
    md.append("## 3. Thiết kế dữ liệu mức hệ thống\n")
    md.append("![Mô hình dữ liệu](images/data-model.png)\n")
    md.append("```plantuml\n" + SYSTEM_DIAGRAMS["data-model"]["plantuml"] + "```\n")
    md.append("## 4. Thiết kế bảo mật và vận hành\n")
    md.append("- Xác thực bằng JWT access/refresh token; phân quyền theo vai trò `user` và `admin`.\n")
    md.append("- API quản trị yêu cầu quyền admin; dữ liệu cá nhân như pets, bookings, cart, orders, notifications được lọc theo `user_id`.\n")
    md.append("- Middleware xử lý logging, lỗi tập trung và CORS cho frontend local.\n")
    md.append("- Docker Compose vận hành frontend, backend và PostgreSQL; Alembic quản lý migration.\n")
    md.append("## 5. Ánh xạ Use Case - Module triển khai\n")
    md.append("| Use Case | Frontend | Backend/API | Bảng dữ liệu chính |\n")
    md.append("|---|---|---|---|\n")
    rows = [
        ("UC-01, UC-02", "auth/Login, auth/Register", "auth.py, auth_service.py", "users"),
        ("UC-03", "profile/Profile, admin/Users", "users.py, admin.py", "users"),
        ("UC-04", "pets/*", "pets.py, pet_service.py", "pets"),
        ("UC-05, UC-06, UC-09", "services/*, shop/*", "products.py, categories.py", "products, categories"),
        ("UC-07", "bookings/*", "bookings.py, booking_service.py", "bookings, pets, notifications"),
        ("UC-08", "care/*", "care_logs.py, care_log_service.py", "care_logs, pets"),
        ("UC-10", "cart/Cart", "carts.py, cart_service.py", "carts, cart_items"),
        ("UC-11, UC-12", "cart/Checkout, orders/*, payment/*", "orders.py, payments.py", "orders, order_items"),
        ("UC-13", "notifications/Notifications", "notifications.py", "notifications"),
        ("UC-14", "reports/Reports", "reports.py, report_service.py", "orders, bookings"),
    ]
    for r in rows:
        md.append("| " + " | ".join(r) + " |\n")
    (OUT / "BaoCao_SE104_PetCare_DFD_Sequence_ThietKeHeThong.md").write_text("".join(md), encoding="utf-8")


def main() -> None:
    IMG_DIR.mkdir(parents=True, exist_ok=True)
    UML_DIR.mkdir(parents=True, exist_ok=True)
    for uc in USE_CASES:
        save_dfd(uc)
        (UML_DIR / f"dfd-{uc['id'].lower()}.puml").write_text(plantuml_dfd(uc), encoding="utf-8")
    for seq in SEQUENCE_GROUPS:
        save_sequence(seq)
        (UML_DIR / f"{seq['file']}.puml").write_text(plantuml_sequence(seq), encoding="utf-8")
    for name, spec in SYSTEM_DIAGRAMS.items():
        save_component_diagram(name, spec)
        (UML_DIR / f"{name}.puml").write_text(spec["plantuml"], encoding="utf-8")
    write_report()
    print(f"Generated artifacts in {OUT}")


if __name__ == "__main__":
    main()
