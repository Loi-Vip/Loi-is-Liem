# Chatbot (tapl;am chatbot)

Mô tả: chatbot đơn giản dùng `scikit-learn` để phân loại intent và có khả năng tìm kiếm thông tin trên mạng khi được yêu cầu.

Tính năng mới:
- Khi mô hình không chắc chắn (prob < 0.7) bot sẽ gọi DuckDuckGo Instant Answer API.
- Người dùng có thể chủ động yêu cầu tìm kiếm bằng cách bắt đầu câu bằng `tìm ` hoặc `tim `.
- Nếu bạn có `BING_API_KEY` (Bing Web Search API), bot sẽ ưu tiên dùng Bing (kết quả phong phú hơn).

Yêu cầu
- Python 3.8+
- Cài gói:

```powershell
pip install -r requirements.txt
```

Sử dụng
- Chạy chatbot:

```powershell
python "c:\Users\Loli\Desktop\nigger\tapl;am chatbot\main.py"
```

- Chủ động tìm kiếm: nhập `tìm lịch sử VN` hoặc `tim thời tiết Hà Nội` → bot trả câu tóm tắt + link nguồn.

Cấu hình (tuỳ chọn)
- Đặt `BING_API_KEY` nếu bạn muốn dùng Bing Web Search API (Azure Bing Search):

```powershell
$env:BING_API_KEY = "your_key_here"
```

Gợi ý nâng cao
- Tối ưu: cache kết quả, cắt tỉa nội dung dài, hoặc tích hợp SerpAPI/Google (cần key).
- Tự động reload `intents.json` khi file thay đổi để không cần khởi động lại.
