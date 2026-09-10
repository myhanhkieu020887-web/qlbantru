# Phân tích và kế hoạch xây dựng phần mềm quản lý dinh dưỡng mầm non

## 1 Mục tiêu và kết luận thiết kế

Sản phẩm cần hỗ trợ trọn chu trình lập thực đơn, tính nhu cầu thực phẩm, cân đối dinh dưỡng và tiền ăn, mua hàng, xuất kho, ghi nhận thực tế và xuất hồ sơ. Giá trị cốt lõi là một bộ dữ liệu nhất quán đi xuyên suốt các công đoạn, giúp giải thích được từng số lượng, số tiền và chỉ tiêu dinh dưỡng trên báo cáo.

Phạm vi tham chiếu là phân hệ Dinh dưỡng – Thu chi của PMS tại qlmn.vn. Màn hình có các chiều điểm trường và năm học, cùng mười mục nghiệp vụ từ nhà cung cấp đến báo cáo. Hướng dẫn của hệ thống phân biệt thiết lập ban đầu và thao tác thường xuyên; cân đối thực đơn được thực hiện trước khi đi chợ và điều chỉnh sau khi đi chợ. [1]

Đề xuất xây dựng MVP trong 12 tuần với đội ngũ chuyên trách quy mô nhỏ, sau đó chạy thí điểm 2 tuần. Đây là ước lượng lập kế hoạch, phụ thuộc việc chốt dữ liệu dinh dưỡng, công thức, biểu mẫu và nguồn lực. Ưu tiên hoàn thiện một ngày ăn từ đầu đến cuối trước khi mở rộng thư viện chia sẻ, tự động tối ưu hoặc tích hợp hệ thống khác.

Năm quyết định nền tảng: tách nhóm tuổi với bữa ăn; tách định lượng ăn được với lượng mua; tách kế hoạch với thực tế; lưu phiên bản giá và công thức; chỉ ghi sổ kho bằng giao dịch có thể truy vết. Các chương từ 4 trở đi là thiết kế đề xuất cho sản phẩm mới, trừ nội dung có ghi nguồn quan sát.

## 2 Căn cứ khảo sát và mức độ xác nhận

Khảo sát giao diện có đăng nhập ngày 10/09/2026, trong ngữ cảnh năm học 2026–2027. Bản phân tích mô tả hành vi và trường thông tin hiển thị; không khẳng định kiến trúc, cơ sở dữ liệu, API hay thuật toán nội bộ của PMS. Không thực hiện lưu, xóa, duyệt hoặc ghi sổ giao dịch. Danh tính, số điện thoại và giấy tờ của nhà cung cấp không được đưa vào tài liệu này.

| Phân hệ | Đã quan sát | Hàm ý cho sản phẩm mới |
|---|---|---|
| Cơ cấu dinh dưỡng | Nhóm tuổi, cơ cấu áp dụng, đạm và béo động vật/thực vật, đường, calo và calo khuyến nghị [2] | Tiêu chuẩn phải có phiên bản và phạm vi áp dụng |
| Nhà cung cấp | Tên, số mã hóa, địa chỉ, chủ cửa hàng, người giao, điện thoại, CMT/CCCD [3] | Tách thông tin đơn vị và người liên hệ; kiểm soát trường nhạy cảm |
| Thực phẩm trường | Mã, tên, giá, ĐVT, quy đổi gam hoặc ml, động vật, thực phẩm khô, hệ số thải bỏ, giá theo ngày; bộ lọc nguồn dữ liệu [4] | Dữ liệu quy đổi và giá quyết định độ đúng của tính toán |
| Món ăn | Mã, tên, calo một trẻ, nhóm tuổi, loại, vùng miền, nhân bản và chia sẻ [5] | Công thức có phiên bản; không dùng tên món làm khóa |
| Thực đơn mẫu | Món ăn, nhóm trẻ, tiền một trẻ, chênh lệch một trẻ, đánh giá lượng và chất, điểm trường [6] | Tiền ăn và cân đối dinh dưỡng là các điều kiện độc lập |
| Nhập kho | Ngày, kho, thực phẩm, lượng, đơn giá, NCC; tùy chọn lưu NCC về danh mục thực phẩm [7] | Chứng từ và dữ liệu danh mục có tác động khác nhau |
| Tồn kho | Nhập, xuất, tồn theo dòng nhập và giá; trả NCC; chuyển tồn năm học [8] | Cần lô nhập, trả hàng và kiểm soát chuyển kỳ |
| Lịch sử và sổ kho | Biến động theo ngày; bảng tháng có số dư đầu kỳ và nhập xuất tồn [9][10] | Sổ chi tiết và báo cáo phải lấy từ cùng nguồn ghi sổ |
| Cân đối khẩu phần | Ngày, nhóm, thực đơn, số trẻ, tiền ăn; bảng định lượng; chỉ tiêu dinh dưỡng; lưu và lưu làm mẫu [11] | Đây là màn hình trung tâm kết nối các phân hệ |
| Biểu mẫu thống kê | Phiếu kê chợ, sổ tính tiền ăn, calo tuần, thực đơn tuần và biểu mẫu kiểm tra thực phẩm [12] | Báo cáo cần bộ tham số, phiên bản và nguồn số liệu rõ ràng |

Ba giới hạn cần giữ khi đọc kết luận: chưa kiểm chứng hành vi sau khi nhấn Lưu; chưa xác định thời điểm xuất kho thực sự; chưa xác định công thức chính thức cho tiền dịch vụ, bổ trợ và chênh lệch chuyển ngày. Các nội dung này là hạng mục xác minh trước phát triển, không được suy diễn thành tính năng đã có.

## 3 Những phát hiện ảnh hưởng đến thiết kế

### 3.1 Nhóm tuổi và bữa ăn đang được biểu diễn lẫn nhau

Danh sách “Nhóm trẻ” hiển thị Nhà trẻ, Mẫu giáo và Ăn sáng. Trong chi tiết lại có Bữa sáng, Bữa trưa, Bữa xế, Bữa phụ. Đây là bằng chứng về nhãn và cách tổ chức giao diện, chưa đủ để kết luận logic đếm người nội bộ. [6][11]

Sản phẩm mới cần các chiều riêng: nhóm tuổi, lớp hoặc nhóm phục vụ, bữa ăn, gói tiền ăn, điểm trường và kho. Báo cáo phải phân biệt số trẻ duy nhất với lượt suất ăn. Nếu một trẻ ăn sáng và ăn trưa, trẻ đó chỉ là một người nhưng có hai lượt phục vụ.

### 3.2 Quy đổi đơn vị là một phần của nghiệp vụ cốt lõi

Bảng cân đối hiển thị lượng ăn một trẻ theo g, thực ăn một nhóm theo kg, hệ số thải bỏ, thực mua theo kg và thực mua theo ĐVT. Có mặt hàng dùng Hộp với quy đổi 180, đồng thời danh mục có các đơn vị Gói, Quả, Trứng. [4][11]

Không được áp dụng một hệ số chung cho tất cả hàng đóng gói. Cần quy đổi theo từng mặt hàng, phiên bản và loại đại lượng. ml và g không tự động tương đương; khi cần chuyển phải có dữ liệu tương ứng hoặc khối lượng riêng đã được xác nhận. Sai quy đổi có thể làm đúng số tiền mua nhưng sai lớn về lượng ăn và dinh dưỡng.

### 3.3 Có báo cáo chưa đồng nghĩa với đã ghi sổ kho

Phiếu kê chợ khảo sát tách Nhóm đi chợ và Nhóm xuất kho. Trong cùng kỳ khảo sát, sổ kho có những ngày không hiển thị số xuất tương ứng với nhu cầu trên phiếu. Đây là điểm cần đối chiếu ngữ cảnh, trạng thái và bộ lọc; chưa phải bằng chứng về lỗi phần mềm. [10][12]

Thiết kế mới phải phân biệt nhu cầu xuất, đặt giữ hàng, phiếu xuất nháp và phiếu đã ghi sổ. Xem hoặc in báo cáo không được âm thầm trừ tồn. Mỗi khoản chi phí tiêu hao phải dẫn ngược về dòng xuất hoặc dòng mua dùng ngay.

### 3.4 Đủ ngân sách chưa chứng minh khẩu phần đạt

Thực đơn mẫu có các cột tiền và đánh giá lượng/chất độc lập. Chi tiết cân đối có nhãn “Vượt quá định mức” và “Chưa cân đối” cùng với tiền một trẻ. Những trạng thái này phản ánh đánh giá của ứng dụng tại dữ liệu đang xem, không phải đánh giá lâm sàng hay xác nhận khẩu phần thực tế của trẻ. [6][11]

Sản phẩm mới cần bốn kiểm tra riêng: dữ liệu đủ; ngân sách hợp lệ; chỉ tiêu dinh dưỡng phù hợp cấu hình; lượng thực phẩm có thể mua và xuất. Cảnh báo phải chỉ ra chỉ tiêu, mẫu số, phạm vi ngày/bữa và dữ liệu tạo ra nó.

### 3.5 Dữ liệu quá khứ cần độc lập với danh mục hiện tại

Thực phẩm có giá theo ngày và kho có giá theo dòng nhập. [4][8] Vì vậy, sửa giá hôm nay không được thay báo cáo đã chốt của hôm trước. Công thức, hệ số quy đổi, bảng dinh dưỡng và quy tắc làm tròn cũng phải được lưu lại theo phiên bản áp dụng.

## 4 Phạm vi sản phẩm và vai trò

MVP bao gồm nhiều điểm trường trong một đơn vị, nhiều kho, năm học, danh mục, thực đơn, suất ăn tổng hợp, cân đối thủ công có gợi ý, nhập xuất tồn, trả hàng, chốt ngày và các báo cáo thiết yếu. Mô hình dữ liệu sẵn sàng tách nhiều đơn vị nếu phát triển dịch vụ dùng chung.

Chưa đưa vào MVP: thu học phí đầy đủ, cổng phụ huynh, thanh toán, sổ kế toán tổng hợp, hồ sơ sức khỏe cá nhân, tự động kê khẩu phần riêng, đặt hàng trực tiếp với nhà cung cấp, thư viện công khai và tối ưu thực đơn tự động hoàn toàn. Tiền ăn trong MVP là ngân sách và chi phí phục vụ; không mặc nhiên là tiền mặt đã thu hoặc đã chi.

| Vai trò | Công việc chính | Quyền đề xuất |
|---|---|---|
| Quản trị đơn vị | Thiết lập điểm trường, kho, tài khoản, kỳ | Cấu hình và phân quyền; không tự động có quyền sửa chứng từ đã chốt |
| Nhân sự dinh dưỡng | Chuẩn hóa thực phẩm, công thức, thực đơn | Lập nháp, tính thử, gửi duyệt; xem chỉ tiêu và cảnh báo |
| Giáo viên hoặc người tổng hợp suất | Báo số suất dự kiến và thực tế | Nhập số lượng trong phạm vi được giao |
| Thủ kho | Nhận hàng, xuất, kiểm kê, trả NCC | Ghi chứng từ kho; không thay tiêu chuẩn dinh dưỡng |
| Bếp hoặc tiếp phẩm | Xác nhận nhận và sử dụng nguyên liệu | Ghi nhận thực tế, kiểm tra và biểu mẫu tác nghiệp |
| Kế toán tiền ăn | Đối chiếu giá, ngân sách, tiêu hao | Kiểm tra chi phí, chốt sổ tiền ăn theo quyền |
| Người duyệt | Duyệt thực đơn, ngoại lệ, mở lại kỳ | Duyệt có lý do; xem lịch sử thay đổi |

Một người có thể kiêm nhiều vai trò tại trường nhỏ. Hệ thống vẫn ghi rõ người lập, người ghi sổ và người duyệt; trường hợp tự duyệt là một chính sách được cấu hình minh bạch.

## 5 Quy trình tổng thể và hợp đồng đầu vào đầu ra

Luồng đề xuất: Thiết lập → Báo suất → Lập thực đơn → Tính nhu cầu → Phân bổ kho và mua → Nhận hàng → Điều chỉnh thực tế → Xuất dùng → Chốt ngày → Báo cáo và chuyển kỳ.

### Bước 1 Thiết lập nền dữ liệu

Đầu vào: điểm trường, kho, năm học, nhóm tuổi, bữa ăn, gói tiền ăn, danh mục thực phẩm, nguồn dinh dưỡng, đơn vị và cơ cấu mục tiêu. Người phụ trách: quản trị và nhân sự dinh dưỡng.

Xử lý: chuẩn hóa mã; loại trùng; kiểm tra quy đổi; xác nhận đơn vị g/ml; xác định thời gian hiệu lực; gán phạm vi áp dụng. Đầu ra: bộ danh mục hợp lệ, giá tham chiếu và bộ quy tắc có phiên bản. Điều kiện hoàn thành: mọi thực phẩm được chọn cho thực đơn có quy đổi và nguồn dinh dưỡng hoặc trạng thái thiếu dữ liệu rõ ràng.

### Bước 2 Báo số suất ăn

Đầu vào: ngày phục vụ, điểm trường, nhóm phục vụ, bữa, số suất dự kiến và sau đó số thực tế. Nguồn ban đầu có thể nhập tổng hợp theo lớp; tích hợp điểm danh thực hiện sau.

Xử lý: tổng hợp theo nhóm tuổi và bữa; chặn số âm; ghi người và thời điểm báo; kiểm tra trùng khóa. Đầu ra: bảng suất ăn có trạng thái dự kiến/thực tế. Ngoại lệ: thay số sau giờ chốt phải tạo phiên bản và nêu tác động đến nhu cầu, ngân sách và xuất kho.

### Bước 3 Lập thực đơn ngày hoặc tuần

Đầu vào: ngày, nhóm tuổi, bữa ăn, công thức và thực đơn mẫu. Xử lý: sao chép phiên bản mẫu; sắp món vào bữa; thay món theo khả năng cung ứng; kiểm tra thiếu công thức, thiếu thành phần và mặt hàng ngừng dùng.

Đầu ra: thực đơn ngày có danh sách món và định lượng cơ sở cho một suất. Thay thực đơn mẫu chỉ áp dụng cho lần tạo mới; cập nhật ngày đã lập cần một hành động riêng có xem trước chênh lệch.

### Bước 4 Tính và cân đối

Đầu vào: thực đơn, số suất, định lượng, hao hụt, quy đổi, giá, ngân sách và tiêu chuẩn. Xử lý: mở công thức thành nguyên liệu; gộp đúng mã thực phẩm; tính lượng ăn, lượng mua, tiền và dinh dưỡng; so sánh với ràng buộc.

Đầu ra: bảng nguyên liệu theo nhóm/bữa/điểm, tổng tiền, tiền một suất, chênh lệch và cảnh báo. Màn hình cho phép thay định lượng hoặc món và xem kết quả tính thử trước khi lưu. Kết quả tính thử chưa ghi sổ kho.

### Bước 5 Phân bổ nguồn cung

Đầu vào: nhu cầu nguyên liệu và tồn khả dụng tại thời điểm phục vụ. Xử lý: đề xuất lô lấy kho, phần mua bổ sung, quy cách mua và dự phòng nếu có chính sách. Đầu ra: yêu cầu xuất kho và danh sách mua, tách theo nhà cung cấp khi đã gán.

Không dùng cờ “thực phẩm khô” để quyết định hoàn toàn hàng có đi qua kho hay không. Cùng thực phẩm có thể vừa lấy tồn vừa mua thêm. Giữ hàng chỉ làm giảm tồn khả dụng, chưa giảm tồn vật lý.

### Bước 6 Nhận hàng

Đầu vào: lượng và giá nhận thực tế, ngày, nhà cung cấp, kho, đơn vị, thông tin lô và kiểm tra nhận hàng. Xử lý: đối chiếu dự kiến; chấp nhận một phần hoặc từ chối; ghi nhận thay thế; tạo chứng từ.

Đầu ra: phiếu nhận/nhập đã ghi sổ, lô tồn và bằng chứng nhận hàng. Hàng mua dùng ngay vẫn có chứng từ liên kết với ngày ăn; không được vừa tính mua dùng ngay vừa tính lại chi phí xuất kho cho cùng lượng.

### Bước 7 Điều chỉnh thực tế

Đầu vào: số suất thực tế, lượng thực nhận, đơn giá, món thay thế. Xử lý: tính lại với dữ liệu mới; so sánh dự kiến/thực tế; giải phóng hoặc bổ sung phần giữ hàng; ghi lý do sai khác.

Đầu ra: phiên bản thực tế được xác nhận. Nếu đã xuất trước khi thay số suất, phải xử lý trả bếp hoặc phần dư bằng nghiệp vụ riêng; không âm thầm chia lại lượng xuất đã ghi sổ.

### Bước 8 Xuất và sử dụng

Đầu vào: nhu cầu đã xác nhận và lô có thể xuất. Xử lý: kiểm tra đủ tồn ngay trong giao dịch; ghi xuất theo lô; liên kết ngày, bữa và nhóm; ghi phần trả lại hoặc hao hụt thực tế nếu phát sinh.

Đầu ra: phiếu xuất, sổ kho, giá trị nguyên liệu tiêu hao. Bếp ghi hồ sơ kiểm tra/chế biến/lưu mẫu theo mẫu đã được đơn vị phê duyệt. Các thời hạn và yêu cầu chuyên môn phải được xác minh trước triển khai, không suy ra chỉ từ tên mẫu trên trang.

### Bước 9 Chốt ngày

Đầu vào: suất thực tế, phiên bản thực đơn, chứng từ mua và xuất, khoản bổ trợ/dịch vụ, số dư được phép chuyển. Xử lý: đối chiếu lượng, tiền, trạng thái kho và cảnh báo còn mở; yêu cầu lý do với ngoại lệ được phép.

Đầu ra: bản chốt ngày bất biến và số dư chuyển theo từng quỹ/gói tiền ăn. Mở lại ngày phải có quyền, lý do và phiên bản thay thế; báo cáo cũ vẫn truy xuất được.

### Bước 10 Báo cáo và chuyển kỳ

Đầu vào: ngày đã chốt, bộ lọc kỳ/điểm/nhóm/bữa/kho và phiên bản biểu mẫu. Xử lý: tổng hợp, đối chiếu, xuất tệp. Đầu ra: hồ sơ ngày, tổng hợp tuần/tháng, sổ kho và biên bản chuyển kỳ.

Chuyển năm học không tạo thêm tồn vật lý. Với mô hình sổ kho liên tục, năm học mới nhận số dư mở đầu bằng một mốc báo cáo; nếu dùng bút toán chuyển, hai vế phải liên kết và chỉ thực hiện một lần.

## 6 Đặc tả dữ liệu đầu vào

| Nhóm dữ liệu | Trường tối thiểu | Kiểm tra bắt buộc |
|---|---|---|
| Bối cảnh | Đơn vị, điểm trường, năm học, kho, ngày | Kho thuộc đúng đơn vị; ngày thuộc kỳ được phép |
| Phục vụ | Nhóm tuổi, nhóm phục vụ, bữa, số suất, trạng thái | Số nguyên không âm; không trùng cùng khóa |
| Thực phẩm | Mã, tên, nguồn, đơn vị mua, đơn vị chuẩn, quy đổi | Mã ổn định; hệ số dương; không đổi g với ml thiếu căn cứ |
| Dinh dưỡng | Giá trị từng chất, đơn vị, cơ sở trên 100 g hoặc 100 ml, trạng thái thực phẩm | Phân biệt sống/chín và phần ăn được; thiếu dữ liệu không bằng 0 |
| Hao hụt | Tỷ lệ thải bỏ và cơ sở áp dụng | Từ 0 đến dưới 100%; không tính hao hụt hai lần |
| Giá | Giá, đơn vị, nguồn, ngày hiệu lực, phạm vi điểm/NCC nếu có | Không âm; giá 0 cần xác nhận; không chồng hiệu lực cùng khóa |
| Công thức | Món, phiên bản, nguyên liệu, lượng chuẩn, số suất chuẩn, bữa phù hợp | Lượng dương; nêu rõ lượng trước hay sau sơ chế |
| Tiêu chuẩn | Nhóm tuổi, phạm vi ngày/bữa, ngưỡng, đơn vị, nguồn và phiên bản | Mẫu số đánh giá rõ ràng; hiệu lực và người duyệt |
| Kho | Phiếu, dòng hàng, lô nội bộ, ngày nhận, lượng, giá vốn | Không xuất vượt tồn; truy về phiếu nguồn |
| Ngân sách | Gói tiền ăn, mức thu phân bổ, dịch vụ, bổ trợ, số dư | Phân biệt khoản/ngày và khoản/suất; không tính trùng gói |

Ngày phục vụ lưu dưới dạng ngày lịch địa phương. Thời điểm tạo/sửa là dấu thời gian riêng. Đơn vị tiền là VND; lượng và tiền dùng số thập phân chính xác với quy tắc làm tròn thống nhất, không lấy giá trị đã làm tròn hiển thị để tính ngược.

## 7 Quy tắc tính toán và ví dụ kiểm chứng

Các quy tắc dưới đây là hợp đồng tính toán đề xuất. Nhãn trường tương ứng đã được quan sát ở bảng cân đối [11]; thuật toán nội bộ PMS chưa được xác minh đầy đủ.

### 7.1 Từ một suất đến lượng mua

Lượng ăn được của nhóm bằng lượng ăn được một suất nhân số suất. Lượng nguyên liệu trước sơ chế bằng lượng ăn được chia cho tỷ lệ còn lại sau thải bỏ. Số đơn vị mua bằng lượng nguyên liệu trước sơ chế chia cho lượng chuẩn trong một đơn vị mua. Mọi đại lượng phải được đưa về cùng loại đơn vị trước khi tính.

Ví dụ giả lập để kiểm thử: 100 suất, mỗi suất cần 40 g phần ăn được, thải bỏ 20%, mua theo kg. Kết quả là 4.000 g ăn được và 5 kg trước sơ chế. Nếu kho có thể cấp 2 kg thì cần mua thêm 3 kg. Ở giá 30.000 đồng/kg, chi mua thêm là 90.000 đồng. Nếu 2 kg trong kho có giá vốn 28.000 đồng/kg, tổng chi phí nguyên liệu sử dụng là 146.000 đồng, không phải 90.000 đồng.

Hàng mua theo gói phải làm tròn theo quy cách mua. Phần dư sau làm tròn thuộc tồn kho hoặc được ghi nhận sử dụng thực tế, không tự động cộng hết vào dinh dưỡng của bữa.

### 7.2 Dinh dưỡng theo cơ sở dữ liệu

Đóng góp một chất của thực phẩm bằng lượng ăn được theo đúng đơn vị cơ sở chia 100, rồi nhân giá trị chất trên 100 đơn vị. Tổng món là tổng nguyên liệu; tổng bữa là tổng món; tổng ngày là tổng các bữa thuộc phạm vi phục vụ.

Năng lượng và tỷ lệ P:L:G phải tuân theo phương pháp đã được người phụ trách chuyên môn xác nhận. Cần lưu hệ số và cách tính trong phiên bản bộ quy tắc; chưa hardcode hệ số quy đổi năng lượng chỉ dựa trên các cột nhìn thấy. Có thể lưu năng lượng công bố trong bảng thực phẩm cùng năng lượng quy đổi để đối chiếu khi phương pháp cho phép.

Phân biệt tỷ lệ năng lượng từng bữa trong tổng năng lượng tại trường với tỷ lệ đáp ứng nhu cầu cả ngày. Nếu mẫu số bằng 0 hoặc thiếu dữ liệu, kết quả là “chưa đủ dữ liệu”, không trả về 0% hay “đạt”. Không dùng trung bình tỷ lệ của các nhóm để thay cho tỷ lệ tính từ tổng lượng và đúng mẫu số.

### 7.3 Ngân sách và tiền ăn

Ngân sách thực phẩm khả dụng đề xuất bằng khoản tiền ăn được phân bổ cộng bổ trợ cộng số dư được phép chuyển, trừ phần dịch vụ đã tách riêng. Mỗi khoản có dấu, đơn vị và phạm vi rõ ràng. Chủ nghiệp vụ phải chốt việc dịch vụ nằm trong hay ngoài mức tiền ăn trước khi phát triển.

Chi phí thực phẩm thực tế bằng giá vốn nguyên liệu xuất dùng cộng chi mua dùng ngay chưa đi qua giá vốn kho, trừ giá trị trả lại hợp lệ. Chênh lệch cuối ngày bằng ngân sách khả dụng trừ chi phí. Chi phí một suất dùng số suất của đúng nhóm/gói; ngày có 0 suất không thực hiện phép chia.

Gói ăn chính bao gồm trưa, xế và phụ chỉ được tính ngân sách một lần cho mỗi suất gói. Không nhân toàn bộ mức tiền gói với số bữa. Tiền mặt đã thu, công nợ phụ huynh và thanh toán NCC thuộc phân hệ khác hoặc giai đoạn mở rộng.

### 7.4 Kho và giá vốn

Tồn cuối bằng tồn đầu cộng nhập và trả về, trừ xuất và trả NCC, cộng hoặc trừ điều chỉnh được duyệt. Tồn khả dụng bằng tồn vật lý trừ lượng đang giữ và lượng không được sử dụng. Sổ kho là nguồn sự thật; màn hình tồn là kết quả tính hoặc bản tổng hợp có thể tái tạo.

Đề xuất MVP theo dõi giá vốn đích danh theo lô xuất được phân bổ, vì giao diện tham chiếu có giá và ngày nhập theo từng dòng [8]. Cách chọn lô vật lý và cách định giá là hai quyết định riêng. Nếu bổ sung hạn dùng, ưu tiên lô phù hợp hạn dùng; chưa khẳng định PMS đang dùng FIFO, bình quân hay phương pháp khác.

### 7.5 Làm tròn và phân bổ

Giữ độ chính xác nội bộ của lượng ít nhất đến mức đáp ứng nguyên liệu dùng rất nhỏ; trình bày theo ĐVT. Tiền trên chứng từ làm tròn theo quy tắc thống nhất được kế toán xác nhận. Khi phân bổ tổng tiền cho nhiều nhóm, phần dư làm tròn được phân bổ có thứ tự ổn định; tổng chi tiết phải đúng bằng tổng chứng từ.

## 8 Trạng thái và điểm kiểm soát

| Đối tượng | Trạng thái đề xuất | Điều kiện chuyển |
|---|---|---|
| Thực đơn ngày | Nháp → Đã tính → Đã duyệt → Đã xác nhận thực tế → Đã chốt | Kiểm tra số suất, quy đổi, giá, chỉ tiêu và chứng từ liên quan |
| Yêu cầu kho | Đề xuất → Đã giữ hàng → Đã xuất hoặc Đã hủy | Giữ hàng có thời hạn; xuất kiểm tra lại tồn |
| Phiếu kho | Nháp → Đã ghi sổ → Đã đảo | Sau ghi sổ không sửa âm thầm; đảo có chứng từ liên kết |
| Ngày ăn | Đang lập → Đang thực hiện → Chờ đối chiếu → Đã chốt | Không còn sai lệch chưa giải thích và chứng từ bắt buộc còn nháp |
| Báo cáo | Xem trước hoặc Bản đã chốt | In bản đã chốt từ cùng phiên bản dữ liệu |
| Kỳ | Mở → Đã khóa | Mở lại cần quyền, lý do và nhật ký |

Trạng thái đánh giá dinh dưỡng không thay thế trạng thái vận hành. Một thực đơn có thể đã được tính nhưng còn cảnh báo; bản nháp có thể được lưu để tiếp tục xử lý. Các lỗi dữ liệu trọng yếu phải chặn duyệt và chốt; ngoại lệ nghiệp vụ cho phép phải được định nghĩa trước.

Nếu hai người cùng sửa một thực đơn, người lưu sau nhận thông báo xung đột và bản so sánh. Nếu nhấn ghi sổ hai lần hoặc gửi lại sau mất mạng, cùng mã yêu cầu chỉ tạo một giao dịch. Nếu lỗi giữa chừng khi xuất nhiều dòng, toàn bộ lần xuất phải thành công hoặc hoàn tác.

## 9 Mô hình dữ liệu đề xuất

Các tên sau là mô hình cho sản phẩm mới, không phải bảng dữ liệu trích từ PMS.

| Cụm | Thực thể | Quan hệ và nội dung quan trọng |
|---|---|---|
| Tổ chức | Organization, Campus, SchoolYear, Warehouse | Kho thuộc điểm và đơn vị; năm học là phạm vi quản lý |
| Phục vụ | AgeGroup, ServingGroup, MealType, MealPackage | Tách nhóm tuổi khỏi bữa và gói ngân sách |
| Danh mục | Food, FoodUnit, FoodConversion, Supplier | Đơn vị và quy đổi riêng cho thực phẩm, có hiệu lực |
| Nguồn số liệu | NutritionDataset, FoodNutrient, NutritionRule | Phiên bản, nguồn, đơn vị cơ sở, người xác nhận |
| Giá | FoodPrice | Giá có ngày hiệu lực, đơn vị, nguồn và phạm vi |
| Công thức | Recipe, RecipeVersion, RecipeIngredient | Một phiên bản món có nhiều nguyên liệu |
| Mẫu | MenuTemplate, TemplateMeal, TemplateDish | Gắn phiên bản món và nhóm tuổi phù hợp |
| Ngày ăn | MealDay, AttendanceCount, DailyMenu, DailyDish | Khóa theo đơn vị, điểm, ngày, nhóm, bữa hoặc gói thích hợp |
| Tính toán | CalculationRun, IngredientRequirement, NutrientResult | Lưu dấu phiên bản và đầu vào để tái tính |
| Cung ứng | PurchaseRequirement, GoodsReceipt, ReceiptLine | Nhu cầu khác với số thực nhận |
| Kho | StockLot, Reservation, StockMovement, IssueAllocation | Dòng xuất liên kết lô nhập; ledger không ghi đè |
| Tiền ăn | BudgetAllocation, MealCost, CarryBalance, DayClosure | Phân bổ quỹ, chi phí, số dư và bản chốt |
| Hồ sơ | FoodCheck, SampleLog, ReportSnapshot | Tác nghiệp thực tế và bản báo cáo theo phiên bản |
| Kiểm soát | UserRole, Approval, AuditEvent | Quyền theo đơn vị/điểm; lịch sử ai, lúc nào, trước/sau |

Chuỗi truy vết tối thiểu: Báo cáo → Bản chốt → Kết quả tính → Thực đơn/nguyên liệu → Phiếu xuất hoặc mua dùng ngay → Lô nhận. Chuỗi dinh dưỡng: Kết quả chất → Lượng ăn được → Quy đổi và hao hụt → Phiên bản công thức → Phiên bản nguồn dinh dưỡng.

Không nối dữ liệu bằng tên thực phẩm hoặc tên thực đơn. Không lưu danh sách nhiều nhóm trong một chuỗi phân cách dấu chấm phẩy làm mô hình chính. Dùng bảng quan hệ; chuỗi ghép chỉ dùng hiển thị.

## 10 Đặc tả màn hình trọng tâm

### 10.1 Bảng điều hành ngày ăn

Chọn điểm trường và ngày, hiển thị số suất dự kiến/thực tế, tình trạng thực đơn, thiếu hàng, chứng từ chưa chốt và chênh lệch tiền. Mỗi cảnh báo mở đúng dòng dữ liệu cần sửa. Người dùng thấy bước tiếp theo thay vì phải nhớ thứ tự các phân hệ.

### 10.2 Danh mục thực phẩm

Tìm theo mã/tên; bộ lọc trạng thái, nguồn và thiếu dữ liệu. Biểu mẫu tách tên/mã, đơn vị mua, quy đổi, hao hụt, dinh dưỡng, giá và nhà cung cấp. Khi thay quy đổi, hiển thị các công thức đang dùng; không áp dụng hồi tố cho ngày đã chốt.

### 10.3 Công thức và thực đơn mẫu

Mỗi món có khẩu phần cơ sở, thành phần và lượng ăn được. Tổng tiền, chất và năng lượng cập nhật khi thay thành phần. Thực đơn mẫu ghép món theo bữa, có bộ tiêu chuẩn và giá tham chiếu. Nhân bản tạo mã mới; sửa mẫu tạo phiên bản mới.

### 10.4 Cân đối ngày

Phần đầu: ngày, điểm, nhóm, bữa/gói, số suất, phiên bản. Phần giữa: món và bảng nguyên liệu với lượng ăn một suất, lượng ăn nhóm, hao hụt, lượng cần dùng, lượng lấy kho, lượng mua thêm, ĐVT, giá và thành tiền. Phần kết quả: ngân sách, chi phí, chênh lệch, chỉ tiêu và nguồn dữ liệu.

Thao tác rõ nghĩa: Lưu nháp, Tính lại, Gửi duyệt, Xác nhận thực tế, Tạo phiếu xuất và Chốt ngày. Tính lại phải thể hiện phần thay đổi; không tự động ghi sổ. Người dùng có thể mở giải thích của một con số ngay từ ô kết quả.

### 10.5 Nhập xuất tồn

Phiếu có phần chung và nhiều dòng hàng. Tồn thể hiện cả số vật lý, đã giữ, khả dụng, lô, đơn giá và thời điểm. Trả NCC tham chiếu lô; kiểm kê tạo chênh lệch với lý do. Sổ tháng có thể mở xuống giao dịch nguồn.

### 10.6 Báo cáo

Chọn kỳ, ngày, nhóm, điểm, bữa/gói và kho; hiện trạng thái dữ liệu. Xem trước và tải xuống phải dùng cùng bộ lọc. Bản chưa chốt có nhãn rõ; bản đã chốt hiển thị phiên bản và thời điểm chốt. Tên cá nhân chỉ xuất khi cần cho mẫu và đúng quyền.

## 11 Danh mục đầu ra và tiêu chí đối chiếu

Các loại mẫu sau được quan sát ở giao diện hoặc hộp phiếu kê chợ. [12] Cấu trúc chi tiết của từng tệp xuất cần được chủ nghiệp vụ xác nhận ở tuần đầu.

| Đầu ra | Nguồn dữ liệu đề xuất | Tiêu chí đúng |
|---|---|---|
| Thực đơn ngày và tuần | Món theo ngày, nhóm và bữa | Tên món, nhóm và lịch đúng phiên bản |
| Bảng cân đối khẩu phần | CalculationRun và nguồn quy tắc | Truy ngược từng chất và lượng; nêu mẫu số |
| Phiếu kê chợ | Nhu cầu mua và xuất theo nhóm | Tách mua mới/xuất kho; tổng nhóm bằng tổng phiếu |
| Phiếu kê hàng chợ | Phần mua mới | Lượng và giá khớp yêu cầu đã xác nhận |
| Phiếu tiếp nhận và KTCLTP | Thực nhận và kiểm tra | Không tự điền “đạt” nếu chưa có ghi nhận |
| M1 thực phẩm tươi và khô | Dòng nhận, loại và kiểm tra | Đủ liên kết NCC và chứng từ nguồn |
| M2 và M3 kiểm tra chế biến/phục vụ | Bữa, món và ghi nhận tác nghiệp | Thời điểm và người kiểm tra có căn cứ |
| M4 nhãn mẫu và M5 lưu hủy mẫu | SampleLog | Mã mẫu, món, thời điểm nhất quán |
| Phiếu xuất kho | Chứng từ đã ghi sổ | Lượng, lô và giá vốn khớp ledger |
| Sổ tính tiền ăn | Suất, ngân sách, tiêu hao, số dư | Thu phân bổ khác chi phí; chuyển dư không trùng |
| Calo tuần | Các kết quả ngày đúng nhóm/bữa | Nêu cách tổng hợp; ngày nghỉ không làm sai mẫu số |
| Sổ kho tháng | StockMovement và số dư đầu kỳ | Đầu + nhập − xuất ± điều chỉnh = cuối |

Không coi nhãn “biểu mẫu chuẩn theo mẫu của bộ” trên giao diện là bằng chứng đủ về tuân thủ hiện hành. Trước phát hành phải đối chiếu mẫu và nguồn chuyên môn đang áp dụng tại đơn vị, lưu phiên bản mẫu và người duyệt.

## 12 Kiến trúc triển khai đề xuất

MVP nên là ứng dụng web với một hệ thống phía máy chủ chia module rõ ràng, một cơ sở dữ liệu quan hệ và nơi lưu tệp riêng. Chưa cần chia nhiều dịch vụ độc lập. Cách này giúp giao dịch kho, bản chốt và phân quyền được kiểm soát thống nhất, đồng thời giảm công vận hành ban đầu.

Tách bộ máy tính khẩu phần khỏi giao diện. Bộ máy nhận một bộ dữ liệu có phiên bản và trả lượng, chất, tiền, cảnh báo cùng dấu vết tính; không tự ghi sổ. Ghi sổ và phê duyệt do lớp nghiệp vụ thực hiện. Báo cáo đọc bản chốt để tránh thay đổi số khi danh mục cập nhật.

Các nhóm giao tiếp nghiệp vụ cần đặc tả: danh mục; công thức; số suất; thực đơn ngày; tính thử; phê duyệt; nhận hàng; giữ hàng; xuất dùng; đảo chứng từ; chốt ngày; xuất báo cáo. Các thao tác quan trọng nhận mã chống lặp và phiên bản hiện tại; báo lỗi rõ trường, nguyên nhân và cách xử lý. Đây là hợp đồng sản phẩm mới, không phải API đã phát hiện trên qlmn.vn.

Yêu cầu vận hành đề xuất: lưu nhật ký thay đổi; sao lưu tự động; diễn tập khôi phục trước thí điểm; không đưa dữ liệu cá nhân vào log lỗi; tách môi trường kiểm thử và thật. Mục tiêu ban đầu để đo: tính lại thực đơn ngày dưới 2 giây ở phân vị 95 với bộ 1.000 suất và 200 dòng nguyên liệu; xuất báo cáo tháng dưới 30 giây ở bộ tải đã thống nhất. Các ngưỡng phải được đo trên cấu hình triển khai, không là cam kết năng lực hiện có.

Phân quyền phải kiểm tra phía máy chủ theo đơn vị và điểm trường cho mọi đọc/ghi/tải tệp. Số giấy tờ và liên hệ cá nhân của NCC chỉ lưu khi nghiệp vụ yêu cầu, có quyền xem riêng và che trên màn hình tổng hợp. Đăng nhập, nhật ký truy cập, thời hạn lưu và khôi phục là hạng mục nghiệm thu, không để sau khi thí điểm.

## 13 Kế hoạch triển khai theo tuần

Giả định nguồn lực: 1 người phân tích nghiệp vụ kiêm quản lý sản phẩm, 2 lập trình viên toàn thời gian, 1 kiểm thử từ tuần 3, thiết kế trải nghiệm bán thời gian và chuyên gia dinh dưỡng/kế toán của trường tham gia xác nhận. Thiếu người xác nhận nghiệp vụ sẽ ảnh hưởng đường găng dù lập trình đủ người.

| Tuần | Công việc | Đầu ra bàn giao | Cổng nghiệm thu |
|---|---|---|---|
| 1 | Phỏng vấn người dùng; xác minh nguồn số trẻ, giá, kho và tiền ăn; thu bộ mẫu | Sơ đồ nghiệp vụ, danh mục quyết định, bộ dữ liệu mẫu đã khử định danh | Chốt nghĩa từng con số và vai trò |
| 2 | Chốt mô hình dữ liệu, trạng thái, nguyên tắc tính; thiết kế màn hình | Đặc tả tính, sơ đồ quan hệ, nguyên mẫu giao diện, backlog | Tính tay và nguyên mẫu được xác nhận |
| 3 | Xây tổ chức, quyền, năm học, danh mục và nhập dữ liệu | Nền tảng sử dụng được, kiểm tra dữ liệu đầu vào | Không truy cập chéo đơn vị/điểm |
| 4 | Công thức món, phiên bản, thực đơn mẫu, số suất | Tạo và sao chép được ngày ăn | Sửa mẫu không đổi ngày đã tạo |
| 5 | Bộ tính lượng, quy đổi, hao hụt, tiền | Một ngày ăn tính đúng với dữ liệu giả lập | Bộ ca tính số vượt kiểm thử |
| 6 | Dinh dưỡng, ngưỡng, giải thích và cân đối thủ công | Màn hình cân đối hoàn chỉnh và snapshot tính | Thiếu dữ liệu không bị đánh giá đạt |
| 7 | Nhận hàng, lô, sổ kho, tồn và giữ hàng | Luồng nhập và phân bổ nguồn cung | Tồn đúng theo giao dịch nguồn |
| 8 | Xuất dùng, trả NCC, đảo chứng từ, cập nhật thực tế | Chu trình từ nhu cầu đến tiêu hao | Không xuất trùng hoặc vượt tồn khi đồng thời |
| 9 | Ngân sách, bổ trợ/dịch vụ, chốt ngày, mở lại | Sổ tiền ăn và quy trình duyệt | Tổng nhóm bằng tổng ngày; số dư truy vết |
| 10 | Phiếu kê chợ, phiếu xuất, thực đơn, calo, sổ kho và biểu mẫu ưu tiên | Bộ báo cáo có phiên bản | Báo cáo khớp bản chốt và mẫu đã duyệt |
| 11 | Nhập chuyển dữ liệu, kiểm thử toàn luồng, phân quyền và tải | Báo cáo UAT, danh sách lỗi, hướng dẫn | Không còn lỗi tính tiền/kho hoặc quyền nghiêm trọng |
| 12 | Sửa lỗi UAT, diễn tập khôi phục, đào tạo và chuẩn bị thật | Bản phát hành, hướng dẫn vận hành, kế hoạch quay lui | Chủ nghiệp vụ ký chấp nhận thí điểm |
| 13–14 | Chạy song song tại một điểm trường | Đối chiếu hằng ngày và báo cáo thí điểm | Ít nhất 10 ngày phục vụ đạt điều kiện chuyển chính thức |

Đường găng: xác nhận công thức và nguồn dữ liệu → bộ tính → ghi sổ kho → chốt ngày → đối chiếu báo cáo. Không rút ngắn bằng cách hoãn kiểm thử quy đổi, kho đồng thời hoặc chênh lệch tiền.

Kết thúc tuần 2 cần cập nhật ước lượng theo độ phức tạp thực tế. Nếu thời gian bắt buộc ngắn hơn, giảm số biểu mẫu và tích hợp ở bản đầu, giữ nguyên các kiểm soát dữ liệu và tiền/kho.

## 14 Backlog để giao việc

P0 là bắt buộc để vận hành MVP; P1 là bổ sung ngay sau khi chu trình lõi ổn định. Mỗi mục cần người chịu trách nhiệm và minh chứng nghiệm thu trong công cụ quản lý dự án.

| ID | Mức | Hạng mục và người phụ trách | Phụ thuộc | Kết quả nghiệm thu |
|---|---|---|---|---|
| B01 | P0 | Phân tích chốt từ điển nghiệp vụ | Không | Nhóm tuổi, bữa, suất, gói, giá vốn được định nghĩa |
| B02 | P0 | Nghiệp vụ xác nhận dữ liệu dinh dưỡng và phương pháp | B01 | Có nguồn, phiên bản và bộ ví dụ tính tay |
| B03 | P0 | Kỹ thuật thiết lập tổ chức và quyền | B01 | Kiểm tra phạm vi mọi thao tác và xuất tệp |
| B04 | P0 | Kỹ thuật xây thực phẩm và quy đổi | B02 B03 | Thiếu quy đổi bị chặn; nguồn dữ liệu truy vết |
| B05 | P0 | Kỹ thuật xây lịch sử giá | B04 | Giá ngày mới không đổi kết quả đã chốt |
| B06 | P0 | Kỹ thuật xây công thức có phiên bản | B04 | Định lượng cơ sở và nguyên liệu kiểm chứng được |
| B07 | P0 | Kỹ thuật xây thực đơn mẫu và ngày | B06 | Sao chép độc lập; nhóm và bữa tách biệt |
| B08 | P0 | Kỹ thuật nhập suất dự kiến và thực tế | B01 B03 | Không trùng khóa; không tính gói nhiều lần |
| B09 | P0 | Kỹ thuật xây bộ tính lượng và tiền | B04 B05 B07 B08 | Đạt bộ test số và làm tròn |
| B10 | P0 | Kỹ thuật xây tính chất và cảnh báo | B02 B09 | Đúng cơ sở 100 g/ml và mẫu số |
| B11 | P0 | Thiết kế và kỹ thuật làm màn hình cân đối | B09 B10 | Xem trước chênh lệch, nguồn giá và thiếu dữ liệu |
| B12 | P0 | Kỹ thuật nhập kho và lô | B03 B04 | Phiếu ghi sổ một lần và có thể đảo |
| B13 | P0 | Kỹ thuật giữ hàng và đề xuất mua | B09 B12 | Cộng mua và xuất bằng nhu cầu; giữ không trừ tồn vật lý |
| B14 | P0 | Kỹ thuật xuất dùng và chống xung đột | B12 B13 | Hai yêu cầu đồng thời không làm âm kho |
| B15 | P0 | Kỹ thuật trả hàng và kiểm kê điều chỉnh | B12 B14 | Có chứng từ nguồn, lý do và người duyệt |
| B16 | P0 | Nghiệp vụ và kỹ thuật chốt ngân sách | B01 B09 B14 | Không tính mua và xuất hai lần |
| B17 | P0 | Kỹ thuật chốt ngày và mở lại | B10 B16 | Có version, quyền và nhật ký |
| B18 | P0 | Kỹ thuật phiếu kê chợ và xuất kho | B13 B14 B17 | Tổng chi tiết khớp tổng chứng từ |
| B19 | P0 | Kỹ thuật sổ tiền ăn và calo tuần | B10 B17 | Đúng nhóm, kỳ, ngày nghỉ và mẫu số |
| B20 | P0 | Kỹ thuật sổ kho và chuyển năm | B14 B15 | Tái tạo tồn; chuyển không nhân đôi |
| B21 | P0 | Nghiệp vụ chốt mẫu kiểm tra và lưu mẫu | B01 | Mẫu, trường, thời điểm và nguồn áp dụng được duyệt |
| B22 | P0 | Kỹ thuật ghi nhận và xuất hồ sơ thiết yếu | B21 B17 | Không tự tạo xác nhận kiểm tra từ thực đơn |
| B23 | P0 | Kiểm thử UAT và chuyển dữ liệu | B18 B19 B20 B22 | Đối chiếu tập mẫu và báo cáo lỗi |
| B24 | P0 | Vận hành sao lưu và khôi phục | B03 | Khôi phục thử và xác nhận dữ liệu |
| B25 | P1 | Tích hợp điểm danh | B08 B23 | Nhập đồng bộ có đối soát và chống lặp |
| B26 | P1 | Thư viện chia sẻ được kiểm duyệt | B06 B07 | Quyền, nguồn và kiểm duyệt trước dùng |
| B27 | P1 | Gợi ý tối ưu thực đơn có ràng buộc | B10 B11 B23 | Giải thích được đề xuất; người phụ trách duyệt |

## 15 Kế hoạch kiểm thử và nghiệm thu

Đối chiếu bằng dữ liệu giả lập có đáp án, sau đó bằng các ngày đại diện đã khử định danh và được chủ nghiệp vụ xác nhận. Không dùng các số trên một màn hình làm chuẩn duy nhất khi chưa biết quy tắc nguồn.

| Ca | Tình huống | Kết quả cần đạt |
|---|---|---|
| T01 | 100 suất × 40 g, thải bỏ 20% | 4 kg ăn được; 5 kg trước sơ chế |
| T02 | Một hộp 180 ml, dữ liệu chất trên 100 ml | Tính theo 1,8 lần giá trị chất mỗi hộp |
| T03 | Dữ liệu chất theo g nhưng lượng chỉ có ml | Báo thiếu cơ sở chuyển; không tự coi bằng nhau |
| T04 | Thải bỏ 100%, quy đổi 0 hoặc thiếu | Chặn tính và chỉ đúng dòng lỗi |
| T05 | Giá 0 chưa được xác nhận | Cảnh báo thiếu giá; không tự coi là miễn phí |
| T06 | Cùng nguyên liệu xuất hiện trong nhiều món | Gộp đúng mã; vẫn truy về từng món |
| T07 | Một trẻ có hai bữa | Hai lượt suất; không báo hai trẻ duy nhất |
| T08 | Gói ăn chính gồm trưa, xế, phụ | Ngân sách gói chỉ tính một lần |
| T09 | Số suất bằng 0 hoặc giảm sau dự kiến | Không chia 0; lập phiên bản và điều chỉnh giữ hàng |
| T10 | Hai lô cùng thực phẩm khác giá | Chi phí theo phân bổ lô; không dùng giá mới cho lô cũ |
| T11 | Hai người xuất cùng lượng tồn cuối | Chỉ giao dịch đủ tồn được ghi sổ |
| T12 | Mất mạng và gửi lại yêu cầu xuất | Chỉ một phiếu và một lần trừ tồn |
| T13 | In phiếu kê chợ nhiều lần | Không thay tồn, tiền hay trạng thái duyệt |
| T14 | Mua đóng gói dư nhu cầu | Phần dư không cộng vào lượng ăn; có số dư tồn |
| T15 | Nhận rồi xuất dùng trong cùng ngày | Chi phí sử dụng không cộng cả hai lần |
| T16 | Sửa giá, quy đổi hoặc công thức sau chốt | Báo cáo chốt cũ không đổi |
| T17 | Đảo phiếu và mở lại ngày | Có chuỗi liên kết; số dư khớp; bản cũ truy xuất được |
| T18 | Tuần có ngày nghỉ và nhóm khác số suất | Tổng hợp đúng phương pháp và nêu rõ mẫu số |
| T19 | Truy cập dữ liệu điểm/đơn vị khác | Bị từ chối cả trên màn hình và tải tệp |
| T20 | Chuyển tồn năm học chạy lại | Không tạo thêm tồn; trả kết quả đã thực hiện |
| T21 | Dinh dưỡng thiếu một nguyên liệu | Kết quả đánh dấu chưa đủ; không hiện đạt |
| T22 | Làm tròn và phân bổ nhiều nhóm | Tổng nhóm bằng tổng phiếu đến đơn vị tiền đã thống nhất |
| T23 | Khôi phục bản sao lưu | Đủ chứng từ, phiên bản và liên kết báo cáo |

Điều kiện phát hành: toàn bộ ca P0 đạt; không còn lỗi nghiêm trọng về tiền, kho, dữ liệu hoặc quyền; người nghiệp vụ xác nhận các mẫu; có cách quay lui; hoàn tất đào tạo theo vai trò. Từng phép tính phải đạt đáp án sau quy tắc làm tròn đã duyệt, không dùng một mức sai số tiền chung để che khác biệt công thức.

Trong thí điểm, đối chiếu tối thiểu 10 ngày phục vụ gồm ngày thường, thay số suất, đổi giá, dùng hai lô và trả hàng. Mỗi ngày phải cân được tiền, lượng kho và báo cáo; mọi chênh lệch có nguyên nhân và người xác nhận trước khi chuyển chính thức.

## 16 Chuyển dữ liệu và vận hành thí điểm

Trước chuyển dữ liệu, lập bảng ánh xạ mã thực phẩm, nhà cung cấp, đơn vị, nhóm và điểm trường. Nhãn “Ăn sáng” phải được ánh xạ theo bữa/gói và tách nhóm tuổi khi đủ thông tin; không tự gán tuổi cho toàn bộ nhóm đó.

Nhập thử danh mục, nguồn dinh dưỡng, công thức, mẫu và tồn đầu. Với mỗi tệp, có xem trước, số dòng hợp lệ, lỗi theo dòng và chống nhập lặp. Chuẩn hóa số thập phân, định dạng ngày và tên đồng nghĩa; giữ mã nguồn để đối chiếu.

Tồn đầu lấy từ biên bản kiểm kê đã duyệt tại mốc chuyển, có giá trị theo lô hoặc cách định giá đã thống nhất. Không chỉ sao chép tổng lượng mà bỏ giá vốn. Lịch sử cũ có thể lưu kho tra cứu ở giai đoạn đầu; không buộc tái dựng toàn bộ nếu nguồn không đủ.

Chạy song song tại một điểm trường: hệ thống đang dùng tiếp tục là nơi ghi nhận chính thức trong thời gian đối chiếu. Đội dự án ghi các số đã xác nhận vào môi trường thí điểm, đối chiếu ngày và xử lý khác biệt. Thời điểm đổi hệ thống chính thức phải được chỉ định để tránh hai nơi cùng phát sinh chứng từ thật.

Quay lui khi phát hiện sai tiền/kho hoặc thiếu khả năng vận hành: dừng ghi mới ở hệ thống mới, bảo toàn nhật ký, xuất danh sách phát sinh sau mốc chuyển, đối chiếu rồi nhập lại vào nơi được chọn làm nguồn chính thức. Không phục hồi một bản sao lưu cũ rồi bỏ mất giao dịch đã phát sinh.

## 17 Rủi ro và quyết định phải chốt

| Rủi ro | Hậu quả | Giảm thiểu và người chốt |
|---|---|---|
| Quy đổi gói/quả/trứng không đúng | Tiền có thể đúng nhưng lượng/chất sai | Dinh dưỡng xác nhận từng mặt hàng có quy cách |
| Nguồn dinh dưỡng không rõ sống/chín hoặc g/ml | Kết quả không so sánh được | Người chuyên môn duyệt bộ dữ liệu và cơ sở tính |
| Chưa biết khi nào trừ kho | Trừ sớm, trừ trùng hoặc bỏ sót | Thủ kho chốt trigger và trạng thái ở tuần 1 |
| Nhóm tuổi lẫn bữa/gói | Đếm trùng và sai ngân sách | Phân tích chốt mô hình và ánh xạ dữ liệu |
| Giá quá khứ bị ghi đè | Báo cáo đã duyệt thay đổi | Kỹ thuật lưu snapshot và kiểm thử hồi tố |
| Tiền dịch vụ/bổ trợ chưa rõ phạm vi | Sai số dư cuối ngày | Kế toán ký ví dụ thu phân bổ và chi phí |
| Biểu mẫu chưa thống nhất | Hoàn thành chức năng nhưng không sử dụng được | Bếp và quản lý duyệt mẫu ngay tuần 1–2 |
| Dữ liệu chuyển không có mã ổn định | Trùng thực phẩm và công thức | Ánh xạ, import thử và khóa chống lặp |
| Chỉ làm giao diện mà thiếu ledger | Sổ kho và báo cáo lệch nhau | Xây chu trình có ghi sổ trước mở rộng tính năng |

Các quyết định cần ghi thành biên bản trước khi phát triển bộ tính: nguồn dinh dưỡng và quyền sử dụng; định lượng sống/chín; đơn vị và hao hụt; phương pháp năng lượng; tiêu chuẩn theo ngày hay tại trường; cách tính gói tiền ăn; xử lý dịch vụ/bổ trợ/số dư; phương pháp giá vốn; thời điểm ghi xuất; thẩm quyền duyệt ngoại lệ.

Các quyết định cần chốt trước thí điểm: số điểm và người dùng; hạ tầng và mức khôi phục; danh sách biểu mẫu bắt buộc; thời hạn lưu dữ liệu; nguồn số suất; dữ liệu chuyển; người chịu trách nhiệm xác nhận từng báo cáo; ngày bắt đầu nguồn ghi nhận chính thức.

## 18 Công việc khởi động trong năm ngày đầu

Ngày 1: phân tích nghiệp vụ cùng dinh dưỡng, kho và kế toán đi qua một ngày ăn cụ thể; ghi rõ ai nhập, nhập lúc nào, nguồn nào và kết quả nào được coi là chính thức.

Ngày 2: chốt từ điển nhóm tuổi/bữa/gói; chọn bộ thực phẩm đại diện cho kg, lít, hộp, gói và quả; xác minh quy đổi và dữ liệu chất.

Ngày 3: dựng bảng tính tay cho một ngày gồm ba nhóm phục vụ, hai nguồn mua/xuất và hai mức giá lô; chốt quy tắc ngân sách và làm tròn.

Ngày 4: trình nguyên mẫu bảng điều hành và cân đối ngày; duyệt các trạng thái, cảnh báo, thao tác ghi sổ và mở lại. Chốt mẫu báo cáo ưu tiên.

Ngày 5: hoàn thiện đặc tả phiên bản đầu, chia backlog tuần 3–6, xác định người nhận từng đầu ra và lịch kiểm thử. Chỉ bắt đầu lập trình bộ tính sau khi bộ ví dụ số đã được ký xác nhận.

## 19 Nguồn tham chiếu

Các nguồn dưới đây do PMS/Vietec cung cấp qua giao diện qlmn.vn, được truy cập ngày 10/09/2026 trong phiên đã đăng nhập. Trang công khai khi chưa đăng nhập chỉ hiển thị biểu mẫu đăng nhập. Liên kết có thể yêu cầu quyền truy cập. Ngày cập nhật tài liệu của nhà cung cấp không được hiển thị rõ; thời điểm trên bản ghi nghiệp vụ không phải ngày phát hành tài liệu.

[1] PMS/Vietec. Tổng quan và hướng dẫn quy trình rút gọn. https://qlmn.vn/single/dinhduong

[2] PMS/Vietec. Cơ cấu dinh dưỡng. https://qlmn.vn/single/dinhduong/norm

[3] PMS/Vietec. Nhà cung cấp. https://qlmn.vn/single/dinhduong/supplier/list

[4] PMS/Vietec. Thực phẩm trường. https://qlmn.vn/single/dinhduong/unit_food_detail/list

[5] PMS/Vietec. Món ăn. https://qlmn.vn/single/dinhduong/dish/list

[6] PMS/Vietec. Thực đơn mẫu. https://qlmn.vn/single/dinhduong/menu_planning/list

[7] PMS/Vietec. Nhập kho và biểu mẫu nhập kho. https://qlmn.vn/single/dinhduong/storage/list

[8] PMS/Vietec. Tồn kho và thao tác trả nhà cung cấp/chuyển năm. https://qlmn.vn/single/dinhduong/storage_inventory/list

[9] PMS/Vietec. Lịch sử kho. https://qlmn.vn/single/dinhduong/storage_history/list

[10] PMS/Vietec. Theo dõi sổ kho. https://qlmn.vn/single/dinhduong/gumshoe/list

[11] PMS/Vietec. Cân đối khẩu phần và hộp Điều chỉnh thực đơn. https://qlmn.vn/single/dinhduong/menu_adjust/list

[12] PMS/Vietec. Biểu mẫu thống kê và hộp Phiếu kê chợ. https://qlmn.vn/single/dinhduong/menu_report/list
