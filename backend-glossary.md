# Thuật ngữ Backend/System — từ cơ bản đến nâng cao

> Mỗi mục trả lời 2 câu hỏi: **vấn đề gì khiến thuật ngữ này được sinh ra**, và **nó giải quyết thế nào**.
> 575 thuật ngữ, sắp theo mức độ rồi theo chủ đề.

## Cách đọc

- **Vấn đề khiến nó ra đời** — bối cảnh đau thật (traffic, crash, tranh chấp, lỗ hổng) khiến người ta phải phát minh ra thuật ngữ này, không phải định nghĩa từ điển.
- **Nguồn gốc** — tác giả/năm khi tra được chắc chắn; để trống khi không có bằng chứng (không bịa).
- **Giải quyết thế nào** — cơ chế ngắn gọn, kèm đánh đổi nếu có.

# PHẦN 1 — NỀN TẢNG (basic)

Những khái niệm gặp ngay tuần đầu đi làm: HTTP, SQL, Unix, biến dạng của request. Bỏ qua phần này thì mọi thứ phía trên xây trên cát.

## Mạng & Giao thức

### ARP
*còn gọi: Address Resolution Protocol*

**Vấn đề khiến nó ra đời:** Ethernet truyền frame dựa trên địa chỉ MAC (địa chỉ phần cứng), nhưng ứng dụng/stack chỉ biết địa chỉ IP — không có cơ chế nào dịch IP sang MAC nên gói không thể đi được trong cùng một LAN; mỗi hệ điều hành sẽ lại tự nghĩ ra cách khác nhau.
**Nguồn gốc:** RFC 826, David C. Plummer, 11/1982.
**Giải quyết thế nào:** Máy broadcast ARP request 'ai có IP này báo lại địa chỉ MAC của mình', máy sở hữu trả lời, bảng ARP cache lại để các frame sau không phải hỏi lại.
*Liên quan: IP, MAC address, TCP, Subnet, Proxy*

### Context switch cost
*còn gọi: chi phí đổi ngữ cảnh, tốn kém context switch*

**Vấn đề khiến nó ra đời:** Mỗi lần CPU chuyển từ tiến trình/thread này sang tiến trình khác, hệ điều phải lưu thanh ghi, cập nhật bảng bảng điều phối, và thường phải flush TLB + làm nhiễu cache CPU — sau đó gần như mọi tham chiếu bộ nhớ đều miss cho tới khi TLB nạp lại. Với 10.000 kết nối đang active, hàng nghìn context switch mỗi giây khiến phần lớn CPU mất vào 'việc nội bộ' thay vì phục vụ request; đây là lý do đo lường thực tế cho thấy thread-per-connection không scale dù RAM còn đủ.
**Nguồn gốc:** không rõ (khái niệm tồn tại từ OS thời kỳ đầu; số liệu cụ thể tùy kiến trúc)
**Giải quyết thế nào:** Giảm số lần phải đổi ngữ cảnh: gom nhiều kết nối vào ít thread (event loop), hoặc dùng user-space thread (goroutine) vốn switch gần như rẻ như một lời gọi hàm vì không cần flush TLB.
*Liên quan: Thread-per-connection, Non-blocking I/O, Event loop*

### Cookie vs session token
*còn gọi: HTTP cookie, session token, phiên làm việc*

**Vấn đề khiến nó ra đời:** HTTP stateless: mỗi request là một sự kiện độc lập nên giỏ hàng biến mất khi chuyển trang — Netscape đang làm ứng dụng thương mại điện tử cho MCI năm 1994, và MCI không muốn server giữ trạng thái giao dịch dở dang cho hàng triệu client (tốn bộ nhớ, không scale).
**Nguồn gốc:** Lou Montulli, Netscape, 6/1994 (cookie); session token phía server phổ biến cùng thời với J2EE Servlet (1999) — mốc chính xác 'không rõ'.
**Giải quyết thế nào:** Cookie: server gửi kèm Set-Cookie chứa mã phiên, browser tự đính kèm nó vào mọi request sau — server nhận mã là biết ngay 'ai'. Session token: server giữ state thật ở RAM/Redis/DB theo mã đó; bản thân token có thể là JWT mang claims đã ký. 5 năm sau Servlet HttpSession (1999) chuẩn hóa khái niệm session phía server.
*Liên quan: HTTP, HTTPS, JWT, Cache, CORS*

### DNS
*còn gọi: Domain Name System, hệ thống tên miền*

**Vấn đề khiến nó ra đời:** Trước 1983, SRI duy trì một file HOSTS.TXT duy nhất ánh xạ hostname↔IP, admin phải gọi điện thoại cho SRI NIC trong giờ hành chính để thêm máy mới — file tập trung đó chậm, phình to và trở thành nút cổ chai khi ARPANET lớn dần.
**Nguồn gốc:** Paul Mockapetris, USC/ISI, 1983 (RFC 882/883); chuẩn hóa lại RFC 1034/1035 (1987).
**Giải quyết thế nào:** Phân cấp tên miền xuống các zone ủy quyền cho name server riêng; resolver hỏi đệ quy hoặc trả lời từ cache (TTL), cuối cùng trả về IP — không còn một file duy nhất làm mọi thứ.
*Liên quan: IP, TTFB, CDN, Cache, UDP*

### DNS resolution chain
*còn gọi: chuỗi phân giải DNS, recursive resolver, stub resolver*

**Vấn đề khiến nó ra đời:** Trước khi request HTTP đầu tiên rời khỏi máy, client phải dịch 'api.example.com' thành IP — nếu mỗi trình ứng dụng tự tra từ đầu (hỏi root → TLD → authoritative) thì mỗi lần mở trang mất thêm vài trăm ms độ trễ và Internet phải gánh lượng query khổng lồ lặp đi lặp lại. Chuỗi phân giải (stub → recursive resolver → root/TLD/authoritative) ra đời để gom việc tra cứu vào một chỗ.
**Nguồn gốc:** Paul Mockapetris, 1983 (USC ISI); RFC 882/883 (11/1983), chuẩn hóa lại bởi RFC 1034/1035 (11/1987)
**Giải quyết thế nào:** Stub resolver cục bộ gửi 1 câu hỏi cho recursive resolver (thường của ISP); resolver này tự hỏi root, rồi server TLD (.com), rồi authoritative server của domain, trả lời cho client và cache kết quả theo TTL.
*Liên quan: DNS TTL caching, DNS negative caching, CDN cache key*

### DNS TTL caching
*còn gọi: Time To Live DNS, cache DNS*

**Vấn đề khiến nó ra đời:** Nếu mỗi lần phân giải đều phải hỏi hết root → TLD → authoritative thì độ trễ cộng dồn và các root server sẽ bị nhấn chìm bởi hàng tỷ query lặp lại mỗi ngày. Trước khi có TTL cache, 'mọi phân giải trên Internet đều bắt đầu từ root' — không bền.
**Nguồn gốc:** Paul Mockapetris, 1983; TTL có từ thiết kế DNS ban đầu (RFC 1034/1035)
**Giải quyết thế nào:** Recursive resolver lưu kết quả theo TTL (do chủ zone đặt, thường vài phút tới vài ngày); truy vấn lặp lại trả lời ngay từ bộ nhớ. TTL hết hạn thì tra lại, nên đổi DNS không mất quá lâu để lan ra toàn cầu.
*Liên quan: DNS resolution chain, DNS negative caching*

### ETag / conditional requests (If-None-Match → 304)
*còn gọi: revalidate cache, 304 Not Modified*

**Vấn đề khiến nó ra đời:** Cache hết hạn (stale) nhưng file có thể vẫn không đổi — nếu tải lại toàn bộ response thì tốn băng thông vô ích, đặc biệt với file lớn. Không có cách nào hỏi 'bản tôi đang giữ còn đúng không?' mà không tải hết body thì cache-hit giảm và origin vẫn bị gọi.
**Nguồn gốc:** RFC 2616 (1997); hiện tại RFC 9110 § field.etag
**Giải quyết thế nào:** Server trả ETag (hash/nhãn phiên bản của nội dung); khi cache stale, client gửi If-None-Match kèm ETag cũ, server nếu thấy nội dung không đổi chỉ trả 304 Not Modified không body — client dùng tiếp bản cache. ETag mạnh đảm bảo giống byte từng byte, ETag yếu (W/) chỉ đảm bảo tương đương ngữ nghĩa; If-Match còn chống 'mid-air collision' khi ghi đè song song (412).
*Liên quan: HTTP caching với Cache-Control, CDN cache key*

### HTTP
*còn gọi: HyperText Transfer Protocol*

**Vấn đề khiến nó ra đời:** Đầu thập niên 1990, nhà nghiên cứu tại CERN muốn chia sẻ tài liệu có hyperlink giữa nhiều loại máy tính khác nhau, nhưng mỗi kiểu mạng/máy lại dùng giao thức riêng (FTP, Telnet, Gopher), phải cài phần mềm riêng, không click chuột được. Tim Berners-Lee cần một giao thức đủ đơn giản để trình duyệt bất kỳ nói chuyện được với server bất kỳ.
**Nguồn gốc:** Tim Berners-Lee, CERN, 1991; HTTP/1.1 chuẩn hóa tại RFC 2616 (1999), hiện hành RFC 9110/9112 (2022).
**Giải quyết thế nào:** Client gửi request (method + URL + header + body) qua TCP, server trả response (status code + header + body); mọi request độc lập với nhau, server không tự nhớ trạng thái giữa các lần gọi.
*Liên quan: HTTPS, TCP, REST, Keep-alive, TTFB*

### HTTP caching với Cache-Control (freshness)
*còn gọi: cache-control max-age, hết hạn cache HTTP*

**Vấn đề khiến nó ra đời:** Mọi request tĩnh (HTML, ảnh, JS) đều phải bay tới origin server khiến origin bị overload và user ở xa chờ cả RTT lẫn thời gian server. Trước khi có Cache-Control, caches dùng Expires tuyệt đối — múi giờ lệch là cache sai vĩnh viễn; còn không có cache thì băng thông và độ trễ không cải thiện được.
**Nguồn gốc:** RFC 2616 (HTTP/1.1, 6/1997) định nghĩa Cache-Control; RFC 7234 (2014); hiện hành RFC 9111 (6/2022)
**Giải quyết thế nào:** Server chỉ định max-age=N (đếm từ lúc sinh ra response, header Age tính nốt thời gian đã nằm ở cache trung gian); trong N giây cache dùng luôn không hỏi origin. no-cache = vẫn lưu nhưng phải revalidate mỗi lần, no-store = cấm lưu, private = chỉ browser được cache (chống rò rỉ data cá nhân ra shared cache).
*Liên quan: ETag / conditional requests, CDN cache key, stale-while-revalidate*

### HTTPS
*còn gọi: HTTP over TLS, HTTP Secure*

**Vấn đề khiến nó ra đời:** HTTP truyền text trần đi qua hàng chục router/ISP trung gian: ai đó ở Wi-Fi quán cà phê hay nhà cung cấp dịch vụ đọc được mật khẩu, cookie phiên, số thẻ tín dụng; mặt khác client không có cách nào kiểm tra server trả lời có đúng là server mình muốn hay không (man-in-the-middle). Thương mại điện tử đầu những 1990s không thể chạy trên kênh công khai như vậy.
**Nguồn gốc:** Netscape giới thiệu HTTPS cùng SSL trong Netscape Navigator (1994–1995); IETF chuẩn hóa thành TLS từ 1999.
**Giải quyết thế nào:** Bọc HTTP trong lớp TLS: TLS mã hóa toàn bộ nội dung request/response (không ai đọc được giữa chăng) và xác thực server qua certificate do CA ký (client biết mình đang nói chuyện với đúng ngân hàng/cửa hàng).
*Liên quan: TLS/SSL, HTTP, Certificate, TCP*

### I/O multiplexing (select/poll)
*còn gọi: nhân rẽ I/O, polling nhiều socket*

**Vấn đề khiến nó ra đời:** Sau khi có non-blocking, bài toán đặt ra là: một thread muốn biết trong hàng nghìn socket nào có dữ liệu tới. Viết vòng lặp hỏi từng cái là O(n) mỗi lượt và lãng phí; select/poll ra đời để hỏi hàng loạt trong một syscall — nhưng select giới hạn hard cap FD_SETSIZE (mặc định 1024) và poll phải quét lại toàn bộ danh sách mỗi lần, nên càng nhiều socket càng chậm.
**Nguồn gốc:** không rõ (select có từ BSD 4.2, ~1983)
**Giải quyết thế nào:** Một syscall duy nhất truyền vào tập socket cần theo dõi, trả về tập socket đang sẵn sàng (đọc/ghi được), để thread chỉ thao tác đúng những socket có việc.
*Liên quan: epoll, kqueue, C10k problem*

### IP
*còn gọi: Internet Protocol, IPv4, IPv6*

**Vấn đề khiến nó ra đời:** Mỗi mạng con riêng (Ethernet, Token Ring, X.25) có cách đặt địa chỉ và định dạng gói khác nhau, máy trong một mạng không giao tiếp được với mạng khác — năm 1974 Cerf và Kahn muốn 'ghép' nhiều mạng thành một mạng ảo thống nhất (internetwork).
**Nguồn gốc:** Vint Cerf & Bob Kahn, 1974; IPv4 RFC 791 (1981).
**Giải quyết thế nào:** Định địa chỉ toàn cục cho mọi thiết bị và định tuyến từng gói từ nguồn đến đích theo hop; IP KHÔNG đảm bảo gói đến nơi hay đến đúng thứ tự — phần đó để TCP/UDP phía trên lo.
*Liên quan: TCP, UDP, DNS, ARP, IPv6*

### Non-blocking I/O
*còn gọi: I/O không chặn, non-blocking socket*

**Vấn đề khiến nó ra đời:** Trong blocking I/O, read() trên socket chưa có data sẽ treo thread tới khi client gửi — 1000 client im lặng đồng nghĩa 1000 thread bị giam, không thread nào làm việc khác được. Mô hình này biến 'chờ mạng' (vài ms tới vài giây, chậm hơn CPU hàng triệu lần) thành lãng phí tài nguyên nghiêm trọng.
**Nguồn gốc:** không rõ (fcntl O_NONBLOCK trên POSIX sockets)
**Giải quyết thế nào:** Đặt socket ở chế độ non-blocking: read() trả về ngay 'chưa có data' thay vì chờ, để thread rảnh làm việc khác hoặc poll kết nối khác; việc chờ được thay bằng một vòng lặp hỏi 'socket nào sẵn sàng?'.
*Liên quan: I/O multiplexing (select/poll), Event loop, Reactor pattern*

### Port
*còn gọi: cổng, TCP/UDP port*

**Vấn đề khiến nó ra đời:** Một server chạy web, mail, DB, Redis cùng lúc thì đều chung một địa chỉ IP — gói TCP/IP chỉ ghi IP thì kernel không biết giao payload cho tiến trình nào; đồng thời không có cơ chế 'gắn nhãn' loại dịch vụ để firewall chặn/mở theo dịch vụ.
**Nguồn gốc:** Phần của mô hình TCP/IP từ RFC 793 (1981); phân bổ chính thức do IANA quản lý.
**Giải quyết thế nào:** TCP/UDP thêm số port 0–65535 vào header (80/443/3306/5432…); kernel gom kết nối theo (IP, port) gọi là socket 4-tuple và chuyển data cho đúng tiến trình đã listen cổng đó.
*Liên quan: Socket, TCP, UDP, Firewall, Proxy*

### RTT (Round-Trip Time)
*còn gọi: thời gian khứ hồi, độ trễ mạng*

**Vấn đề khiến nó ra đời:** Mọi request web đều bị chi phối bởi thời gian gói tin đi đi về về: client ở Việt Nam tới server Mỹ mất ~200-300ms mỗi RTT, và một trang web cần 20-100 round trip (DNS, TCP, TLS, HTML, JS, API) nên dù server xử lý chỉ 5ms, user vẫn chờ vài giây. Đây là lý do CDN, HTTP/2 multiplexing, keep-alive tồn tại — giảm số RTT, không phải tăng CPU.
**Nguồn gốc:** không rõ (khái niệm cơ bản của networking)
**Giải quyết thế nào:** Đo RTT để làm căn cứ cho các cơ chế khác: timeout tính từ RTT ước lượng, TCP tính bandwidth-delay product từ RTT, thuật toán delay-based (BBR, Vegas) dùng RTT tăng làm tín hiệu tắc nghẽn.
*Liên quan: TCP slow start, TCP congestion control, CDN cache key*

### Socket
*còn gọi: Berkeley socket, BSD socket*

**Vấn đề khiến nó ra đời:** Nhiều chương trình user-space cùng muốn gửi/nhận dữ liệu mạng trên một máy, nhưng hệ điềuälle sở hữu NIC — không có chuẩn nào cho app gọi 'mở kết nối, gửi bytes, nhận bytes' mà không đụng trực tiếp vào driver mạng.
**Nguồn gốc:** Berkeley sockets giới thiệu trong 4.2BSD (1983); mô hình trở thành chuẩn chéo nền tảng.
**Giải quyết thế nào:** Cung cấp API (AF_INET, bind/listen/connect/accept/send/recv) để chương trình làm việc với 'cổng giao tiếp' ảo gắn với IP+port; kernel lo phần giao packet xuống card mạng.
*Liên quan: Port, TCP, UDP, Connection pool, Firewall*

### TCP
*còn gọi: Transmission Control Protocol*

**Vấn đề khiến nó ra đời:** Mạng packet-switching (ARPANET) làm mất gói, trộn thứ tự, nhân bản gói tin — gửi file 10MB mà rơi 0.1% gói là file hỏng, và không ứng dụng nào muốn tự viết lại logic truyền cho từng loại mạng. Cerf và Kahn (1974) cần một lớp 'tin cậy' đặt trên nhiều mạng con khác nhau.
**Nguồn gốc:** Vint Cerf & Bob Kahn, 1974; chuẩn hóa RFC 793 (1981), hiện RFC 9293 (2022).
**Giải quyết thế nào:** Chia dữ liệu thành segment có số thứ tự; bên nhận xác nhận (ACK) và báo thiếu để bên gửiretransmit; sắp lại đúng thứ tự, kiểm tra checksum; kèm kiểm soát luồng (flow control) và kiểm soát tắc nghẽn (congestion control).
*Liên quan: UDP, IP, TCP handshake, Socket, Port, Head-of-line blocking*

### Thread-per-connection (Blocking I/O model)
*còn gọi: mỗi kết nối một luồng, blocking server*

**Vấn đề khiến nó ra đời:** Server thế hệ đầu viết theo mô hình mỗi socket một thread: thread gọi read() và đứng yên chờ client gửi data. Khi số kết nối lên tới hàng nghìn, mỗi threadcòn phải giữ stack 2MB — máy 1GB RAM hết bộ nhớ ở ~512 thread, và CPU thì tiêu hao cho việc đổi ngữ cảnh liên tục thay vì xử lý request. Đây là mô hình mặc định của mọi server đơn giản (Apache prefork từng thời kỳ) và là thứ đầu tiên vỡ khi traffic tăng.
**Nguồn gốc:** không rõ (mô hình socket blocking có từ BSD sockets cổ điển)
**Giải quyết thế nào:** Tách 'chờ I/O' khỏi 'xử lý': đọc dữ liệu không block (non-blocking) hoặc nhờ một cơ chế tập trung báo biết socket nào đã sẵn sàng, để một thread duy nhất phục vụ hàng nghìn kết nối thay vì mỗi kết nối một thread.
*Liên quan: Non-blocking I/O, Context switch cost, C10k problem, Event loop*

### TLS/SSL
*còn gọi: Transport Layer Security, Secure Sockets Layer*

**Vấn đề khiến nó ra đời:** Những năm 1990 Netscape muốn trình duyệt của mình giao dịch thương mại (mua hàng, thẻ tín dụng) trên Internet công cộng — kênh TCP/IP vốn không có mã hóa lẫn xác thực, mọi router trung gian đều đọc/sửa đổi được nội dung. SSL 1.0 có lỗ hổng nghiêm trọng nên không bao giờ phát hành công khai.
**Nguồn gốc:** Netscape (Taher Elgamal) — SSL 2.0 (1995), SSL 3.0 (1996); IETF chuẩn hóa TLS 1.0 tại RFC 2246 (1999); TLS 1.3 RFC 8446 (2018).
**Giải quyết thế nào:** Handshake agreed key (AES…) để mã hóa channel, dùng certificate do CA ký để chứng minh danh tính server, và chữ ký MAC để phát hiện chỉnh sửa; TLS 1.3 (2018) rút handshake còn 1-RTT và buộc forward secrecy.
*Liên quan: HTTPS, Certificate, TCP handshake, HTTP/2, HTTP/3 (QUIC)*

### UDP
*còn gọi: User Datagram Protocol*

**Vấn đề khiến nó ra đời:** TCP bắt mất round-trip bắt tay, chờ ACK từng đoạn, truyền packet bị mất khiến độ trễ tăng hàng trăm ms — với VoIP/telephony thì mất 1 gói âm thanh còn tốt hơn là 'đứng hình' chờ nó; nhiều giao thức chỉ cần một cặp hỏi–trả lời gọn (DNS, DHCP, NTP) không cần giữ kết nối.
**Nguồn gốc:** RFC 768, Jon Postel, 1980.
**Giải quyết thế nào:** Chỉ thêm port + checksum lên IP: không bắt tay, không ACK, không thứ tự, gửi là đi — mất packet hay không thứ tự do chính ứng dụng tự xử lý (hoặc bỏ qua).
*Liên quan: TCP, IP, Port, DNS*

## Thiết kế API

### Envelope pattern
*còn gọi: response wrapper, data envelope, API wrapper*

**Vấn đề khiến nó ra đời:** Mỗi endpoint tự shape response (đôi khi là object, đôi khi là array), client phải viết code khác nhau cho từng chỗ; thêm metadata (pagination, requestId) không có chỗ đặt.
**Nguồn gốc:** Không có 1 RFC - là convention phổ biến (AWS ApiResponse {data, error, requestId}; Azure object {value, nextLink}).
**Giải quyết thế nào:** Bọc payload trong object cố định vd {data, meta, error}. Meta chứa cursor, tổng số, requestId; error chứa mã lỗi thống nhất. Downsides: không đúng chuẩn REST lắm (mỗi resource là 1 representation), đôi khi gâydư thừa; nhiều API chọn không envelope để giữ đơn giản.
*Liên quan: Error response shape, RFC 7807 problem+json, Pagination (offset vs cursor)*

### Error response shape
*còn gọi: error object, error format, standard error*

**Vấn đề khiến nó ra đời:** Lỗi trả tùy hứng (string, {message}, {errors:[]}...) khiến client không viết được 1 chỗ xử lý lỗi chung, monitoring không phân loại được.
**Nguồn gốc:** Azure REST API Guidelines: body {error: {code, message, target, details[], innererror}} + header x-ms-error-code khớp code trong body; Microsoft Graph, Google (google.rpc.Status) đều có format chuẩn.
**Giải quyết thế nào:** Chuẩn hóa: code máy đọc (stable, không đổi), message người đọc, field lỗi chi tiết (per-field validation), requestId để truy vết. Code khác nhau cho lỗi runtime-recoverable vs lỗi dùng sai; thêm code mới ở top-level cần bump version.
*Liên quan: RFC 7807 problem+json, Envelope pattern, Request correlation ID*

### HTTP methods semantics
*còn gọi: HTTP verbs, GET/POST/PUT/PATCH/DELETE semantics*

**Vấn đề khiến nó ra đời:** Dùng POST cho mọi thứ làm mất khả năng cache, mất retry an toàn, proxy/CDN không biết request có an toàn để lặp lại không.
**Nguồn gốc:** RFC 9110 (STD 97, 2022, Fielding/Nottingham/Reschke) section 9 - kế thừa RFC 7231/2616.
**Giải quyết thế nào:** GET/HEAD = đọc (safe); POST = tạo/submit, không an toàn; PUT = thay thế toàn bộ resource (idempotent); DELETE = xóa (idempotent); PATCH = sửa một phần (không idempotent); OPTIONS = hỏi khả năng. Trả status code đúng ngữ nghĩa: 201 khi tạo, 204 khi xóa thành công.
*Liên quan: Safe & idempotent methods, Status codes, PUT vs PATCH*

### Idempotency
*còn gọi: idempotent operation, idempotent, bất biến lặp, idempotency key*

**Vấn đề khiến nó ra đời:** Retry sau timeout mạng có thể tạo đối tượng thứ hai hoặc charge hai lần; client không phân biệt 'mạng lỗi' với 'chưa xử lý'.
**Nguồn gốc:** Khái niệm từ HTTP spec (idempotent methods, RFC 9110 section 9.2.2); mẫu Idempotency-Key phổ biến hóa bởi Stripe API.
**Giải quyết thế nào:** Server ghi kết quả của lần đầu theo key; lần retry cùng key trả về đúng kết quả cũ thay vì thực thi lại. Stripe lưu status code + body của lần đầu với key, cho phép dùng lại tối đa khoảng 24h, tham số khác key cũ gây lỗi để tránh dùng nhầm.
*Liên quan: Idempotency key (Stripe pattern), Safe & idempotent methods, Exactly-once illusion vs at-least-once, Idempotent consumer, Retry với exponential backoff & jitter, Exactly-once semantics*

### OpenAPI/Swagger
*còn gọi: OpenAPI Specification, OAS, Swagger, OpenAPI Description*

**Vấn đề khiến nó ra đời:** Document API bằng wiki/Excel nhanh lạc hậu; không có format machine-readable thì không tự sinh SDK, không mock, không test contract tự động.
**Nguồn gốc:** Swagger do Tony Tam tạo khi ở Wordnik, spec đầu tiên phát hành 10/8/2011; 11/2015 SmartBear donate cho OpenAPI Initiative dưới Linux Foundation (Google, IBM, Microsoft, PayPal); 1/1/2016 đổi tên OpenAPI Specification.
**Giải quyết thế nào:** File YAML/JSON mô tả paths, operations, parameters, schemas (JSON Schema), security, servers. Tools đọc spec để sinh docs (Swagger UI/Redoc), client SDK, server stub, contract tests. Spec language-agnostic nên team khác nhau dùng chung 1 nguồn.
*Liên quan: API-first design, Contract-first, SDK/codegen*

### PUT vs PATCH
*còn gọi: full update vs partial update, replace vs merge*

**Vấn đề khiến nó ra đời:** Gửi PUT với body thiếu trường sẽ xóa mất dữ liệu do PUT là thay thế toàn bộ; còn PATCH không chuẩn thì mỗi API tự định nghĩa format, client không đoán được.
**Nguồn gốc:** RFC 5789 'PATCH Method for HTTP' (2010, Lisa Dusseault & James M. Snell) - PUT chỉ thay thế toàn bộ nên không dùng được cho sửa một phần.
**Giải quyết thế nào:** PUT gửi full representation, idempotent; PATCH gửi instruction sửa một phần (JSON Merge Patch RFC 7396 hoặc JSON Patch RFC 6902), không idempotent. PATCH trả 204/200, lỗi 400 (patch sai), 409 (xung đột), 412 (precondition fail), 415 (không hỗ trợ format), 422 (syntax đúng nhưng không áp được).
*Liên quan: HTTP methods semantics, Optimistic concurrency (ETag/If-Match)*

### Representational state (resource vs representation)
*còn gọi: resource-oriented design, resource, representation*

**Vấn đề khiến nó ra đời:** Khi API trả về 'đối tượng' như gửi trực tiếp object, client phụ thuộc format cụ thể; đổi trường dữ liệu hay đổi format là phá mọi client.
**Nguồn gốc:** Fielding dissertation 2000 - phân biệt resource (khái niệm được định danh) và representation (dữ liệu mô tả trạng thái tại thời điểm gửi, theo định dạng JSON/XML...).
**Giải quyết thế nào:** Resource có nhiều representation; client chọn qua content negotiation. Server gửi trạng thái hiện tại, client thay đổi trạng thái bằng PUT/POST/PATCH; thao tác dựa trên giao thức không lưu trạng thái phía client.
*Liên quan: REST, Content negotiation, HTTP methods semantics*

### REST (Representational State Transfer)
*còn gọi: RESTful, RESTful API*

**Vấn đề khiến nó ra đời:** Trước 2000 web API thiết kế tùy tiện: mỗi hệ thống tự đặt quy ước URL/verb/định dạng riêng, client phải hardcode cấu trúc máy chủ và vỡ khi hệ thống thay đổi.
**Nguồn gốc:** Roy Fielding, luận án tiến sĩ 'Architectural Styles and the Design of Network-based Software Architectures', UC Irvine, 2000.
**Giải quyết thế nào:** Kiểu kiến trúc gồm 6 ràng buộc: client-server, statelessness, cache, uniform interface (tài nguyên định danh bằng URI, thao tác qua representation, message tự mô tả, HATEOAS), layered system, code on demand (tùy chọn). Client chỉ cần URI khởi đầu và tự khám phá phần còn lại qua hypermedia nên ít khớp chặt với máy chủ.
*Liên quan: Representational state, Statelessness, HATEOAS, HTTP methods semantics*

### Safe & idempotent methods
*còn gọi: safe methods, idempotent methods*

**Vấn đề khiến nó ra đời:** Khi kết nối sập giữa chừng client không biết request đã xử lý chưa; retry bừa có thể tạo trùng (double charge, record trùng).
**Nguồn gốc:** RFC 9110 section 9.2: safe = không đổi trạng thái server (GET/HEAD/OPTIONS); idempotent = làm N lần giống 1 lần về hiệu ứng (PUT/DELETE, GET).
**Giải quyết thế nào:** Client chỉ tự động retry method an toàn/idempotent khi mạng lỗi; với POST phải dùng idempotency key hoặc cho người dùng xác nhận. Azure REST guidelines còn yêu cầu mọi method phải idempotent, POST tạo resource cũng idempotent nhờ header Repeatability-Request-ID.
*Liên quan: Idempotency, Retry guidance (safe methods), HTTP methods semantics*

### Statelessness
*còn gọi: stateless server, server stateless*

**Vấn đề khiến nó ra đời:** Server giữ session trên memory khiến không scale ngang (request phải về đúng node giữ session), client nghỉ mà server vẫn tốn tài nguyên lưu trạng thái.
**Nguồn gốc:** Ràng buộc thứ 2 của REST, Fielding 2000: 'A specific client does not consume server storage when the client is at rest'.
**Giải quyết thế nào:** Mỗi request mang đủ thông tin để xử lý độc lập (auth token, context); server không lưu phiên. Trạng thái nằm ở client hoặc resource, mọi node xử lý được mọi request, dễ load balance và chịu lỗi.
*Liên quan: REST, Idempotency*

### Status codes (2xx/4xx/5xx)
*còn gọi: HTTP status codes, response status*

**Vấn đề khiến nó ra đời:** Luôn trả 200 kèm lỗi trong body làm client khó phân biệt thành công/thất bại, cache và monitoring hiểu sai, debug tốn thời gian.
**Nguồn gốc:** RFC 9110 section 15 (2022) định nghĩa bảng status code; RFC 6585 (2012, Nottingham & Fielding) bổ sung 428/429/431/511.
**Giải quyết thế nào:** 2xx thành công (200 OK, 201 Created, 202 Accepted, 204 No Content); 4xx lỗi phía client (400, 401, 403, 404, 409, 412, 415, 422, 429); 5xx lỗi server (500, 503). Mã lạ client coi như nhóm tương ứng (499 lạ coi như 400).
*Liên quan: Error response shape, RFC 7807 problem+json, Rate limit headers*

## Cơ sở dữ liệu & Lưu trữ

### ACID
*còn gọi: giao dịch ACID*

**Vấn đề khiến nó ra đời:** Ghi dữ liệu từ nhiều client song song rất dễ hỏng khi lỗi phần cứng hoặc tranh chấp xảy ra, để lại trạng thái nửa vời.
**Nguồn gốc:** Härder và Reuter đặt tên năm 1983
**Giải quyết thế nào:** Bốn thuộc tính Atomicity, Consistency, Isolation, Durability: ghi hoặc bỏ hẳn, luôn giữ DB ở trạng thái hợp lệ, bền sau crash.
*Liên quan: Transaction, Isolation level, WAL, MVCC*

### BEGIN/COMMIT/ROLLBACK
*còn gọi: vòng đời transaction*

**Vấn đề khiến nó ra đời:** Cần cơ chế để ứng dụng tự quyết định điểm chốt hoặc hoàn tác một nhóm thao tác ghi.
**Nguồn gốc:** Tiêu chuẩn SQL, thập niên 1980
**Giải quyết thế nào:** BEGIN mở transaction, COMMIT ghi vĩnh viễn và chốt, ROLLBACK đưa dữ liệu về trạng thái trước BEGIN.
*Liên quan: Transaction, WAL, Crash recovery*

### Connection pool
*còn gọi: pool kết nối, kết nối DB tái sử dụng, connection pooling, DB pool, Connection pool vs kết nối mới, pooling, pre-warm connections, connection reuse, kết nối pool, pool kết nối database*

**Vấn đề khiến nó ra đời:** Mỗi request mở 1 kết nối TCP + auth tới DB rồi đóng lại thì tốn hàng chục ms handshake; traffic cao hàng nghìn kết nối cùng lúc làm sập DB (mỗi connection ăn RAM và slot) — mở-đóng kết nối thẳng là bottleneck kinh điển. Mỗi request mở 1 kết nối TCP + handshake + TLS + auth với Postgres rồi đóng lại — tốn vài chục ms và hàng nghìn kết nối ngắn hạn khiến database kiệt sức (connection storm), đặc biệt với serverless Lambda khởi động per-invocation.
**Nguồn gốc:** Không rõ tác giả — phát triển cùng application server Java/JDBC pools thập niên 2000 (Commons DBCP, HikariCP...)
**Giải quyết thế nào:** Giữ sẵn nhóm kết nối mở, cho mượn rồi trả lại pool — app tái sử dụng thay vì tạo mới; giới hạn số kết nối tối đa bảo vệ DB không bị overload. Pool giữ sẵn N kết nối đã xác thực, checkout/checkin microseconds. Cấu hình: max pool = f(số instance app, số backend), idle timeout, validation query on borrow, leak detection. Pre-warm: mở hết pool lúc boot trước khi nhận traffic (tránh cold-start spike). Pool quá lớn → backend (Postgres, MySQL) kiệt slot kết nối. Tạo trước tập kết nối, cho mượn/trả lại thay vì mở-đóng — giảm overhead setup, giới hạn đồng thời tối đa khớp max_connections của DB; phải tune idle timeout vì NAT/proxy âm thầm giết kết nối cũ.
*Liên quan: N+1 problem, Query plan / EXPLAIN, Replication (master-slave / read replica), TCP, Keep-alive, Socket, Load balancer, Reverse proxy, TLS handshake cost, Pre-warming, Batching, QPS, latency vs throughput*

### Dirty read
*còn gọi: đọc bẩn*

**Vấn đề khiến nó ra đời:** Đọc dữ liệu chưa commit của transaction khác; nếu bên đó rollback, bạn giữ giá trị chưa bao giờ tồn tại.
**Giải quyết thế nào:** Nâng isolation lên Read Committed trở lên để chỉ đọc dữ liệu đã commit.
*Liên quan: Isolation level, MVCC, Snapshot isolation*

### Index
*còn gọi: chỉ mục*

**Vấn đề khiến nó ra đời:** Query không index phải quét toàn bảng, tốn O(n) trên dữ liệu lớn.
**Giải quyết thế nào:** Cấu trúc phụ thường là B+tree lưu key kèm vị trí bản ghi, đổi dung lượng và chi phí ghi lấy tốc độ đọc.
*Liên quan: B+tree, Primary key vs Secondary index, Query planner*

### Index (B-tree, hash, composite)
*còn gọi: chỉ mục, B-tree index, hash index, composite index*

**Vấn đề khiến nó ra đời:** Bảng 10 triệu dòng mà WHERE email = 'x' phải quét toàn table (full table scan) — truy vấn vài chục ms biến thành vài giây, sập dưới tải thật. Không index thì tìm kiếm, lọc, phân trang đều chậm theo kích thước dữ liệu.
**Nguồn gốc:** Cây B-tree do Bayer & McCreight (Boeing Research Labs) công bố 1970/1972; hash index và composite index có trong các hệ DB thương mại thập niên 1980
**Giải quyết thế nào:** Cấu trúc dữ liệu phụ (B-tree cho so sánh =, <, >, range và giữ thứ tự; hash chỉ cho =; composite gộp nhiều cột cho WHERE dùng 2+ cột) để tìm dòng đúng gần O(log n) thay vì O(n). Đánh đổi: đọc nhanh hơn nhưng ghi chậm hơn vì phải cập nhật index.
*Liên quan: Query plan / EXPLAIN, Normalization, GIN / GiST*

### Migration
*còn gọi: di trú schema, database migration, Flyway, Liquibase, Prisma Migrate*

**Vấn đề khiến nó ra đời:** Developer A đổi schema trên máy mình, developer B và production vẫn schema cũ — code deploy lên là crash vì cột biến mất hoặc sai kiểu. Không có lịch sử schema thì không biết DB đang ở cấu trúc nào và không rollback được khi migration sai.
**Nguồn gốc:** Không rõ tác giả đầu tiên; được phổ biến rộng rãi bởi Ruby on Rails (migrations, giữa thập niên 2000)
**Giải quyết thế nào:** Schema mô tả bằng file versioned trong git; từng bước migration chạy có trật tự trên mọi môi trường — dev/staging/prod cùng phiên bản, ai cũng thấy lịch sử thay đổi và revert được.
*Liên quan: Schema, ORM, Relational database (RDBMS)*

### Normalization
*còn gọi: chuẩn hoá dữ liệu, 1NF, 2NF, 3NF, BCNF*

**Vấn đề khiến nó ra đời:** Bảng chưa chuẩn hoá thì cùng một sự thật nằm ở nhiều dòng: đổi địa chỉ 1 khách phải UPDATE 50 dòng, sót dòng nào là dữ liệu mâu thuẫn ngay (update anomaly); xoá đúng 1 dòng lại mất luôn thông tin không liên quan (delete anomaly).
**Nguồn gốc:** Edgar F. Codd — 1NF (1970), 2NF/3NF (1971); BCNF do Codd & Boyce, 1974
**Giải quyết thế nào:** Chia bảng nhỏ, mỗi sự thật chỉ lưu 1 lần, quan hệ qua FK. Đánh đổi nhiều JOIN khi đọc — sau này denormalize lại khi JOIN thật sự chậm.
*Liên quan: Primary key / Foreign key, N+1 problem, Index (B-tree, hash, composite)*

### NoSQL (MongoDB / Redis / Cassandra)
*còn gọi: document store, key-value store, wide-column store*

**Vấn đề khiến nó ra đời:** Sản phẩm đổi schema liên tục thì schema rigid của RDBMS khiến mỗi lần thêm field là migration lớn; khi cần hàng triệu lượt ghi/giây (session, feed, telemetry) thì single-node ACID trả giá quá cao — mô hình quan hệ không phù hợp cho tải này.
**Nguồn gốc:** Thuật ngữ "NoSQL" xuất hiện cuối thập niên 1990, phổ biến rộng rãi khoảng 2009 (cộng đồng Cassandra/MongoDB/Redis); không có tác giả duy nhất
**Giải quyết thế nào:** Bỏ bớt ràng buộc: document store (MongoDB) lưu JSON linh hoạt, key-value (Redis) tra cứu O(1) trong RAM, wide-column (Cassandra) ghi phân tán theo hàng — thường chọn availability + tốc độ thay vì ACID đầy đủ (BASE).
*Liên quan: BASE / eventual consistency, CAP theorem, Sharding & consistent hashing*

### OLTP vs OLAP
*còn gọi: OLTP, OLAP, hệ giao dịch, hệ phân tích*

**Vấn đề khiến nó ra đời:** Truy vấn giao dịch ngắn và báo cáo tổng hợp lớn có workload trái ngược, không tối ưu chung được.
**Giải quyết thế nào:** OLTP xử lý nhiều transaction ngắn trên dòng, cần index và khóa; OLAP quét khối lớn, ưu tiên cột và hàm tổng hợp.
*Liên quan: Index, Normalization (1NF-3NF), Clustered index*

### ORM
*còn gọi: Object-Relational Mapping, Prisma, TypeORM, Hibernate, Sequelize*

**Vấn đề khiến nó ra đời:** Code app làm việc với object/struct, DB làm việc với hàng/cột — mỗi chỗ tự viết tay SELECT/INSERT rồi map về object rất lặp và dễ sai; đổi schema là sửa hàng chục chỗ SQL rải rác, thiếu type safety.
**Nguồn gốc:** Không rõ tác giả duy nhất; kỹ thuật bắt nguồn từ object database thập niên 1980-90, phổ biến cùng các framework web (Hibernate 2001, ActiveRecord của Rails)
**Giải quyết thế nào:** ORM ánh xạ model class sang bảng, cho phép thao tác mức object (user.findMany()) và tự sinh SQL; đổi tên cột chỉ sửa 1 chỗ model. Đánh đổi: dễ tạo query ẩn kém tối ưu, dẫn tới N+1.
*Liên quan: N+1 problem, Migration, Schema*

### Page
*còn gọi: khối dữ liệu, block*

**Vấn đề khiến nó ra đời:** Đọc ghi từng byte trên đĩa kém hiệu quả, I/O nên thực hiện theo lô cỡ cố định.
**Giải quyết thế nào:** Chia file thành khối thường 4-16KB; mọi đọc ghi đều đi theo trang để gộp I/O.
*Liên quan: Buffer pool, Slotted page, Heap file, B-tree*

### Primary key & Foreign key
*còn gọi: khóa chính, khóa ngoại, PK, FK*

**Vấn đề khiến nó ra đời:** Cùng một thông tin ghi ở nhiều bảng (địa chỉ khách nằm cả ở orders lẫn invoices) thì sửa 1 chỗ không ăn thua chỗ khác — trùng lặp, mâu thuẫn, không biết bản nào là thật. Thêm dòng tham chiếu tới bản không tồn tại (đặt hàng cho khách không có) cũng không ai chặn.
**Nguồn gốc:** Gắn với mô hình quan hệ của Edgar F. Codd, 1970
**Giải quyết thế nào:** PK định danh duy nhất 1 dòng; FK tham chiếu về PK bảng khác và DB chặn ghi có FK trỏ vào chỗ không tồn tại — mối quan hệ được cưỡng chế ở tầng dữ liệu thay vì hy vọng application luôn đúng.
*Liên quan: Relational database (RDBMS), Normalization, ORM*

### Primary key vs Secondary index
*còn gọi: khóa chính, index phụ*

**Vấn đề khiến nó ra đời:** Cần phân biệt đường định danh duy nhất của bản ghi với các đường dẫn phụ phục vụ truy vấn.
**Giải quyết thế nào:** Primary key bắt buộc duy nhất và không null; secondary index trỏ tới bản ghi nên thêm một bước tìm khi đọc.
*Liên quan: Clustered index, Index, Covering index*

### Relational database (RDBMS)
*còn gọi: Cơ sở dữ liệu quan hệ, RDBMS*

**Vấn đề khiến nó ra đời:** Trước khi có mô hình quan hệ, dữ liệu doanh nghiệp nằm trong file phẳng hoặc mô hình mạng/phân cấp: mỗi ứng dụng tự lưu file riêng, dữ liệu trùng lặp khắp nơi, đổi cấu trúc là phải sửa hàng loạt chương trình và các bản sao rất dễ mâu thuẫn với nhau.
**Nguồn gốc:** Edgar F. Codd (IBM), 1970 — paper "A Relational Model of Data for Large Shared Data Banks"
**Giải quyết thế nào:** Dữ liệu tổ chức thành bảng có schema cố định, truy cập qua ngôn ngữ khai báo (SQL); quan hệ giữa bảng giữ bằng khóa chính/khóa ngoại thay vì hardcode cấu trúc con trỏ trong code.
*Liên quan: SQL, Normalization, Primary key / Foreign key, Transaction & ACID*

### Schema
*còn gọi: lớp sơ đồ dữ liệu, database schema*

**Vấn đề khiến nó ra đời:** Nếu mỗi developer tự quyết dữ liệu lưu kiểu gì (cột tên lung tung, kiểu dữ liệu mỗi nơi một khác) thì dữ liệu trao đổi giữa các service hỏng ngầm — app này ghi "age", app kia đọc "tuoi", không ai biết bản nào là đúng.
**Nguồn gốc:** Không rõ (đi kèm mô hình quan hệ của Codd 1970 và các hệ DB thương mại đầu thập niên 1970-80)
**Giải quyết thế nào:** Schema là bản khai báo cứng: tên bảng/cột, kiểu dữ liệu, ràng buộc (NOT NULL, unique...). DB enforce schema lúc ghi vào, dữ liệu sai cấu trúc bị từ chối ngay ở cửa vào thay vì lan vào bảng.
*Liên quan: Relational database (RDBMS), Migration, ORM*

### SQL
*còn gọi: Structured Query Language, ngôn ngữ truy vấn có cấu trúc*

**Vấn đề khiến nó ra đời:** Khi dữ liệu đã tổ chức thành bảng, programmer vẫn phải viết code imperative từng bước (mở dữ liệu, lặp, lọc, map) để lấy kết quả — chậm, dễ sai, mỗi người viết một kiểu và không ai tối ưu tập trung được.
**Nguồn gốc:** IBM System R, đầu thập niên 1970 — ban đầu gọi SEQUEL (Chamberlin & Boyce), đổi thành SQL vì lý do tên thương mại
**Giải quyết thế nào:** Ngôn ngữ khai báo: nói "muốn gì" (SELECT ... WHERE ... JOIN), bộ query planner của DB tự chọn cách thực hiện — người viết không cần biết dữ liệu nằm ở đâu hay index nào được dùng.
*Liên quan: Relational database (RDBMS), Query plan / EXPLAIN, Index (B-tree, hash, composite)*

### Transaction
*còn gọi: giao dịch*

**Vấn đề khiến nó ra đời:** Nhiều thao tác ghi liên quan phải thành công hoặc thất bại cùng nhau; lỗi giữa chừng để dữ liệu lệch nhau.
**Nguồn gốc:** IBM System R, thập niên 1970
**Giải quyết thế nào:** Gói nhiều lệnh thành một đơn vị nguyên tử: commit thì ghi hết, rollback thì hủy hết.
*Liên quan: BEGIN/COMMIT/ROLLBACK, ACID, Isolation level*

### Transaction & ACID
*còn gọi: giao dịch, giao dịch nguyên tử, Atomicity, Consistency, Isolation, Durability*

**Vấn đề khiến nó ra đời:** Chuyển tiền là nhiều bước UPDATE riêng lẻ; app crash giữa chừng hoặc 2 client ghi đè nhau thì số dư lệch thật, không tự cân đối được — code application không thể tự đảm bảo mọi bước thành công hay thất bại cùng nhau khi process chết giữa chừng.
**Nguồn gốc:** Thuật ngữ ACID do Haerder & Reuter đặt trong "Principles of Transaction-Oriented Database Recovery" (1983); ý tưởng giao dịch phát triển từ công việc của James Gray (IBM/System R, thập niên 1970)
**Giải quyết thế nào:** DB đóng gói nhiều thao tác thành 1 đơn vị: Atomicity (thành công hết hoặc rollback hết), Consistency (ràng buộc luôn đúng sau giao dịch), Isolation (giao dịch song song không làm hỏng nhau), Durability (đã commit là sống qua crash nhờ WAL).
*Liên quan: Isolation level, WAL, Two-phase commit*

## Caching & Hiệu năng

### Browser cache
*còn gọi: HTTP cache, client cache*

**Vấn đề khiến nó ra đời:** Mỗi lần mở trang, browser tải lại toàn bộ CSS/JS/ảnh dù file không đổi — tốn bandwidth, chậm, server chịu load vô nghĩa cho static resource.
**Nguồn gốc:** Phần của HTTP/1.0 (1997) với header Expires; phát triển qua RFC 2616 (1999) và RFC 9111 (2022)
**Giải quyết thế nào:** Browser lưu response kèm metadata (ETag, Last-Modified, Cache-Control) rồi gửi conditional request (If-None-Match) — server trả 304 Not Modified khi chưa đổi, tiết kiệm cả bandwidth lẫn round-trip.
*Liên quan: Cache, TTL, stale-while-revalidate, CDN*

### Cache
*còn gọi: bộ nhớ đệm*

**Vấn đề khiến nó ra đời:** Mỗi request đều đọc database hoặc tính lại dữ liệu khiến hệ thống chậm và database chết tải khi traffic tăng. Đọc ổ cứng/Database tốn hàng chục ms trong khi RAM chỉ tốn vài ms — người phục vụ website động những năm 1990-2000 liên tục bị bottleneck ở tầng lưu trữ.
**Nguồn gốc:** Khái niệm cổ trong khoa học máy tính (CPU cache từ những năm 1960s); không ghi nhận một người phát minh duy nhất
**Giải quyết thế nào:** Chuỗi lưu kết quả tính sẵn ở nơi đọc nhanh (RAM, ổ đĩa) để request sau đọc lại thay vì truy vấn lại nguồn gốc; chỉ trả về từ nguồn thật khi cache miss.
*Liên quan: in-memory cache, TTL, cache invalidation, CDN*

### Cache invalidation
*còn gọi: hủy cache, xóa cache*

**Vấn đề khiến nó ra đời:** Dữ liệu trong cache là bản sao — khi user ghi đè database, cache vẫn giữ bản cũ nên user thấy dữ liệu sai (giá cũ, quyền hạn cũ). Invalidate sai cách thì serve data sai; invalidate quá mạnh thì mất hết lợi ích cache.
**Nguồn gốc:** Phát biểu nổi tiếng "there are only two hard things in cache invalidation" gắn với Phil Karlton (late 1990s); không có một phát minh cụ thể
**Giải quyết thế nào:** Có nhiều chiến lược: ghi DB thì xóa key tương ứng (cache-aside), version/epoch key, pub/sub broadcast xóa đa node, hoặc để TTL tự hết — chọn theo mức chấp nhận được của staleness.
*Liên quan: Cache, TTL, cache-aside, write-through*

### CDN (Content Delivery Network)
*còn gọi: mạng phân phối nội dung*

**Vấn đề khiến nó ra đời:** Người dùng ở Việt Nam truy cập server đặt ở Mỹ phải đi qua hàng chục hop xuyên đại dương — latency 200-300ms mỗi request, và server gốc chịu toàn bộ traffic dồn dập gây bottleneck.
**Nguồn gốc:** CDN xuất hiện cuối thập niên 1990 (Akamai thành lập 1998 bởi Tom Leighton và nhóm MIT) để xử lý bottleneck Internet thời đó
**Giải quyết thế nào:** Phân phối static content ra các edge node đặt khắp thế giới; request trả lời từ node gần user nhất, giảm latency và gánh bandwidth cho origin. Push CDN nhận file chủ động, Pull CDN hút khi có request đầu tiên.
*Liên quan: Cache, Browser cache, stale-while-revalidate, Compression*

### Compression (gzip/Brotli)
*còn gọi: nén dữ liệu, gzip, brotli, Compression (gzip/brotli) & CPU tradeoff, nén HTTP, compression ratio*

**Vấn đề khiến nó ra đời:** Response JSON/HTML/JS hàng trăm KB gửi nguyên dạng khiến trang tải chậm trên mạng di động, tốn bandwidth — server cũng tốn băng thông egress mỗi GB trả về. Nén brotli level 11 cho JSON 200KB nhưng tốn 50ms CPU/request trên QPS cao — tiết kiệm bandwidth đổi lấy CPU và latency, hoặc nén mọi thứ kể cả ảnh đã nén (lãngng phí).
**Nguồn gốc:** Gzip là RFC 1952 (1996). Brotli do kỹ sư Google Jyrki Alakuijala và Zoltán Szabadka phát triển, phát hành 15/10/2013, chuẩn hóa RFC 7932
**Giải quyết thế nào:** Nén payload trước khi gửi (Content-Encoding), client giải nén — JSON 500KB có thể còn ~50-100KB. Gzip phổ biến từ lâu; Brotli nén tốt hơn ~15-20% cho JS/HTML/CSS nhờ dictionary 120KB, nhưng encode chậm hơn nên hay dùng cho static asset. Gzip (deflate) nhanh, ratio ~70-80% so với thô; brotli (Google, RFC 7932) ratio cao hơn nhưng level cao chậm (nên precompress tĩnh tại build). Chỉ nén text (json/html/js/css), bỏ qua ảnh/video đã nén. Threshold tối thiểu (~1KB), Vary: Accept-Encoding, tính CPU/request × QPS.
*Liên quan: CDN, latency vs throughput, Connection pool, CPU pinning, Zero-copy, CDN edge caching*

### In-memory cache
*còn gọi: cache trong bộ nhớ RAM*

**Vấn đề khiến nó ra đời:** Database lưu trên đĩa (hoặc network round-trip) quá chậm so với nhu cầu đọc hàng nghìn lần/giây; đọc cùng một row hàng nghìn lần mà vẫn disk I/O thì throughput bị chặn.
**Nguồn gốc:** không rõ
**Giải quyết thế nào:** Giữ dữ liệu thường đọc trong RAM của process hoặc service riêng, tra key-value O(1) thay vì truy vấn SQL; đổi lấy chi phí RAM và vấn đề đồng bộ khi dữ liệu gốc thay đổi.
*Liên quan: Redis, Memcached, Cache*

### Latency vs Throughput
*còn gọi: độ trễ vs công suất*

**Vấn đề khiến nó ra đời:** Team đo 'hệ thống xử lý 10k req/s' nhưng user vẫn phì thanh toán chậm 5 giây — vì họ nhầm throughput cao = nhanh. Tối ưu một chiều có thể làm chiều kia xấu đi (batching tăng throughput nhưng tăng latency từng request).
**Nguồn gốc:** không rõ (khái niệm nền tảng của performance engineering)
**Giải quyết thế nào:** Latency = thời gian 1 request hoàn thành (ms); throughput = số request hoàn thành mỗi giây. Đặt SLO theo p50/p95/p99 latency cho UX, dùng throughput để tính capacity — tối ưu cả hai theo mục tiêu thật chứ không chỉ một con số.
*Liên quan: QPS, Little's law, Benchmark, Backpressure*

### Pagination (offset vs cursor)
*còn gọi: phân trang, offset pagination, cursor/keyset pagination, Pagination (offset vs cursor/keyset), cursor pagination, keyset pagination, page token*

**Vấn đề khiến nó ra đời:** Bảng triệu dòng mà trả hết một lần thì API trả hàng GB và browser treo. Nhưng OFFSET 100000 thì database vẫn phải đọc rồi vứt 100000 dòng trước đó — càng lặn sâu càng chậm; đồng thời data đổi giữa 2 trang thì OFFSET làm trùng/sót dòng (drift). Trả toàn bộ collection làm response phình và timeout; offset(skip) trên bảng lớn làm query chậm O(n) và item bị trùng/lọt khi dữ liệu chèn/xóa giữa chừng.
**Nguồn gốc:** không rõ (bài toán cổ điển của mọi ORM/API; cộng đồng wiki.use-the-index-luke.com của Markus Winand phổ biến keyset pagination)
**Giải quyết thế nào:** Offset (?page=50) nhảy theo số dòng — đơn giản cho số trang tùy ý nhưng chậm ở trang sâu. Cursor/keyset (WHERE id < last_seen ORDER BY id LIMIT 10) seek thẳng theo index — O(1) ở mọi độ sâu, không drift khi data đổi, đánh đổi là không nhảy arbitrary page. Offset: page/limit, dễ nhảy trang nhưng đắt và không ổn định. Cursor: server trả token opaque trỏ tới vị trí (thường kèm sort key); client gửi lại token cho trang sau. AIP-158: token phải opaque, không user-parseable (base64 che thông tin minh bạch là không đủ), token không được cấp quyền truy cập, khoảng 3 ngày là thời hạn tối hậu, thêm pagination vào API cũ là breaking change.
*Liên quan: hot path, QPS, in-memory cache, Cursor stability, Pagination token expiry, Filtering/sorting query params*

### TTL (Time To Live)
*còn gọi: thời gian sống, cache expiry*

**Vấn đề khiến nó ra đời:** Cache không bao giờ hết hạn thì dữ liệu cũ tồn tại mãi — giá sản phẩm thay đổi nhưng client vẫn thấy giá cũ, hoặc cache phình vô hạn vì không có cơ chế tự dọn.
**Nguồn gốc:** không rõ (khái niệm xuất hiện sớm trong DNS TTL và mạng máy tính)
**Giải quyết thế nào:** Gắn thời hạn cho mỗi entry; quá hạn thì bị evict hoặc phải revalidate với nguồn, cân bằng giữa độ tươi mới dữ liệu và số lần phải truy vấn nguồn.
*Liên quan: Cache invalidation, TTL jitter, stale-while-revalidate*

## Hiệu năng

### Amdahl's law
*còn gọi: định luật Amdahl, speedup tối đa, serial fraction*

**Vấn đề khiến nó ra đời:** Đội ngũ thêm 100 core mà tốc độ chỉ cải thiện 2x, rồi kết luận 'phần song song hóa làm sai' — thực ra phần tuần tự còn lại chi phối tất cả.
**Nguồn gốc:** Gene Amdahl, trình bày tại AFIPS Spring Joint Computer Conference, 1967
**Giải quyết thế nào:** Speedup tối đa = 1 / (f + (1-f)/n), với f là fraction tuần tự, n số luồng/tài nguyên. Khi n → vô hạn, speedup bị chặn bởi 1/f. Bài học: đo fraction tuần tự trước khi đầu tư song song; tối ưu phần chiếm nhiều thời gian nhất (profiling) trước.
*Liên quan: Gustafson's law, Amdahl, Profiling*

### Bandwidth vs Latency
*còn gọi: băng thông và độ trễ, bandwidth latency tradeoff*

**Vấn đề khiến nó ra đời:** Đường truyền 1Gbps vẫn upload file chậm vì latency cao (satellite/4G): người dùng hiểu nhầm 'mạng nhanh = băng thông lớn'.
**Giải quyết thế nào:** Bandwidth = số byte tối đa mỗi giây (phụ thuộc pipe); latency = thời gian byte đầu tiên đi được hết đường (phụ thuộc khoảng cách + xử lý ở mỗi nút). Giao thức gửi nhiều round trip nhỏ bị chi phối bởi latency; transfer file lớn bị chi phối bởi bandwidth. High-BDP link cần cửa sổ truyền đủ lớn để lấp đầy băng thông.
*Liên quan: Speed of light RTT, TCP slow start, Bufferbloat*

### Cache hit ratio
*còn gọi: tỉ lệ trúng cache, hit rate, cache hit rate*

**Vấn đề khiến nó ra đời:** Thêm Redis nhưng DB vẫn chết vì hit ratio chỉ 40% — 60% request vẫn xuyên thấu xuống database đúng lúc traffic cao điểm.
**Giải quyết thế nào:** Hit ratio = số truy cập trả về từ cache / tổng số truy cập. Đo theo key/hotpath, không chỉ tổng thể (một tỷ lệ cao toàn cục vẫn che một vùng key miss 100%). Cải thiện: TTL và refresh phù hợp, warming, nâng cache cho hot key; kết hợp negative caching cho miss lặp lại.
*Liên quan: Cache stampede, Negative caching, Hot key*

### Capacity test vs performance test
*còn gọi: capacity testing, performance testing, load test vs stress test, soak test*

**Vấn đề khiến nó ra đời:** Team chỉ chạy 'load test đúng kịch bản giờ cao điểm' rồi kết luận đủ capacity — thực tế không biết giới hạn rìa ở đâu, không biết phục hồi sau quá tải ra sao.
**Giải quyết thế nào:** Performance test đo latency/throughput ở mức load xác định (so sánh regression); capacity test dò đến ngưỡng (max sustainable RPS trước khi latency SLO vỡ); stress test vượt ngưỡng để xem degrade/recovery; soak test chạy giờ-độ để bắt leak. Mỗi loại mục tiêu và tiêu chí pass khác nhau.
*Liên quan: Performance budget, SLO-driven optimization, Benchmark*

### CDN edge caching
*còn gọi: CDN, edge cache, cache tại biên, origin shield*

**Vấn đề khiến nó ra đời:** User ở xa origin: mỗi lần tải ảnh/video qua nửa vòng đất, origin chịu load dù nội dung tĩnh — chi phí bandwidth và latency cao vô ích.
**Giải quyết thế nào:** CDN phân phối replica nội dung tại PoP gần user: cache HIT → RTT vài ms; MISS → pull về origin rồi phục vụ edge sau. Cấu hình: Cache-Control/TTL, cache key (query string, header), stale-while-revalidate tại edge, purge, origin shield để tránh request storm (cache stampede phân tán). Đo hit ratio theo edge.
*Liên quan: Stale-while-revalidate, Cache stampede, TTFB*

### Debounce & throttle
*còn gọi: debounce, throttle, giới hạn tần suất event, Debounce / Throttle (backend context), chống rung, xử lý dồn, rate-limit theo thời gian*

**Vấn đề khiến nó ra đời:** User gõ nhanh mỗi phím bắn 1 request gợi ý → server nhận 10 request/giây cho 1 truy vấn thật, phần lớn bị bỏ phí (và có thể bị rate limit chính mình). Webhook Stripe/GitHub bắn 50 event trùng trong 2 giây mà mỗi event đều trigger recompute báo cáo thì backend tốn 50 lần tính việc chỉ cần làm 1 lần; hoặc client bấm double-submit tạo 2 đơn hàng.
**Giải quyết thế nào:** Debounce: chỉ fire sau khi sự kiện dừng một khoảng (gõ xong mới gọi API). Throttle: fire tối đa 1 lần mỗi N ms (cố định tần suất). Áp dụng cả hai phía: client giảm request, server endpoint tìm kiếm có thể debounce/queue nội bộ. Đây là rate shaping ở mức độ trễ-micro. Debounce: chỉ xử lý khi im lặng đủ N ms (dồn event lại thành 1). Throttle: cho phép tối đa N lần xử lý trong cửa sổ thời gian. Ở backend còn là rate limiting theo token bucket cho API — cả hai giảm tải và chống duplicate work.
*Liên quan: Rate shaping, Backpressure, Debounced search, Batching, QPS*

### DNS lookup cost
*còn gọi: DNS resolution, resolve time, DNS TTL*

**Vấn đề khiến nó ra đời:** Mỗi cold request chịu 1-2 lần DNS query hàng chục-hàng trăm ms (đặc biệt mobile/3G hoặc resolver chậm), và TTL thấp làm re-resolve thường xuyên.
**Giải quyết thế nào:** Hạ tầng DNS: recursive resolver cache theo TTL; hạ TTL trước khi migrate. Ứng dụng: connection pooling giữ socket sống (không phải resolve lại), happy eyeballs IPv6/IPv4 song song, DNS-over-HTTPS/TCP có chi phí riêng. Đo riêng component DNS trong waterfall.
*Liên quan: Keep-alive, TTFB, Latency numbers*

### FCP / LCP (web vitals backend liên quan)
*còn gọi: First Contentful Paint, Largest Contentful Paint, Core Web Vitals*

**Vấn đề khiến nó ra đời:** LCP 4s trên mobile do HTML render-blocking + ảnh hero không nén + API blockmàn hình đầu — số liệu UX này quyết định SEO/ranking nhưng dev backend thường không nhìn.
**Nguồn gốc:** FCP đến từ cộng đồng W3C Web Performance; LCP do nhóm Chrome/Google giới thiệu ~2019, chuẩn hóa trong Core Web Vitals (web.dev, 2020)
**Giải quyết thế nào:** FCP: thời điểm pixel đầu tiên có nội dung xuất hiện. LCP: thời điểm phần tử lớn nhất (hero ảnh/title) hoàn tất. Backend ảnh hưởng qua: TTFB, server-rendered HTML, CDN cache hit, payload ảnh/API blocking. Ngân sách: LCP < 2.5s ở p75, TTFB mục tiêu < 800ms.
*Liên quan: TTFB, Performance budget, CDN edge caching*

### Gustafson's law
*còn gọi: định luật Gustafson, Gustafson-Barsis*

**Vấn đề khiến nó ra đời:** Amdahl's law dùng workload cố định nên có vẻ 'song song vô dụng', trong khi thực tế người dùng luôn tăng quy mô bài toán khi có thêm tài nguyên.
**Nguồn gốc:** John L. Gustafson & Edwin H. Barsis, bài 'Reevaluating Amdahl's Law', 1988
**Giải quyết thế nào:** Speedup = n - (1-n)·s (với s là fraction tuần tự của bản tuần tự, n số core): workload mới = phần song song mở rộng + phần tuần tự giữ nguyên. Phản đề thực tế của Amdahl: câu hỏi đúng là 'có thêm tài nguyên thì giải được bài toán lớn đến đâu', không chỉ 'bài cũ nhanh bao nhiêu'.
*Liên quan: Amdahl's law, Capacity planning*

### HTTP keep-alive
*còn gọi: persistent connection, TCP connection reuse, HTTP connection reuse*

**Vấn đề khiến nó ra đời:** Mỗi ảnh/JS/CSS lại mở một TCP+TLS handshake (vài trăm ms) nên trang 50 tài nguyên mất vài giây chỉ để 'chào hỏi', trong khi server tốn thời gian accept/teardown.
**Nguồn gốc:** Mặc định từ HTTP/1.1 (RFC 2068/7230, Fielding và cộng sự, 1997)
**Giải quyết thế nào:** Giữ socket TCP mở sau response để request tiếp theo dùng lại, bỏ đi 1-3 round trip (SYN, TLS) mỗi tài nguyên. Cấu hình: keep-alive timeout, max requests per connection, connection pool phía client (pool size cân bằng với số kết nối server chịu nổi).
*Liên quan: Connection pool vs new connection, TLS handshake cost, HTTP/2 multiplexing*

### Latency numbers every programmer should know
*còn gọi: bảng số độ trễ, 100ns/1ms/10ms, Jeff Dean latency table*

**Vấn đề khiến nó ra đời:** Dev viết code gọi network call cho việc có thể làm bằng RAM cache vì không có 'intuition' về thứ tự độ lớn: 100ns với 10ms chênh 100.000 lần nhưng trong đầu người viết chỉ là 'cũng nhanh thôi'.
**Nguồn gốc:** Bảng số của Jeff Dean (Google) trong các talk (~2002-2009); bản tương tác phổ biến của Colin Scott; nhiều bản cập nhật sau này
**Giải quyết thế nào:** Tham chiếu thứ tự độ lớn: ~1ns đọc cache L1, ~100ns đọc RAM / cache L3, ~1ms network RTT cùng trung tâm dữ liệu, ~10-40ms RTT xuyên lục địa, ~10ms đọc SSD, ~100ms-10s đọc HDD/seek. Dùng làm quy tắc ngón tay trước khi quyết định thêm một hop mạng hoặc một lần đọc đĩa.
*Liên quan: Speed of light RTT, Cache locality, Bandwidth vs latency*

### Lazy vs eager loading / lazy evaluation
*còn gọi: trễ trễ, deferred evaluation, call-by-need, eager loading*

**Vấn đề khiến nó ra đời:** Eager: render trang list 1000 phần tử gán mọi relation dù 90% không hiển thị → query thừa. Lazy ngược lại: mỗi phần tử hiển thị lại query 1 lần → N+1. Cả hai cực đoan đều sai.
**Nguồn gốc:** Lazy evaluation (call-by-need) là chủ đề học thuật PL từ thập niên 1970
**Giải quyết thế nào:** Lazy hoãn tính đến khi giá trị cần (giảm work thừa, thêm độ trễ lần đầu + complexity); eager tính ngay (dễ dự đoán, trả giá trước). Trong backend: lazy load relation theo trang, nhưng eager theo batch cho list; pagination + virtual list; dùng projection select đúng cột.
*Liên quan: N+1 query, Memoization, Pagination cost*

### Memoization
*còn gọi: ghi nhớ kết quả, memoise, function result cache, ghi nhớ kết quả hàm*

**Vấn đề khiến nó ra đời:** Hàm đệ quy tính lại Fibonacci/parse config/validate token hàng nghìn lần với cùng input — CPU đốt cho việc đã từng tính rồi.
**Nguồn gốc:** Thuật ngữ do Donald Michie đặt năm 1968 (từ tiếng Hy Lạp 'memorikos')
**Giải quyết thế nào:** Hash map input → kết quả, lần gọi sau trả thẳng (trade time lấy space). Yêu cầu hàm thuần (cùng input → cùng output) và key hash ổn định; cần TTL/invalidation nếu dữ liệu nền thay đổi. Kết hợp cache-control: LRU cho kích thước, per-key lock chống stampede khi compute đắt.
*Liên quan: Cache hit ratio, Lazy evaluation, Cache stampede, Cache, Precomputation, Materialized view*

### N+1 query
*còn gọi: n+1 problem, truy vấn N+1, chậm vì lặp query*

**Vấn đề khiến nó ra đời:** Danh sách 50 sản phẩm render chậm 2 giây vì code hỏi DB 51 lần: 1 lần lấy list + 50 lần hỏi category từng cái — ORM eager/lazy sai chỗ, QPS DB phình 50x.
**Giải quyết thế nào:** Lặp query trong vòng lặp (hoặc lazy-load mỗi phần tử). Fix: JOIN/include prefetch trọn quan hệ, hoặc batch theo id (WHERE id IN (...)), gộp thành map cache. Phát hiện bằng log query + đếm số statement/request, EXPLAIN, pg_stat_statements.
*Liên quan: Query batching (IN/bulk), Fan-out, Prefetch*

### Performance budget & SLO-driven optimization
*còn gọi: performance budget, SLO, error budget, service level objective, budget hiệu năng*

**Vấn đề khiến nó ra đời:** Không ai đặt ngưỡng 'được phép chậm bao nhiêu' nên mỗi lần regression chỉ phát hiện khi khách khiếu nại; tối ưu lan man vì thiếu tiêu chí 'đủ rồi'.
**Nguồn gốc:** SLO/error budget được hệ thống hóa trong Google SRE Book (2016); performance budget là pratique cộng đồng web performance
**Giải quyết thế nào:** Performance budget: ngưỡng cứng cho metric (LCP < 2.5s, API p99 < 300ms, bundle < 200KB) — vượt là gate CI/PR. SLO = mục tiêu độ tin cậy (99.9% requests < 300ms/tháng); error budget = phần được phép fail, còi báo khi burn quá nhanh. Tối ưu theo budget/SLO, không theo cảm tính.
*Liên quan: SLO-driven optimization, Regression detection in benchmarks, Tail latency*

### Phân vị trung vị và phần trăm (p50/p95/p99)
*còn gọi: percentile latency, median latency, average vs percentile*

**Vấn đề khiến nó ra đời:** Trung bình (mean) nói dối: 99 request nhanh 10ms + 1 request chậm 10s cho mean ~110ms,trông như đạt SLO trong khi 1% user chờ 10 giây.
**Giải quyết thế nào:** Chia toàn bộ mẫu latency đã sắp xếp vào 100 phần, p50 = nửa dưới nhanh hơn, p99 = ngưỡng chỉ 1% mẫu vượt qua. Mean dễ tính nhưng bị outlier chi phối; p50 mô tả 'người dùng trung bình', p95/p99 mô tả nhóm kém may mắn — nhóm hay rời bỏ sản phẩm.
*Liên quan: Tail latency, Latency histogram, Coordinated omission*

### Query batching (IN / bulk)
*còn gọi: batch query, whereIn, bulk insert, batch insert*

**Vấn đề khiến nó ra đời:** Ghi 1.000 dòng mỗi dòng một INSERT trong 1 transaction riêng → 1.000 round trip mạng và fsync, mất hàng chục giây.
**Giải quyết thế nào:** Gộp N câu thành một: INSERT multi-values, SELECT ... WHERE id IN (n,...), bulk update qua VALUES join (PostgreSQL). Cần trần batch (vd 500-1000 id/query) tránh packet size limit và plan xấu. Tradeoff: SQL dài hơn, parameter limits (SQLite 999), lock giữ lâu hơn.
*Liên quan: N+1 query, Syscall batching, Fan-out*

### Speed of light & network RTT
*còn gọi: độ trễ tốc độ ánh sáng, round-trip time, cross-country latency*

**Vấn đề khiến nó ra đời:** Kế hoạch 'gọi service ở datacenter bên kia quả đất cho mỗi request' thất bại vì không phần mềm nào nhanh hơn tín hiệu đi qua cáp quang: mỗi round trip thêm hàng chục ms bất kể code tối ưu thế nào.
**Giải quyết thế nào:** Tín hiệu trong cáp quang ~200.000 km/s (≈2/3 tốc độ ánh sáng), nên RTT TP.HCM–Hoa Kỳ thực tế ~150-250ms kể cả không nghẽn. Tổng latency request ≈ (số round trip) × RTT + thời gian xử lý. Giảm số round trip (batch, pipeline, cache) thường thắng việc tối ưu vài dòng code.
*Liên quan: Latency numbers, Bandwidth vs latency, TLS handshake cost*

### TTFB (Time To First Byte)
*còn gọi: time to first byte, thời gian đến byte đầu*

**Vấn đề khiến nó ra đời:** TTFB 2s dù transfer chỉ 20KB: vấn đề nằm ở phía server (DNS, TLS, xử lý, block I/O) chứ không phải bandwidth — nhưng dev lại đi tối ưu nén ảnh.
**Giải quyết thế nào:** TTFB = thời gian từ request bắt đầu đến byte đầu của response về (gồm DNS + TCP + TLS + server processing + network). TTFB cao → nghi server/DB/queue; TTFB thấp mà LCP chậm → nghi payload/render. Phân tách bằng watermark DevTools (DNS/connect/TLS/wait).
*Liên quan: DNS lookup cost, TLS handshake cost, FCP/LCP*

## Phân tán & Đồng thời

### Async/await
*còn gọi: callback hell, pyramid of doom, lồng callback*

**Vấn đề khiến nó ra đời:** Code Node.js lồng 5 cấp callback (đọc file → duyệt danh sách → xử lý → ghi → báo lỗi) thành kim tự tháp — lỗi phải bắt riêng ở từng tầng, muốn retry/điều phối gần như không viết nổi; developer gọi là callback hell.
**Nguồn gốc:** F# 2007 → C# 5.0 (2012) → Python 3.5/PEP 492 (2015) → JavaScript (ES2017).
**Giải quyết thế nào:** Khai báo hàm async rồi 'await' kết quả; trình biên dịch chuyển thành state machine/continuation, code đọc tuyến tính như đồng bộ nhưng không block thread. Khi await, trạng thái dùng chung vẫn có thể đổi — vẫn phải phòng race.
*Liên quan: Callback hell, Event loop, Race condition*

### Concurrency vs Parallelism
*còn gọi: đồng thời, song song, concurrency, parallelism*

**Vấn đề khiến nó ra đời:** Team hay nhầm lẫn: thêm async/timer đã tưởng là 'có parallel', hoặc ngược lại máy 8 core nhưng code toàn chặn chờ I/O nên 1 core cũng không dùng hết. Hiểu sai dẫn đến tối ưu sai chỗ — thêm thread không cứu được bottleneck đang là network I/O.
**Nguồn gốc:** Phân biệt được làm rành mạch trong talk của Rob Pike, 'Concurrency is not Parallelism' (Waza, 11/01/2012); học thuật về concurrent algorithm bắt đầu từ bài của Dijkstra 1965.
**Giải quyết thế nào:** Concurrency là nhiều task chồng lên nhau trong cùng một khoảng thời gian (có thể lần lượt trên 1 core, phục vụ điều phối I/O); Parallelism là chạy thực sự đồng thời trên nhiều core (phục vụ tính toán). Mục tiêu khác nhau nên công cụ cũng khác.
*Liên quan: Event loop, Thread, Process vs Thread*

### Deadlock
*còn gọi: chết lock, treo, bế tắc*

**Vấn đề khiến nó ra đời:** Hai thread giữ hai mutex theo thứ tự ngược nhau (A→B và B→A) rồi cùng chờ vô hạn; hoặc DB: T1 lock dòng 1 rồi chờ dòng 2, T2 lock dòng 2 rồi chờ dòng 1 — toàn bộ request kẹt cứng, service treo mà không crash để báo lỗi.
**Nguồn gốc:** Bốn điều kiện cần (mutual exclusion, hold-and-wait, no preemption, circular wait) do Coffman, Elphick & Shoshani mô tả năm 1971 ('System Deadlocks', ACM Computing Surveys).
**Giải quyết thế nào:** Phá ít nhất một trong 4 điều kiện Coffman: thứ tự khóa thống nhất toàn hệ thống, hoặc cho phép chiếm lại khóa qua timeout (nhưng timeout phải có thiết kế compensating).
*Liên quan: Mutex & Semaphore, Starvation & livelock, Race condition*

### Event loop
*còn gọi: vòng lặp sự kiện, single-threaded event loop, lõi sự kiện Node/Nginx*

**Vấn đề khiến nó ra đời:** Mỗi kết nối HTTP mà một thread riêng thì 10.000 kết nối tốn cả GB RAM và kernel tốn công context switch; trong khi đo ra thì 99% thời gian request đang chờ socket/disk, không hề dùng CPU — block một thread chỉ vì chờ I/O là lãng phí.
**Nguồn gốc:** không rõ (mẫu được tự phát minh ở nhiều nơi: select()/poll() của Unix, message loop của Windows).
**Giải quyết thế nào:** Một vòng lặp duy nhất poll sự kiện (socket có dữ liệu, timer hết giờ) rồi gọi handler tương ứng — không bao giờ chờ I/O blocking nên 1 thread vẫn phục vụ hàng vạn kết nối (mô hình Node.js, nginx worker).
*Liên quan: Async/await, Callback hell, Thread pool & pool exhaustion, Reactor pattern, epoll, Non-blocking I/O*

### Mutex & Semaphore
*còn gọi: khóa tương hỗ, mutual exclusion, semaphore, P/V*

**Vấn đề khiến nó ra đời:** Nhiều thread cùng ghi biến đếm/đẩy phần tử vào mảng chung làm mất dữ liệu (race condition); song có lúc cần cho phép tối đa N thread cùng vào một resource (pool kết nối) chứ không phải chỉ đúng 1 — spinlock busy-wait thì phung phí CPU.
**Nguồn gốc:** Semaphore do Dijkstra phát minh 1962-1963 với thao tác P/V trên máy Electrologica X8; bài 'Solution of a problem in concurrent programming control' của Dijkstra (1965) đặt nền cho mutual exclusion.
**Giải quyết thế nào:** Mutex cho chỉ một thread sở hữu critical section tại một thời điểm; semaphore đếm số lượt vào — thao tác P/trừ chặn khi hết lượt, V/cộng giải thread đang chờ. OS chuyển thread sang chờ thay vì quay vòng.
*Liên quan: Race condition, Deadlock, Atomic operation & CAS*

### Process vs Thread
*còn gọi: process, thread, tiến trình, luồng*

**Vấn đề khiến nó ra đời:** Server xử lý nhiều request cùng lúc nhưng chạy tuần tự thì request sau phải đợi request trước, nhất là khi chờ đọc DB/network (I/O chậm) trong khi CPU thì rảnh. Người viết server phải tự chia chương trình thành các đơn vị chạy song song, và câu hỏi đầu tiên là: tách bộ nhớ (process) hay dùng chung heap (thread)?
**Nguồn gốc:** không rõ
**Giải quyết thế nào:** Process có không gian địa chỉ riêng, nặng, cách ly mạnh; thread chia sẻ bộ nhớ của process, nhẹ hơn nhưng phải tự xử lý race condition khi truy cập dữ liệu chung. Chọn theo mức cách ly và chi phí giao tiếp cần có.
*Liên quan: Concurrency vs Parallelism, Mutex & Semaphore, Race condition*

### Race condition
*còn gọi: điều kiện tranh chấp, data race, race*

**Vấn đề khiến nó ra đời:** Hai request đồng thời đọc số dư 100k, mỗi bên cộng thêm 50k rồi ghi — kết quả là 150k thay vì 200k; hoặc hai thread cùng sửa linked list làm hỏng cấu trúc. Đáng sợ hơn: lỗi chỉ xuất hiện tùy timing nên 'test local vẫn pass, production thi thoảng mất tiền'.
**Nguồn gốc:** không rõ (khái niệm đi cùng văn học hệ điều hành đầu thập niên 1960).
**Giải quyết thế nào:** Loại bỏ sự bất định thứ tự thực thi: đưa thao tác đọc-ghi vào critical section bằng mutex, dùng biến nguyên tử/CAS, hoặc thiết kế để mỗi dữ liệu chỉ có một chủ sở hữu (actor/message queue).
*Liên quan: Mutex & Semaphore, Atomic operation & CAS, Deadlock*

## Messaging & Bất đồng bộ

### Fan-out / Fan-in
*còn gọi: scatter-gather, fanout, rải tụ*

**Vấn đề khiến nó ra đời:** Tweet mới phải vào timeline của 500k follower — xử lý tuần tự trong request thì mất hàng phút, follower không thấy gì; hoặc job index 10 triệu bản ghi chạy một thread thì nửa đêm vẫn chưa xong.
**Giải quyết thế nào:** Fan-out rải việc (hoặc bản sao tin nhắn) cho nhiều worker xử lý song song (scatter), fan-in gom kết quả các nhánh về một nơi (gather) để trả kết quả hoặc ghi tổng hợp.
*Liên quan: Pub/Sub, Message queue, Competing consumers, Stream processing vs batch*

### FIFO / Message ordering
*còn gọi: FIFO queue, message ordering, thứ tự tin nhắn*

**Vấn đề khiến nó ra đời:** Worker xử lý song song khiến event 'khách đã chuyển khoản' đến TRƯỚC event 'đơn được tạo' do hai luồng khác lane, xử lý đảo thứ tự nên đơn bị tính sai trạng thái; queue chuẩn (standard queue) còn không giữ thứ tự qua các lần redelivery.
**Giải quyết thế nào:** Gom tin nhắn cùng khoá (message group, partition) và ép tuần tự trong nhóm đó — tin sau chờ tin trước xong; đánh đổi: tiến độ nhóm bị chặn bởi nút chậm nhất (head-of-line blocking).
*Liên quan: Kafka topic / partition / consumer group, Idempotent consumer, Message queue*

### Message broker
*còn gọi: broker, trung gian tin nhắn, message-oriented middleware*

**Vấn đề khiến nó ra đời:** 5 service giao tiếp trực tiếp thì mỗi cặp giữ kết nối riêng, phải biết địa chỉ nhau; một service đổi địa chỉ hoặc crash thì các bên gửi treo hoặc mất dữ liệu — không ai lưu hộ tin nhắn chờ người nhận quay lại.
**Giải quyết thế nào:** Broker (RabbitMQ, Kafka, SQS) đứng giữa: nhận, lưu (store-and-forward) và route tin nhắn theo queue/topic tới người nhận sẵn sàng — mọi thứ chỉ kết nối tới một điểm trung tâm.
*Liên quan: Message queue, RabbitMQ, Apache Kafka, Pub/Sub*

### Message queue
*còn gọi: hàng đợi tin nhắn, message-oriented middleware, MOM*

**Vấn đề khiến nó ra đời:** Team làm API gửi email xác nhận ngay trong luồng request HTTP: lúc traffic cao, SMTP chậm khiến request treo và timeout, user thấy lỗi dù đơn hàng đã lưu. Gọi thẳng sang service khác thì service đó sập là mất việc kèm theo, không ai giữ hộ tin nhắn chờ.
**Nguồn gốc:** IBM MQ (MQSeries) là thương mại hóa sớm nhất; hàng đợi tin nhắn đã có trong RTOS thập niên 1980 (VRTX, pSOS+)
**Giải quyết thế nào:** Producer đẩy tin nhắn vào hàng đợi giữa chừng rồi trả lời client ngay; worker tách riêng lấy tin ra xử lý — áp lực đỉnh bị hàng đợi giữ (buffer), việc xử lý nền không kéo sập request path.
*Liên quan: Message broker, Pub/Sub, Competing consumers, Dead letter queue*

### Polling
*còn gọi: hỏi thăm, long polling*

**Vấn đề khiến nó ra đời:** Trang cần hiển thị notification mới nhưng HTTP là request/response — không ai báo khi server có gì; client hỏi mỗi giây thì server gánh hàng nghìn GET rỗng, hỏi thưa thì user thấy trễ.
**Giải quyết thế nào:** Client định kỳ GET kiểm tra thay đổi (dùng ETag/If-None-Match cho nhẹ); long polling giữ request mở tới khi có dữ liệu hoặc timeout để giảm số lần hỏi.
*Liên quan: Webhook, Server-Sent Events, WebSocket*

### Pub/Sub
*còn gọi: publish-subscribe, đăng ký phát, topic*

**Vấn đề khiến nó ra đời:** Log service muốn ghi log mọi sự kiện, search indexer và analytics cũng muốn; nếu mỗi sự kiện gọi thẳng từng consumer thì service sinh sự kiện phải biết và sửa code mỗi khi thêm consumer mới — coupling 1-1 tăng theo số người đọc.
**Nguồn gốc:** Hệ thống 'news' của Isis Toolkit (Birman & Joseph, trình bày tại SOSP '87) là một trong những pub/sub công khai đầu tiên
**Giải quyết thế nào:** Publisher publish vào topic chung, subscriber tự đăng ký topic mình cần — một publish chạm n subscriber, bên gửi không cần biết bên nhận là ai hay đã tồn tại chưa.
*Liên quan: Message broker, Fan-out / Fan-in, Event-driven architecture, Apache Kafka*

### Retry với exponential backoff & jitter
*còn gọi: exponential backoff, jitter, retry, thử lại có lùi giờ*

**Vấn đề khiến nó ra đời:** Call API phụ chợt timeout 5 giây do service restart — bỏ qua thì mất việc; nhưng 1000 client cùng retry sau đúng 1 giây thì service đang yếu bị ném thêm 1000 request cùng lúc (thundering herd / retry storm) và chết hẳn.
**Giải quyết thế nào:** Chờ tăng theo cấp số nhân (1s→2s→4s, có cap) để service có thời gian hồi phục; thêm jitter ngẫu nhiên để các client không bắn retry cùng một thời điểm.
*Liên quan: Idempotency, Dead letter queue, Message queue*

### Webhook
*còn gọi: HTTP callback, web hook*

**Vấn đề khiến nó ra đời:** Ứng dụng cần biết ngay khi Stripe trừ tiền thành công hay GitHub push code — polling Stripe mỗi 5 giây thì vừa trễ vừa tốn quota, trong khi bạn không muốn giữ kết nối dài hạn tới từng nhà cung cấp.
**Nguồn gốc:** Jeff Lindsay, 2007 — bài blog 'Web hook to revolutionize the web'
**Giải quyết thế nào:** Bạn đăng ký URL callback; khi sự kiện xảy ra, server bên kia tự POST HTTP tới URL đó — push đúng lúc, chỉ dùng HTTP nên không cần hạ tầng mới; cần ký HMAC để chống giả mạo và replay.
*Liên quan: Polling, Event-driven architecture, Idempotency*

## Kiến trúc & Khả năng mở rộng

### Container vs VM
*còn gọi: thùng chứa vs máy ảo*

**Vấn đề khiến nó ra đời:** App cần chạy trên máy dev, staging, production giống hệt nhau. VM giải quyết bằng cách giả lập cả OS — nhưng mỗi VM nặng hàng GB, khởi động mất phút, tốn RAM cho kernel riêng. Container ra đời để đóng gói app + dependency nhưng dùng chung kernel host, nhẹ hơn, khởi động bằng giây.
**Nguồn gốc:** chroot (1982), FreeBSD Jail (2000), Solaris Zones (2004), LXC (2008). Docker (2013) phổ biến hóa container trên Linux bằng UX đơn giản và image registry.
**Giải quyết thế nào:** VM: hypervisor chạy nhiều guest OS riêng (strong isolation, nặng). Container: engine (Docker/containerd) chạy nhiều user-space isolated trên cùng kernel host qua Linux namespaces (chia view) và cgroups (giới hạn resource).
*Liên quan: sidecar, orchestration, 12-factor app*

### Horizontal vs Vertical Scaling
*còn gọi: scale out vs scale up, mở rộng ngang vs dọc*

**Vấn đề khiến nó ra đời:** App chạy chậm vì quá tải. Có 2 cách: mua server mạnh hơn (vertical — đắt, có giới hạn phần cứng, downtime khi nâng) hoặc thêm nhiều server nhỏ chạy song song (horizontal — rẻ hơn theo đơn vị, elastic, nhưng cần app stateless và có load balancer).
**Nguồn gốc:** Khái niệm có từ thời mainframe; trở thành lựa chọn kiến trúc rõ ràng từ khi cloud ra đời (AWS EC2 2006) cho phép thêm/bớt máy theo phút.
**Giải quyết thế nào:** Vertical: tăng CPU/RAM của một máy, tới giới hạn phần cứng thì phải dừng. Horizontal: thêm nhiều máy phía sau load balancer, không có ceiling; yêu cầu app stateless, session chuyển sang store trung tâm (Redis/DB).
*Liên quan: load balancer, autoscaling, stateless*

### Load Balancer (L4/L7)
*còn gọi: bộ cân bằng tải*

**Vấn đề khiến nó ra đời:** Một server không chịu nổi 10k request/giây, nhưng thay vì mua server to hơn, người ta đặt nhiều server nhỏ phía sau và cần một 'người gác cổng' chia request đều cho chúng — đồng thời loại bỏ server chết khỏi vòng xoay để user không bị lỗi.
**Nguồn gốc:** Load balancing xuất hiện từ các hệ thống viễn thông và mainframe những năm 1970-80s; DNS round-robin có từ những ngày đầu của DNS (RFC 1035, 1987).
**Giải quyết thế nào:** L4 (transport) cân bằng theo IP+port, nhanh nhưng không đọc được nội dung HTTP. L7 (application) đọc được header/URL/cookie để route thông minh hơn (ví dụ route /api sang pool API, /static sang pool static) nhưng tốn tài nguyên hơn.
*Liên quan: round robin, sticky session, horizontal scaling*

### Microservices
*còn gọi: kiến trúc vi dịch vụ*

**Vấn đề khiến nó ra đời:** Monolith lớn tới mức một thay đổi nhỏ ở module thanh toán buộc phải redeploy toàn bộ app, team 50+ dev đụng code nhau liên tục, một bug ở feature A kéo sập cả hệ thống. Microservices ra đời để mỗi team sở hữu một service độc lập, deploy riêng, fail riêng.
**Nguồn gốc:** Thuật ngữ được Peter Rodgers (HP Labs) dùng năm 2005 tại hội nghị Web Services Edge; phổ biến rộng rãi sau bài viết của Martin Fowler và James Lewis năm 2014, và được Netflix/Amazon/Uber áp dụng từ ~2008-2012.
**Giải quyết thế nào:** Chia hệ thống thành nhiều service nhỏ, mỗi service có DB riêng, giao tiếp qua network (HTTP/gRPC/message), deploy độc lập, team nào làm service nấy sở hữu.
*Liên quan: SOA, monolith, bounded context, service mesh*

### Monolith
*còn gọi: monolithic architecture, kiến trúc đơn khối*

**Vấn đề khiến nó ra đời:** Khi mới xây dựng sản phẩm, đội nhỏ (3-5 dev) cần một codebase duy nhất để deploy nhanh, debug dễ, không ai muốn chia nhỏ hệ thống khi chưa có user. Monolith ra đời vì nhu cầu 'chỉ cần chạy được đã' — mọi module nằm chung process, chung DB, gọi hàm trực tiếp không qua mạng.
**Nguồn gốc:** Kiến trúc mặc định của phần mềm từ những năm 1960s; thuật ngữ 'monolith' được dùng phổ biến trong cộng đồng SOA/microservices những năm 2010 để phân biệt với kiến trúc phân tán.
**Giải quyết thế nào:** Toàn bộ logic (auth, business, DB access) chạy trong một process duy nhất; deploy một artifact duy nhất; scale bằng cách nhân bản instance.
*Liên quan: microservices, modular monolith, SOA*

### Round Robin
*còn gọi: luân phiên*

**Vấn đề khiến nó ra đời:** Cần chia request đều cho N server mà không muốn giữ state, không muốn tính toán phức tạp. Round robin ra đời như cách đơn giản nhất: phát đều tay, server nào cũng nhận số lượng xấp xỉ như nhau.
**Nguồn gốc:** Xuất phát từ lý thuyết xếp hàng (queueing theory) và lập lịch CPU; áp dụng vào DNS round-robin từ cuối những năm 1980s.
**Giải quyết thế nào:** Danh sách server xếp vòng tròn, mỗi request phát cho server kế tiếp; có biến thể weighted round robin cho server mạnh nhận nhiều request hơn server yếu.
*Liên quan: load balancer, sticky session, least connections*

### Singleton
*còn gọi: mẫu đơn bản*

**Vấn đề khiến nó ra đời:** Cần đảm bảo một class chỉ có đúng một instance trong toàn bộ app (connection pool, config manager, logger) — nếu mỗi chỗ tự new một connection pool thì lãng phí resource và state không nhất quán. Singleton ra đời để enforce điều đó ở mức language.
**Nguồn gốc:** Gang of Four (Gamma, Helm, Johnson, Vlissides) trong cuốn 'Design Patterns: Elements of Reusable Object-Oriented Software' (1994).
**Giải quyết thế nào:** Private constructor, static method trả về instance duy nhất (lazy hoặc eager init). Nhược điểm: tạo global state ẩn, coupling ẩn, khó unit test (khó mock), vi phạm single responsibility. Thư viện hiện đại thường thay bằng DI container với scope singleton.
*Liên quan: dependency injection, global state, design patterns*

### SOA (Service-Oriented Architecture)
*còn gọi: kiến trúc hướng dịch vụ*

**Vấn đề khiến nó ra đời:** Trong doanh nghiệp lớn, mỗi phòng ban có một app riêng (ERP, CRM, billing) không nói chuyện được với nhau; tích hợp point-to-point tạo ra 'spaghetti' mỗi lần thêm app mới lại phải viết N connector. SOA sinh ra để các app này tái sử dụng nhau qua service chuẩn.
**Nguồn gốc:** Phát triển từ distributed computing và CORBA/DCOM những năm 1990s; thuật ngữ SOA được chuẩn hóa qua các công bố của Gartner và OASIS đầu những năm 2000, phổ biến với SOAP/WSDL.
**Giải quyết thế nào:** Expose chức năng business dưới dạng service có contract chuẩn (thường SOAP/REST), các app khác gọi lại qua network; thường đi kèm ESB (Enterprise Service Bus).
*Liên quan: microservices, monolith, API gateway*

### Sticky Session
*còn gọi: session affinity, phiên bám dính*

**Vấn đề khiến nó ra đời:** App lưu session trên RAM của server (không dùng Redis/DB chung). Khi load balancer chuyển user từ server A sang server B, user bị logout ngay. Sticky session ra đời để 'ghim' user vào đúng server họ đã login.
**Nguồn gốc:** Xuất hiện cùng sự phát triển của web application và session-based authentication những năm 1990s-2000s.
**Giải quyết thế nào:** Load balancer đọc cookie (hoặc IP) để luôn route cùng một user về cùng một backend server. Nhược điểm: khi server đó chết, user mất session; phân phối tải không còn đều; khó scale khi user dồn vào một server nóng.
*Liên quan: load balancer, session replication, horizontal scaling*

### Tight vs Loose Coupling
*còn gọi: liên kết chặt vs lỏng*

**Vấn đề khiến nó ra đời:** Module A gọi trực tiếp hàm của module B, khi B đổi signature thì A break — phải sửa cả hệ thống mỗi lần thay đổi nhỏ. Loose coupling ra đời để các thành phần ít biết về nhau, thay đổi một bên không kéo theo sửa hàng loạt bên kia.
**Nguồn gốc:** Khái niệm coupling/cohesion từ Larry Constantine và Edward Yourdon cuối những năm 1960s-1970s (Structured Design, 1979).
**Giải quyết thế nào:** Tight coupling: gọi trực tiếp, shared state, phụ thuộc implementation. Loose coupling: giao tiếp qua interface ổn định, message queue, event, contract rõ ràng. Hệ thống lớn luôn hướng tới loose coupling để đổi một service mà không đụng services khác.
*Liên quan: microservices, event bus, SOA*

## Độ tin cậy & Quan sát được

### Alerting (threshold alert)
*còn gọi: cảnh báo theo ngưỡng, threshold alert, paging*

**Vấn đề khiến nó ra đời:** Dashboard chỉ có ích khi có người nhìn; incident lúc đêm khuya nếu không có gì đánh thức ai thì downtime kéo dài cho tới sáng. Cần hệ thống tự kết nối 'sai lệch' với 'con người có trách nhiệm'.
**Nguồn gốc:** không rõ
**Giải quyết thế nào:** Rule so sánh metric với ngưỡng (error rate > 5% trong 5 phút...) → gửi notification/pager tới on-call; alertmanager gộp (group) và dedup các alert trùng.
*Liên quan: On-call rotation, Alert fatigue, Monitoring*

### Four Golden Signals
*còn gọi: four_golden_signals, bốn tín hiệu vàng, latency-traffic-errors-saturation*

**Vấn đề khiến nó ra đời:** Cần tập trung vào 4 chỉ số cốt lõi thay vì theo dõi quá nhiều metric gây nhiễu.
**Nguồn gốc:** Google SRE Book - Chapter 6 (Monitoring Distributed Systems)
**Giải quyết thế nào:** Latency (thời gian phản hồi, phân biệt thành công/thất bại), Traffic (lưu lượng yêu cầu), Errors (tỷ lệ thất bại), Saturation (mức độ đầy tải của tài nguyên giới hạn).
*Liên quan: RED_method, USE_method, latency, RED method, USE method, Black-box vs white-box monitoring*

### Health check (/health, /ready)
*còn gọi: health probe, liveness/readiness probe, kiểm tra sức khỏe service*

**Vấn đề khiến nó ra đời:** Process vẫn sống nhưng treo hoặc không kết nối được DB: load balancer/Kubernetes không biết, request vẫn route đến node hỏng và user thấy timeout trong khi node khác vẫn khỏe.
**Nguồn gốc:** không rõ (quy dıktan phổ biến trong Kubernetes/ECS)
**Giải quyết thế nào:** Endpoint HTTP được probe định kỳ; liveness để orchestrator restart, readiness để LB ngừng gửi traffic cho tới khi service thật sự sẵn sàng.
*Liên quan: Black-box monitoring, Alerting, Synthetic monitoring*

### Log aggregation & ELK Stack
*còn gọi: log aggregation, ELK, Elasticsearch-Logstash-Kibana, xây dựng trung tâm log*

**Vấn đề khiến nó ra đời:** Một request đi qua 8 service, mỗi service ghi log vào file của máy mình; user báo lỗi nhưng dev không thể ssh hàng trăm node để đọc file, và mỗi kiểu lỗi nằm ở một nơi nên không soi chéo được. Không có nơi tập trung thì điều tra incident = chạy khắp nơi.
**Nguồn gốc:** Elasticsearch (Shay Banon) mở nguồn năm 2010; stack ELK hình thành từ đó
**Giải quyết thế nào:** Logstash/Beats gom log từ mọi node, Elasticsearch lưu index cho phép search full-text + filter theo field, Kibana để tra cứu và vẽ; toàn hệ thống có một chỗ hỏi 'về request này đã xảy ra gì'.
*Liên quan: Structured logging, Loki, Trace*

### Metrics (time-series)
*còn gọi: metric, số liệu, thời gian series*

**Vấn đề khiến nó ra đời:** Log text không trả lời được 'p99 latency 5 phút qua là bao nhiêu, so với hôm qua thế nào' — parse từng dòng quá chậm và đắt đỏ; dashboard và alert cần dữ liệu liên tục, dạng số để aggregate và so ngưỡng.
**Nguồn gốc:** không rõ
**Giải quyết thế nào:** Ghi dữ liệu dạng (timestamp, tên metric, value, labels) — time series — cho phép sum/avg/percentile theo khoảng thời gian với chi phí lưu trữ và truy vấn thấp hơn log rất nhiều.
*Liên quan: Prometheus scrape model, Monitoring, Metric cardinality*

### Monitoring
*còn gọi: giám sát, monitoring dashboard*

**Vấn đề khiến nó ra đời:** Không ai ngồi nhìn console 24/7; sự cố lúc 3h sáng chỉ được phát hiện khi customer support mở ticket. Team cần lớp liên tục đo những câu hỏi ĐÃ biết trước (CPU bao nhiêu, lỗi bao nhiêu phần trăm) và tự báo khi sai lệch.
**Nguồn gốc:** không rõ
**Giải quyết thế nào:** Thu thập số liệu định kỳ, vẽ dashboard và đặt ngưỡng; khi metric vượt ngưỡng thì hệ thống cảnh báo, con người chỉ can thiệp khi có việc thật.
*Liên quan: Alerting, Metrics (time-series), Observability*

### On-call rotation
*còn gọi: trực production, trực ca đêm, on-call, trực trực*

**Vấn đề khiến nó ra đời:** Production chạy 24/7 nhưng developer làm giờ hành chính; sự cố ngoài giờ không ai chịu trách nhiệm rõ ràng thì mọi người giả vờ không thấy, hoặc mấy người nhiệt tình bị burnout vì lúc nào cũng bị gọi.
**Nguồn gốc:** không rõ
**Giải quyết thế nào:** Xếp lịch trực xoay vòng kèm escalation policy: một người luôn là người đầu tiên được gọi, có quyền pause deploy/rollback, sau ca đêm được nghỉ bù; có tool (PagerDuty, Opsgenie) để gọi điện/turn theo lịch.
*Liên quan: Alert fatigue, Alerting (threshold alert), Blameless postmortem*

### Reliability vs Availability
*còn gọi: reliability_vs_availability*

**Vấn đề khiến nó ra đời:** Người ta thường nhầm lẫn giữa độ tin cậy (reliability) và tính sẵn sàng (availability), dẫn đến mục tiêu đo lường sai.
**Nguồn gốc:** Google SRE Book - Chapter 1 (Betsy Beyer et al.)
**Giải quyết thế nào:** Reliability là xác suất hệ thống thực hiện đúng chức năng trong khoảng thời gian đã định. Availability là tỷ lệ thời gian hệ thống có thể sử dụng được (uptime/total time). Hệ thống có thể có downtime có kế hoạch nhưng vẫn đạt reliability mục tiêu.
*Liên quan: SLO, availability, error_budget*

### SLA
*còn gọi: Service Level Agreement*

**Vấn đề khiến nó ra đời:** Cần phân biệt rõ cam kết hợp đồng với khách hàng khỏi mục tiêu nội bộ để tránh nhầm lẫn khái niệm.
**Nguồn gốc:** Google SRE Book - Chapter 4 (Service Level Objectives)
**Giải quyết thế nào:** SLA là hợp đồng rõ ràng hoặc ngầm định với người dùng, bao gồm hậu quả khi đạt/mất SLO (bồi thường, credit...). SRE thường dùng SLO nội bộ cao hơn SLA.
*Liên quan: SLI, SLO, error_budget*

### SLI
*còn gọi: Service Level Indicator*

**Vấn đề khiến nó ra đời:** Cần một chỉ số định lượng rõ ràng để đo mức độ phục vụ, tránh đo cảm tính.
**Nguồn gốc:** Google SRE Book - Chapter 4 (Service Level Objectives)
**Giải quyết thế nào:** SLI là chỉ số định lượng được định nghĩa cẩn thận để đo một khía cạnh của dịch vụ (ví dụ: tỷ lệ request thành công, latency percentile, throughput). Thường được tổng hợp trong cửa sổ đo lường.
*Liên quan: SLO, SLA, error_rate*

### SLO
*còn gọi: Service Level Objective*

**Vấn đề khiến nó ra đời:** Không có mục tiêu rõ ràng khiến người dùng tự kỳ vọng và đội vận hành thiếu tiêu chí ra quyết định.
**Nguồn gốc:** Google SRE Book - Chapter 4 (Service Level Objectives)
**Giải quyết thế nào:** SLO là giá trị mục tiêu hoặc khoảng mục tiêu cho SLI (ví dụ: p95 latency < 100ms). Giúp cân bằng giữa đổi mới và ổn định.
*Liên quan: SLI, SLA, error_budget*

### Structured logging
*còn gọi: JSON logging, nhật ký có cấu trúc*

**Vấn đề khiến nó ra đời:** Service ghi log dạng text tự do ('ERROR: timeout when calling...') chạy trên vài chục container, dev phải ssh từng máy để grep chuỗi; khi cần lọc 'lỗi theo user_id' hay đếm 'số lỗi mỗi phút' thì không làm được vì thông tin nằm lẫn trong câu chữ. Sau sự cố 2h sáng, container đã restart và file log bị xoay vòng thì bằng chứng biến mất hoàn toàn.
**Nguồn gốc:** Mô hình 12-factor (Heroku, Adam Wiggins), Factor XI 'Treat logs as event streams'
**Giải quyết thế nào:** Ép mỗi dòng log thành record JSON có trường cố định (timestamp, level, msg, request_id...) để filter/group-by/index ngay ở tầng thu thập, đồng thời app chỉ ghi ra stdout để log shipper tự kéo đi — không tự quản lý file.
*Liên quan: Log aggregation, Correlation ID, Structured event*

## Bền vững & Chị tải

### Autoscaling (Horizontal/Vertical)
*còn gọi: tự động mở rộng, scale out/in, scale up/down, autoscaler*

**Vấn đề khiến nó ra đời:** Capacity cố định: mua theo đỉnh thì lãng phí, mua theo trung bình thì sập giờ cao điểm.
**Nguồn gốc:** AWS EC2 Auto Scaling là nơi chuẩn hóa khái niệm trong cloud.
**Giải quyết thế nào:** Horizontal (scale out): thêm/bớt instance theo tín hiệu (CPU, queue depth, request count). Vertical (scale up): tăng CPU/RAM cho instance hiện có. Kèm warmup để instance mới chưa nhận traffic khi chưa sẵn sàng.
*Liên quan: Cooldown, Capacity Planning, Load Testing, Connection Draining*

### Availability Math (Five Nines)
*còn gọi: 99.999%, high availability, uptime calculation*

**Vấn đề khiến nó ra đời:** Cần quy đổi 'five nines' (99.999%) ra downtime thực tế để đặt kỳ vọng.
**Nguồn gốc:** Thuật ngữ phổ biến trong telecom/carrier-grade tradition (high availability).
**Giải quyết thế nào:** 99.9% = ~43 phút/tháng, 99.99% = ~4.3 phút/tháng, 99.999% = ~26 giây/tháng (~5.26 phút/năm). Availability tính theo SLI thành công, không tính planned maintenance nếu quy ước khác nhau.
*Liên quan: SLO/SLI, Error Budget, MTTR/MTBF*

### Exponential Backoff
*còn gọi: backoff mũ, exponential backoff with jitter, full jitter, Exponential backoff + jitter (client), backoff with jitter, decorrelated jitter*

**Vấn đề khiến nó ra đời:** Nhiều client cùng fail rồi retry cùng một thời điểm khiến backend vừa hồi phục lại bị dồn dập đánh gục (retry storm). Retry sau 1s, 2s, 4s... đồng bộ giữa các client khiến burst retry trùng nhau (thundering herd); server vừa hồi phục lại bị đánh sập - plain backoff 'chỉ tạo ra các khoảng thời gian không client nào tranh chấp'.
**Nguồn gốc:** Ethernet binary exponential backoff (Metcalfe & Boggs, 1976, CSMA/CD); biến thể exponential + jitter cho service được AWS Builders Library (Marc Brooker) phổ biến trong 'Timeouts, retries and backoff with jitter'.
**Giải quyết thế nào:** Mỗi lần retry tiếp theo, thời gian chờ tăng theo cấp số nhân (1s, 2s, 4s...) có cap; thêm jitter (ngẫu nhiên hóa thời điểm retry, kiểu 'full jitter' = random trong [0, backoff]) để phá đồng bộ hóa đàn thú. AWS khuyên kết hợp token bucket giới hạn retry locally thay vì chỉ cap. sleep = min(base * 2^n, cap) cộng random. Full jitter: sleep = random(0, backoff) - giảm tải nhất; Equal jitter: backoff/2 + random(0, backoff/2); Decorrelated jitter: random(base, prev*3). Hầu hết AWS SDK bật sẵn standard/adaptive retry mode (update 2023).
*Liên quan: Retry, Retry Budget, Thundering Herd, Rate limit headers, Retry guidance (safe methods), Request timeout budgets*

### Fallback
*còn gọi: phương án thay thế, fallback path*

**Vấn đề khiến nó ra đời:** Dependency chính không sẵn sàng thì request fail toàn bộ thay vì trả kết quả thay thế.
**Giải quyết thế nào:** Khi primary fail (thường trigger bởi circuit breaker/timeout), chuyển sang đường thay thế: cache/CDN, service dự phòng, dữ liệu mặc định, trả 'đang xử lý sau'. Fallback phải nhanh (không gọi thêm dependency chậm như primary) và tránh tầng tầng lớp phủ lỗi che bug thật.
*Liên quan: Circuit Breaker, Graceful Degradation, Timeout*

### Load Testing
*còn gọi: kiểm thử tải, performance testing, kịch bản tải*

**Vấn đề khiến nó ra đời:** Không biết hệ thống chịu được bao nhiêu trước khi có khách thật.
**Giải quyết thế nào:** Mô phỏng lưu lượng gần thực tế (steady state, ramp-up, spike, soak) để tìm throughput tối đa, latency tail, điểm break. Load test nên chạy trước giờ cao điểm, theo kịch bản production-like, quan sát error rate/SLO.
*Liên quan: Stress Test vs Soak Test, Capacity Planning, Autoscaling, Bottleneck Analysis*

### Redundancy/N+1 Redundancy
*còn gọi: dự phòng, N+1, active-active, active-passive*

**Vấn đề khiến nó ra đời:** Single point of failure (SPOF) làm toàn hệ thống sập khi 1 thành phần hỏng.
**Giải quyết thế nào:** N = capacity cần thiết để phục vụ; N+1 nghĩa thêm 1 instance dự phòng; N+2 an toàn hơn nhưng tốn kém. Active-active: tất cả xử lý lưu lượng; active-passive: dự phòng chờ kích hoạt. Cần đảm bảo failover nhanh và test định kỳ.
*Liên quan: Autoscaling, Capacity Planning, Replication Lag Tolerance*

### Retry
*còn gọi: tái thử, retry policy*

**Vấn đề khiến nó ra đời:** Lỗi mạng tạm thời hoặc backend chậm đôi lần làm request bị fail dù hệ thống vẫn sống.
**Giải quyết thế nào:** Gọi lại thao tác thất bại sau một khoảng trễ. Chỉ nên retry lỗi tạm thời (timeout, 502/503), chỉ retry idempotent (hoặc có idempotency key); retry ở nhiều tầng cùng lúc nhân số request lên (3 tầng × 3 lần = 64 lần gọi DB cho 1 hành động của user — ví dụ trong Google SRE Book ch.22).
*Liên quan: Exponential Backoff, Retry Budget, Timeout, Cascading Failure*

### SLO/SLI
*còn gọi: service level indicator, service level objective, chỉ số/mục tiêu mức dịch vụ*

**Vấn đề khiến nó ra đời:** Chỉ nói 'hệ thống nhanh/ổn định' thì không đo được, không quyết định được cần đầu tư.
**Nguồn gốc:** Google SRE Book (2016), Chương 4 'Service Level Objectives'.
**Giải quyết thế nào:** SLI = số đo thực tế (tỷ lệ request thành công, latency p99, throughput). SLO = cam kết ngưỡng cho SLI trên cửa sổ thời gian. Chọn SLI theo trải nghiệm user, đặt SLO chặt hơn SLA.
*Liên quan: Error Budget, Latency SLO, Availability Math (Five Nines), MTTR/MTBF*

### Stress Test vs Soak Test
*còn gọi: stress testing, soak testing, endurance test*

**Vấn đề khiến nó ra đời:** Dùng sai loại test: stress test tìm giới hạn tối đa, soak test tìm leak/resource ổn định dài hạn.
**Giải quyết thế nào:** Stress test: tăng lưu lượng vượt ngưỡng dự kiến (tìm breaking point, behavior under extreme). Soak test: chạy lưu lượng ổn định trong thời gian dài (4–24h) để phát hiện memory leak, connection leak, GC issue.
*Liên quan: Load Testing, Chaos Engineering, Capacity Planning*

### Thundering Herd
*còn gọi: đàn thú, thundering herd problem, wake-up storm*

**Vấn đề khiến nó ra đời:** Nhiều process cùng thức dậy cho cùng 1 sự kiện, chỉ 1 thắng, còn lại tốn CPU rồi ngủ lại.
**Nguồn gốc:** Wikipedia trích nguồn sớm nhất là Jargon File (bản 4.4.7) — gốc slang hacker; Linux thêm EPOLLEXCLUSIVE (kernel 4.5).
**Giải quyết thế nào:** Giải pháp: random hóa thời điểm đánh thức (jitter), single-flight/gọi trước (1 coroutine fetch, còn lại đợi), EPOLLEXCLUSIVE, Windows I/O completion port chỉ đánh thức 1 thread.
*Liên quan: Stampeding Herd, Exponential Backoff, Caching Stampede, Retry*

### Timeout
*còn gọi: hạn chờ, request timeout, connect timeout*

**Vấn đề khiến nó ra đời:** Không đặt hạn chờ thì một call treo vô hạn giữ thread và kết nối, request đến sau xếp hàng phía sau.
**Giải quyết thế nào:** Đặt giới hạn thời gian cho từng bước (connect, read, tổng request). Chọn giá trị từ độ trễ thật của downstream: AWS Builders Library gợi ý lấy percentile tương ứng mức false-timeout chấp nhận được (VD p99.9 cho tỷ lệ timeout oan 0.1%). Quá cao → lãng phí tài nguyên; quá thấp → retry storm.
*Liên quan: Deadline Propagation, Retry, Circuit Breaker, Tail Latency*

## Bảo mật & Xác thực

### authentication vs authorization
*còn gọi: authN vs authZ, Authentication vs Authorization (Authn vs AuthZ), xác thực vs phân quyền, định danh và truy cập*

**Vấn đề khiến nó ra đời:** Khi web app mới xuất hiện, chỉ cần 'ai là ai' (authentication) thôi chưa đủ — hệ thống cũng phải biết 'ai được làm gì' (authorization). Nếu không phân biệt rõ, dễ cấp quyền sai hoặc chặn nhầm người dùng hợp lệ. Người mới xây API thường gộp 'đăng nhập' và 'được phép làm gì' thành một khái niệm login. Hệ quả thực tế: endpoint kiểm tra 'user đã đăng nhập' rồi cho mọi user đọc/xóa dữ liệu của user khác, hoặc khi sửa code auth không biết mình đang sửa khâu nào vì code lẫn lộn. Hai câu hỏi khác nhau — 'bạn là ai' vs 'bạn được làm gì' — cần tách bạch từ đầu.
**Nguồn gốc:** General access control model (early multi-user systems)
**Giải quyết thế nào:** Authentication xác minh danh tính (username/password, token), authorization quyết định quyền truy cập tài nguyên sau khi đã xác minh. Authentication xác minh danh tính (password, token, MFA) và trả về identity; Authorization diễn ra sau đó, quyết định identity đó được thực hiện hành động nào trên tài nguyên nào (policy/permission check).
*Liên quan: session-based auth, RBAC, least privilege, Session, OAuth 2.0*

### bcrypt

**Vấn đề khiến nó ra đời:** Trước bcrypt, web dùng MD5/SHA-1 để hash mật khẩu — chúng là hash nhanh, thiết kế để tính toán nhiều lần trên giây, hoàn toàn ngược với nhu cầu hash mật khẩu. Attacker với GPU đập được hàng tỷ hash mỗi giây nên mật khẩu yếu chỉ sống sót vài giây khi database lộ.
**Nguồn gốc:** Niels Provos và David Mazières, USENIX 1999
**Giải quyết thế nào:** Dựa trên Blowfish, hàm adaptive: tham số cost (2^cost vòng lặp) tăng được theo thời gian, kèm salt ngẫu nhiên 16 byte — mỗi lần verify cố ý chậm lại để brute-force offline trở nên đắt đỏ.
*Liên quan: Password hashing, Salt, Argon2*

### CORS vs CSRF

**Vấn đề khiến nó ra đời:** Browser thực thi Same-Origin Policy để bảo vệ, nhưng app frontend cần gọi API cross-origin. Đồng thời, browser tự động gửi cookie khiến request giả mạo từ trang khác có thể hành động thay user (CSRF). Cần phân biệt rõ hai vấn đề.
**Nguồn gốc:** Same-Origin Policy; CSRF described in security literature (early 2000s)
**Giải quyết thế nào:** CORS (server opt-in qua HTTP headers) quyết định trình duyệt có cho JS đọc response cross-origin không. CSRF là tấn công khiến user vô tình gửi request có cookie; phòng bằng CSRF token, SameSite cookie.
*Liên quan: session-based auth, XSS*

### Cross-Origin Resource Sharing (CORS)

**Vấn đề khiến nó ra đời:** Same-origin policy chặn JS đọc response từ domain khác, nhưng SPA frontend ở `app.example.com` lại cần gọi API `api.example.com` — không có cơ chế cho phép có kiểm soát thì developer buộc phải đặt chung origin hoặc mở proxy chết người. Thiếu CORS đúng thì tính năng 'gọi API chéo origin' không hoạt động; CORS sai (`*` + credentials) thì lộ data cho site lạ.
**Nguồn gốc:** không rõ
**Giải quyết thế nào:** Server trả header `Access-Control-Allow-Origin` (và Allow-Methods/Headers/Credentials) như consent có chủ đích; request 'độc' (POST, custom header)kích hoạt preflight OPTIONS trước. CORS enforced bởi trình duyệt, bảo người dùng chứ không bảo server khỏi CSRF.
*Liên quan: CSRF, Session*

### Cross-Site Request Forgery (CSRF)
*còn gọi: giả mạo yêu cầu chéo trang*

**Vấn đề khiến nó ra đời:** Trình duyệt tự gắn cookie phiên khi gửi request sang site khác, nên site xấu chèn `<img src="bank.com/transfer?to=attacker">` vẫn chạy với quyền của nạn nhân đang đăng nhập bank.com — server thấy cookie hợp lệ và không phân biệt được request thật do user bấm vs request bị site khác ép gửi.
**Nguồn gốc:** không rõ
**Giải quyết thế nào:** Token đồng bộ (server phát token ẩn trong form/header, đối chiếu khi nhận), double-submit cookie, và SameSite cookie attr — mỗi lớp chặn một phần đường gửi cookie ngầm.
*Liên quan: SameSite cookie, CORS, XSS*

### Cross-Site Scripting (XSS)
*còn gọi: chèn script chéo trang*

**Vấn đề khiến nó ra đời:** Server render user input (tên hiển thị, comment) vào HTML mà không encode, trình duyệt giao đoạn script của attacker chạy trong phiên của nạn nhân. Kẻ tấn công ăn cắp cookie/session, giả mạo nạn nhân, keylog ngay trong trang 'tin tưởng' — mức nghiêm trọng ngang SQLi nhưng nhắm vào trình duyệt thay vì database.
**Nguồn gốc:** không rõ
**Giải quyết thế nào:** Encode theo từng ngữ cảnh (HTML/JS/URL/CSS) tại điểm render, sanitize HTML do user tạo bằng thư viện như DOMPurify, và dùng Content Security Policy làm lớp phòng thủ thứ hai.
*Liên quan: CSRF, Content Security Policy*

### encryption symmetric vs asymmetric

**Vấn đề khiến nó ra đời:** Cần mã hóa dữ liệu trong truyền tải/lưu trữ. Symmetric nhanh nhưng khó phân phối key; asymmetric dùng cặp public/private giúp trao đổi key/xác thực nhưng chậm hơn.
**Nguồn gốc:** Diffie–Hellman (1976), RSA (1978)
**Giải quyết thế nào:** Symmetric: cùng key mã hóa/giải mã (AES). Asymmetric: public key mã hóa, private key giải mã (RSA/ECDSA); ngược lại dùng cho signature.
*Liên quan: TLS handshake, certificate, digital signature*

### Multi-Factor Authentication (MFA)
*còn gọi: xác thực đa yếu tố, 2FA*

**Vấn đề khiến nó ra đời:** Mật khẩu một mình đã thất bại ở quy mô lớn: phishing, credential stuffing từ database site khác, mật khẩu yếu — Microsoft phân tích cho thấy MFA chặn được 99,9% các vụ account compromise. Cần thứ gì đó 'attacker không có' ngoài mật khẩu đã bị đánh cắp.
**Nguồn gốc:** không rõ
**Giải quyết thế nào:** Yêu cầu kết hợp 2 trong 3 loại yếu tố (biết — mật khẩu/PIN; có — phone/hardware key; là — sinh trắc) trước khi vào tài khoản, nên chiếm được mật khẩu vẫn không đăng nhập được.
*Liên quan: Password hashing, Rate limiting*

### password hashing
*còn gọi: băm mật khẩu, password hash*

**Vấn đề khiến nó ra đời:** Nếu lưu password dạng plaintext, một khi database bị leak, toàn bộ tài khoản bị mất ngay. Cần biến đổi password thành dạng không thể đảo ngược để so sánh khi login.
**Nguồn gốc:** UNIX password storage (DES crypt) evolved to salted hashes
**Giải quyết thế nào:** Dùng hash function chuyên biệt cho password (bcrypt/scrypt/argon2) với salt để tạo digest; login so sánh digest.
*Liên quan: salting, rainbow table, brute force + rate limiting, bcrypt, Argon2, Salt, Rainbow table*

### Principle of Least Privilege (PoLP)
*còn gọi: nguyên tắc đặc quyền tối thiểu*

**Vấn đề khiến nó ra đời:** Cho mọi service/user quyền admin 'cho đỡ phải sửa quyền sau này' — khi một tài khoản bị xâm phạm, attacker hưởng trọn toàn bộ quyền đó (database read-write cả bảng, xóa production...). Thiếu nguyên tắc này thì mọi sự cố nhỏ đều leo thang thành sự cố toàn hệ thống.
**Nguồn gốc:** Jerome Saltzer và Michael Schroeder, "The protection of information in computer systems", Proceedings of the IEEE, 1975
**Giải quyết thế nào:** Mỗi chương trình/user chỉ nhận đúng đặc quyền cần cho công việc cụ thể, chia nhỏ service account theo endpoint, review định kỳ; giảm bề mặt tấn công và blast radius của mỗi sự cố.
*Liên quan: RBAC, Secrets management*

### rainbow table
*còn gọi: bảng cầu vồng, precomputed hash table*

**Vấn đề khiến nó ra đời:** Attacker cần nhanh chóng đảo ngược hash thành plaintext sau khi có database leak. Brute force chậm, nên sinh bảng precomputed (space-time tradeoff) để tra ngược nhanh.
**Nguồn gốc:** Martin Hellman (1980) time-memory tradeoff; Philippe Oechslin (2003) rainbow tables
**Giải quyết thế nào:** Precompute chains (hash+reduce) từ passwords, chỉ lưu start/end. Khi có hash cần crack, tìm chain chứa hash rồi dựng lại plaintext.
*Liên quan: salting, password hashing, Salt, Password hashing*

### Rate limiting / login throttling
*còn gọi: giới hạn tần suất đăng nhập, brute force protection*

**Vấn đề khiến nó ra đời:** Không giới hạn số lần thử mật khẩu thì attacker chạy dictionary/brute-force thoải mái; tệ hơn là credential stuffing (danh sách user/pass rò rỉ từ site khác) và password spraying (1 mật khẩu yếu thử hàng nghìn account) — cả hai tấn công hàng loạt mà không site nào chặn vì mỗi IP/account chỉ thử vài lần.
**Nguồn gốc:** không rõ
**Giải quyết thế nào:** Chốt số lần thử thất bại theo account (không theo IP để né distributed attack), khóa theo bậc thang/exponential backoff, MFA và blocklist mật khẩu đã rò rỉ như lớp bổ sung; OWASP khuyến nghị defense-in-depth thay vì một biện pháp đơn lẻ.
*Liên quan: MFA, Password hashing*

### Salt
*còn gọi: mặn hóa mật khẩu, random salt*

**Vấn đề khiến nó ra đời:** Nếu chỉ hash mật khẩu không salt, cùng một mật khẩu luôn cho cùng hash — attacker tải một bảng tra ngược sẵn là crack toàn bộ user dùng 'password123' cùng lúc, và attacker biết ngay user nào trùng mật khẩu mà không cần thử gì.
**Nguồn gốc:** không rõ
**Giải quyết thế nào:** Sinh số ngẫu nhiên 128-bit riêng cho mỗi mật khẩu, hash(password + salt) và lưu cùng hash; mỗi password có hash riêng vô hiệu hóa bảng tra trước và việc đối chiếu hàng loạt.
*Liên quan: Rainbow table, bcrypt, Password hashing*

### salting
*còn gọi: salt*

**Vấn đề khiến nó ra đời:** Ngay cả khi dùng hash, nhiều user dùng cùng password sẽ có cùng hash. Attacker có thể dùng precomputed bảng để dò nhanh. Cần thêm giá trị ngẫu nhiên (salt) vào mỗi password trước khi hash.
**Nguồn gốc:** Morris/Thompson (1979) noted need for salt
**Giải quyết thế nào:** Tạo salt ngẫu nhiên cho mỗi user, lưu salt cùng hash; hash(password+salt). Nhờ vậy identical passwords cho hash khác nhau.
*Liên quan: password hashing, rainbow table, bcrypt/scrypt/argon2*

### SameSite cookie
*còn gọi: SameSite=Strict/Lax/None*

**Vấn đề khiến nó ra đời:** Cookie mặc định được gửi trong mọi request kể cả request từ site khác — chính là lỗ hổng cho CSRF. Trước khi có SameSite, developer phải tự gắn anti-CSRF token vào từng form/API,site nào quên là bị giả mạo ngay.
**Nguồn gốc:** không rõ
**Giải quyết thế nào:** Attribute của Set-Cookie: Strict chặn toàn bộ cross-site, Lax chỉ cho navigation GET an toàn, None (bắt buộc kèm Secure) cho phép cross-site có chủ đích; giảm đáng kể CSRF nhưng OWASP cảnh báo không đủ một mình.
*Liên quan: CSRF, Session*

### session-based auth
*còn gọi: cookie-based session*

**Vấn đề khiến nó ra đời:** Khi server cần ghi nhớ người dùng sau login, việc gửi username/password đi lại mỗi request rất tốn và không an toàn. Cần cách 'ghi nhớ phiên đăng nhập' mà vẫn có thể kiểm soát hết hạn.
**Nguồn gốc:** HTTP is stateless; early web apps needed stateful sessions
**Giải quyết thế nào:** Sau login, server tạo session ID lưu server-side (session store), gửi session ID qua cookie cho client. Mỗi request kèm cookie để server tra cứu phiên.
*Liên quan: authentication vs authorization, CORS vs CSRF, replay attack*

### SQL injection (SQLi)
*còn gọi: tiêm SQL, chèn lệnh SQL*

**Vấn đề khiến nó ra đời:** Ứng dụng nối chuỗi user input thẳng vào câu SQL (`"SELECT * FROM users WHERE name='" + input + "'`), nên input `' OR 1=1--` viết lại cả logic truy vấn. Hậu quả gặp thật hàng ngày: đăng nhập bypass bằng `admin'--`, dump toàn bảng user, thậm chí OS command qua INTO OUTFILE — OWASP xếp đầu Top 10 suốt nhiều năm vì nguồn gốc là thói quen nối chuỗi có từ thời CGI.
**Nguồn gốc:** không rõ
**Giải quyết thế nào:** Parameterized query/prepared statement tách query structure khỏi data: input chỉ được bind vào placeholder, không bao giờparse thành SQL; phần không parameterize được (tên bảng/cột, ORDER BY) thì whitelist.
*Liên quan: Command injection, Input validation*

### token
*còn gọi: access token*

**Vấn đề khiến nó ra đời:** Session lưu trên server không scale tốt (load balancer nhiều node). Cần cách đại diện cho quyền truy cập mà client tự mang theo, server có thể xác minh nhanh mà không cần tra cứu session store.
**Nguồn gốc:** OAuth delegation needs stateless credentials
**Giải quyết thế nào:** Token là chuỗi đại diện (thường signed) client đính kèm (Authorization: Bearer) để server xác minh quyền truy cập.
*Liên quan: JWT, OAuth 2.0, refresh token rotation*

## Kiểm thử & Chất lượng

### arrange-act-assert
*còn gọi: AAA, 3A pattern*

**Vấn đề khiến nó ra đời:** Test viết lộn xộn, khó đọc, khó biết đâu là setup, đâu là hành động, đâu là kiểm chứng.
**Nguồn gốc:** William C. Wake / Bill Wake popularized
**Giải quyết thế nào:** Arrange: chuẩn bị. Act: thực thi. Assert: kiểm chứng. Giúp test rõ ràng, dễ review.
*Liên quan: assertion, fixture, unit test*

### assertion
*còn gọi: assert*

**Vấn đề khiến nó ra đời:** Sau khi chạy code, cần xác định "đúng hay sai" một cách tự động. Nếu chỉ in kết quả, dễ bỏ sót.
**Nguồn gốc:** xUnit
**Giải quyết thế nào:** So sánh kết quả kỳ vọng vs thực tế; nếu sai, test fail ngay với thông báo rõ ràng.
*Liên quan: arrange-act-assert, unit test*

### Code coverage
*còn gọi: Test coverage*

**Vấn đề khiến nó ra đời:** Cần biết phần nào của code đã được test thực thi, nhưng không đủ chỉ đọc code — cần một thước đo khách quan về vùng code được phủ bởi test.
**Nguồn gốc:** Miller & Maloney (CACM, 1963)
**Giải quyết thế nào:** Đo tỷ lệ dòng/nhánh/điều kiện được thực thi khi chạy test suite. Tuy nhiên, coverage cao không đồng nghĩa với test chất lượng tốt.
*Liên quan: Mutation testing, Statement coverage, Branch coverage*

### code review
*còn gọi: peer review, pull request review*

**Vấn đề khiến nó ra đời:** Lỗi logic, design kém, hoặc hiểu sai chỉ có 1 người biết trước merge. Thiếu cơ chế bắt lỗi đa góc nhìn.
**Nguồn gốc:** Fagan Inspection (Michael Fagan) → modern PR review
**Giải quyết thế nào:** Peer review trước merge: kiểm tra logic, readability, test coverage, security, tránh knowledge silo.
*Liên quan: technical debt, refactoring*

### Dummy

**Vấn đề khiến nó ra đời:** Khi signature của phương thức yêu cầu một tham số, nhưng test không hề dùng đến giá trị đó, cần truyền gì đó chỉ để gọi được.
**Nguồn gốc:** Gerard Meszaros (xUnit Test Patterns)
**Giải quyết thế nào:** Truyền một giá trị không sử dụng (null, object rỗng) nhằm thỏa mãn interface mà không ảnh hưởng đến logic test.
*Liên quan: Test double*

### e2e test
*còn gọi: end-to-end test, end to end testing, E2E*

**Vấn đề khiến nó ra đời:** Khi deploy, người dùng gặp lỗi nhưng cả unit + integration đều pass. Lỗi chỉ xuất hiện ở toàn bộ luồng (UI/API/DB/network).
**Nguồn gốc:** Agile/acceptance testing practice (Glenford Myers influenced)
**Giải quyết thế nào:** Mô phỏng người dùng thực chạy toàn bộ hệ thống (thường qua UI hoặc HTTP) để kiểm tra kịch bản hoàn chỉnh.
*Liên quan: integration test, smoke test, test pyramid, acceptance test*

### End-to-end test
*còn gọi: E2E test*

**Vấn đề khiến nó ra đời:** Dù các thành phần đã được kiểm tra riêng lẻ, hệ thống vẫn có thể sai ở điểm tích hợp cuối cùng (luồng người dùng thực, giao diện, xác thực) khi chạy trong môi trường thật.
**Nguồn gốc:** không rõ
**Giải quyết thế nào:** Mô phỏng hành động của người dùng trên toàn bộ ứng dụng (frontend + backend + database + API) để xác minh một luồng nghiệp vụ hoàn chỉnh.
*Liên quan: Test pyramid, Integration test, Flaky test*

### Fake

**Vấn đề khiến nó ra đời:** Khi stub đơn thuần quá đơn giản nhưng dùng phụ thuộc thật lại quá chậm (vd. dùng DB thật trong unit test), cần một triển khai thay thế có hành vi tương tự nhưng nhẹ.
**Nguồn gốc:** Gerard Meszaros (xUnit Test Patterns)
**Giải quyết thế nào:** Triển khai một phiên bản đơn giản, hiệu quả hơn của phụ thuộc thật (ví dụ: in-memory database) nhưng vẫn tuân thủ cùng interface.
*Liên quan: Test double, Mock, Stub*

### fixture
*còn gọi: test fixture, setup/teardown*

**Vấn đề khiến nó ra đời:** Nhiều test cần cùng dữ liệu/state khởi tạo, nếu lặp lại code thì khó maintain và dễ sai lệch.
**Nguồn gốc:** xUnit terminology
**Giải quyết thế nào:** Tập trung khởi tạo state dùng chung (hoặc per-test) trong beforeEach/afterEach hoặc factory để tránh trùng lặp.
*Liên quan: test data management, test isolation, arrange-act-assert*

### Gherkin

**Vấn đề khiến nó ra đời:** Cần một định dạng văn bản có cấu trúc để biểu diễn ví dụ nghiệp vụ mà cả người kỹ thuật và không kỹ thuật đều đọc được và có thể chạy làm test.
**Nguồn gốc:** khoảng 2008 (Cucumber)
**Giải quyết thế nào:** Sử dụng cú pháp Given, When, Then để mô tả ngữ cảnh, hành động và kết quả kỳ vọng, sau đó ánh xạ từng bước vào code thực thi.
*Liên quan: BDD, Cucumber, Specification by example*

### integration test
*còn gọi: integration testing*

**Vấn đề khiến nó ra đời:** Unit test pass nhưng ứng dụng vẫn lỗi vì các thành phần (DB, service, module) không tương thích nhau khi ghép lại. Cần test quy trình liên kết giữa chúng.
**Nguồn gốc:** Kent Beck / xUnit context
**Giải quyết thế nào:** Test tương tác thật giữa vài thành phần (vd. service + DB in-memory/test DB) thay vì mock toàn bộ.
*Liên quan: unit test, e2e test, test pyramid, contract test (Pact), Test pyramid, Unit test, End-to-end test*

### lint
*còn gọi: linter, linting*

**Vấn đề khiến nó ra đời:** Code style không nhất quán, dễ gây tranh cãi trong review. Nhiều lỗi đơn giản (unused import, typo) lặp lại.
**Nguồn gốc:** Stephen C. Johnson (lint for C)
**Giải quyết thế nào:** Tự động kiểm tra style/rule (format, convention) trước commit/CI để bắt lỗi sớm, giữ codebase nhất quán.
*Liên quan: static analysis, type check*

### Mock

**Vấn đề khiến nó ra đời:** Khi muốn đảm bảo system under test gọi đúng phương thức với tham số đúng lên một collaborator (hành vi tương tác), chứ không chỉ quan tâm đến kết quả trả về.
**Nguồn gốc:** Gerard Meszaros (xUnit Test Patterns)
**Giải quyết thế nào:** Một test double được cấu hình trước với các kỳ vọng (expectations) về cách nó sẽ được gọi; test sẽ thất bại nếu các tương tác không khớp như mong đợi.
*Liên quan: Test double, Behavior verification, Stub*

### red-green-refactor
*còn gọi: red-green-refactor cycle*

**Vấn đề khiến nó ra đời:** Khi sửa code mà không có vòng lặp ngắn, dễ mất định hướng: implement thừa hoặc không biết khi nào xong.
**Nguồn gốc:** Kent Beck (TDD)
**Giải quyết thế nào:** Red: test fail. Green: làm tối thiểu để pass. Refactor: dọn code mà vẫn giữ test pass.
*Liên quan: TDD, refactoring*

### regression test
*còn gọi: regression testing*

**Vấn đề khiến nó ra đời:** Sau khi sửa bug hoặc refactor, chức năng cũ bị hỏng mà không ai phát hiện (regression) vì không có test cho nhánh đó.
**Nguồn gốc:** Software engineering practice (Myers)
**Giải quyết thế nào:** Giữ lại test cho bug đã fix hoặc chức năng quan trọng; chạy lại để đảm bảo không tái xuất hiện.
*Liên quan: unit test, integration test, smoke test, TDD, Test suite, CI*

### smoke test
*còn gọi: sanity test, smoke testing, kiểm thử khói, smoke check, post-deploy check*

**Vấn đề khiến nó ra đời:** Sau build/deploy, mất nhiều thời gian chạy full suite. Cần nhanh chóng biết "có lỗi nghiêm trọng không" trước khi chạy sâu hơn.
**Nguồn gốc:** Hardware testing origin (circuit smoke) adopted in software
**Giải quyết thế nào:** Chọn tập nhỏ kịch bản then chốt (login, healthcheck, endpoint quan trọng) chạy trong vài phút.
*Liên quan: regression test, e2e test, CD (continuous delivery/deployment), rollback, canary deploy*

### Spy

**Vấn đề khiến nó ra đời:** Khi cần dùng một phụ thuộc thực (hoặc gần thực) nhưng vẫn muốn ghi lại các lời gọi đã diễn ra (tham số, số lần gọi) để kiểm chứng sau khi thực thi.
**Nguồn gốc:** Gerard Meszaros (xUnit Test Patterns)
**Giải quyết thế nào:** Bọc quanh một đối tượng thật và ghi lại lịch sử tương tác, sau đó cho phép kiểm tra các tương tác đó trong phần assert.
*Liên quan: Test double, Mock, Stub*

### Statement coverage
*còn gọi: Line coverage*

**Vấn đề khiến nó ra đời:** Cần đo đơn giản xem từng dòng lệnh có được chạy ít nhất một lần bởi test hay không.
**Nguồn gốc:** Miller & Maloney (1963)
**Giải quyết thế nào:** Tính phần trăm số dòng code được thực thi trong tổng số dòng có thể thực thi.
*Liên quan: Code coverage, Branch coverage*

### Stub

**Vấn đề khiến nó ra đời:** Khi cần cung cấp dữ liệu trả về cố định cho một phụ thuộc để system under test đi vào nhánh mong muốn, mà không cần quan tâm collaborator có được gọi đúng cách không.
**Nguồn gốc:** Gerard Meszaros (xUnit Test Patterns)
**Giải quyết thế nào:** Cung cấp câu trả lời cứng (hardcoded) cho các lời gọi, giúp kiểm soát luồng chạy mà không thực thi logic thật của phụ thuộc.
*Liên quan: Test double, State verification, Mock*

### TDD
*còn gọi: Test-Driven Development*

**Vấn đề khiến nó ra đời:** Khi code trước test, dễ viết code quá phức, khó test, hoặc bỏ sót yêu cầu. Thiếu ràng buộc để đảm bảo code đúng theo kỳ vọng.
**Nguồn gốc:** Kent Beck (Extreme Programming)
**Giải quyết thế nào:** Viết test fail trước, rồi implement tối thiểu để pass, sau đó refactor. Quy trình red-green-refactor.
*Liên quan: red-green-refactor, BDD, unit test, refactoring, Red-Green-Refactor, Regression test*

### Test double

**Vấn đề khiến nó ra đời:** Khi test cần phụ thuộc vào component bên ngoài (database, API, file hệ thống) làm chậm, không ổn định hoặc khó kiểm soát, việc test đơn vị trở nên khó khăn.
**Nguồn gốc:** Gerard Meszaros (xUnit Test Patterns, 2007)
**Giải quyết thế nào:** Thay thế các phụ thuộc thật bằng đối tượng thay thế có hành vi được kiểm soát, giúp cô lập system under test.
*Liên quan: Mock, Stub, Fake, Spy*

### test pyramid
*còn gọi: testing pyramid*

**Vấn đề khiến nó ra đời:** Nếu chỉ viết e2e, test chạy chậm, dễ flaky, khó maintain. Nếu chỉ viết unit, dễ bỏ sót tương tác. Cần cân bằng số lượng test theo tốc độ/độ tin cậy.
**Nguồn gốc:** Martin Fowler (Test Pyramid) referencing Cohn/Beck ideas; popularized 2012
**Giải quyết thế nào:** Ưu tiên nhiều unit (nhanh), vừa phải integration, ít e2e (chậm) để tối ưu feedback loop.
*Liên quan: unit test, integration test, e2e test, TDD, Unit test, Integration test, End-to-end test*

### Test suite

**Vấn đề khiến nó ra đời:** Cần tổ chức tập hợp test một cách có cấu trúc để chạy hiệu quả, phân loại và báo cáo kết quả rõ ràng.
**Nguồn gốc:** không rõ
**Giải quyết thế nào:** Tập hợp các test case được nhóm theo module/tầng (unit/integration/e2e) có thể chạy cùng nhau, thường tự động trong CI.
*Liên quan: Regression test, Test pyramid*

### type check
*còn gọi: type checking, static typing*

**Vấn đề khiến nó ra đời:** Lỗi kiểu dữ liệu (string truyền nhầm number) chỉ phát hiện runtime, gây bug khó debug sau deploy.
**Nguồn gốc:** Type theory (Milner) applied to PLs
**Giải quyết thế nào:** Kiểm tra kiểu tại compile-time (TS, flow) để bắt lỗi trước khi chạy, cải thiện refactor an toàn.
*Liên quan: lint, static analysis*

### unit test
*còn gọi: unit testing, unit test case*

**Vấn đề khiến nó ra đời:** Khi sửa một hàm nhỏ, lập trình viên phải mất nhiều thời gian chạy toàn bộ hệ thống thủ công để chắc chắn không ảnh hưởng. Việc đó chậm và dễ bỏ sót.
**Nguồn gốc:** Kent Beck (xUnit, Smalltalk)
**Giải quyết thế nào:** Chạy nhanh, cô lập hàm/class nhỏ bằng cách mock phụ thuộc. Giúp phát hiện lỗi ngay tại chỗ sửa.
*Liên quan: test isolation, mocking/stub/fake/spy, assertion, arrange-act-assert, Test pyramid, Test double, Test isolation*

## DevOps & Triển khai

### Build artifact
*còn gọi: artifact, tệp đóng gói build, bản build*

**Vấn đề khiến nó ra đời:** Mỗi môi trường tự build lại từ source: dev build với dependency bản mới, prod build với dependency bản cũ nên 'chạy được trên dev, lỗi trên prod'. Không có thứ gì để truy vết 'commit nào, build nào đang chạy trên production'.
**Nguồn gốc:** không rõ
**Giải quyết thế nào:** Build đúng 1 lần, đóng gói thành artifact bất biến (jar, npm tarball, docker image) kèm version + hash; mọi môi trường dùng đúng artifact đó, chỉ khác config. Muốn biết prod chạy gì thì xem version artifact.
*Liên quan: CD (continuous delivery/deployment), container (Docker, container image), immutable infrastructure, rollback*

### CD (continuous delivery / continuous deployment)
*còn gọi: continuous delivery, continuous deployment, phát hành liên tục, CD pipeline*

**Vấn đề khiến nó ra đời:** Sau khi có CI, team vẫn build tay, copy file lên server, chạy migration tay trước mỗi lần phát hành; mỗi release là một sự kiện căng thẳng cuối tuần. Vì deploy khó nên họ chỉ release vài tuần một lần, gom cả đống thay đổi rủi ro vào cùng lúc.
**Nguồn gốc:** Dave Farley & Jez Humble, cuốn Continuous Delivery (Addison-Wesley, 2010).
**Giải quyết thế nào:** CD tự động hóa mọi bước sau CI (test end-to-end, đóng gói, deploy) để build luôn ở trạng thái có thể phát hành bất kỳ lúc nào; continuous deployment còn push thẳng thay đổi pass test lên production, không cần người bấm nút.
*Liên quan: CI (continuous integration), release vs deploy, build artifact, smoke test, zero-downtime deploy*

### Container (Docker, container image)
*còn gọi: Docker, container, container image, image, OCI image*

**Vấn đề khiến nó ra đời:** Code chạy ngon trên máy dev nhưng lên server production lỗi vì version Java/Python/dependency khác nhau; mỗi server cài đặt tay nên 'cùng commit, hai môi trường, hai kết quả'. Dùng VM đầy đủ thì nặng — GB disk, khởi động hàng phút, không nhanh được khi scale hàng trăm instance.
**Nguồn gốc:** Docker trình diễn công khai lần đầu tại PyCon ngày 15/3/2013 (Solomon Hykes, khi đó ở dotCloud); nền tảng namespace/cgroups của Linux có trước đó nhiều năm.
**Giải quyết thế nào:** Docker đóng gói ứng dụng + dependency vào unit cách ly dùng chung kernel (namespaces/cgroups của Linux); container image là snapshot read-only nhiều lớp, kéo về đâu cũng chạy giống nhau, khởi động trong vài giây.
*Liên quan: build artifact, Kubernetes, immutable infrastructure, pod*

### Continuous Integration (CI)
*còn gọi: CI, tích hợp liên tục, CI pipeline*

**Vấn đề khiến nó ra đời:** Đội 5-10 người backend mỗi người code trên nhánh riêng, vài ngày mới gộp một lần: đến lúc merge, conflict kéo dài hàng giờ, không ai biết commit nào làm hỏng build. Trước đó họ chỉ chạy test tay trên máy trước khi release, nên lỗi chỉ lộ khi đã gộp xong và đã sát ngày phát hành.
**Nguồn gốc:** Xuất xứ từ Extreme Programming (thập niên 1990); được hệ thống hóa bởi Martin Fowler (bliki Continuous Integration) và cộng đồng ThoughtWorks.
**Giải quyết thế nào:** Mỗi lần push, máy trung tâm tự build + chạy test trong vài phút; code không xanh thì bị chặn merge. Gộp nhỏ liên tục thay vì gộp lớn định kỳ, lỗi tìm được ngay tại commit gây ra.
*Liên quan: CD (continuous delivery/deployment), build artifact, trunk-based vs git flow, smoke test*

### Cron job & Scheduler
*còn gọi: crontab, cron, job scheduler, lập lịch công việc, batch scheduler, task queue, định kỳ công việc*

**Vấn đề khiến nó ra đời:** Việc lặp theo lịch (đồng bộ dữ liệu 3h sáng, gửi báo cáo hàng ngày, dọn file hết hạn) bị làm tay hoặc code ngủ `sleep()` trong tiến trình: server restart là mất job, không ai biết job nào đã/chưa chạy, lỗi chạy âm thầm hàng tháng mới phát hiện.
**Nguồn gốc:** cron có từ Unix thập niên 1970 ở Bell Labs; định dạng crontab 5 trường chuẩn hóa quanh Unix Version 7 (1979).
**Giải quyết thế nào:** Tách 'lịch' ra khỏi 'việc': crontab 5 trường (phút/giờ/ngày/tháng/thứ) + daemon tự đánh thức đúng lúc; scheduler cấp cao hơn (Quartz, Celery beat, Kubernetes CronJob) thêm retry, chống chạy trùng, giám sát.
*Liên quan: process manager (systemd, PM2, Supervisor), scheduler trong Kubernetes (CronJob), SRE vs DevOps, Delayed queue, Priority queue, Message queue*

### Environment (dev / staging / prod)
*còn gọi: môi trường, dev/staging/prod, pre-prod*

**Vấn đề khiến nó ra đời:** Nhóm nhỏ lúc đầu cấu hình và test thẳng trên môi trường dùng chung, thậm chí sửa trực tiếp production để fix nhanh; hậu quả là không ai tái lập được cấu hình, test vô tình làm hỏng hệ thống thật, và dev không bao giờ giống prod.
**Nguồn gốc:** không rõ
**Giải quyết thế nào:** Tách thành dev (chạy nhanh, data giả), staging (giống prod) và prod (user thật); thay đổi phải đi qua các tầng này, cấu hình mỗi tầng khai báo riêng và không sửa tay ngoài quy trình.
*Liên quan: config management, release vs deploy, secrets in runtime, rollback*

### Process manager (systemd, PM2, Supervisor)
*còn gọi: systemd, init system, PM2, Supervisor, upstart, quản lý tiến trình*

**Vấn đề khiến nó ra đời:** Ứng dụng chạy nền bằng `node app.js &` hay nohup: crash lúc 3h sáng thì im lặng, không tự khởi động lại, log rải rác, và server reboot xong thì cả hệ thống nằm im cho tới khi có người SSH vào vá lại từng tiến trình.
**Nguồn gốc:** systemd do Lennart Poettering công bố năm 2010 để thay SysV init; Supervisor (Python) và PM2 (Node) ra đời cho cấp ứng dụng web.
**Giải quyết thế nào:** Process manager giữ tiến trình sống (respawn khi crash), quản lý start/stop/restart, gom log, và đăng ký khởi động cùng hệ điều hành. systemd đảm nhận vai trò PID 1 cho services trên Linux; PM2/Supervisor làm việc tương tự ở cấp ứng dụng.
*Liên quan: cron job & scheduler, zero-downtime deploy, SRE vs DevOps*

### Release vs deploy
*còn gọi: phát hành khác triển khai, deploy ≠ release*

**Vấn đề khiến nó ra đời:** Quyền 'cho user thấy tính năng' bị gắn cứng với việc deploy: muốn bật cho 10% user hay tắt khi tính năng lỗi thì phải deploy lại toàn bộ hệ thống. Vì thế hoặc là không dám tung tính năng, hoặc là phải roll back cả build chỉ vì một toggle.
**Nguồn gốc:** không rõ (khái niệm được cộng đồng continuous delivery và feature-flag phổ biến)
**Giải quyết thế nào:** Tách hai việc: deploy = đưa code lên môi trường (có thể nhiều lần mỗi ngày), release = quyết định hiển thị tính năng cho user (qua feature flag). Code deployed nhưng chưa released là bình thường.
*Liên quan: feature flag, CD (continuous delivery/deployment), environment (dev/staging/prod)*

### Rollback
*còn gọi: quay lui phiên bản, rollback về bản cũ, revert deploy*

**Vấn đề khiến nó ra đời:** Release mới gây lỗi thanh toán lúc 2h sáng; trước đó server bị sửa in-place nên muốn quay lại phải build lại version cũ, copy lên, cấu hình tay — mất hàng giờ trong đêm, user đã bị ảnh hưởng từ phút đầu.
**Nguồn gốc:** không rõ
**Giải quyết thế nào:** Luôn giữ artifact/version trước đó còn chạy được và chuyển lưu lượng về nó như một thao tác (đổi tag, đổi load balancer, helm rollback) — phục hồi là nút bấm, không phải dự án.
*Liên quan: blue-green deploy, canary deploy, build artifact, smoke test*

# PHẦN 2 — TRUNG CẤP (intermediate)

Độ sâu của người đã chạy service thật: caching, queue, transaction, test strategy. Đây là nơi phân biệt người viết code với người vận hành hệ thống.

## Mạng & Giao thức

### C10k problem
*còn gọi: bài toán 10.000 kết nối, bài toán C10K*

**Vấn đề khiến nó ra đời:** Năm 1999, Dan Kegel chỉ ra rằng phần cứng đã không còn là nút thắt (máy $1200 với 2GB RAM đủ để phục vụ 10.000 client, mỗi client chỉ cần ~50KHz CPU) — thứ vỡ là mô hình phần mềm: thread-per-connection hết stack ở vài trăm thread, select bị cap 1024 fd và O(n) quét, poll chậm khi quét hàng nghìn descriptor mostly-idle. Web server không thể scale theo phần cứng vì kiến trúc I/O cũ.
**Nguồn gốc:** Dan Kegel, 1999 (kegel.com/c10k.html)
**Giải quyết thế nào:** Kegel hệ thống hóa 5 hướng giải: non-blocking I/O + readiness (select/poll), edge-triggered notification (epoll/kqueue), asynchronous completion (IOCP/AIO), thread-per-client (giữ làm baseline), và server in-kernel. Kết luận: non-blocking + event-driven + epoll/kqueue cho phép một máy nhỏ phục vụ vượt 10k kết nối.
*Liên quan: epoll, kqueue, Non-blocking I/O, Reactor pattern*

### CDN
*còn gọi: Content Delivery Network, mạng phân phối nội dung*

**Vấn đề khiến nó ra đời:** Website phục vụ user toàn cầu từ MỘT data center: người ở châu Á tải ảnh từ server Mỹ mất vài trăm ms RTT, và đợt cao điểm (sale, tin nóng) cả origin sập vì mọi request về một chỗ — chi phí bandwidth origin cũng phình. Đứng sau một trang lớn, bạn không thể giải quyết bằng cách chỉ tăng 1 server ở 1 vùng.
**Nguồn gốc:** Cảm hứng từ work của Tom Leighton/Danny Lewin (MIT) cuối 1990s → Akamai thành lập 1998; CDN 'arose in the late 1990s' để giảm bottleneck Internet.
**Giải quyết thế nào:** Sao chép cache static (và cả dynamic) ra các PoP edge khắp thế giới, DNS/Anycast định tuyến user về node gần nhất; miss mới quay về origin (origin shield), giảm cả latency lẫn tải origin.
*Liên quan: DNS, Cache, Reverse proxy, TLS/SSL, TTFB*

### CORS
*còn gọi: Cross-Origin Resource Sharing, chính sách cùng nguồn*

**Vấn đề khiến nó ra đời:** Same-origin policy (từ Netscape, 1995) chặn Ajax đọc tài nguyên khác domain — site ở foo.com không fetch được api.bar.com, trong khi backend tách frontend/API thành 2 domain là chuyện bình thường. Trick cũ JSONP chỉ chạy GET, embed script, dễ XSS. Cần cơ chế server 'cho phép' cross-origin một cách có kiểm soát.
**Nguồn gốc:** Đề xuất ban đầu 3/2004 (Matt Oshry, Brad Porter, Michael Bodell — Tellme Networks); W3C Recommendation 1/2014; hiện sống trong WHATWG Fetch Living Standard.
**Giải quyết thế nào:** Browser gắn header Origin; server trả Access-Control-Allow-Origin (kèm credentials nếu muốn); request 'phức tạp' (POST/PUT có Content-Type lạ) kích hoạt preflight OPTIONS trước — server xác nhận thì browser mới gửi thật.
*Liên quan: Cookie vs session token, HTTP, HTTPS, Preflight, Same-origin policy*

### DNS negative caching
*còn gọi: cache DNS 'không tồn tại', NXDOMAIN cache, RFC 2308*

**Vấn đề khiến nó ra đời:** Người dùng gõ sai domain hàng triệu lần mỗi ngày; mỗi lần resolver đều phải hỏi nguyên chuỗi tới authoritative server chỉ để nhận về 'NXDOMAIN, không có tên này'. RFC 1034 gốc có cơ chế cache câu trả lời âm nhưng 'có khuyết tật gốc' — không cho server khác mượn lại cache đó, nên phần lớn DNS traffic vẫn là query vô nghĩa lặp lại.
**Nguồn gốc:** Mark P. Andrews (CSIRO), RFC 2308, tháng 3/1998
**Giải quyết thế nào:** Resolver cache cả câu trả lời 'không tồn tại' (NXDOMAIN) và 'tên đúng nhưng sai loại record' (NODATA) theo TTL lấy từ field MINIMUM của SOA; RFC 2308 còn buộc resolver 'nếu cache gì thì phải cache cả câu trả lời âm'.
*Liên quan: DNS TTL caching, DNS resolution chain*

### epoll
*còn gọi: event poll Linux, epoll_wait*

**Vấn đề khiến nó ra đời:** select/poll phải quét toàn bộ danh sách descriptor O(n) mỗi lần hỏi 'ai sẵn sàng?', và select còn hard-cap FD_SETSIZE — server có 100.000 kết nối thì mỗi vòng lặp tốn 100.000 lần kiểm tra, phần lớn kết nối im lặng. Nút thắt này khiến Linux không thể cạnh tranh ở bài toán C10k cho tới khi epoll ra đời.
**Nguồn gốc:** Linux kernel 2.5.45, tháng 10/2002 (được công bố trong bản phát hành của Linus Torvalds; đưa tin bởi Jonathan Corbet trên LWN)
**Giải quyết thế nào:** Kernel giữ tập descriptor đã đăng ký trong cây đỏ-đen; người dùng thêm/sửa/xóa riêng qua epoll_ctl, rồi epoll_wait chỉ trả về đúng các event đang xảy ra — O(1) cho thao tác thường gặp, không phải quét lại. Hỗ trợ level-triggered (trả về chừng điều kiện còn đúng) và edge-triggered (chỉ trả về khi có event mới).
*Liên quan: kqueue, C10k problem, Edge-triggered vs level-triggered, Event loop*

### gRPC
*còn gọi: Google RPC*

**Vấn đề khiến nó ra đời:** Google dùng RPC nội bộ tên Stubby (từ ~2001) nối hàng nghìn microservice, nhưng nó proprietary, JSON/HTTP/1.1 bên ngoài thì phình to (parse text), mỗi request chiếm kết nối TCP riêng, không có streaming hai chiều, và mỗi ngôn ngữ phải viết tay client — không ai ngoài Google dùng được. Microservices ra đời rầm rộ 2010s cần cách gọi RPC chuẩn, nhanh, đa ngôn ngữ.
**Nguồn gốc:** Google open-source Stubby thành gRPC, 3/2015 (release 8/2016, Apache 2.0).
**Giải quyết thế nào:** Định nghĩa service trong .proto (Protocol Buffers — binary compact), codegen client/server đa ngôn ngữ, chạy trên HTTP/2 (multiplex nhiều call trên 1 kết nối), hỗ trợ 4 kiểu streaming (unary/server/client/bidirectional).
*Liên quan: RPC, HTTP/2, Protocol Buffers, REST, Microservices*

### HTTP/1.1
*còn gọi: HTTP 1.1*

**Vấn đề khiến nó ra đời:** HTTP/1.0 mỗi request mở TCP rồi đóng ngay — trang web 80 resource = 80 lần bắt tay TCP + 80 lần gửi lại header cookie/user-agent to đùng; còn giữ kết nối thì proxy/load balancer cũ treo kết nối vô hạn (rò rỉ bộ nhớ). Browser giới hạn ~6 kết nối/origin nên phần còn lại phải xếp hàng.
**Nguồn gốc:** RFC 2068 (1997) → RFC 2616 (1999); hiện RFC 9112 (2022).
**Giải quyết thế nào:** Thêm mandatory Host header, support chunked transfer encoding, pipelining (có hạn chế), và keep-alive mặc định — mỗi request vẫn là văn bản dòng–dòng (method/URI/version…), một request phải đợi response xong mới gửi tiếp trên cùng kết nối.
*Liên quan: Keep-alive, HTTP/2, HTTP/3 (QUIC), Head-of-line blocking*

### HTTP/2
*còn gọi: HTTP 2, h2*

**Vấn đề khiến nó ra đời:** HTTP/1.1 text-based + 1 request/lần đợi response khiến trang tài nguyên lớn tải chậm: browser phải mở 6 kết nối song song, header (cookie vài KB) gửi lặp lại mỗi request, không ưu tiên tài nguyên nào quan trọng hơn, không push trước được. Google muốn nhanh mà không đổi semantic HTTP nên làm SPDY (2009) — Chrome tải trang nhanh hơn 50%.
**Nguồn gốc:** Google SPDY (2009); IETF chuẩn hóa từ SPDY, RFC 7540 (5/2015), sửa lại RFC 9113 (6/2022).
**Giải quyết thế nào:** Lớp nhị phân (frames) + multiplex nhiều request song song trên MỘT kết nối TCP (stream có ID), HPACK nén header, priority, server push — method/status code/URI giữ nguyên như HTTP/1.1 nên app không phải viết lại.
*Liên quan: HTTP/1.1, HTTP/3 (QUIC), Head-of-line blocking, gRPC, TLS/SSL*

### HTTP/3 (QUIC)
*còn gọi: QUIC, HTTP over QUIC*

**Vấn đề khiến nó ra đời:** HTTP/2 multiplex trên TCP → 1 packet mất là TCP chặn TOÀN BỘ byte phía sau, mọi stream đứng im dù chỉ stream liên quan bị mất (HOL blocking tầng vận chuyển); thêm nữa TCP + TLS mất 2–3 round-trip bắt tay, đổi Wi-Fi sang 4G là mất kết nối vì tứ giác (IP, port) đổi. Jim Roskind tại Google muốn sửa cả hai từ 2012.
**Nguồn gốc:** Jim Roskin (Jim Roskind) tại Google thiết kế 2012, công bố 2013 (gQUIC); IETF chuẩn hóa RFC 9000 (5/2021); IETF đổi tên 'HTTP-over-QUIC' thành HTTP/3 (10/2018).
**Giải quyết thế nào:** QUIC chạy trên UDP, gộp truyền tải + TLS 1.3 vào 1-RTT handshake, mỗi stream có flow-control riêng (mất packet chỉ chặn stream đó), Connection ID giữ kết nối sống khi đổi IP; HTTP/3 chỉ là HTTP chạy phía trên QUIC.
*Liên quan: HTTP/2, UDP, TLS/SSL, Head-of-line blocking, TCP handshake*

### Keep-alive
*còn gọi: persistent connection, Connection: keep-alive*

**Vấn đề khiến nó ra đời:** Với HTTP/1.0, mỗi request tái tạo TCP handshake (3 gói) + TLS handshake (2 round-trip) chỉ để gửi một file nhỏ — latency cộng dồn khiến trang chậm rõ rệt; server cũng tốn tài nguyên accept/đóng kết nối liên tục.
**Nguồn gốc:** Đề xuất như extension 'Connection: Keep-Alive' trong HTTP/1.0, trở thành mặc định trong HTTP/1.1 (RFC 2616, 1999).
**Giải quyết thế nào:** Giữ kết nối TCP/TLS mở sau response đầu tiên và tái dùng cho các request tiếp theo (bản thân HTTP không còn rào cản vì mỗi request/response vẫn có Content-Length/ chunked để phân tách); timeout phía server giải phóng kết nối idle.
*Liên quan: HTTP/1.1, Connection pool, TCP, TLS/SSL, TTFB*

### kqueue
*còn gọi: kernel event queue, BSD event mechanism*

**Vấn đề khiến nó ra đời:** FreeBSD/BSD cũng gặp đúng bài toán C10k với select/poll O(n) và cần cơ chế sự kiện của riêng hệ, vì epoll là Linux-specific. nginx và các server production cần một interface hiệu quả để theo dõi hàng nghìn fd trên BSD/macOS.
**Nguồn gốc:** Jonathan Lemon, FreeBSD Core Team, 2000 (FreeBSD 4.1, tháng 7/2000)
**Giải quyết thế nào:** Một call kevent() gộp cả đăng ký filter, sửa đổi và chờ event — kernel chỉ trả về đúng những sự kiện người dùng quan tâm; ngoài fd readiness còn theo dõi được file đổi, signal, timer nanosecond, tiến trình con, event người dùng định nghĩa.
*Liên quan: epoll, C10k problem, I/O multiplexing (select/poll)*

### Proxy (forward/reverse)
*còn gọi: reverse proxy, forward proxy, nginx, HAProxy*

**Vấn đề khiến nó ra đời:** Forward proxy: doanh nghiệp 1990s muốn hàng trăm nhân viên ra Internet qua MỘT cửa chung — tiết kiệm băng thông, log/locại nội dung, không lộ IP nội bộ ra ngoài. Reverse proxy: server gốc chịu hết tải đặt sau load balancer không nổi, muốn gắn TLS tập trung, cache, gộp nhiều backend — đặt một lớp trước nó nhận hết request.
**Nguồn gốc:** không rõ (forward proxy xuất hiện cùng thời với CERN httpd/early web thập niên 1990; reverse proxy phổ biến cùng nginx 2004).
**Giải quyết thế nào:** Forward proxy: client cấu hình trỏ vào proxy, proxy thay mặt fetch (ẩn client). Reverse proxy: client chỉ biết proxy, proxy chuyển tiếp (proxy_pass) tới backend pool — client không biết có bao nhiêu máy sau đó; dùng để terminate TLS, cache, rate limit, health check.
*Liên quan: CDN, Load balancer, TLS/SSL, Port, Firewall*

### Reactor pattern
*còn gọi: mẫu Reactor, readiness-based event handling*

**Vấn đề khiến nó ra đời:** Thiết kế server theo kiểu thủ công 'vòng lặp + if event' khiến mỗi project tự phát minh lại cách demultiplex và dispatch, code trộn lẫn giữa 'chờ socket' và 'xử lý nghiệp vụ', khó bảo trì và dễ block ngoài ý muốn. Bài toán cần một mẫu chuẩn: single thread xử lý nhiều kết nối mà không block.
**Nguồn gốc:** Douglas C. Schmidt, 1995 — 'Reactor: An Object Behavioral Pattern...', Chương 29, Pattern Languages of Program Design (Addison-Wesley)
**Giải quyết thế nào:** Reactor gồm: Handle (socket/fd) → Demultiplexer (epoll/kqueue/select chờ sẵn sàng) → Dispatcher (event loop) → Event handlers đã đăng ký. Sự kiện 'đã sẵn sàng để đọc/ghi' được dispatch đúng handler — readiness-based: kernel báo 'sẵn sàng', handler tự đọc.
*Liên quan: Proactor pattern, Event loop, epoll, C10k problem*

### REST
*còn gọi: Representational State Transfer, RESTful API*

**Vấn đề khiến nó ra đời:** Đầu những 2000, các extension HTTP tự chế và giao thức RPC kiểu cũ (CORBA, DCOM) khiến kiến trúc web không có mô tả chính thức: mỗi team phát minh cách gọi API riêng, proxy/cache không hiểu response nào được cache, dev không thống nhất cách đặt tên tài nguyên. Roy Fielding — người đồng tác giả HTTP/URI — cần một mô hình chuẩn để đánh giá mọi thay đổi đề xuất lên Web.
**Nguồn gốc:** Roy Fielding, luận án tiến sĩ UC Irvine, 2000 ('Architectural Styles and the Design of Network-based Software Architectures').
**Giải quyết thế nào:** Bắt buộc 6 ràng buộc: client-server, stateless (mỗi request tự chứa đủ thông tin), cacheable, uniform interface (URI đánh dấu tài nguyên, GET/PUT/POST/DELETE thao tác, representation, self-descriptive messages), layered system, code-on-demand (tùy chọn).
*Liên quan: HTTP, RPC, gRPC, Cache, CORS*

### RPC
*còn gọi: Remote Procedure Call, gọi hàm từ xa*

**Vấn đề khiến nó ra đời:** Khi hệ thống chia từ một tiến trình ra nhiều máy, hàm không còn gọi hàm được — dev phải tự serialize tham số, mở socket, viết giao thức, xử lý timeout/mất kết nối cho từng hàm, code trùng lặp và dễ sai. Birrell & Nelson muốn gọi hàm từ máy khác 'như đang gọi hàm nội bộ'.
**Nguồn gốc:** Andrew Birrell & Bruce Nelson, Xerox PARC, paper 'Implementing Remote Procedure Calls' (1984).
**Giải quyết thế nào:** Client stub thay mặt hàm remotes: marshal tham số vào message, gửi qua network, server unmarshal, chạy hàm thật, marshal kết quả trả về — phần network được framework che đi (SOAP, Thrift, JSON-RPC, gRPC đều là con của ý tưởng này).
*Liên quan: gRPC, REST, Protocol Buffers, IDL, Load balancer*

### SSE
*còn gọi: Server-Sent Events, EventSource, text/event-stream*

**Vấn đề khiến nó ra đời:** Nhiều trường hợp chỉ cần server push một chiều (bảng giá, notification, tiến trình build) — dùng WebSocket thì phải viết tay cả handshake upgrade, framing, heartbeat, reconnect, và bị proxy cũ cắt; poll lại phí băng thông. Cần một cơ chế push đơn giản chỉ dựa trên HTTP thông thường.
**Nguồn gốc:** Ian Hickson, WHATWG 'Web Applications 1.0', bắt đầu 2004; Opera thử nghiệm 9/2006; W3C Recommendation 3/2015.
**Giải quyết thế nào:** Server trả Content-Type: text/event-stream và stream các dòng 'data: ...' định dạng; browser qua API EventSource tự giữ kết nối, tự parse, tự reconnect — không cần thư viện bên ngoài.
*Liên quan: WebSocket, HTTP, Long polling, Streaming*

### TCP congestion control (AIMD)
*còn gọi: kiểm soát tắc nghẽn TCP, congestion window, AIMD*

**Vấn đề khiến nó ra đời:** Nếu mọi host bung data theo khả năng đường truyền mà không kiểm soát, router quá tải sẽ drop hàng loạt — các kết nối cùng retransmit làm tình trạng tệ hơn, kéo cả Internet vào 'congestive collapse' (mô tả của Van Jacobson cuối những năm 80). Flow control (receiver window) không giải quyết được vì nó chỉ bảo vệ từng connection, không bảo vệ mạng.
**Nguồn gốc:** Van Jacobson & Michael Karels, 1988 (RFC 2001, RFC 5681)
**Giải quyết thế nào:** Sender giữ congestion window (cwnd) giới hạn byte đang trong đường; mất packet/có tín hiệu nghẽn thì cắt cửa sổ (multiplicative decrease), không nghẽn thì tăng từ từ (additive increase) — AIMD. Mất 3 duplicate ACK → fast retransmit ngay không chờ timeout; Tahoe reset về 1 MSS, Reno vào fast recovery. End-to-end: kiểm soát nằm ở host, không ở router.
*Liên quan: TCP slow start, RTT, BBR / CUBIC*

### Vary header / content negotiation cache
*còn gọi: Vary: Accept-Encoding, cache variant*

**Vấn đề khiến nó ra đời:** Cache mặc định chỉ key theo URL — nhưng cùng một URL có thể trả body khác nhau tùy Accept-Language (đức/anh), Accept-Encoding (gzip/br) hoặc User-Agent (mobile/desktop). Không có Vary, cache sẽ trao bản tiếng Đức cho client yêu cầu tiếng Anh, hoặc gửi bản nén cho client không hỗ trợ — đúng loại bug 'phục vụ sai biến thể' cực khó debug.
**Nguồn gốc:** RFC 2616 (1997); hiện RFC 9110 § field.vary
**Giải quyết thế nào:** Vary liệt kê các request header ảnh hưởng tới nội dung; cache mở rộng key từ URL thành URL + các header đó, lưu nhiều biến thể riêng. Cạm bẫy: mỗi chiều Vary nhân lên số entry (10 ngôn ngữ × 3 encoding × 50 UA = 1500 key) → cache fragmentation, hit rate sập; chỉ liệt kê header thực sự đổi bytes, giữ giá trị Vary nhất quán giữa 200/304. Vary: * = cấm cache.
*Liên quan: CDN cache key, ETag / conditional requests, HTTP caching với Cache-Control*

### WebSocket
*còn gọi: ws://, wss://*

**Vấn đề khiến nó ra đời:** HTTP một chiều: client hỏi server mới trả lời — chat/realtime/notifications đành dùng long-polling hay Comet (giữ request treo, client hỏi đi hỏi lại), mỗi lần tốn TCP handshake + HTTP header, độ trễ cao và không scale nổi với hàng nghìn client hỏi dồn dập. Port 80 phải đi qua firewall, không mở socket tùy ý được.
**Nguồn gốc:** Ian Hickson & Michael Carter đặt tên trong #whatwg (2008); RFC 6455 (12/2011, Ian Fette); Chrome 4 hỗ trợ đầu tiên (12/2009).
**Giải quyết thế nào:** Bắt tay 'upgrade' ngay trên HTTP port 80/443, sau đó giữ kết nối TCP mở hai chiều: server push bất cứ lúc nào, thêm khung message (frame) trên stream byte của TCP, overhead rất nhỏ.
*Liên quan: SSE, HTTP, TCP, Socket, Long polling*

## Thiết kế API

### API deprecation policy
*còn gọi: deprecation, sunset policy*

**Vấn đề khiến nó ra đời:** Xóa endpoint/change shape đột ngột làm client đang chạy production chết; không có thời gian chuyển thì quan hệ đối tác/người dùng phá vỡ.
**Nguồn gốc:** Microsoft Graph: element deprecated GA phải hỗ trợ tối thiểu 36 tháng hoặc 24 tháng khi chứng minh không còn dùng. Draft IETF draft-ietf-httpapi-sunset (HTTPAPI WG) chuẩn hóa header Sunset.
**Giải quyết thế nào:** Công bố sớm: header Sunset (ngày ngừng hoạt động theo HTTP-date), header Deprecation, link rel=sunset; log usage để biết client nào còn gọi. Breaking change bắt buộc qua version mới, version cũ giữ trong cửa sổ deprecation. Stripe hướng dẫn migrate từng bước qua 2 endpoint webhook song song.
*Liên quan: Deprecation/sunset headers, API versioning (URL/header/media type), Breaking vs non-breaking change*

### API gateway pattern
*còn gọi: gateway, edge service, single entry point*

**Vấn đề khiến nó ra đời:** Microservice expose hàng chục endpoint nội bộ: client phải tự discovery, tự auth từng service, gộp data từ 10 service = 10 round-trip, giao thức internal (gRPC) không nói chuyện được với browser.
**Nguồn gốc:** microservices.io - Chris Richardson (tác giả 'Microservices Patterns'), có dẫn Netflix API gateway làm ví dụ; cùng pattern có trong Sam Newman 'Building Microservices'.
**Giải quyết thế nào:** Gateway là single entry point: proxy route tới service phù hợp, fan-out gộp nhiều service (aggregation), kiểm tra auth, dịch giao thức public (HTTPS/JSON) sang internal (gRPC), expose API khác nhau cho client khác nhau (BFF variant). Cost: thêm hop (latency) + thêm component quản lý.
*Liên quan: BFF (Backend for Frontend), Rate limiting vs throttling vs quota, Strangler fig*

### API versioning (URL/header/media type)
*còn gọi: versioning strategy, api-version, breaking version*

**Vấn đề khiến nó ra đời:** Đổi shape API mà không version thì client cũ vỡ; version sai cách (mọi thay đổi đều bump) thì client phải nâng liên tục.
**Nguồn gốc:** Azure: query param api-version dạng YYYY-MM-DD (preview thêm -preview); Microsoft Graph: segment /v1.0 và /beta; Stripe: header Stripe-Version pin theo ngày (2015-02-16); RFC 9110 media type versioning (application/vnd.company.v2+json) hiếm dùng.
**Giải quyết thế nào:** URL prefix dễ thấy, dễ cache nhưng chia đôi codebase; header gọn hơn nhưng khó discover/test; media type đúng chuẩn content negotiation nhưng client phức tạp. Bất kỳ cách nào cũng phải có policy deprecation rõ. Stripe: mỗi request nên pin version thay vì dựa default của account.
*Liên quan: Breaking vs non-breaking change, Semantic versioning for APIs, API deprecation policy*

### API-first design
*còn gọi: API-driven design, design-first API*

**Vấn đề khiến nó ra đời:** Code xong rồi mới vẽ swagger: backend/frontend/qa mỗi bên tự hiểu contract khác nhau, integration test fail cuối sprint, đổi contract lúc đó đã tốn.
**Nguồn gốc:** Phong trào API-first phổ biến cùng thời OpenAPI; AWS API Gateway và các platform (Stoplight, Postman) quảng bá 'design before implementation'.
**Giải quyết thế nào:** Chốt contract (OpenAPI/proto) TRƯỚC khi implement: backend code theo contract, frontend mock được ngay, contract test chặn drift, SDK tự sinh. Dùng contract làm single source of truth giữa các team và các language.
*Liên quan: OpenAPI/Swagger, Contract-first, SDK/codegen*

### BFF (Backend for Frontend)
*còn gọi: Backend for Frontend, per-client BFF, backend cho frontend*

**Vấn đề khiến nó ra đời:** 1 API chung cho web + iOS + Android: web cần 15 field, mobile cần 5 field; mỗi client đòi endpoint riêng làm API phình, team backend thành bottleneck chung.
**Nguồn gốc:** Thuật ngữ do Phil Calçado (SoundCloud) đặt; Sam Newman mô tả trong bài 'Pattern: Backends For Frontend' ngày 18/11/2015, dẫn feedback của Stewart Gleadow ('one experience, one BFF').
**Giải quyết thế nào:** Deploy 1 server-side component cho mỗi loại client (BFF cho iOS, BFF cho web...), đặt trong perimeter cạnh client, do team làm UI đó duy trì (Conway's Law). BFF gộp call nhiều downstream (catalog + inventory + wishlist cho 1 trang) song song, degrade graceful. Chấp nhận trùng lặp giữa các BFF; trích xuất abstraction tới lần 3.
*Liên quan: API gateway pattern, API-first design, Query parameter design, API gateway, microservices, monolith*

### Conditional requests & 304 Not Modified
*còn gọi: If-None-Match, If-Modified-Since, revalidation*

**Vấn đề khiến nó ra đời:** Reload trang trả lại toàn bộ body dù dữ liệu không đổi - lãng phí băng thông, chậm, đặc biệt với asset/API lớn.
**Nguồn gốc:** RFC 9110 section 13 (conditional requests) + RFC 9111 (caching) - 304 dùng để cập nhật metadata cache.
**Giải quyết thế nào:** Client gửi If-None-Match: <etag> (hoặc If-Modified-Since); nếu validator khớp server trả 304 không body, client dùng bản cache. GET tĩnh còn dùng If-Match để chặn ghi đè. Cache nhận 304 MUST cập nhật header trường từ response 304 đó.
*Liên quan: ETag/Last-Modified caching, Optimistic concurrency (ETag/If-Match), HTTP caching semantics (Cache-Control)*

### Content negotiation
*còn gọi: Accept header, proactive negotiation, media type selection*

**Vấn đề khiến nó ra đời:** Muốn trả XML cho client cũ, JSON cho client mới, bản in PDF cho in... nếu tạo endpoint riêng thì nhân đôi API và khó duy trì.
**Nguồn gốc:** RFC 9110 section 12 (Content Negotiation) - kế thừa framework negotiation từ HTTP/1.1 (RFC 2616).
**Giải quyết thế nào:** Proactive: client gửi Accept, Accept-Language, Accept-Encoding (kèm q value ưu tiên); server chọn representation và trả kèm Vary để cache phân biệt. Reactive: server trả 406/415 kèm list option. Nếu response phụ thuộc Accept thì PHẢI có Vary: Accept, không cache lẫn.
*Liên quan: Vary header, HTTP caching semantics (Cache-Control), Representational state*

### Contract-first
*còn gọi: contract-first development, schema-first, design by contract*

**Vấn đề khiến nó ra đời:** Implement trước rồi sinh spec từ code: spec là ảnh chụp cái đã có, không ai review được contract trước khi code; schema drift giữa các service im lặng.
**Nguồn gốc:** Thuật ngữ gắn với OpenAPI/gRPC (define .proto trước khi viết service) - thực hành chuẩn của API-first.
**Giải quyết thế nào:** Soạn contract (OpenAPI hay protobuf) → review + version nó như sản phẩm → sinh stub/mock → backend implement, frontend viết theo mock → CI chạy contract test (khớp implementation với spec). Breaking change bị chặn ngay ở vòng review contract.
*Liên quan: OpenAPI/Swagger, API-first design, gRPC (HTTP/2, protobuf)*

### CORS preflight (OPTIONS)
*còn gọi: Cross-Origin Resource Sharing, preflight request, Access-Control-Allow-**

**Vấn đề khiến nó ra đời:** Same-origin policy chặn JS gọi API khác domain; nếu server không trả header đúng thì browser nuốt response, JS không thấy lỗi chi tiết.
**Nguồn gốc:** Chuẩn hóa bởi WHATWG Fetch spec (W3C CORS cũ đã obsolete); browser hỗ trợ rộng từ 7/2015.
**Giải quyết thế nào:** Request 'đơn giản' (GET/HEAD/POST + header safelisted, content-type text/plain...) không preflight, server trả Access-Control-Allow-Origin. Request 'phức tạp' (method khác, custom header) browser gửi OPTIONS trước với Origin + Access-Control-Request-Method; server trả Allow-Methods/Allow-Headers, cache được qua Access-Control-Max-Age. Request có credential thì không được dùng *, phải chỉ định origin cụ thể + Allow-Credentials: true.
*Liên quan: Vary header, Status codes*

### Deprecation/sunset headers
*còn gọi: Sunset header, Deprecation header, rel=sunset*

**Vấn đề khiến nó ra đời:** Client chỉ biết API bị gỡ khi nó hỏng 500/404 giữa đêm; không có tín hiệu máy đọc để cảnh báo trước.
**Nguồn gốc:** draft-ietf-httpapi-sunset (IETF HTTPAPI WG - Internet-Draft, chưa thành RFC khi research; Roberto Polli và cộng sự trong nhóm HTTPAPI liên quan).
**Giải quyết thế nào:** Server trả header Deprecation (thời điểm công bố deprecated) và Sunset: <HTTP-date> (thời điểm tắt hẳn) trên response; link relation ' Sunset' chỉ trang thông báo. Client/SDK đọc được thì log warning và lên kế hoạch migrate thay vì chờ outage.
*Liên quan: API deprecation policy, Rate limit headers*

### ETag/Last-Modified caching
*còn gọi: entity tag, strong/weak validator, Last-Modified*

**Vấn đề khiến nó ra đời:** Không có validator thì không phân biệt được 'response cũ' với 'response mới giống hệt', conditional request không hoạt động.
**Nguồn gốc:** RFC 9110 section 8.8.3-8.8.4: ETag strong (bản byte-different) vs weak (semantic khác); Last-Modified chỉ có độ phân giải tới giây nên không đủ với update sub-second (Azure guidelines cảnh báo).
**Giải quyết thế nào:** Server trả ETag mỗi khi trả/update resource; dùng làm validator cho 304 và làm khóa optimistic cho If-Match. Weak etag (W/ prefix) dùng khi content negotiation/ghi gzip làm byte thay đổi nhưng ngữ nghĩa không đổi.
*Liên quan: Optimistic concurrency (ETag/If-Match), Conditional requests & 304 Not Modified, HTTP caching semantics (Cache-Control)*

### Field masks
*còn gọi: google.protobuf.FieldMask, update_mask, mask parameter*

**Vấn đề khiến nó ra đời:** PATCH với body đầy đủ làm client phải đọc-modify-write; server không biết field nào client cố tình sửa so với field chỉ vô tình gửi kèm.
**Nguồn gốc:** Google AIP-161 (Field Masks) - dùng google.protobuf.FieldMask làm syntax chuẩn cho cả đọc và ghi.
**Giải quyết thế nào:** Mask liệt kê đường dẫn field tương đối với resource (title, author.given_name), traversal dấu chấm, wildcard '*' trên repeated/map, backquote cho key lạ. Update kèm update_mask thì server chỉ sửa field trong mask. Mask đọc phải khớp mask ghi (đọc rồi ghi lại = no-op), field output-only bị bỏ qua khi ghi.
*Liên quan: Partial response (fields param), PUT vs PATCH*

### Filtering/sorting query params
*còn gọi: query filter, sort parameter, filter syntax*

**Vấn đề khiến nó ra đời:** Mỗi client tự tạo endpoint con ('/users/active', '/users/banned') làm số endpoint bùng nổ và không mở rộng được khi thêm tiêu chí lọc.
**Nguồn gốc:** Google AIP-160 (filter string syntax với EBNF grammar); cộng đồng REST dùng query param như ?status=active&sort=-created_at.
**Giải quyết thế nào:** API nhận filter dạng chuỗi có ngữ pháp: so sánh (=, !=, <, >, <=, >=), AND/OR, NOT, wildcard, traversal dấu chấm (a.b), toán tử has ':'. Sort qua param riêng (vd sort=-created_at). Validate trả INVALID_ARGUMENT/400 khi field không tồn tại hoặc sai kiểu. Filter kết hợp pagination: đổi tham số ngoài filter giữa các trang thì lỗi.
*Liên quan: Pagination (offset vs cursor), Query parameter design, N+1 at API layer (sparse fieldsets)*

### HTTP caching semantics (Cache-Control)
*còn gọi: Cache-Control, max-age, no-store, private/public*

**Vấn đề khiến nó ra đời:** Response chứa dữ liệu cá nhân bị shared cache/CDN lưu và trả cho người khác; hoặc response không cache được làm tốn bandwidth và làm chậm.
**Nguồn gốc:** RFC 9111 HTTP Caching (STD 98, 2022, Fielding/Nottingham/Reschke) - kế thừa RFC 7234.
**Giải quyết thế nào:** max-age: hết hạn sau N giây (s-maxage ưu tiên cho shared cache); no-store: không được lưu gì; private: chỉ browser cache được, shared cache cấm; public: force cacheable kể cả kèm Authorization; stale-while-revalidate (RFC 5861): phục vụ bản cũ khi đang revalidate. Hết hạn thì revalidate bằng conditional request.
*Liên quan: Conditional requests & 304 Not Modified, ETag/Last-Modified caching, Vary header*

### Optimistic concurrency (ETag/If-Match)
*còn gọi: conditional request, lost update prevention, optimistic locking*

**Vấn đề khiến nó ra đời:** Hai client cùng đọc rồi cùng ghi, bản ghi sau đè lên bản trước mà không ai báo (lost update); pessimistic lock giữ khóa quá lâu giảm throughput.
**Nguồn gốc:** ETag từ RFC 2616/7232, nay RFC 9110 section 8.8.3; Azure REST API Guidelines khuyến nghị mạnh ETag thay Last-Modified vì ngày không phân biệt cập nhật dưới giây.
**Giải quyết thế nào:** Server trả ETag (version/validator) kèm resource; client ghi kèm If-Match: ETag. Server thấy ETag cũ trả 412 Precondition Failed. GET kèm If-None-Match khớp trả 304. Nếu server muốn chặn ghi thiếu conditional thì trả 428 Precondition Required (RFC 6585).
*Liên quan: Conditional requests & 304 Not Modified, ETag/Last-Modified caching, PUT vs PATCH*

### Partial response (fields param)
*còn gọi: fields parameter, sparse fieldsets, read_mask, partial responses*

**Vấn đề khiến nó ra đời:** Resource lớn (user 50 field) trả đầy đủ làm response nặng, mobile tốn data, compute lãng phí; client chỉ cần 3 field.
**Nguồn gốc:** Google APIs 'fields' query param, chuẩn hóa trong AIP-157 (Partial Responses) và AIP-161 (Field Masks).
**Giải quyết thế nào:** Client truyền danh sách field cần (vd fields=id,name,email hoặc FieldMask proto qua query/header). Mặc định '*' (lấy tất cả) - đổi default này là breaking change. AIP-157: thay vì read_mask trên request nên để qua system parameter; cách khác là enum view (BASIC/FULL) khi chỉ có vài tổ hợp cố định.
*Liên quan: Field masks, N+1 at API layer (sparse fieldsets), Envelope pattern*

### Rate limit headers (429 + Retry-After + RateLimit)
*còn gọi: throttling headers, X-RateLimit, RateLimit-Policy*

**Vấn đề khiến nó ra đời:** Client vượt quota thì server trả 429 nhưng client không biết khi nào được thử lại, hoặc cả nghìn client retry cùng lúc gây sập tiếp (thundering herd).
**Nguồn gốc:** 429 Too Many Requests từ RFC 6585 (2012, Nottingham & Fielding); Retry-After định nghĩa ở RFC 9110 section 10.2.3 (delta-seconds hoặc HTTP-date); header chuẩn RateLimit/RateLimit-Policy từ draft-ietf-httpapi-ratelimit-headers (Polli & Martínez Ruiz, 2022+).
**Giải quyết thế nào:** 429 + Retry-After: client chờ đúng ngần đó giây. Draft chuẩn hóa: RateLimit-Limit (giới hạn đang tới hạn), RateLimit-Remaining (còn bao nhiêu), RateLimit-Reset (giây tới reset - dạng delay tránh lệch đồng hồ), RateLimit-Policy (100;w=60 nghĩa 100 req/60s). Giá trị là gợi ý không phải guarantee; nếu có cả Retry-After và RateLimit-Reset thì Retry-After thắng.
*Liên quan: Rate limiting vs throttling vs quota, Exponential backoff + jitter, Status codes*

### Retry guidance (safe methods)
*còn gọi: automatic retry, retry policy, retryable status codes*

**Vấn đề khiến nó ra đời:** Client retry tùy hứng: retry cả POST (tạo trùng), retry 400 vô hạn, hoặc không retry gì khi 503 thoáng qua làm mất availability.
**Nguồn gốc:** RFC 9110 section 9.2.2: 'Some requests can be automatically retried by a client in the event of an underlying connection failure' - áp cho method an toàn/idempotent.
**Giải quyết thế nào:** Retry an toàn: GET/HEAD khi lỗi kết nối (chưa nhận response); PUT/DELETE (idempotent) retry được; POST chỉ retry khi có idempotency key. Không retry 4xx (lỗi request thật). Với 429/503 tôn trọng Retry-After. Áp backoff + jitter để không dồn dập.
*Liên quan: Safe & idempotent methods, Exponential backoff + jitter, Idempotency key (Stripe pattern)*

### RFC 7807/9457 problem+json
*còn gọi: application/problem+json, problem details, RFC 9457*

**Vấn đề khiến nó ra đời:** 403 hay 400 đơn lẻ không nói vì sao bị từ chối và cách sửa; mỗi API tự bịa format lỗi riêng gây fragment hóa.
**Nguồn gốc:** RFC 7807 (2016, Mark Nottingham & Erik Wilde), bị thay thế bởi RFC 9457 (2023, Nottingham, Wilde, S. Dalal) thêm registry problem type URI.
**Giải quyết thế nào:** Media type application/problem+json với member: type (URI định dạng lỗi, mặc định about:blank), title (mô tả loại), status (bản sao HTTP status), detail (giải thích cho lần này), instance (URI occurrence cụ thể). Extension member tùy ý (vd balance) - client MUST bỏ qua field không nhận ra. Dùng thay vì tự bịa envelope lỗi.
*Liên quan: Error response shape, Status codes, Envelope pattern*

### Vary header
*còn gọi: Vary: Accept-Encoding, Vary: Origin, cache key variance*

**Vấn đề khiến nó ra đời:** CDN cache 1 response cho request đầu (vd Accept-Encoding: gzip) rồi trả đúng bản đó cho client không nhận gzip; hoặc cache nhầm response CORS giữa các origin.
**Nguồn gốc:** RFC 9110 section 8.4 + RFC 9111 section 4.1: response có Vary không được dùng lại nếu header được nêu không khớp.
**Giải quyết thế nào:** Vary liệt kê request header mà response phụ thuộc: Vary: Accept-Encoding, Accept-Language, Origin. Vary: * = không bao giờ match. Đây là lý do content negotiation bắt buộc kèm Vary, và CORS nên kèm Vary: Origin khi trả origin cụ thể.
*Liên quan: Content negotiation, HTTP caching semantics (Cache-Control), CORS preflight (OPTIONS)*

### Webhook (delivery, retries, signature)
*còn gọi: webhook callback, HTTP callback, push notification*

**Vấn đề khiến nó ra đời:** Polling hỏi server 'có gì mới?' liên tục tốn resources và chậm; tự dựng message bus riêng giữa 2 công ty thì không thực tế.
**Nguồn gốc:** Thuật ngữ 'webhook' do Jeff Lindsay đặt năm 2007 (theo Wikipedia, derive từ programming term 'hook').
**Giải quyết thế nào:** Khi event xảy ra, source HTTP POST JSON tới URL đã đăng ký. Bắt buộc: verify chữ ký (Stripe-Signature HMAC-SHA256 với timestamp chống replay, tolerance 5 phút; IP allowlist), trả 2xx NGẮN trước khi xử lý nặng, retry với backoff (Stripe: tới 3 ngày, exponential backoff; sandbox 3 lần trong vài giờ), consumer idempotent vì event gửi lại, KHÔNG phụ thuộc thứ tự event (Stripe không guarantee order).
*Liên quan: Webhook subscription, Idempotent consumer, Exactly-once illusion vs at-least-once*

### Webhook subscription
*còn gọi: webhook endpoint registration, event destination, subscribe events*

**Vấn đề khiến nó ra đời:** Server không biết URL nào của khách để gửi event; khách đổi URL thì event gửi vào chỗ cũ mất; gửi tất cả event cho mọi người thì lãng phí và đè nặng receiver.
**Nguồn gốc:** Mẫu đăng ký endpoint có trong Stripe Webhooks/Dashboard, GitHub webhooks, AWS EventDestinations.
**Giải quyết thế nào:** Client đăng ký URL + danh sách event type cần (webhook endpoint phải HTTPS public). Server cấp signing secret (vd whsec_...) để verify. Nên subscribe đúng event cần, xử lý bất đồng bộ qua queue, exempt route khỏi CSRF, bật TLS. Roll secret định kỳ (cho phép overlap 24h để rotate không downtime).
*Liên quan: Webhook (delivery, retries, signature), API gateway pattern*

## Cơ sở dữ liệu & Lưu trữ

### B-tree
*còn gọi: cây B, B-plus tree*

**Vấn đề khiến nó ra đời:** Index theo mảng phẳng phải duy trì thứ tự khi chèn, còn tìm kiếm thì lại phải quét.
**Nguồn gốc:** Bayer và McCreight, 1970
**Giải quyết thế nào:** Cây đa nhánh cân bằng với mọi lá cùng độ sâu; chèn xẻ nút để giữ cân bằng, tìm kiếm mất O(log n).
*Liên quan: B+tree, Index, Primary key vs Secondary index, Clustered index, Covering index*

### Buffer pool
*còn gọi: bộ đệm trang, buffer cache*

**Vấn đề khiến nó ra đời:** Đọc từng trang từ đĩa chậm hơn RAM hàng nghìn lần, còn ghi trực tiếp thì cản truy vấn.
**Giải quyết thế nào:** Giữ trang hay dùng trong RAM, thay thế theo LRU hoặc clock, ghi dirty page ra đĩa khi cần.
*Liên quan: Page, Checkpoint, Heap file*

### Checkpoint
*còn gọi: fuzzy checkpoint*

**Vấn đề khiến nó ra đời:** Replay toàn bộ WAL từ đầu sau crash quá chậm khi log đã dài.
**Giải quyết thế nào:** Định kỳ ghi lại trạng thái buffer pool và vị trí log, nên recovery chỉ replay từ checkpoint gần nhất.
*Liên quan: WAL, Crash recovery, Buffer pool*

### Clustered index
*còn gọi: index gộp*

**Vấn đề khiến nó ra đời:** Index phụ trỏ rời làm tìm theo khóa chính phải lookup ngẫu nhiên sang trang dữ liệu.
**Giải quyết thế nào:** Dữ liệu chính sắp theo thứ tự index, như InnoDB với khóa chính; bản ghi nằm ngay trong nút lá.
*Liên quan: B+tree, Heap file, Primary key vs Secondary index*

### Consistent hashing
*còn gọi: băm nhất quán, Consistent hashing & virtual node, virtual node, vnode, hash ring*

**Vấn đề khiến nó ra đời:** Phân phối theo modulo số node khiến phải remap gần như toàn bộ dữ liệu khi thêm hoặc bớt node. Distribute cache bằng key % N: thêm 1 node thì N đổi → gần như toàn bộ key phải rehash, cache rỗng cùng lúc, request dồn vào DB (cache stampede); node chết cũng vậy. Thêm nữa, 10 node mạnh yếu không đều nhưng hash đều nhau dẫn đến load lệch — node yếu chết chìm.
**Nguồn gốc:** Karger và cộng sự, 1997
**Giải quyết thế nào:** Đặt node và key lên vành băm, key gán cho node kế tiếp; đổi số node chỉ làm một phần nhỏ key phải chuyển. Đặt node và key lên một vòng tròn, key gán cho node kế tiếp theo chiều kim đồng hồ — thêm/bớt node chỉ di chuyển khoảng 1/N key; virtual node (nhiều điểm ảo cho mỗi máy vật lý) san đều load giữa node khác sức mạnh và khi node chết, key giao cho nhiều node thay.
*Liên quan: Sharding, Replication (sync/async), Gossip protocol, Split brain & quorum*

### Covering index
*còn gọi: index bao quát*

**Vấn đề khiến nó ra đời:** Query chỉ cần vài cột nhưng vẫn phải quay lại bảng, tốn lookup không cần thiết.
**Giải quyết thế nào:** Đưa các cột cần vào mục lục để trả lời trực tiếp từ index, tránh truy cập bảng (index-only scan).
*Liên quan: Index, Query planner, Clustered index*

### Crash recovery
*còn gọi: phục hồi sau sự cố*

**Vấn đề khiến nó ra đời:** Máy tắt giữa chừng khi transaction đang ghi dở và mọi thứ trong RAM biến mất.
**Giải quyết thế nào:** Redo các thay đổi đã commit từ log và undo transaction chưa commit, đưa DB về trạng thái nhất quán.
*Liên quan: WAL, Checkpoint, ACID*

### Cursor / keyset pagination
*còn gọi: phân trang con trỏ, keyset pagination, seek pagination, pagination không OFFSET*

**Vấn đề khiến nó ra đời:** LIMIT 20 OFFSET 1000000 bắt DB phải tính và vứt đi 1 triệu dòng trước khi lấy 20 dòng — trang sau càng chậm; đồng thời giữa 2 trang có data mới insert/delete làm dòng nhảy cóc, lặp hoặc mất (offset drift).
**Nguồn gốc:** Không rõ tác giả; được phổ biến trong cộng đồng web (các bài về keyset pagination, thập niên 2010)
**Giải quyết thế nào:** Thay vì nhảy vị trí, nhớ khóa của dòng cuối (cursor = id + sort key) rồi WHERE id > cursor ORDER BY ... LIMIT 20 — luôn đi tiếp từ chỗ cũ, chi phí ổn định dù trang số bao nhiêu. Phù hợp feed/scroll vô hạn.
*Liên quan: Index (B-tree, hash, composite), Query plan / EXPLAIN, SQL*

### Deadlock detection
*còn gọi: phát hiện khóa chết*

**Vấn đề khiến nó ra đời:** Hai transaction giữ khóa của nhau và chờ vô hạn, không bên nào thoát ra được.
**Giải quyết thế nào:** Dựng đồ thị chờ đợi và tìm vòng chờ, hoặc đặt timeout rồi hủy một transaction để phá vòng.
*Liên quan: Two-phase locking (2PL), Row lock vs Table lock, Transaction*

### Denormalization
*còn gọi: phi chuẩn hóa*

**Vấn đề khiến nó ra đời:** Chuẩn hóa nhiều join làm truy vấn đọc chậm trên workload đọc nhiều.
**Giải quyết thế nào:** Thêm cột hoặc bảng sao để đọc một lượt, đánh đổi bằng dung lượng và rủi ro dữ liệu lệch.
*Liên quan: Normalization (1NF-3NF), Index, Covering index*

### Failover
*còn gọi: chuyển vai trò*

**Vấn đề khiến nó ra đời:** Primary chết thì hệ thống dừng nếu không có node thay thế sẵn sàng.
**Giải quyết thế nào:** Chuyển truy vấn sang bản sao, promote nó lên primary, để client tự tìm node mới qua DNS hoặc proxy.
*Liên quan: Replication (sync/async), Split brain*

### Forward engineering
*còn gọi: kỹ thuật tiến*

**Vấn đề khiến nó ra đời:** Cần biến mô tả schema thành database thật một cách lặp lại được giữa các môi trường.
**Giải quyết thế nào:** Chạy DDL từ nguồn mô tả để tạo hoặc cập nhật bảng, index và ràng buộc trên database.
*Liên quan: Schema migration, Backward compatibility (schema)*

### Heap file
*còn gọi: heap table, file đống*

**Vấn đề khiến nó ra đời:** Bản ghi chèn ngẫu nhiên không theo thứ tự nào nên cần cấu trúc lưu không phân cấp.
**Giải quyết thế nào:** Danh sách trang không phân cấp chứa bản ghi thêm vào; không có index thì phải quét toàn bộ.
*Liên quan: Slotted page, Index, Clustered index*

### Isolation level
*còn gọi: mức cô lập, mức cách ly, Read Committed, Repeatable Read, Serializable, dirty read, non-repeatable read, phantom read*

**Vấn đề khiến nó ra đời:** Cô lập hoàn toàn giữa các transaction làm chậm hệ thống, nên cần nới lường có kiểm soát.
**Nguồn gốc:** Tiêu chuẩn SQL-92
**Giải quyết thế nào:** Xác định loại nhiễu được phép: Read Uncommitted thấp nhất, Read Committed, Repeatable Read, Serializable cao nhất.
*Liên quan: Dirty read, Phantom read, Snapshot isolation, Two-phase locking (2PL), Transaction & ACID, MVCC, Lock & deadlock*

### JOIN algorithms (nested loop / hash / sort-merge)
*còn gọi: thuật toán join*

**Vấn đề khiến nó ra đời:** Join hai bảng có nhiều chiến lược, mỗi kiểu mạnh hay yếu tùy kích thước và thứ tự dữ liệu.
**Giải quyết thế nào:** Nested loop lặp lồng, hash join gộp bảng nhỏ vào bảng băm, sort-merge sắp rồi trộn; planner chọn theo chi phí.
*Liên quan: Cost-based optimizer, Cardinality estimation, Query planner*

### Lock & deadlock
*còn gọi: khóa dữ liệu, row lock, table lock, deadlock, SELECT FOR UPDATE, optimistic locking*

**Vấn đề khiến nó ra đời:** 2 transaction cùng sửa 1 dòng thì mất update (cùng ghi, ghi sau đè) hoặc đọc intermediate state. Khi A giữ lock dòng 1 chờ lock dòng 2, còn B giữ dòng 2 chờ dòng 1 — cả hai chờ nhau vĩnh viễn, transaction treo và connection pool cạn dần.
**Nguồn gốc:** Không rõ tác giả duy nhất; locking/mutex là nền tảng computer science, deadlock detection có trong DB từ thập niên 1970 (System R, IBM)
**Giải quyết thế nào:** Lock row/table chặn truy cập ghi đè khi có transaction khác đang xử lý; DB detect deadlock (đồ thị chờ có cycle) và abort 1 transaction để giải — application phải retry. Optimistic locking (version field) tránh khóa bằng cách fail nếu có người sửa giữa chừng.
*Liên quan: Isolation level, MVCC, Transaction & ACID*

### N+1 problem
*còn gọi: vấn đề N+1 query, N+1 select, lazy loading issue*

**Vấn đề khiến nó ra đời:** Trang list 50 post hiển thị tác giả mỗi post: query 1 lấy posts, rồi loop 50 lần query tác giả = 51 round-trip thay vì 2. Dưới load thật, DB nhận hàng nghìn query thừa, latency tăng theo O(N) dù codetrông đẹp với ORM lazy loading.
**Nguồn gốc:** Không rõ tác giả; thuật ngữ phổ biến qua cộng đồng ORM/Ruby on Rails (cuối thập niên 2000)
**Giải quyết thế nào:** Gộp thành 1 query JOIN/include (WHERE author_id IN (...)) hoặc batch loading — giảm từ N+1 xuống tối đa 2-3 query. Nhận diện qua log query hoặc debug mode của ORM.
*Liên quan: ORM, Connection pool, Query plan / EXPLAIN*

### Normalization (1NF-3NF)
*còn gọi: chuẩn hóa, normal form*

**Vấn đề khiến nó ra đời:** Trùng lặp dữ liệu gây update anomaly: sửa một chỗ thì chỗ khác không theo.
**Nguồn gốc:** Codd 1970 (1NF), Fagin 1974 (3NF)
**Giải quyết thế nào:** 1NF loại giá trị lồng, 2NF bỏ phụ thuộc một phần, 3NF bỏ phụ thuộc chuyển tiếp; mỗi sự kiện chỉ ghi một nơi.
*Liên quan: Denormalization, Primary key vs Secondary index*

### Partitioning (horizontal / vertical)
*còn gọi: phân mảnh dữ liệu, horizontal partitioning, vertical partitioning, table partition*

**Vấn đề khiến nó ra đời:** Bảng orders 500 triệu dòng thì index phình to, backup/quét dữ liệu chậm, query chạm mọi partition dù chỉ cần tháng này — 1 table quá lớn làm mọi thao tác trên nó đều chậm và khó quản lý.
**Nguồn gốc:** Không rõ tác giả — tính năng partitioning xuất hiện sớm trong Oracle (1996-97) và DB2, trước khi có khái niệm sharding phân tán
**Giải quyết thế nào:** Horizontal: chia dòng theo khoá (user_id, date) — mỗi phần nằm ở file/segment riêng, query lọc theo khoá chỉ đụng đúng partition. Vertical: chia cột (tách field ít dùng sang bảng riêng). Giảm kích thước đơn vị thao tác.
*Liên quan: Sharding & consistent hashing, Index (B-tree, hash, composite), Query plan / EXPLAIN*

### Phantom read
*còn gọi: phantom*

**Vấn đề khiến nó ra đời:** Chạy cùng query hai lần trong transaction nhưng transaction khác đã insert nên bộ kết quả khác đi.
**Nguồn gốc:** Định nghĩa trong tiêu chuẩn SQL-92
**Giải quyết thế nào:** Serializable, predicate locking, hoặc SSI chặn insert mới dưới cùng bộ điều kiện quét.
*Liên quan: Isolation level, Two-phase locking (2PL), Snapshot isolation*

### Query plan / EXPLAIN
*còn gọi: kế hoạch thực thi, EXPLAIN ANALYZE, execution plan, query planner*

**Vấn đề khiến nó ra đời:** Cùng 1 câu SQL chạy nhanh khi table nhỏ, chậm gấp 1000x khi data tăng — vì planner chọn sai cách (dùng index sai, quét bảng full, join sai thứ tự). Không xem được plan thì tối ưu query là đoán mò.
**Nguồn gốc:** Có từ các hệ sớm như IBM System R (thập niên 1970) — không rõ người/năm cụ thể
**Giải quyết thế nào:** EXPLAIN cho planner giải thích: scan table hay index, ước tính bao nhiêu dòng, join thế nào; EXPLAIN ANALYZE chạy thật và đo thời gian từng bước — chỉ ra chính xác bước nào tốn nhất để sửa.
*Liên quan: Index (B-tree, hash, composite), SQL, N+1 problem*

### Query planner
*còn gọi: bộ lập kế hoạch truy vấn*

**Vấn đề khiến nó ra đời:** Nhiều cách thực hiện cùng một SQL, chọn sai thì chậm hơn hàng nghìn lần.
**Giải quyết thế nào:** Sinh các plan thay thế, ước chi phí rồi chọn cách thực hiện rẻ nhất cho truy vấn đó.
*Liên quan: Cost-based optimizer, Cardinality estimation, JOIN algorithms (nested loop / hash / sort-merge)*

### Replication (master-slave / read replica)
*còn gọi: sao chép dữ liệu, master-slave, primary-replica, read replica*

**Vấn đề khiến nó ra đời:** Một node DB gánh hết read+write thì giới hạn cứng: đọc nhiều (báo cáo, feed) làm chậm luồng ghi; node chết là toàn hệ thống dừng, không có bản sao nào để chuyển sang.
**Nguồn gốc:** Không rõ tác giả — có trong các hệ DB thương mại thập niên 1980-90 (Oracle Data Guard, SQL Server mirroring...)
**Giải quyết thế nào:** Master nhận ghi, đồng bộ sang nhiều slave; client đọc từ replica (giảm tải master) và failover khi master chết. Đánh đổi: replication lag (replica trễ), failover cần promote slave, dữ liệu có thể mất trước khi kịp đồng bộ.
*Liên quan: Multi-master replication, Split brain, CAP theorem*

### Replication (sync/async)
*còn gọi: sao chép dữ liệu, primary-replica*

**Vấn đề khiến nó ra đời:** Một node đơn điểm vừa không chịu nổi tải, vừa mất dữ liệu khi hỏng.
**Giải quyết thế nào:** Sync chờ ít nhất một bản sao nhận nên an toàn hơn nhưng chậm; async trả lời ngay, có nguy cơ mất ghi khi primary chết.
*Liên quan: Failover, Split brain, Sharding*

### Row lock vs Table lock
*còn gọi: khóa hàng, khóa bảng*

**Vấn đề khiến nó ra đời:** Cần chặn ghi trùng; khóa càng rộng càng ít xung đột nhưng càng kém đồng thời.
**Giải quyết thế nào:** Row lock chỉ chặn dòng liên quan, đồng thời cao nhưng dễ deadlock; table lock đơn giản nhưng chặn cả bảng.
*Liên quan: Two-phase locking (2PL), Deadlock detection, Transaction*

### Schema migration
*còn gọi: migration*

**Vấn đề khiến nó ra đời:** Schema thay đổi theo thời gian nhưng dữ liệu production đang chạy, không thể dừng hệ thống.
**Giải quyết thế nào:** Mỗi thay đổi là script version hóa, chạy dần trên môi trường thật, có thể review và rollback.
*Liên quan: Forward engineering, Backward compatibility (schema)*

### WAL (Write-Ahead Log)
*còn gọi: nhật ký ghi trước, redo log, transaction log, WAL (Write-Ahead Logging)*

**Vấn đề khiến nó ra đời:** Ghi trực tiếp data page vào disk rồi mất nguồn giữa chừng thì page có thể ghi dở (torn page) — DB không biết phần nào đã ghi, không thể khôi phục, dữ liệu hỏng vĩnh viễn. Ghi toàn bộ data page mỗi thao tác cũng quá chậm.
**Nguồn gốc:** Không rõ người/năm đầu tiên; thuật toán ARIES (Mohan, Haderle, Lindsay, IBM, 1992) là chuẩn mực của họ WAL
**Giải quyết thế nào:** Ghi thay đổi nhỏ vào log append-only TRƯỚC khi chạm data page; crash thì replay log (redo) hoặc undo thao tác chưa commit. Checkpoint định kỳ đổ log ra data file, page chỉ cần ghi nền.
*Liên quan: Transaction & ACID, MVCC, Two-phase commit, Crash recovery, Checkpoint, Transaction, Buffer pool*

## Caching & Hiệu năng

### Batching
*còn gọi: gộp lô, batch write/read*

**Vấn đề khiến nó ra đời:** Gửi 1000 message mỗi cái 1 round-trip (network hoặc disk seek) thì latency tích lũy nghìn ms — hệ thống I/O-bound, CPU chờ I/O gần như suốt ngày dù chưa bận thật.
**Nguồn gốc:** không rõ (kỹ thuật kinh điển của I/O và network, có từ era mainframe)
**Giải quyết thế nào:** Gộp nhiều thao tác nhỏ thành 1 lần I/O/1 query (bulk insert, batch API, message batch) — giảm số round-trip theo cấp số nhân, tăng throughput; đánh đổi là latency từng phần tử cao hơn và logic retry phức tạp hơn khi batch fail giữa chừng.
*Liên quan: Write-behind, Precomputation, latency vs throughput, Backpressure*

### Benchmark
*còn gọi: đo chuẩn, ép thử*

**Vấn đề khiến nó ra đời:** Tối ưu code hoặc đổi database mà không đo trước/sau thì chỉ là cảm tính — 'có vẻ nhanh hơn' thực tế có thể chậm hơn, hoặc regression âm thầm khi upgrade version không ai phát hiện.
**Nguồn gốc:** không rõ (benchmark là thực hành lâu đời của khoa học máy tính; Node.js/microbenchmark culture phổ biến từ 2010s)
**Giải quyết thế nào:** Chạy workload chuẩn hoá (wrk, sysbench, k6, JMH) với dữ liệu và cấu hình cố định, so sánh throughput/latency trước và sau — định lượng từng thay đổi, phát hiện regression; phải chạy ở môi trường tương đương production mới có giá trị.
*Liên quan: QPS, Profiling, Hot path, Little's law*

### Cache-aside (lazy loading)
*còn gọi: đọc ghi qua cache, lazy loading cache*

**Vấn đề khiến nó ra đời:** App tự tô cache ngay cả cho dữ liệu ít người đọc thì lãng phí RAM; còn bỏ cache đi thì mỗi request lại đập thẳng vào database. Cần cách để cache tự nhiên chỉ chứa thứ thực sự được hỏi.
**Nguồn gốc:** không rõ (phổ biến qua tài liệu AWS và paper Amazon Dynamo 2007 mô tả lazy loading)
**Giải quyết thế nào:** App tự quản lý cache: đọc thì check cache, miss thì đọc DB rồi ghi vào cache; ghi thì ghi DB rồi xóa (hoặc ghi lại) key cache — chỉ dữ liệu thật sự được truy cập mới vào cache, nhưng mỗi miss phát sinh thêm 1 truy vấn DB và cần xử lý invalidation thủ công.
*Liên quan: Cache, Cache invalidation, Write-through, Lazy loading*

### Lazy loading (backend)
*còn gọi: tải trì hoãn, load on demand*

**Vấn đề khiến nó ra đời:** Endpoint trả order nhưng eager-load luôn user, products, reviews, coupons... dù 90% response không cần — query N+1 hoặc join khổng lồ, mỗi request tốn hàng chục query cho dữ liệu không ai dùng.
**Nguồn gốc:** không rõ (pattern thuộc quen thuộc của ORM/Hibernate và lazy initialization)
**Giải quyết thế nào:** Chỉ load dữ liệu khi thật sự được truy cập (field resolver trì hoãn, virtual proxy, on-demand cache fill) — giảm chi phí khởi tạo và chỉ trả phần cần thiết; đổi lại code phức tạp hơn và có thể dồn query về cuối request (lazy load burst).
*Liên quan: Cache-aside, Batching, N+1 queries, Memoization*

### Memcached
*còn gọi: mem cache d*

**Vấn đề khiến nó ra đời:** LiveJournal cuối những năm 1990-early 2000s: mỗi request trang nhật ký đọc nhiều row từ MySQL lặp lại y hệt — database chịu hàng nghìn query giống nhau/giây cho dữ liệu gần như tĩnh, CPU disk I/O trở thành bottleneck của toàn site.
**Nguồn gốc:** Brad Fitzpatrick tạo cho LiveJournal, phát hành 22/5/2003; viết lại bằng C bởi Anatoly Vorobey
**Giải quyết thế nào:** Distributed key-value cache chạy hoàn toàn trong RAM với LRU eviction: app tra cache trước, miss mới quỳ database — đơn giản, slab allocator, không persist, không cấu trúc dữ liệu phức tạp.
*Liên quan: Redis, In-memory cache, Cache-aside, Connection pool*

### QPS (Queries Per Second)
*còn gọi: số truy vấn mỗi giây*

**Vấn đề khiến nó ra đời:** Không đo được 'hệ thống chịu bao nhiêu' thì không biết khi nào phải scale, không đặt được capacity plan, và mọi so sánh tối ưu đều cảm tính — deploy feature mới không biết có làm sập hệ thống không.
**Nguồn gốc:** không rõ (metric vận hành chuẩn của ngành, phổ biến cùng era web scale)
**Giải quyết thế nào:** Đếm số request hoàn thành mỗi giây (thường kèm p95/p99 latency) làm đơn vị đo tải và capacity: QPS hiện tại × hệ số an toàn = số máy cần có; so QPS đỉnh với giới hạn của DB/connection pool để dự báo điểm nghẽp.
*Liên quan: Benchmark, Little's law, latency vs throughput, Connection pool*

### Redis
*còn gọi: Remote Dictionary Server*

**Vấn đề khiến nó ra đời:** Memcached chỉ lưu string thuần và không persist — startup của Salvatore Sanfilippo gặp khó khi scale các workload kiểu real-time (log analyzer) mà database quan hệ truyền thống xử lý không nổi: cần đọc/ghi cực nhanh nhưng vẫn phải có cấu trúc dữ liệu và không mất dữ liệu khi restart.
**Nguồn gốc:** Salvatore Sanfilippo (antirez) tạo năm 2009 tại Ý; ban đầu viết bằng Tcl rồi chuyển C
**Giải quyết thế nào:** In-memory key-value store đơn process với nhiều cấu trúc (string, hash, list, set, sorted set), persist tùy chọn ra disk, hỗ trợ pub/sub và Lua — vừa là cache vừa là broker/lock/coordination layer nhanh hơn database hàng chục lần.
*Liên quan: In-memory cache, Memcached, Cache-aside, Hot key*

### Write-behind (write-back)
*còn gọi: ghi nền, write-back*

**Vấn đề khiến nó ra đời:** Hệ thống ghi hàng nghìn event/giây (giỏ hàng, telemetry) mà mỗi ghi đều đồng bộ xuống DB thì write latency chặn hết throughput, DB bị write hotspot.
**Nguồn gốc:** không rõ (write-back là chính sách cache CPU cổ điển; bất đồng bộ xuống storage phổ biến ở tầng ứng dụng)
**Giải quyết thế nào:** Ghi vào cache trước, flush xuống DB sau (async, theo batch hoặc khi evict) — ghi cực nhanh cho client; đánh đổi là rủi ro mất dữ liệu nếu cache chết trước khi flush, và DB nhận burst ghi định kỳ.
*Liên quan: Write-through, Batching, Backpressure*

### Write-through
*còn gọi: ghi xuyên qua cache*

**Vấn đề khiến nó ra đời:** Ghi dữ liệu mà cache không được cập nhật thì đọc ngay sau đó trả về bản cũ (read-your-own-writes fail) — user bấm 'đã lưu' mà refresh vẫn thấy giá trị cũ, mất niềm tin vào hệ thống.
**Nguồn gốc:** không rõ (chính sách ghi kinh điển của CPU cache, áp dụng xuống tầng ứng dụng)
**Giải quyết thế nào:** Mọi ghi đi đồng thời vào cache và DB (đồng bộ, ghi thành công cả hai mới trả success) — cache luôn nhất quán với DB, đổi lấy latency ghi cao hơn và DB chịu toàn bộ write load.
*Liên quan: Cache-aside, Write-behind, Cache invalidation*

## Hiệu năng

### Backpressure & rate shaping
*còn gọi: back pressure, áp suất ngược, rate limiting vs rate shaping, throttling*

**Vấn đề khiến nó ra đời:** Service consumer chậm hơn producer: queue trong RAM phình đến OOM rồi crash mất dữ liệu — thà từ chối/chậm lại có kiểm soát còn hơn sập ngẫu nhiên.
**Nguồn gốc:** Khái niệm backpressure từ networking/dataflow; được phổ biến trong model reactive/Reactive Streams (2015-2016)
**Giải quyết thế nào:** Backpressure: tín hiệu 'chậm lại' truyền ngược từ consumer sang producer (TCP window, bounded queue + discard/block, credit-based flow control trong gRPC/reactive). Rate limiting chặn request đến (429); rate shaping/trạt giữ và phát ra đều hơn để làm mượt đỉnh. Kết hợp bounded queue + drop policy có chủ đích + metric depth.
*Liên quan: Little's law, Queue depth, Fan-out*

### Branch prediction
*còn gọi: dự đoán nhánh, branch misprediction, pipeline stall*

**Vấn đề khiến nó ra đời:** Thứ tự dữ liệu đầu vào làm thay đổi tỉ lệ true/false của một if trong vòng lặp khiến code chạy chậm gấp 2-3 lần mà profiler CPU không chỉ ra dòng nào 'đắt' rõ ràng.
**Giải quyết thế nào:** CPU đoán trước nhánh điều khiển để nạp sẵn instruction; đoán sai = flush pipeline, mất hàng chục chu kỳ. Code phân nhánh khó đoán (dữ liệu aleatory) làm giảm IPC. Tối ưu: sort dữ liệu để tăng tính dự đoán được, gom nhánh hot ra ngoài vòng lặp, dùng branchless/CMOV khi hợp lý.
*Liên quan: Profiling, CPU cache line, Hot path*

### Bufferbloat
*còn gọi: phình bộ đệm, độ trễ do buffer, smart queue management*

**Vấn đề khiến nó ra đời:** Đường truyền 50Mbps nhưng ping luôn 300ms+ vì router consumer giữ buffer hàng trăm MB 'cho đầy' rồi packet delay cả giây — VoIP/gaming lag trong khi throughput test vẫn 'nhanh'.
**Nguồn gốc:** Thuật ngữ phổ biến nhờ Jim Gettys (blog 'Bufferbloat', ~2010-2011); giải pháp CoDel của Nichols & Jacobson (2012)
**Giải quyết thế nào:** Buffer lớn ở switch/router/home gateway giữ queue đầy → standing queue → RTT tăng (theo Little's law: L = λW, W phình khi queue phình). Xử lý: sqm/fq_codel/cake đặt queue nhỏ + fair queueing, hoặc giảm hẳn buffer — theo BBR: bạn không cần buffer đầy để đạt BtlBw.
*Liên quan: Little's law, BBR, Bandwidth vs latency*

### C10K / C10M problem
*còn gọi: c10k, c10m, 10.000 kết nối, millions of connections*

**Vấn đề khiến nó ra đời:** Web server 2000 ('một request = một process/thread') sập khi có 10.000 client đồng thời vì mỗi kết nối tốn một process và bộ nhớ, dù CPU hoàn toàn có thể gánh nổi.
**Nguồn gốc:** Dan Kegel, trang 'The C10K problem' (kegel.com/c10k.html), khoảng năm 2000; C10M do Robert Graham đề xuất (Black Hat, 2013)
**Giải quyết thế nào:** Bài toán phục vụ 10.000 (rồi 10 triệu) kết nối đồng thời: cần event-driven I/O (epoll/kqueue), thread pool, non-blocking sockets, kernel tuning (somaxconn, file descriptor limit, TIME_WAIT), tách accept worker. Trở thành nền của Nginx, Node.js, Netty.
*Liên quan: epoll vs select vs poll, Event loop, Non-blocking I/O*

### Cache locality (spatial/temporal)
*còn gọi: tính cục bộ cache, temporal locality, spatial locality*

**Vấn đề khiến nó ra đời:** Duyệt mảng AoS tràn lan trên dataset lớn chạy chậm gấp nhiều lần vòng lặp gọn tương đương, dù 'cùng một công việc tính toán' — vì CPU cache miss trả giá hàng chục-đôi trăm chu kỳ.
**Giải quyết thế nào:** Temporal locality: dữ liệu vừa dùng sẽ được dùng lại soon (giữ biến vòng lặp trong cache/register). Spatial locality: truy cập dữ liệu kề nhau nên fetch theo block (cache line) sẽ trúng. Tối ưu: duyệt theo thứ tự bộ nhớ, struct-of-arrays cho hot field, tách dữ liệu lạnh ra để dòng cache không bị pollution.
*Liên quan: CPU cache line, False sharing, Prefetch*

### Cache stampede / thundering herd
*còn gọi: cache stampede, thundering herd, đàn ong, hotspot key expiry*

**Vấn đề khiến nó ra đời:** Key cache quan trọng hết TTL đúng lúc; 10.000 request cùng lúc miss và đều đi compute/DB nặng → DB chết thêm lần nữa (đúng cái mà cache sinh ra để tránh).
**Nguồn gốc:** Hiện tượng 'thundering herd' mô tả trong networking/OS hàng thập niên (xem Wikipedia: thundering herd problem); cache stampede là tên gọi cụ thể trong cộng đồng cache
**Giải quyết thế nào:** Cùng một sự kiện đánh thức hàng loạt luồng, chỉ 1 cái làm việc thực. Fix: distributed lock (setnx) chỉ cho 1 request rebuild, các request còn lại serve stale hoặc chờ; jitter TTL ngẫu nhiên; probabilistic early refresh; singleflight trong Go/memoize với mutex.
*Liên quan: Stale-while-revalidate, Hot key, Negative caching*

### CPU cache line
*còn gọi: dòng cache, cache line 64 bytes, cacheline*

**Vấn đề khiến nó ra đời:** Không hiểu cache line dẫn tới tối ưu 'đúng logic nhưng sai vật lý': đọc một byte vẫn kéo cả 64 byte, và ghi một byte vẫn invalidate cả dòng trên các core khác.
**Giải quyết thế nào:** Đơn vị nhỏ nhất cache(L1/L2/L3) di chuyển và hợp nhất coherence — thường 64 byte. Đọc 1 byte = load cả dòng (lợi nếu truy cập tuần tự, lãng nếu duỗi dọc array-of-struct). Đồ thị directory-based coherence theo dòng: mọi false sharing, race padding đều tính trên đơn vị này.
*Liên quan: False sharing, Cache locality, Prefetch*

### Disk IOPS, throughput & queue depth
*còn gọi: IOPS, queue depth, disk throughput, io scheduler, fio*

**Vấn đề khiến nó ra đời:** Database report chậm nhưng 'đĩa không bận lắm' — nhìn sai metric: throughput (MB/s) ổn định trong khi IOPS saturation và queue depth (nvme0n1qu_time) đang phình, latency ghi tăng gấp 5.
**Giải quyết thế nào:** IOPS = số thao tác mỗi giây (4K random vs 1M sequential khác nhau hàng chục lần); queue depth = số I/O đang chờ trong thiết bị — tăng QD đến một ngưỡng thì throughput bão hòa mà latency tăng tuyến tính (Little's law trên disk). Đo bằng iostat -x (%util, aqu-sz), fio benchmark. SSD: QD nhỏ đã đủ; HDD cần QD lớn.
*Liên quan: fsync cost & SSD vs HDD, Little's law, Queue depth*

### epoll vs select vs poll
*còn gọi: select poll epoll, I/O multiplexing, scalable event notification*

**Vấn đề khiến nó ra đời:** Server dùng select() với hàng nghìn socket: mỗi lần gọi quét O(n) toàn bộ fd, fd tối đa bị giới hạn (FD_SETSIZE), wake-up báo 'có sự kiện' nhưng không nói cái nào → tự quét lại rồi lãng phí.
**Nguồn gốc:** select/poll có từ BSD/System V cổ điển; epoll thêm vào kernel Linux 2.5.45 (tháng 10/2002, Davide Libenzi)
**Giải quyết thế nào:** select/poll: O(n) mỗi lần, sao chép toàn bộ bitmap/ mảng fd sang-kernel. epoll: đăng ký interest set một lần, kernel chủ động báo exact fd sẵn sàng (ready list), O(1) trên hot path; có edge/level trigger. Tương đương: kqueue (BSD), IOCP (Windows).
*Liên quan: C10K problem, Event loop, Busy polling*

### Fan-out & amplification factor
*còn gọi: fanout, amplification, read amplification, write amplification, request amplification*

**Vấn đề khiến nó ra đời:** 1 request API phía user khiến service gọi 50 service con (fan-out 50), mỗi service con lại fan-out tiếp → bức tranh 'gấp 50 lần' nằm sau một endpointtrông nhẹ; hay WAL ghi 1MB nhưng flash phải ghi 10MB (write amplification) làm SSD mòn và chậm.
**Giải quyết thế nào:** Fan-out: số lời gọi nội bộ sinh ra từ 1 request — nhân với tail latency (xem The Tail at Scale) và QPS của downstream. Amplification factor: tỉ lệ bytes/IO thực thực so với bytes hữu ích (read/write amplification trong LSM-tree/SSD, DNS amplification trong networking). Đo để phát hiện: metric per-request downstream calls, write bytes/ingest bytes.
*Liên quan: Tail latency, N+1 query, Pagination cost*

### Generational GC
*còn gọi: GC thế hệ, generation scavenging, young/old generation*

**Vấn đề khiến nó ra đời:** Trace cả heap vài GB mỗi lần thu dọn thì pause quá dài; thực tế phần lớn object chết rất sớm nên quét cả núi dữ liệu sống là lãng phí.
**Nguồn gốc:** David Ungar, 'Generation Scavenging', 1984; thành chuẩn trong JVM/boyer-GC hiện đại
**Giải quyết thế nào:** Chia heap theo thế hệ dựa trên giả thuyết 'most objects die young': object mới vào young gen,_minor GC quét nhanh khu nhỏ, object sống qua nhiều vòng được promote lên old gen (quét ít hơn). Viết barrier cho tham chiếu cross-generation. Tradeoff: fragmentation/promotion và major GC thỉnh thoảng vẫn lâu.
*Liên quan: Stop-the-world, Memory allocation, Heap profiling*

### Hot key / hot partition
*còn gọi: hotspot key, hot partition, skewed key, phân vùng nóng*

**Vấn đề khiến nó ra đời:** Một hashtag viral làm 30% toàn bộ traffic dồn vào 1 shard/1 node Redis: node đó CPU 100% trong khi cluster overall chỉ 40% — partitioning 'đều theo hash' không đều theo thực tế.
**Giải quyết thế nào:** Phân bố key không đồng đều (zipf). Xử lý: tách hot key ra instance riêng (salting/trie sharding cho hot prefix), replicate hot key sang nhiều node rồi client load-balance, cache L1 tại ứng dụng, giới hạn rate theo key. Đo bằng per-key access counter (sampling) để tìm hotspot.
*Liên quan: Hot partition, Cache stampede, Hot path*

### HTTP/2 multiplexing
*còn gọi: đaplex HTTP/2, stream HTTP/2, multiplexing over one connection*

**Vấn đề khiến nó ra đời:** HTTP/1.1 giới hạn ~6 kết nối/nền tảng nên trình duyệt phải mở nhiều TCP (hoặc serialize), trang nhiều tài nguyên nhỏ bị head-of-line và chậm tải song song.
**Nguồn gốc:** HTTP/2 chuẩn hóa tại RFC 7540 (tháng 5/2015), kế thừa SPDY của Google (2009-2012)
**Giải quyết thế nào:** Nhiều stream (request/response) chạy đồng thời trên cùng một TCP connection, mỗi stream có ID, frame tùy ý interleaving + HPACK nén header. Giảm số kết nối, tận dụng một handshake TLS. Nhưng: một packet TCP loss vẫn block toàn connection (xem HOL blocking).
*Liên quan: Head-of-line blocking, HTTP keep-alive, TLS handshake cost*

### JIT compilation & warmup
*còn gọi: just-in-time, JIT warmup, pre-warming JIT, tiered compilation*

**Vấn đề khiến nó ra đời:** Service JVM vừa deploy (hoặc vừa scale) cho p99 xấu gấp 3-5 lần vài phút đầu vì mã bytecode chưa được biên dịch thành mã máy tối ưu — benchmark hoặc smoke test ngay sau restart ra kết quả sai.
**Nguồn gốc:** JIT như khái niệm xuất hiện từ đầu thập niên 1980 (Smalltalk-80 VM, UCSD p-code); phổ biến rộng rãi bởi JVM/HotSpot từ những năm 1990-2000
**Giải quyết thế nào:** Runtime dịch bytecode → machine code khi phát hiện hot method (profiling counters), rồi tái biên dịch cấp cao hơn (C1/C2 tiered, OSR). Warmup = thời gian JIT quan sát + biên dịch + JIT log ổn định. Trong benchmark: warmup đủ vòng, xóa/warm JIT profile nhất quán; trong prod: pre-warm bằng health-check/traffic giả trước khi nhận user thật.
*Liên quan: Hot path, Benchmark, Microbenchmark*

### Latency histogram / HDR Histogram
*còn gọi: HDR Histogram, High Dynamic Range Histogram, histogram độ trễ*

**Vấn đề khiến nó ra đời:** Giữ toàn bộ mẫu latency trong mảng để tính percentile thì tốn RAM; lưu log rồi tính offline thì chậm; bucket cố định thô thì mấtđộ chính xác ở đuôi (p99.99).
**Nguồn gốc:** HDR Histogram do Gil Tene & Brian Otto phát triển (Azul), công bố ~2014-2015, hdrhistogram.org
**Giải quyết thế nào:** Chia thang log các bucket theo bậc tin cậy (significant digits), độ trễ 3-6ns mỗi mẫu trên CPU Intel ~2014, bộ nhớ cố định theo khoảng giá trị. Cho phép gộp (add) histogram con thành tổng thể chính xác — nền tảng của benchmark correction (coordinated omission) và monitoring percentile.
*Liên quan: Coordinated omission, Phân vị p50/p95/p99, Benchmark*

### Little's law
*còn gọi: định luật Little, L = λW, L=λW, Little's theorem*

**Vấn đề khiến nó ra đời:** Đặt kích thước thread pool / connection pool / hàng đợi hoàn toàn theo cảm tính: quá nhỏ thì queue phình, quá lớn thì context switch và OOM, không có công thức kiểm chứng.
**Nguồn gốc:** John Little (MIT), công thức L = λW, chứng minh năm 1961 (Operations Research)
**Giải quyết thế nào:** Số job trung bình trong hệ thống L = tốc độ đến λ × thời gian tồn W, đúng với hầu hết mọi hệ thống (không phụ thuộc phân phối tới hạn/dịch vụ). Dùng để suy ngược: đo throughput và latency → biết có bao nhiêu request đang 'nằm trong hệ thống' → sized pool/queue hợp lý, phát hiện bottleneck.
*Liên quan: Latency vs throughput, Backpressure, Capacity planning, Capacity Planning, Queueing Theory Basics (M/M/1), Bottleneck Analysis, QPS, Connection pool*

### Memory allocation & GC churn
*còn gọi: allocation rate, memory churn, heap allocation, object churn*

**Vấn đề khiến nó ra đời:** Hot loop new object hàng triệu lần mỗi giây làm GC chạy liên tục, log GC warning và p99 phình dù algorithm chính xác.
**Giải quyết thế nào:** Mỗi allocation = native heap/arena work + later reclamation; rate cao → young GC dày đặc → STW/scan nhiều. Giảm: object pool/arena, reuse buffer (bytes.Buffer), tránh boxing/lambda capture thừa, chọn cấu trúc data gọn (primitive arrays), đo allocation rate qua profiler (async-profiler, go tool pprof -alloc).
*Liên quan: Generational GC, Stop-the-world, Heap profiling*

### Microbenchmark & bẫy của nó
*còn gọi: benchmark nhỏ, microbenchmark pitfalls, JMH, benchmark artifacts*

**Vấn đề khiến nó ra đời:** Benchmark vòng lặp 10^9 lần hàm 5ns rồi kết luận tối ưu 20% — thực tế JVM đã dead-code elimination, constant fold, CPU boost, branch predictor ấm, và khác hẳn khi chạy thật với data lớn.
**Giải quyết thế nào:** Bẫy: dead-code elimination (kết quả không dùng → JIT xóa), store-to-load forwarding/constant folding, warmup thiếu, data set nằm gọn trong L1 (không phản ánh production), turbo clock, run-to-run variance, đồng bộ đo sai (System.nanoTime mỗi iter). Giải pháp: JMH/blackhole, warmup đầy đủ, -prof perf, chạy nhiều lần, báo median + confidence interval.
*Liên quan: Warmup, Statistical significance in benchmarks, Regression detection in benchmarks*

### Nagle's algorithm & delayed ACK
*còn gọi: Nagle algorithm, delayed ACK, RFC 896, tinygram*

**Vấn đề khiến nó ra đời:** Protocol gửi phím gõ / message nhỏ hàng chục byte thấy latency lạ thường (40-200ms) đôi khi — hai thuật toán tối ưu 'chống nhau': một bên gom gói, bên kia chờ trả lời.
**Nguồn gốc:** John Nagle (Ford Aerospace), RFC 896 'Congestion Control in IP/TCP Internetworks', 1984; delayed ACK đến từ triển khai TCP cổ điển (~4.2BSD)
**Giải quyết thế nào:** Nagle: chỉ gửi segment nhỏ ngay khi không có gói chưa ACK; nếu có thì gom đến khi ACK về hoặc đủ MSS (giảm tinygram). Delayed ACK: receiver chờ ~40ms (hoặc 2 packet đến) mới ACK. Kết quả deadlock nhẹ: Nagle chờ ACK, ACK bị delay → 40ms+. Fix: TCP_NODELAY cho latency-sensitive, gom message ở ứng dụng, hoặc dùng header + payload trong 1 packet.
*Liên quan: TCP keep-alive, Latency numbers, Bufferbloat*

### Negative caching & cache penetration (null cache)
*còn gọi: null cache, negative cache, cache penetration, không-trúng xuyên thấu*

**Vấn đề khiến nó ra đời:** Bot quét id không tồn tại liên tục: mỗi request đều miss cache → 100% dồn xuống DB (cache penetration), hoặc cache 'không có' TTL quá dài thì item vừa được tạo lại bị che (null cache sai).
**Giải quyết thế nào:** Negative caching: lưu kết quả 'không tồn tại' với TTL ngắn (vd 30-60s) để chặn chuỗi miss lặp. Null cache/không-trúng cache penetration: key lạ không có trong cache luôn đi DB — đối phó: bloom filter phía trước, validate id định dạng, TTL negative ngắn, jitter. Đừng cache null vĩnh viễn (che dữ liệu vừa ghi).
*Liên quan: Cache hit ratio, Stale-while-revalidate, Hot key*

### Pagination cost & keyset pagination
*còn gọi: offset pagination, LIMIT OFFSET, keyset pagination, seek method, cursor pagination*

**Vấn đề khiến nó ra đời:** OFFSET 100.000 khiến DB phải quét và vứt 100.000 dòng trước khi trả 20 dòng — page càng sâu càng chậm, và row chèn/xóa làm lặp/mất item giữa các trang.
**Giải quyết thế nào:** Offset: chi phí O(offset), không ổn định với ghi chèn. Keyset/cursor: WHERE (updated_at, id) < (cursor) ORDER BY ... LIMIT n — chi phí O(log n + page), ổn định, cần index dẫn xuất (sort key). Trừ khi user cần 'jump đến trang N' tự do thì offset vẫn hợp lệ cho trang đầu.
*Liên quan: Pagination, N+1 query, Query batching*

### Prefetch
*còn gọi: hardware prefetch, software prefetch, read-ahead, prefetching*

**Vấn đề khiến nó ra đời:** Duyệt con trỏ liên kết (linked list/tree node phân tán) chậm vì mỗi node một cache miss — CPU không đoán được trỏ tiếp theo nên luôn chờ DRAM.
**Giải quyết thế nào:** Hardware prefetcher đoán pattern tuần tự/stride và nạp trước dòng cache; software prefetch (__builtin_prefetch/PRF) chủ động nạp ô sẽ dùng sau N vòng lặp. Tối ưu cấu trúc data (array thay vì linked list) thường thắng prefetch thủ công. Cũng áp dụng ở tầng cao: prefetch relation/bản ghi trước khi cần.
*Liên quan: Cache locality, N+1 query, Lazy evaluation*

### Profiling: CPU/heap, flame graph
*còn gọi: flame graph, CPU profiler, heap profiler, USE method*

**Vấn đề khiến nó ra đời:** 'Code chậm' không có chỗ nào chỉ tên: log chỉ nói endpoint mất 2s, không nói hàm nào, dòng nào, đang chờ I/O hay đang đốt CPU.
**Nguồn gốc:** Flame graph do Brendan Gregg phát triển năm 2011 (brendangregg.com/flamegraphs); USE method cũng của Gregg
**Giải quyết thế nào:** Sampling profiler lấy stack định kỳ (low overhead) → histogram stack; instrument ghi mọi entry (đầy đủ nhưng overhead cao). Flame graph: trục X = % mẫu (không phải thời gian), trục Y = độ sâu stack, width = tỉ trọng CPU — nhìn ngay 'ngọn lửa' nóng. Heap profiler (pprof, async-profiler) xem ai giữ object; kết hợp mutation breakpoint/line-level cho phần code cần sửa.
*Liên quan: Sampling vs instrumentation, Hot path, Benchmark*

### Sampling vs instrumentation
*còn gọi: sampling profiler, instrumentation overhead, observer effect profiling*

**Vấn đề khiến nó ra đời:** Bật profiler instrumentation để đo thì chính nó làm slowdown 2-5x, benchmark bị thay đổi ('hiệu ứng người quan sát'); sampling quá thô thì miss hot path hàng chục μs.
**Giải quyết thế nào:** Sampling: đếm stackmỗi N μs hoặc N event (perf, async-profiler wall/cpu) — overhead thấp, số liệu statistical, có thể miss code ngắn. Instrumentation: hook mọi hàm/đoạn (pgo, karhu, eBPF uprobe dày) — chính xác per-call nhưng overhead và skew độ trễ. Chọn theo câu hỏi: 'chỗ nào tốn CPU tổng thể?' → sampling; 'hàm này chạy bao nhiêu lần/bao lâu?' → instrumentation có kiểm soát sampling rate.
*Liên quan: Profiling, Tracing overhead, Statistical significance in benchmarks*

### Stale-while-revalidate
*còn gọi: SWR, phục vụ cũ làm mới nền, cache revalidation, phục vụ cũ vừa làm mới, SWR (HTTP), stale-while-revalidate / immutable, phục vụ cũ khi đang làm mới, RFC 5861, immutable asset*

**Vấn đề khiến nó ra đời:** Cache hết hạn = mọi request đầu tiên sau đó chịu full latency backend (và nếu đồng loạt thì thành stampede), trong khi dữ liệu cũ vài giây thường vẫn chấp nhận được. Khi cache hết hạn, client bắt buộc chờ revalidation round-trip về origin (thêm 1+ RTT + thời gian origin) dù nội dung 99% vẫn giữ nguyên — user cảm nhận độ trễ đúng vào lúc họ click. Ngược lại, asset đã hash version (?v=abc123) không bao giờ đổi nội dung nhưng client vẫn gửi conditional request vô ích mỗi lần.
**Nguồn gốc:** Được chuẩn hóa tại RFC 5861 (M. Nottingham, Yahoo!, tháng 5/2010); cách dùng phổ biến trước đó từ RFC 2616 (HTTP/1.1)
**Giải quyết thế nào:** Khi TTL stale: trả ngay bản cũ cho client (latency ~0) và đồng thời trigger refresh nền; response tiếp theo lấy bản mới. Kết hợp với stale-if-error, jitter TTL, soft/hard TTL. Cân bằng giữa freshness và availability — đo xem dữ liệu cũ bao lâu thì vẫn đúng nghiệp vụ. stale-while-revalidate=N: quá max-age, cache vẫn phục vụ bản cũ NGAY cho user và âm thầm revalidate nền — user không thấy độ trễ. immutable: trong suốt thời gian fresh, không cần revalidate (dùng với URL có version hash + max-age dài). Kết hợp pattern: index.html đặt no-cache để luôn lấy HTML mới trỏ tới asset mới, /assets/* đặt immutable caching vĩnh viễn.
*Liên quan: Cache stampede, CDN edge caching, Negative caching, TTL, CDN, Browser cache, Cache invalidation, HTTP caching với Cache-Control, ETag / conditional requests, CDN cache key*

### Stop-the-world & GC pause
*còn gọi: GC pause, STW, thời gian dừng GC*

**Vấn đề khiến nó ra đời:** Service Java/Go p99 thỉnh thoảng nhảy từ 50ms lên 2 giây đúng lúc heap đầy, log không có lỗi gì — đó là garbage collector dừng toàn bộ mutator.
**Giải quyết thế nào:** GC cần chặn luồng ứng dụng (stop-the-world) ở các phase như root scanning/compaction để graph đối tượng nhất quán. Pause dài = outlier latency. Giảm: giữ heap và rate tạo object ổn định, GC low-latency (ZGC/Shenandoah), cân nhắc region-based collector, luôn đo GC time trong SLO.
*Liên quan: Generational GC, Memory allocation, Tail latency*

### SYN flood & SYN cookies
*còn gọi: SYN flood, SYN cookie, half-open connection*

**Vấn đề khiến nó ra đời:** Máy chủ web nhận hàng triệu SYN giả, bảng kết nối half-open đầy thật → không accept nổi kết nối hợp lệ (từ chối dịch vụ cả khách thật).
**Nguồn gốc:** Sóng tấn công SYN flood được cảnh báo rộng rãi cuối những năm 1990 (CERT); SYN cookies do Daniel J. Bernstein đề xuất năm 1996
**Giải quyết thế nào:** Attacker gửi SYN mà không trả lời ACK, mỗi kết nối nửa vời chiếm entry bảng. SYN cookie mã hóa state (timestamp, MSS, secret) vào ISN sequence → server không lưu state cho đến khi ACK hợp lệ về; kèm backlog tuning, syncookies sysctl, rate limit SYN theo nút con.
*Liên quan: Connection pool vs new connection, Rate shaping, Keep-alive*

### Syscall overhead
*còn gọi: chi phí system call, syscall cost, user kernel transition*

**Vấn đề khiến nó ra đời:** Hàm đọc file nhỏ gọi open/read/close hàng nghìn lần mỗi request, mỗi lần trả giá chuyển ngữ cảnh user→kernel (~hàng trăm ns đến ~1μs) — tổng lại thành bottleneck CPU không thấy trong code ứng dụng.
**Giải quyết thế nào:** Mỗi syscall phải chuyển chế độ kernel, kiểm tra tham số, đối chiếu page table (đặc biệt khi bộ nhớ user bị thay đổi). Reduce: batch syscall (preadv/writev, recvmmsg, io_uring), cache fd/connection (keep-alive), map file thay vì đọc lặp, tránh gettimeofday() trong hot loop.
*Liên quan: Syscall batching, io_uring, Zero-copy*

### TCP slow start
*còn gọi: slow start, khởi động chậm, cwnd growth, cwnd exponential growth*

**Vấn đề khiến nó ra đời:** Kết nối mới (hoặc mất kết nối) gửi nhỏ giọt từ ~10 segment, mất nhiều round trip mới đạt băng thông tối đa — request đầu của connection pool 'nóng' bất ngờ chậm.
**Nguồn gốc:** Van Jacobson, 'Congestion Avoidance and Control', SIGCOMM 1988
**Giải quyết thế nào:** cwnd bắt đầu nhỏ (10 MSS theo RFC 5681) và tăng gấp đôi mỗi RTT (exponential) đến ngưỡng ssthresh/congestion event rồi chuyển sang additive increase. Slow start kết thúc sớm bằng pacing (prr) hoặc BBR Startup. Ảnh hưởng thực tế: kết nối mới luôn chịu 'tax' vài round trip — lại là lý do keep-alive/pool/pre-warm.
*Liên quan: BBR, Connection pool vs new connection, TLS handshake cost, TCP congestion control, RTT, BBR / CUBIC*

### Thread-per-request vs event loop
*còn gọi: một thread mỗi request, reactor pattern, event-driven server*

**Vấn đề khiến nó ra đời:** Mỗi request một thread (servlet servlet container cổ điển) khiến 10.000 request đồng thời = 10.000 thread, RAM và context switch phình; ngược lại event loop một thread dễ bị block bởi I/O đồng bộ ngầm.
**Giải quyết thế nào:** Thread-per-request: code đồng bộ dễ viết, chi phí thread (~stack MB, context switch) giới hạn C10K. Event loop/reactor: 1 luồng điều phối hàng vạn kết nối, I/O phải non-blocking, callback/coroutine; CPU-bound job phải tách worker pool. Chọn theo workload: I/O-bound→event loop, CPU-bound/đồng bộ legacy→thread pool.
*Liên quan: C10K problem, Non-blocking I/O, Context switch cost*

### Tracing overhead
*còn gọi: overhead distributed tracing, trace sampling, OpenTelemetry overhead*

**Vấn đề khiến nó ra đời:** Mở full tracing cho mọi request trên service QPS cao thì CPU và network export phình, latency tăng — 'đo để không làm méo thứ mình đo'.
**Giải quyết thế nào:** Mỗi span = object + serialization + export; head sampling (quyết định trace ở entry), tail sampling (giữ trace chậm/lỗi), probabilistic rate. Benchmark so sánh bật/tắt tracing; giới hạn attributes/stack depth; queue+batch exporter. Quy tắc: overhead mục tiêu < ~1-5% CPU, luôn đo baseline.
*Liên quan: Sampling vs instrumentation, Latency histogram, Observability*

### Zero-copy
*còn gọi: không sao chép, sendfile, splice, MSG_ZEROCOPY*

**Vấn đề khiến nó ra đời:** Proxy/streaming server đẩy 10Gbps mà CPU 100% chỉ để copy dữ liệu qua lại giữa kernel buffer, user buffer, socket buffer — nội dung không đổi nhưng bị memcpy nhiều lần.
**Giải quyết thế nào:** Đưa dữ liệu từ đĩa/network thẳng sang socket (sendfile/splice/io_uring fixed buffers, RDMA/DPDK) không qua vùng đệm user-space. Tránh 2-3 lần memcpy + giảm cache pollution. Tradeoff: khó transform giữa chừng (nếu cần chỉnh byte thì phải copy), API phức tạp hơn.
*Liên quan: io_uring, Syscall batching, Compression*

## Phân tán & Đồng thời

### 2PC/3PC & distributed transaction
*còn gọi: two-phase commit, 2PC, three-phase commit, 3PC, distributed transaction*

**Vấn đề khiến nó ra đời:** Transaction trải qua hai database/service (trừ tiền ở DB A, ghi sổ ở DB B): commit riêng lẻ thì A commit xong B fail là tiền biến mất. Cần tất cả cùng quyết định commit hoặc abort — nhưng 2PC blocking: sau khi participant đã vote yes mà coordinator chết, participant giữ lock chờ vô hạn, dòng đó bị khóa cả chục phút.
**Nguồn gốc:** không rõ (được Bernstein, Hadzilacos & Goodman, 'Concurrency Control and Recovery in Database Systems' 1987 tài liệu hóa; thường ghi nhận từ công việc của Jim Gray cuối thập niên 1970, chưa verify trực tiếp).
**Giải quyết thế nào:** 2PC: phase 1 prepare/vote, phase 2 broadcast commit/abort — an toàn nhưng blocking; 3PC thêm phase pre-commit với timeout để participant tự quyết định khi coordinator mất, giảm blocking (vẫn không an toàn tuyệt đối khi network partition).
*Liên quan: Saga, Consensus, Paxos*

### Atomic operation & CAS
*còn gọi: atomic, compare-and-swap, CMPXCHG, vận động nguyên tử*

**Vấn đề khiến nó ra đời:** Muốn tăng biến đếm không cần mutex (mutex quá nặng hoặc muốn lock-free): đọc → +1 → ghi ba bước này bị ngắt giữa chừng thì hai thread đọc cùng giá trị cũ rồi ghi đè, mất lần tăng. Cần một thao tác mà CPU đảm bảo đọc-so sánh-ghi là một bước không thể chen ngang.
**Nguồn gốc:** Có sẵn trong kiến trúc IBM 370 từ 1970; trên x86 là lệnh CMPXCHG; Maurice Herlihy (1991) chứng minh CAS mạnh hơn read/write/fetch-and-add đơn thuần.
**Giải quyết thế nào:** CAS đọc giá trị hiện tại, nếu còn bằng giá trị mong đợi thì ghi giá trị mới, ngược lại báo thất bại để thread đọc lại và thử tiếp — mọi thao đổi luôn tính trên dữ liệu 'mới nhất', từ đó dựng được cấu trúc dữ liệu lock-free.
*Liên quan: Optimistic vs pessimistic locking, Race condition*

### Distributed lock & fencing token
*còn gọi: distributed lock, fencing token, Redlock, lease*

**Vấn đề khiến nó ra đời:** Lock trong process local vô ích khi có nhiều instance cùng chạy job định kỳ. Đặt distributed lock vẫn chưa đủ: client giữ lock rồi bị GC pause hàng chục giây (trường hợp GitHub thực tế, packet delay ~90s), lease hết hạn, client khác acquire — hai bên cùng tin mình giữ lock và cùng ghi. Kiểm tra lease ngay trước khi ghi cũng vô dụng vì pause có thể xảy ra đúng thời điểm đó.
**Nguồn gốc:** Martin Kleppmann, 'How to do distributed locking' (2016); lease phân tán do Cary Gray & David Cheriton đặt tên, paper SOSP 1989 về cache coherence.
**Giải quyết thế nào:** Lock service cấp fencing token tăng dần theo mỗi lần acquire; storage từ chối mọi ghi có token nhỏ hơn token đã xử lý — client 'đông băng' cũ thức dậy cũng không thể ghi đè. ZooKeeper dùng zxid làm token; Redlock không có cơ chế này nên không an toàn cho critical section.
*Liên quan: Mutex & Semaphore, Starvation & livelock, Split brain & quorum*

### Eventual consistency
*còn gọi: nhất quán cuối cùng, anti-entropy*

**Vấn đề khiến nó ra đời:** Ghi đa vùng: đồng bộ đồng nghĩa mỗi lần ghi phải chờ đủ replica — replica nào chậm hay partition là unavailable; không đồng bộ thì người ở London đọc được giá cũ mà người ở Tokyo vừa sửa. Giữ cả availability lẫn đồng nhất tại mọi thời điểm là bất khả thi.
**Nguồn gốc:** Hệ thống Bayou (Terry et al., 1995) là ví dụ sớm; thuật ngữ được Werner Vogels phổ biến qua 'Eventually Consistent' (ACM Queue 2008 / CACM 2009).
**Giải quyết thế nào:** Ghi cục bộ rồi lan truyền bất đồng bộ (gossip, anti-entropy, read/write repair), xung đột phân xử bằng last-writer-wins hoặc CRDT — cam kết duy nhất là khi ngừng ghi, mọi replica hội tụ; trong lúc chờ thì đọc được giá trị trung gian.
*Liên quan: CAP theorem, Gossip protocol, CRDT*

### Gossip protocol
*còn gọi: gossip, epidemic protocol, anti-entropy, phân phối lan truyền*

**Vấn đề khiến nó ra đời:** Cluster vài trăm node cần lan truyền membership/tình trạng: mỗi node broadcast O(n) tin nhắn thì tổng O(n²), một node chết làm cả push gãy; còn đặt coordinator trung tâm thì nó thành điểm lỗi đơn (SPOF) và bottleneck.
**Nguồn gốc:** Demers, Greene, Hauser, Irish & Larson, 'Epidemic algorithms for replicated database maintenance', PODC 1987.
**Giải quyết thế nào:** Mỗi vòng, node chọn ngẫu nhiên vài peer để trao đổi/chênh lệch state — thông tin lan như dịch bệnh, đến mọi node trong O(log n) lượt, chấp nhận packet loss và membership thay đổi (AWS S3, Cassandra, Serf).
*Liên quan: Consistent hashing, Eventual consistency, Leader election*

### Idempotency & delivery semantics
*còn gọi: idempotency, idempotent, at-least-once, at-most-once, exactly-once, Idempotency-Key*

**Vấn đề khiến nó ra đời:** Client gọi API trừ tiền rồi timeout — không biết server đã xử lý hay chưa nên phải retry; nếu endpoint không idempotent thì retry sinh 2 lần trừ tiền. Tương tự với broker: at-most-once (gửi rồi quên) thì mất event khi crash giữa chừng; at-least-once thì redelivery làm consumer xử lý 2 lần. Mạng không bao giờ cho biết chắc 'gói tin đã đến hay chưa'.
**Nguồn gốc:** Thuật ngữ idempotence do nhà toán học Benjamin Peirce đặt năm 1870; ngữ nghĩa HTTP (GET/PUT/DELETE idempotent, POST không) do RFC 7231 quy định. Delivery semantics: không rõ tác giả đầu tiên.
**Giải quyết thế nào:** At-least-once + idempotent consumer (dedupe theo message ID hoặc Idempotency-Key ghi lại kết quả cũ) cho praktikal exactly-once; at-most-once chỉ dùng khi mất nhẹ hơn lặp (metrics, log). Thiết kế API theo PUT/DELETE theo ID để lặp vẫn cho cùng kết quả.
*Liên quan: Saga, 2PC/3PC, Optimistic vs pessimistic locking*

### Leader election
*còn gọi: bầu lãnh đạo, single master*

**Vấn đề khiến nó ra đời:** Cluster cần một coordinator duy nhất (ghi log, điều phối job) nhưng không node nào biết leader hiện tại còn sống hay đã chết — nếu hai node cùng tự nhận là leader thì write đi hai hướng, duplication job; không ai nhận thì cluster bất động.
**Nguồn gốc:** LeLann chuẩn thức hóa bài toán (mất token trong ring); Chang & Roberts 1979 (ring, highest-ID); GHS (Gallager, Humblet, Spira) 1983 — đoạt Dijkstra Prize.
**Giải quyết thế nào:** Thuật toán bầu chọn đảm bảo hai điều kiện: uniqueness (đúng một node tự nhận là leader) và agreement (các node còn lạiđều biết leader là ai) — qua token ring, hay lease-based (ZooKeeper ephemeral node, etcd lease) để leader chết thì lease hết hạn và bầu lại.
*Liên quan: Consensus, Raft, Distributed lock & fencing token*

### Optimistic vs pessimistic locking
*còn gọi: optimistic locking, pessimistic locking, SELECT FOR UPDATE, version field*

**Vấn đề khiến nó ra đời:** Ghi cùng một bản ghi: pessimistic lock (SELECT FOR UPDATE) giữ lock từ đầu → dưới tải cao, các transaction khác xếp hàng chỉ để đọc, throughput tụt. Optimistic thì cứ đọc-tính-ghi rồi kiểm tra ở commit — nhưng hai bên cùng sửa một dòng thì một bên phải làm lại toàn bộ, client không hiểu vì sao retry.
**Nguồn gốc:** không rõ
**Giải quyết thế nào:** Pessimistic: khóa trước khi sửa, an toàn nhưng dễ tắc khi xung đột nhiều; optimistic: đọc không khóa, kèm version/ETag, lúc ghi phát hiện version cũ thì reject và retry — phù hợp xung đột hiếm.
*Liên quan: Atomic operation & CAS, Race condition, Idempotency & delivery semantics*

### Saga
*còn gọi: saga pattern, compensating transaction, giao dịch bù trừ, choreography vs orchestration*

**Vấn đề khiến nó ra đời:** Microservices mỗi service một database riêng nên không dùng ACID xuyên services; mà giữ lock kiểu 2PC suốt một business flow dài (đặt vé → thanh toán → xuất vé) thì lock giữ hàng giây-phút, block dữ liệu khác, và coordinator chết là cả flow treo chờ.
**Nguồn gốc:** Hector Garcia-Molina & Kenneth Salem, 'Sagas', SIGMOD 1987 (Princeton, 1/1987).
**Giải quyết thế nào:** Chia transaction thành chuỗi local transaction, bước sau chạy khi bước trước phát event báo thành công; nếu bước nào fail thì chạy compensating transaction (hoàn tiền, hủy chỗ) để bù trừ về trạng thái nhất quán — thay vì rollback. Trao đổi: không có isolation, phải chống xung đột giữa các saga chạy song song.
*Liên quan: 2PC/3PC, Idempotency & delivery semantics, Eventual consistency, Event-driven architecture, Transactional outbox, Idempotent consumer*

### Split brain & quorum
*còn gọi: split-brain, brain split, quorum, majority quorum*

**Vấn đề khiến nó ra đời:** HA cluster mất nhau vì đường heartbeat chết nhưng process vẫn sống: hai node tự cho mình là master, cùng nhận ghi, dữ liệu hai bên lệch nhau — lúc heal là corrupt, phải operator can thiệp tay. Cụm 2 node không có witness thì không ai quyết định được ai là 'đúng'.
**Nguồn gốc:** Quorum (weighted voting) do David Gifford đề xuất, 'Weighted voting for replicated data', 1979; thuật ngữ split-brain thuộc vận hành cluster HA, không rõ tác giả đầu tiên.
**Giải quyết thế nào:** Quorum: chỉ nhóm giữ đa số phiếu mới được active, nhóm còn lại auto-fence; điều kiện Vw > N/2 khiến hai nhóm 'đa số' không thể cùng tồn tại (MongoDB replica set, Galera). Hy sinh availability của nhóm thiểu số để giữ consistency.
*Liên quan: CAP theorem, Consensus, Distributed lock & fencing token*

### Starvation & livelock
*còn gọi: starvation, livelock, đói, treo động*

**Vấn đề khiến nó ra đời:** Lock không fair: thread cũ bị thread mới liên tục giành mất nên không bao giờ được chạy (starvation) — ví dụ worker mãi không nhận được job. Livelock thì ngược lại: hai thread liên tục nhường nhau, cùng thả lock rồi retry cùng lúc, đổi trạng thái mãi nhưng không ai tiến — giống hai người tránh nhau cùng nghiêng cùng hướng.
**Nguồn gốc:** không rõ
**Giải quyết thế nào:** Starvation: hàng đợi fair/fifo, chia đều tài nguyên, aging ưu tiên dần; livelock: thêm ngẫu nhiên hoặc backoff (exponential + jitter) khi retry để phá nhịp đồng bộ.
*Liên quan: Deadlock, Race condition, Distributed lock & fencing token*

### Thread pool & pool exhaustion
*còn gọi: thread pool, hàng đợi luồng, pool exhaustion, cạn kiệt thread*

**Vấn đề khiến nó ra đời:** Mỗi request tạo một thread mới: 10k request đồng thời thì RAM cạn vì mỗi thread chiếm stack, kernel tay trắng với context switch. Nhưng set pool quá nhỏ thì request xếp hàng timeout; tệ hơn — pool cạn kiệt khi mọi thread cùng mắc trên I/O chậm (DB treo), không còn thread nào cho request mới, toàn service đứng im dù CPU còn rảnh.
**Nguồn gốc:** không rõ
**Giải quyết thế nào:** Giữ cố định N thread làm việc từ hàng đợi task; hàng đợi có giới hạn (bounded) + backpressure để từ chối/đẩy chậm khi quá tải thay vì nhận vô hạn và OOM.
*Liên quan: Event loop, Concurrency vs Parallelism, Deadlock*

## Messaging & Bất đồng bộ

### Competing consumers
*còn gọi: competing-consumers, visibility timeout, PeekLock*

**Vấn đề khiến nó ra đời:** Một consumer duy nhất bị chặn bởi một máy: đỉnh 500 msg/s trong khi worker xử lý 50/s thì backlog phình; thêm instance thứ hai mà không cơ chế phân phát thì hai đứa cùng lấy cùng một tin nhắn → xử lý trùng.
**Giải quyết thế nào:** Nhiều consumer cùng pull một queue, broker phân phát mỗi tin nhắn cho đúng một người; SQS dùng visibility timeout (ẩn tin nhắn trong lúc xử lý, hết timeout mà chưa ack thì hiện lại), Service Bus dùng PeekLock.
*Liên quan: Message queue, Idempotent consumer, RabbitMQ*

### Dead letter queue
*còn gọi: DLQ, dead-letter queue, hàng đợi thư chết*

**Vấn đề khiến nó ra đời:** Tin nhắn JSON hỏng bị worker từ chối rồi broker trả lại mãi — nó quay vòng vô hạn, chiếm slot xử lý, log tràn và cảnh báo spam trong khi các tin tốt phía sau không được đụng tới.
**Giải quyết thế nào:** Đếm số lần nhận thất bại, quá ngưỡng (maxReceiveCount) thì chuyển tin sang DLQ riêng; operator inspect log, chẩn đoán, fix root cause rồi redrive về queue chính.
*Liên quan: Poison message, Retry với exponential backoff & jitter, Idempotent consumer*

### Delayed queue
*còn gọi: scheduled message, delay queue, tin nhắn hẹn giờ*

**Vấn đề khiến nó ra đời:** Đơn hết hạn thanh toán sau 30 phút phải tự hủy — worker sleep 30 phút thì chiếm thread và mất job khi crash; poll DB mỗi phút thì tốn query và trễ tùy tần suất.
**Giải quyết thế nào:** Đặt thời gian available trên tin nhắn (hoặc queue riêng có độ trễ), broker/worker chỉ trả tin về khi tới hạn — không chiếm tài nguyên trong lúc chờ.
*Liên quan: Cron / Job scheduler, Message queue, Priority queue*

### Event-driven architecture
*còn gọi: event, domain event, sự kiện, event-driven, EDA*

**Vấn đề khiến nó ra đời:** Kiến trúc gọi nhau tuần tự A→B→C: thêm bước D phải sửa service A, service B chậm làm timeout cả chuỗi, và mọi service phải biết địa chỉ service khác — coupling tăng theo mỗi bước và khó test.
**Nguồn gốc:** Brenda M. Michelson viết tổng quan EDA có ảnh hưởng (2006); Udi Dahan gắn EDA với SOA
**Giải quyết thế nào:** Service phát event (điều đã xảy ra, ví dụ 'đơn đã tạo') vào kênh; consumer tự subscribe và phản ứng — thêm consumer mới không sửa producer, thất bại phía consumer không kéo sập phía sinh event; đánh đổi: phức tạp và khó test hơn request/response.
*Liên quan: Pub/Sub, Event sourcing, Saga, Transactional outbox*

### Poison message
*còn gọi: tin nhắn độc, message độc*

**Vấn đề khiến nó ra đời:** Một tin sai schema làm worker throw ngay từ dòng parse — mỗi lần redelivery là mỗi lần crash hoặc treo, consumer group không tiến lên vì lặp mãi lỗi y hệt, chặn cả partition/queue phía sau.
**Giải quyết thế nào:** Đánh dấu poison sau N lần fail, tách hẳn khỏi luồng chính (chuyển DLQ + báo alert), chờ fix dữ liệu hoặc fix code rồi xử lý lại có kiểm soát.
*Liên quan: Dead letter queue, Retry với exponential backoff & jitter, Message queue*

### Priority queue
*còn gọi: hàng đợi ưu tiên*

**Vấn đề khiến nó ra đời:** Khi backlog 10 nghìn job, FIFO xử lý log crawl 200MB trước trong khi request thanh toán của khách chờ phía sau — coi mọi job ngang hàng là sai khi chúng không ngang giá trị.
**Giải quyết thế nào:** Xếp theo mức ưu tiên, dequeue phần tử cao nhất trước (heap); broker thì tách channel ưu tiên cao/thấp hoặc dùng field priority — chấp nhận starve job thấp nếu job cao đến liên tục.
*Liên quan: Message queue, Cron / Job scheduler, FIFO / Message ordering*

### RabbitMQ (AMQP)
*còn gọi: RabbitMQ, AMQP*

**Vấn đề khiến nó ra đời:** Team cần broker tin cậy tự host với ack rõ ràng, routing linh động, failover khi node chết — nhưng middleware thời trước mỗi hãng một giao thức proprietary, team Java mua MQ của hãng này thì team Go không nối được (lock-in vendor).
**Nguồn gốc:** Rabbit Technologies Ltd. (liên doanh LShift + CohesiveFT), 2007, viết bằng Erlang; giao thức AMQP do John O'Hara khởi xướng tại JPMorgan Chase London năm 2003
**Giải quyết thế nào:** Broker viết bằng Erlang implement AMQP: exchange route tin theo binding vào queue, consumer ack khi xử lý xong (không ack → redeliver), clustering failover; plugin mở rộng STOMP/MQTT/management.
*Liên quan: Message broker, Dead letter queue, Apache Kafka, Pub/Sub*

### Server-Sent Events (SSE)
*còn gọi: SSE, EventSource, text/event-stream*

**Vấn đề khiến nó ra đời:** Server cần đẩy stream một chiều (dashboard giá, log, token LLM) — WebSocket quá nặng vì phải tự viết heartbeat/reconnect/binary framing và dễ bị proxy chặn; polling thì chậm và tốn request.
**Giải quyết thế nào:** Response HTTP với Content-Type text/event-stream, server ghi event liên tục; EventSource API tự reconnect và gửi header Last-Event-ID để tiếp tục từ chỗ đứt; HTTP/2 cho phép multiplex nhiều stream.
*Liên quan: Polling, WebSocket, Fan-out / Fan-in*

## Kiến trúc & Khả năng mở rộng

### 12-Factor App
*còn gọi: ứng dụng 12 yếu tố*

**Vấn đề khiến nó ra đời:** App chạy tốt trên máy dev nhưng fail khi lên production vì phụ thuộc config file local, file system, state lưu trên disk, version khác nhau giữa môi trường dev và prod. 12-factor ra đời như checklist để app chạy được trên mọi cloud PaaS mà không sửa code.
**Nguồn gốc:** Adam Wiggins (Heroku/Salesforce) công bố năm 2011, tổng kết từ kinh nghiệm deploy hàng trăm ngàn app trên Heroku; format lấy cảm hứng từ sách của Martin Fowler.
**Giải quyết thế nào:** 12 nguyên tắc: codebase duy nhất, dependency khai báo rõ, config lưu env, backing service là resource, build/release/run tách biệt, process stateless, port binding, concurrency, disposability, dev/prod parity, logs là event stream, admin process chạy một lần.
*Liên quan: serverless, container, monolith*

### API Gateway
*còn gọi: cổng API*

**Vấn đề khiến nó ra đời:** Mobile client cần gọi 5 microservice để render một màn hình (user, order, product, review, recommendation) — 5 round-trip qua mạng chậm. API gateway ra đời như entry point duy nhất, gom tất cả lời gọi backend thành 1 request cho client, đồng thời lo auth, rate limit, SSL termination.
**Nguồn gốc:** Pattern được Chris Richardson mô tả trong microservices.io; Netflix API Gateway (2012-2013) là một trong những triển khai nổi tiếng đầu tiên.
**Giải quyết thế nào:** Nhận request từ client, route tới service phù hợp, gom response, trả về client. Cũng là nơi đặt cross-cutting concern: authentication, rate limiting, logging, request validation, TLS termination.
*Liên quan: BFF, load balancer, microservices*

### Autoscaling
*còn gọi: tự động co giãn*

**Vấn đề khiến nó ra đời:** Traffic biến động theo giờ (cao điểm trưa, thấp đêm). Provision cho peak thì lãng phí 70% thời gian; provision cho trung bình thì sập lúc peak. Autoscaling ra đời để tự động thêm/bớt server theo metric (CPU, request rate, queue depth).
**Nguồn gốc:** AWS Auto Scaling ra mắt năm 2006 cùng EC2; khái niệm elastic computing phổ biến từ đó.
**Giải quyết thế nào:** Đặt policy: khi CPU > 70% trong 5 phút thì thêm instance; khi < 30% thì bớt. Kết hợp health check để chỉ route traffic vào instance đã sẵn sàng, và cooldown để tránh scale oscillation.
*Liên quan: horizontal scaling, load balancer, serverless*

### Edge Computing
*còn gọi: điện toán biên*

**Vấn đề khiến nó ra đời:** Camera giao thông phát hiện tai nạn cần phản ứng trong 50ms, nhưng gửi video lên cloud rồi nhận lệnh về mất 300ms — trễ không chấp nhận được. IoT xả hàng GB data mỗi phút thì băng thông gửi hết về cloud cũng không chịu nổi. Edge computing ra đời để xử lý data ngay tại nơi phát sinh.
**Nguồn gốc:** Thuật ngữ xuất hiện từ những năm 1990s để chỉ CDN; được Karim Arabi (Qualcomm) định nghĩa tại keynote IEEE DAC 2014 và seminar MIT 2015.
**Giải quyết thế nào:** Đặt compute và storage gần user/device hơn: edge server (Cloudflare Workers, AWS Lambda@Edge), edge gateway (IoT), hoặc on-premise. Giảm latency, tiết kiệm bandwidth, data nhạy cảm không rời khỏi region (privacy).
*Liên quan: CDN, latency, IoT*

### Event Bus
*còn gọi: tuyến sự kiện, message broker*

**Vấn đề khiến nó ra đời:** Service A cần báo cho B, C, D biết 'đơn hàng đã thanh toán' — nhưng A không nên biết B/C/D là ai (thêm service E thì A phải sửa code). Event bus ra đời để A chỉ publish sự kiện vào một nơi trung gian, ai quan tâm thì tự subscribe.
**Nguồn gốc:** Khái niệm từ event-driven architecture và pub-sub pattern; implementation phổ biến: RabbitMQ (2007), Kafka (LinkedIn, 2011), AWS SNS/SQS, Azure Event Grid.
**Giải quyết thế nào:** Producer publish event vào bus. Bus phân phối cho subscriber đã đăng ký. Subscriber không biết producer và ngược lại. 2 mô hình: pub-sub (fan-out, không lưu) và event streaming (Kafka — log lưu bền, replay được).
*Liên quan: event-driven, orchestration vs choreography, message queue*

### FaaS (Function as a Service)
*còn gọi: hàm như dịch vụ*

**Vấn đề khiến nó ra đời:** Cần chạy logic ngắn (xử lý webhook, transform data, cron job) mà không muốn duy trì một server luôn chạy. FaaS ra đời để mỗi function chạy khi có sự kiện, tự động scale, tắt ngay khi xong.
**Nguồn gốc:** AWS Lambda (2014) là sản phẩm FaaS phổ biến đầu tiên; trước đó có Google App Engine (2008) và PiCloud nhưng chưa đúng nghĩa FaaS.
**Giải quyết thế nào:** Dev viết function với signature nhận event, trả về result. Provider bind function với trigger (HTTP, queue, schedule). Mỗi invocation chạy trong container ephemeral — sinh ra khi có request, chết khi xong (gây cold start).
*Liên quan: serverless, event bus, cold start*

### Modular Monolith
*còn gọi: modularized monolith*

**Vấn đề khiến nó ra đời:** Team muốn có cấu trúc rõ ràng như microservices nhưng chưa sẵn sàng trả giá vận hành hàng chục service (deploy, monitoring, network latency). Modular monolith ra đời để giữ lợi ích của monolith (deploy đơn giản, debug dễ) nhưng có boundary rõ giữa các module để sau này tách ra dễ.
**Nguồn gốc:** Martin Fowler phổ biến khái niệm 'MonolithFirst' (2015); thuật ngữ 'modular monolith' được cộng đồng dùng rộng từ ~2017-2020.
**Giải quyết thế nào:** Chia codebase thành các module có boundary rõ (interface, dependency rule), chạy chung process và DB, nhưng các module giao tiếp qua API nội bộ thay vì gọi trực tiếp hàm.
*Liên quan: monolith, microservices, bounded context*

### Multi-Tenancy
*còn gọi: đa khách hàng, multi-tenant*

**Vấn đề khiến nó ra đời:** SaaS bán phần mềm cho 1000 công ty, nếu mỗi công ty một instance riêng thì tốn 1000 server, 1000 DB, 1000 lần deploy và nâng cấp. Multi-tenancy ra đời để một instance duy nhất phục vụ nhiều customer, chia sẻ tài nguyên nhưng data vẫn phải cô lập.
**Nguồn gốc:** Xuất hiện từ timesharing trên mainframe những năm 1960s; được SaaS (Salesforce, 1999) và cloud computing phổ biến hóa trở lại.
**Giải quyết thế nào:** 3 mô hình: silo (mỗi tenant một DB/instance — cô lập mạnh, đắt), pool (chung tất cả, phân biệt qua tenant_id — hiệu quả nhất, rủi ro noisy neighbor), bridge (hybrid: component nhạy cảm silo, phần còn lại pool).
*Liên quan: cell-based, sharding, SaaS*

### Serverless
*còn gọi: không máy chủ*

**Vấn đề khiến nó ra đời:** Dev viết một function xử lý ảnh upload, nhưng phải lo luôn: provision server, scale khi 10k ảnh cùng lúc, trả tiền cho server chạy 24/7 dù ban đêm không ai upload. Serverless ra đời để dev chỉ quan tâm code, cloud lo phần còn lại và tính tiền theo thời gian thực chạy.
**Nguồn gốc:** Thuật ngữ 'serverless' được Iron.io dùng từ 2012; AWS Lambda ra mắt 13/11/2014 đưa khái niệm vào mainstream.
**Giải quyết thế nào:** Cloud provider quản lý hoàn toàn infrastructure; dev deploy code (function/service) và provider tự scale từ 0 đến hàng ngàn concurrent execution, tính tiền theo số request và thời gian chạy (đến millisecond).
*Liên quan: FaaS, autoscaling, 12-factor app*

### Service Discovery
*còn gọi: khám phá dịch vụ, service registry*

**Vấn đề khiến nó ra đời:** Trong microservices, hàng trăm instance có IP thay đổi liên tục (autoscaling, restart, deploy). Hard-code IP vào config là không thể bảo trì. Service discovery ra đời để các service tự tìm ra nhau qua registry trung tâm.
**Nguồn gốc:** Netflix open-source Eureka năm 2012; các hệ thống trước đó dùng Zookeeper (Yahoo, 2006). Consul (HashiCorp) và etcd (CoreOS) ra đời ~2014. DNS cũ quá chậm (TTL cao) cho môi trường dynamic.
**Giải quyết thế nào:** Mỗi service khi khởi động đăng ký IP+port vào registry. Client hoặc sidecar query registry để lấy danh sách instance sống, tự cập nhật khi có instance chết/mới, kết hợp health check để tránh route vào instance hỏng.
*Liên quan: load balancer, sidecar, service mesh*

## Độ tin cậy & Quan sát được

### Alert Fatigue
*còn gọi: alert_fatigue, pager_fatigue, mệt mỏi vì cảnh báo, alarm fatigue, cảnh báo nhiễu*

**Vấn đề khiến nó ra đời:** Quá nhiều alert nhiễu khiến engineer bỏ qua hoặc trì hoãn phản hồi, làm kéo dài outage.
**Nguồn gốc:** Google SRE Book - Chapter 6/10 (Monitoring, Practical Alerting)
**Giải quyết thế nào:** Giảm noise: alert trên symptoms (triệu chứng người dùng cảm nhận) thay vì causes, tránh 'something weird', ưu tiên signal-to-noise cao, dashboard cho non-critical, paging chỉ cho vấn đề cần can thiệp ngay.
*Liên quan: on_call, four_golden_signals, burn_rate, Alerting (threshold alert), On-call rotation, Four golden signals*

### APM
*còn gọi: application performance monitoring, giám sát hiệu năng ứng dụng*

**Vấn đề khiến nó ra đời:** Metric host (CPU, RAM) lên 100% không cho biết code nào chậm: team cần nhìn tới từng request lẻ — query SQL nào tốn time, call API ngoài nào treo, dòng code nào chiếm phần lớn latency — điều metric hạ tầng không bao giờ hiện.
**Nguồn gốc:** không rõ
**Giải quyết thế nào:** Instrument ở tầng ứng dụng (DB query, cache, external call, transaction) rồi gom dữ liệu theo transaction để drill-down từ symptom (endpoint chậm) xuống nguyên nhân (query N+1).
*Liên quan: Distributed tracing, Four golden signals, Metrics (time-series)*

### Black-box vs white-box monitoring
*còn gọi: giám sát đen hộp, giám sát trắng hộp, synthetic monitoring*

**Vấn đề khiến nó ra đời:** Chỉ watch metric nội bộ (white-box) thì không phát hiện được 'service vẫn alive nhưng user không đăng nhập được' vì sai config/response; chỉ probe từ ngoài (black-box) thì không thấy trước được failure sắp xảy ra và không có dữ liệu chẩn đoán.
**Nguồn gốc:** Google SRE book, chương 6 (2017)
**Giải quyết thế nào:** Dùng cả hai: white-box (metric/log/profile) cho early warning và chẩn đoán; black-box + synthetic probe (đăng nhập/tạo đơn định kỳ như user thật) để đo đúng symptom người dùng cảm nhận.
*Liên quan: Health check (/health, /ready), Four golden signals, Synthetic monitoring*

### Blameless Postmortem
*còn gọi: blameless_postmortem, báo cáo sau sự cố không đổ lỗi, postmortem, học hỏi từ sự cố*

**Vấn đề khiến nó ra đời:** Văn hóa đổ lỗi (blame) làm người tham gia che giấu sự thật, ngăn chặn học hỏi tổ chức.
**Nguồn gốc:** Google SRE Book - Chapter 15 (Postmortem Culture); healthcare/avionics safety culture
**Giải quyết thế nào:** Tập trung vào contributing causes (nguyên nhân góp phần), không quy tội cá nhân/nhóm. Giả định thiện chí, tập trung vào hệ thống/process/thông tin thiếu để rút ra action items có thể thực thi.
*Liên quan: postmortem, incident_management, learning_culture, On-call rotation, Toil, Alert fatigue*

### Context propagation & Correlation ID
*còn gọi: trace context, traceparent header, correlation ID, truyền ngữ cảnh*

**Vấn đề khiến nó ra đời:** Trace chỉ ghép được nếu service downstream nhận trace_id từ upstream; nếu mỗi service tự sinh ID riêng, hoặc header bị proxy/message queue làm mất, trace đứt thành nhiều mảnh vô dụng — cũng không nối được log của cùng một request qua 8 service.
**Nguồn gốc:** không rõ (chuẩn W3C Trace Context; không verify được năm Recommendation)
**Giải quyết thế nào:** Đính kèm trace_id/parent_id vào HTTP header (chuẩn W3C traceparent) hoặc message property, đọc lại ở cửa vào và kế thừa khi gọi tiếp; correlation ID tương tự để join toàn bộ log của một request.
*Liên quan: Distributed tracing, Structured logging, OpenTelemetry*

### Distributed tracing
*còn gọi: trace phân tán, phân bố trace, distributed trace, trace/span*

**Vấn đề khiến nó ra đời:** Request từ user đi gateway → auth → order → payment → DB, mỗi service ghi log riêng với clock lệch nhau; khi request chậm 2 giây không ai biết bottleneck ở đâu vì log của từng service không nối được với nhau, log grep không nói được 'cái này gọi cái kia'.
**Nguồn gốc:** Google Dapper (Sigelman và cộng sự, 2010)
**Giải quyết thế nào:** Mỗi service tự tạo span (start/end, metadata) và nối vào chung trace_id; toàn bộ cây gọi + thời gian từng bước được gom lại cho thấy chính xác bước nào tốn thời gian và lỗi xảy ra ở đâu.
*Liên quan: Context propagation, OpenTelemetry, APM*

### Error Budget
*còn gọi: error_budget, ngân sách lỗi, error budget policy, ngân sách không ổn định*

**Vấn đề khiến nó ra đời:** Xung đột giữa phát triển (tốc độ) và ổn định (độ tin cậy) cần được giải quyết có hệ thống.
**Nguồn gốc:** Google SRE Book - Chapter 1 (Introduction)
**Giải quyết thế nào:** Error budget = 1 - SLO (ví dụ: SLO 99.9% -> budget 0.1% downtime/failed requests). Khi budget còn nhiều, có thể đổi mới nhanh hơn; khi gần hết, ưu tiên ổn định.
*Liên quan: SLO, burn_rate, availability, SLO/SLI, Availability Math (Five Nines), Chaos Engineering, Load Testing, SLI / SLO, Burn rate multiwindow alerting, Alerting (threshold alert)*

### Grafana Loki
*còn gọi: Loki, log aggregation kiểu Prometheus*

**Vấn đề khiến nó ra đời:** ELK index full-text rất mạnh nhưng chi phí lưu trữ/cluster Elasticsearch phình khi log chạm hàng TB/ngày; nhiều team chỉ cần tra log theo service/pod trong vài ngày gần, không cần full-text search mọi thứ.
**Nguồn gốc:** Grafana Labs (năm ra mắt không verify được)
**Giải quyết thế nào:** Loki chỉ index metadata (labels) chứ không index nội dung log, giữ log nén thô trong object storage và filter khi query — chi phí thấp hơn đáng kể, mô hình nhãn + query language (LogQL) giống Prometheus.
*Liên quan: Log aggregation & ELK Stack, Prometheus scrape model, Metric cardinality*

### Health Check
*còn gọi: health_check, liveness_probe, readiness_probe*

**Vấn đề khiến nó ra đời:** Load balancer/orchestrator cần phân biệt service bị treo (hung) vs đang khởi động/chưa sẵn sàng nhận traffic.
**Nguồn gốc:** Google SRE Book; Kubernetes probe semantics (common practice)
**Giải quyết thế nào:** Shallow/deep health check. Liveness: service còn sống (có thể restart nếu fail). Readiness: sẵn sàng nhận traffic (dependencies ready). Giúp graceful shutdown/drain và tránh route traffic tới instance chưa sẵn sàng.
*Liên quan: graceful_shutdown, service_discovery, load_balancing*

### Incident Management
*còn gọi: incident_response*

**Vấn đề khiến nó ra đời:** Cần cơ cấu phối hợp rõ ràng khi sự cố xảy ra để giảm MTTR và tránh hỗn loạn.
**Nguồn gốc:** Google SRE Book - Chapter 13/14 (Emergency Response, Managing Incidents)
**Giải quyết thế nào:** Quy trình có cấu trúc: declare incident, establish incident commander, comms/updates, mitigation, resolution, post-incident review. Ưu tiên stabilize trước, xác định root sau.
*Liên quan: on_call, postmortem, MTTR*

### Metric cardinality
*còn gọi: high-cardinality label, độ lớn số label*

**Vấn đề khiến nó ra đời:** Dev gắn user_id/email làm label cho metric 'HTTP requests' → mỗi user một time series riêng; hệ thống 100k user sinh 100k series cho mỗi metric, Prometheus RAM/disk phình, query chậm, thậm chí OOM. Cardinality không kiểm soát là nguyên nhân kinh điển làm sập monitoring stack.
**Nguồn gốc:** không rõ (hướng dẫn thực hành trong tài liệu Prometheus về naming/labels)
**Giải quyết thế nào:** Chỉ dùng label có tập giá trị hữu hạn và nhỏ (method, status, stage, service); giá trị không biên (user_id, email, request_id) phải để sang log/trace hoặc exemplar — mỗi tổ hợp label = một series mới nên mọi thứ vô hạn đều cấm.
*Liên quan: Prometheus scrape model, Observability, Metrics (time-series)*

### Metric Types
*còn gọi: counter, gauge, histogram, native_histogram*

**Vấn đề khiến nó ra đời:** Cần phân loại metric đúng để tránh diễn giải sai (giá trị tăng/giảm, phân phối).
**Nguồn gốc:** Prometheus Documentation - Metric Types
**Giải quyết thế nào:** Counter: tăng đơn điệu, reset khi restart (requests). Gauge: lên/xuống (memory, concurrent). Histogram: quan sát phân phối theo bucket + sum + count (latency). Native histogram hiệu quả hơn classic.
*Liên quan: metrics, Prometheus, histogram*

### Observability
*còn gọi: tính quan sát được, observability vs monitoring, unknown-unknowns*

**Vấn đề khiến nó ra đời:** Microservices + container + polyglot storage tạo ra trạng thái hệ thống chưa từng thấy (unknown-unknowns); dashboard chỉ trả lời câu hỏi đặt sẵn,gặp sự cố lạ dev phải đoán, redeploy thêm log rồi chờ chu kỳ mới — sửa lỗi chậm và mù tịt (developer mất >40% thời gian cho công việc không hiệu quả).
**Nguồn gốc:** Charity Majors (Honeycomb), 'Observability is a many-splendored thing' (3/3/2020); gốc từ lý thuyết điều khiển (control theory)
**Giải quyết thế nào:** Thu thập event giàu ngữ cảnh quanh path của request (mỗi service một event rộng, nhiều dimension) để tự do cắt lát/bắt chước mọi câu hỏi mà không cần đoán trước; metrics/logs/traces chỉ là loại dữ liệu — observability là khả năng trả lời câu hỏi chưa từng đặt ra, cần data high-cardinality/high-dimensionality.
*Liên quan: Metric cardinality, Monitoring, Structured logging*

### On-call
*còn gọi: on_call_rotation*

**Vấn đề khiến nó ra đời:** Phản ứng kịp thời khi sự cố xảy ra mà vẫn bảo vệ wellbeing của nhân viên.
**Nguồn gốc:** Google SRE Book - Chapter 11 (Being On-Call)
**Giải quyết thế nào:** Rotation có định nghĩa rõ ràng, paging dựa trên symptom (alert on symptoms) để giảm noise, có ngưỡng alert hợp lý, tránh alert fatigue. Tập trung vào việc can thiệp có ý nghĩa.
*Liên quan: alert_fatigue, pager_fatigue, incident_management*

### OpenTelemetry
*còn gọi: OTel*

**Vấn đề khiến nó ra đời:** Thiếu chuẩn mở để thu thập traces/metrics/logs, dẫn đến vendor lock-in.
**Nguồn gốc:** OpenTelemetry Project (merger of OpenTracing + OpenCensus)
**Giải quyết thế nào:** SDK/API chuẩn để instrument, thu thập và xuất (export) signals (traces, metrics, logs) với context propagation mặc định (W3C traceparent).
*Liên quan: trace, metrics, logs, sampling*

### OpenTelemetry (OTel)
*còn gọi: OTel, OTLP, OpenTelemetry SDK*

**Vấn đề khiến nó ra đời:** Mỗi vendor (Datadog, Jaeger, Zipkin, New Relic) có API instrumentation riêng; team phải viết lại code mỗi lần đổi công cụ, mỗi ngôn ngữ một kiểu hook, instrumentation rải rác và đủ thứ bị kẹp vào một backend duy nhất (lock-in).
**Nguồn gốc:** CNCF — công bố sáp nhập OpenTracing + OpenCensus ngày 21/5/2019
**Giải quyết thế nào:** Framework trung gian chuẩn hóa: app instrument một lần theo API/SDK OTel, export qua giao thức OTLP → collector/router chuyển tiếp tới backend bất kỳ; sinh ra từ việc sáp nhập hai dự án cùng giải quyết một vách ngăn chuẩn hóa.
*Liên quan: Distributed tracing, Context propagation, OpenTelemetry Collector*

### Postmortem
*còn gọi: incident_postmortem*

**Vấn đề khiến nó ra đời:** Incident xảy ra lại nếu không có quá trình học hỏi có cấu trúc sau sự cố.
**Nguồn gốc:** Google SRE Book - Chapter 15 (Postmortem Culture)
**Giải quyết thế nào:** Tài liệu sau incident: timeline, impact, root/contributing causes, mitigation, action items, lessons learned. Cần có tiêu chí kích hoạt postmortem rõ ràng trước khi sự cố xảy ra.
*Liên quan: blameless_postmortem, incident_management, runbook*

### Prometheus Pull Model
*còn gọi: pull_model, prometheus_scrape*

**Vấn đề khiến nó ra đời:** Cần cơ chế thu thập metric an toàn, dễ discovery, tránh bị flood từ nhiều nguồn.
**Nguồn gốc:** Prometheus Project - Overview (SoundCloud 2012, CNCF since 2016)
**Giải quyết thế nào:** Prometheus chủ động scrape (pull) metrics từ HTTP endpoints (/metrics). Ưu điểm: dễ kiểm soát, service discovery (static/k8s), autonomous per-server. Push hỗ trợ qua Pushgateway.
*Liên quan: metrics, Prometheus, time_series*

### Prometheus scrape model (pull)
*còn gọi: pull model, scrape, mô hình kéo metrics, endpoint /metrics*

**Vấn đề khiến nó ra đời:** Với push, mỗi service phải biết địa chỉ collector và tự gửi metric; service chết thì mất luôn dữ liệu báo nó chết, và kiến trúc dynamic (pod đổi IP liên tục, tự nhân bản) khiến việc cấu hình push target ở khắp nơi thành hỗn loạn.
**Nguồn gốc:** SoundCloud, khởi đầu năm 2012; gia nhập CNCF năm 2016 (dự án thứ hai sau Kubernetes)
**Giải quyết thế nào:** Prometheus chủ động pull (scrape) endpoint /metrics theo danh sách target khám phá được; target chết → series biến mất hoặc up==0 chính là tín hiệu. Metric chỉ là số + label, query qua PromQL, lưu cục bộ từng node nên không phụ thuộc storage tập trung lúc outage.
*Liên quan: Metrics (time-series), Metric cardinality, Exemplars*

### RED Method
*còn gọi: RED, Rate-Errors-Duration, phương pháp RED*

**Vấn đề khiến nó ra đời:** Cần triết lý giám sát tập trung cho microservices, dễ áp dụng nhất quán.
**Nguồn gốc:** Tom Wilkie (Grafana Labs) - RED Method, 2015
**Giải quyết thế nào:** Rate (số request/giây), Errors (số request thất bại), Duration (thời gian xử lý phân phối). Tập trung vào trải nghiệm người dùng (request-based).
*Liên quan: four_golden_signals, USE_method, latency, USE method, Four golden signals, SLI / SLO*

### RPO
*còn gọi: Recovery Point Objective*

**Vấn đề khiến nó ra đời:** Cần xác định mức độ mất dữ liệu có thể chấp nhận được để chọn chiến lược DR phù hợp.
**Nguồn gốc:** AWS Disaster Recovery Whitepapers
**Giải quyết thế nào:** RPO là thời gian tối đa dữ liệu có thể mất (tolerable data loss). Ví dụ RPO 1h nghĩa là có thể mất dữ liệu tối đa 1 giờ. Ảnh hưởng trực tiếp đến tần suất backup/replication.
*Liên quan: RTO, disaster_recovery, backup_restore*

### RTO
*còn gọi: Recovery Time Objective*

**Vấn đề khiến nó ra đời:** Cần xác định thời gian phục hồi tối đa chấp nhận được để cân bằng cost vs resilience.
**Nguồn gốc:** AWS Disaster Recovery Whitepapers
**Giải quyết thế nào:** RTO là thời gian tối đa để phục hồi dịch vụ sau disaster. Xác định chiến lược DR (Backup/Restore -> Pilot Light -> Warm Standby -> Active-Active).
*Liên quan: RPO, disaster_recovery, pilot_light*

### Sampling
*còn gọi: trace_sampling*

**Vấn đề khiến nó ra đời:** Volume telemetry quá lớn làm tăng chi phí mà vẫn cần giữ tính đại diện (representativeness).
**Nguồn gốc:** OpenTelemetry Concepts - Sampling
**Giải quyết thế nào:** Chọn tập con trace đại diện để xử lý/xuất, giảm chi phí mà vẫn có khả năng phân tích. Cần cân nhắc representativeness, rule domain-specific và ngân sách observability.
*Liên quan: head_based_sampling, tail_based_sampling, cardinality*

### SLI / SLO
*còn gọi: service level indicator, service level objective, mức cam kết dịch vụ*

**Vấn đề khiến nó ra đời:** Không có con số thống nhất cho 'nhanh là bao nhiêu, ổn là bao nhiêu': mỗi lần tranh luận làm feature hay vá độ ổn định chỉ là cảm tính; business hứa 99.99% với khách nhưng kỹ thuật không biết mình đang ở đâu và cái gì quan trọng nhất.
**Nguồn gốc:** Google SRE Workbook, chương 2 'Implementing SLOs' (2018)
**Giải quyết thế nào:** SLI = tỷ số đo được (requests tốt/tổng, latency dưới ngưỡng/tổng), SLO = mục tiêu (99.9% trong 30 ngày) đặt KHÔNG quá sát cam kết với khách, làm thước đo chung cho mọi quyết định ưu tiên.
*Liên quan: Error budget, Burn rate multiwindow alerting, RED method*

### Span
*còn gọi: span_id*

**Vấn đề khiến nó ra đời:** Cần đơn vị đo lường thời gian và ngữ cảnh cho từng thao tác trong trace.
**Nguồn gốc:** OpenTelemetry Project
**Giải quyết thế nào:** Span là đơn vị công việc trong trace (operation name, start/end time, attributes, events, status). Liên kết parent-child tạo thành cây causal.
*Liên quan: trace, traceparent, OpenTelemetry*

### Toil
*còn gọi: công việc vận hành thủ công, toil vận hành*

**Vấn đề khiến nó ra đời:** Công việc vận hành lặp lại, thủ công làm tiêu tốn thời gian SRE, giảm khả năng tập trung vào việc bền vững.
**Nguồn gốc:** Google SRE Book - Chapter 5 (Eliminating Toil)
**Giải quyết thế nào:** Toil là công việc vận hành sản xuất mang tính thủ công, lặp lại, có thể tự động hóa, mang tính chiến thuật, không giá trị bền vững và tỷ lệ tuyến tính theo quy mô dịch vụ. Phân biệt với overhead/engineering work có giá trị lâu dài.
*Liên quan: automation, postmortem, on_call, On-call rotation, Alert fatigue, Blameless postmortem*

### Trace
*còn gọi: distributed_trace*

**Vấn đề khiến nó ra đời:** Cần theo dõi yêu cầu xuyên qua nhiều service trong hệ thống phân tán để gỡ lỗi hiệu quả.
**Nguồn gốc:** OpenTelemetry Project; W3C Trace Context Working Group
**Giải quyết thế nào:** Trace là cây các span mô tả hành trình end-to-end của một request xuyên qua các service/process/network boundary, cho phép phân tích nguyên nhân gốc rễ.
*Liên quan: span, traceparent, OpenTelemetry*

### USE Method
*còn gọi: USE, Utilization-Saturation-Errors, phương pháp USE*

**Vấn đề khiến nó ra đời:** Cần checklist để giám sát tài nguyên hệ thống (CPU/memory/disk/network) một cách nhất quán.
**Nguồn gốc:** Brendan Gregg - Performance Analysis Methodology (USE Method)
**Giải quyết thế nào:** Utilization (% thời gian tài nguyên bận), Saturation (mức độ công việc chờ/xử lý, queue), Errors (số sự kiện lỗi tài nguyên). Tập trung vào resource-level.
*Liên quan: four_golden_signals, RED_method, saturation, RED method, Four golden signals, Metrics (time-series)*

## Bền vững & Chị tải

### Bottleneck Analysis
*còn gọi: phát hiện nút thắt, performance bottleneck*

**Vấn đề khiến nó ra đời:** Scale sai chỗ: thêm CPU nhưng vẫn chậm vì I/O/DB/connection.
**Giải quyết thế nào:** Tìm resource giới hạn: theo dõi CPU, memory, network, disk I/O, DB query time, connection pool usage, queue depth. Dùng Amdahl's Law, flame graph, tracing (distributed tracing), log correlation. Focus vào resource có utilization cao nhất kèm latency tăng.
*Liên quan: Capacity Planning, Load Testing, Little's Law*

### Bulk Sync
*còn gọi: đồng bộ hàng loạt, batch sync, delta sync*

**Vấn đề khiến nó ra đời:** Sync từng item 1-1 gây nhiều request nhỏ → quá tải network/DB.
**Giải quyết thế nào:** Gom nhiều thay đổi vào 1 request (batch) để giảm round-trip. Có thể dùng delta sync (chỉ sync thay đổi từ cursor) thay vì full sync. Cần xử lý partial failure, idempotency, backpressure khi batch quá lớn.
*Liên quan: Graceful Degradation, Retry, Queue Backpressure*

### Bulkhead
*còn gọi: vách kín, bulkhead isolation, cell-based architecture*

**Vấn đề khiến nó ra đời:** Một dependency chậm/hỏng ăn hết connection pool hoặc thread pool dùng chung, khiến các service khác khỏe mạnh cũng không gọi được.
**Nguồn gốc:** Lấy tên từ vách kín tàu thủy (hull section chỉ ngập phần bị thủng); được tài liệu hóa trong sách 'Release It!' (Michael Nygard) và Azure Architecture Center pattern 'Bulkhead'.
**Giải quyết thế nào:** Chia tài nguyên (thread pool, connection pool, container, queue) thành từng nhóm biệt lập cho từng dependency/tenant: dependency A chết chỉ làm pool của A đầy, pool B/C vẫn chạy. Chi phí là ít dùng chung tài nguyên hơn; thường kết hợp với circuit breaker + retry.
*Liên quan: Circuit Breaker, Connection Pool Sizing, Thread Pool Sizing*

### Capacity Planning
*còn gọi: lập kế hoạch dung lượng, capacity forecast*

**Vấn đề khiến nó ra đời:** Không dự trù dung lượng → sập giờ cao điểm; over-provision quanh năm → lãng phí.
**Giải quyết thế nào:** Dự báo traffic → quy đổi resource (CPU, IOPS, connection, bandwidth) → so với capacity hiện tại + headroom; kết hợp load test để đo điểm bão hòa thật.
*Liên quan: Load Testing, Autoscaling (Horizontal/Vertical), Bottleneck Analysis, Little's Law*

### Connection Pool Sizing
*còn gọi: kích thước connection pool, DB pool*

**Vấn đề khiến nó ra đời:** Pool quá nhỏ → thread chờ DB; pool quá lớn → DB quá tải, tạo nhiều connection đồng thời.
**Giải quyết thế nào:** Tối ưu dựa trên (DB max connections) và (concurrent queries service cần). Công thức tham khảo: max_pool_size ≈ (threads_per_instance × instances) nhưng giới hạn bởi DB. Theo HikariCP best practice: tránh max pool quá lớn; quan sát wait time. Kết hợp với circuit breaker khi DB chậm.
*Liên quan: Thread Pool Sizing, Bulkhead, Timeout*

### Cooldown
*còn gọi: scaling cooldown, cooldown period, thời gian làm nguội*

**Vấn đề khiến nó ra đời:** Autoscaler phản ứng trước khi effect của lần scale trước kịp hiện ra → thrash liên tục.
**Nguồn gốc:** AWS EC2 Auto Scaling documentation: cooldown period mặc định 300 giây (5 phút); AWS khuyên chuyển sang target tracking/step scaling (dùng instance warmup thay cooldown).
**Giải quyết thế nào:** Sau khi launch/terminate instance, autoscaler dừng mọi scaling activity simple-scaling trong khoảng cooldown để cluster ổn định. Scale-in có thể dùng cooldown ngắn hơn; nếu đứng sau ELB thì ELB hoàn tất connection draining trước khi cooldown bắt đầu.
*Liên quan: Autoscaling (Horizontal/Vertical), Connection Draining, Graceful Shutdown*

### Drain Connections
*còn gọi: rút kết nối, connection draining, deregistration*

**Vấn đề khiến nó ra đời:** Endpoint bị loại khỏi load balancer ngay nhưng kết nối đã mở vẫn bị client thấy lỗi.
**Nguồn gốc:** Kubernetes Services + ELB/ALB thực hành connection draining.
**Giải quyết thế nào:** Trước khi dừng process: ngừng accept connection mới (kết nối với LB), hoàn tất request đang xử lý, đóng keep-alive, đợi endpoint propagation. ELB có connection draining timeout (mặc định 300s) để đảm bảo kết nối cũ hoàn tất.
*Liên quan: Graceful Shutdown, Zombe Connection, Cooldown*

### Fault Injection
*còn gọi: tiêm lỗi, chaos injection*

**Vấn đề khiến nó ra đời:** Không chủ động tạo lỗi khó biết phản ứng hệ thống thực tế.
**Giải quyết thế nào:** Chủ động gây ra lỗi có kiểm soát (kill process, thêm latency, drop packet, auth fail) để xác minh circuit breaker, fallback, retry hoạt động đúng. Thường là công cụ trong chaos engineering.
*Liên quan: Chaos Engineering, Circuit Breaker, Graceful Shutdown*

### Graceful Degradation
*còn gọi: suy giảm duyên dáng, degraded mode, degraded response*

**Vấn đề khiến nó ra đời:** Khi một thành phần hỏng, trả nguyên trang lỗi 500 cho user tệ hơn nhiều so với bớt đi một tính năng phụ.
**Giải quyết thế nào:** Chủ động bỏ/thay thế các tính năng không cốt lõi khi hệ thống gặp sức ép hoặc dependency hỏng: serve dữ liệu cũ/ít chính xác hơn, tắt recommend, bật trang tĩnh — giữ lõi chức năng chạy được. SRE Book ch.21-22 coi 'serve degraded responses' là công cụ chống quá tải chính.
*Liên quan: Fallback, Circuit Breaker, Load Shedding, Bulk Sync*

### Graceful Shutdown
*còn gọi: tắt từ từ, graceful stop*

**Vấn đề khiến nó ra đời:** Dừng Pod/instance đột ngột làm mất in-flight request, connection bị reset.
**Nguồn gốc:** Kubernetes Pod lifecycle: default terminationGracePeriodSeconds 30s.
**Giải quyết thế nào:** Pod nhận SIGTERM, chạy preStop hook (thường sleep để endpoint propagation), server ngừng accept request mới, hoàn tất in-flight request, rồi exit. Sau grace period hết mà chưa exit → SIGKILL.
*Liên quan: Drain Connections, Cooldown, Deadline Propagation*

### Latency SLO
*còn gọi: p50/p90/p95/p99 SLO, tail latency SLO*

**Vấn đề khiến nó ra đời:** Chỉ đo trung bình latency che giấu trải nghiệm tệ nhất của user.
**Nguồn gốc:** Google SRE Book nhấn mạnh đo tail (p90/p99) vì slowest requests thường là user quan trọng nhất.
**Giải quyết thế nào:** Xác định SLO theo percentile (VD: 99% < 300ms, 99.9% < 1s) dựa trên user journey. Theo dõi p50/p95/p99/p99.9 và lỗi tỷ lệ vượt SLO.
*Liên quan: Tail Latency, SLO/SLI, Availability Math (Five Nines)*

### Load Shedding
*còn gọi: cắt tải, shed load, reject excess traffic*

**Vấn đề khiến nó ra đời:** Quá tải: nếu nhận hết rồi xếp hàng, độ trễ phình vô hạn, thread chết hết và toàn bộ service sập thay vì chỉ mất phần dư.
**Nguồn gốc:** Thuật ngữ gốc từ lưới điện (cắt tải khẩn cấp khi cầu vượt cung — Under-frequency load shedding); Google SRE Book ch.21-22 (2016) áp dụng cho server với criticality levels SHEDDABLE_PLUS/SHEDDABLE.
**Giải quyết thế nào:** Khi tín hiệu utilization (CPU, active threads) vượt ngưỡng, server từ chối ngay phần request dư thay vì buffer: drop theo mức ưu tiên thấp nhất trước (sheddable trước critical), trả 429/503 kèm Retry-After. Mục tiêu: throughput ổn định ở mức xử lý được, latency không phình.
*Liên quan: Overload Protection, Shed Load vs Queue, Rate Limiting (Adaptive), Graceful Degradation*

### MTTR/MTBF
*còn gọi: mean time to repair, mean time between failures, mean time to detect*

**Vấn đề khiến nó ra đời:** Đo lường độ tin cậy hệ thống: thời gian phục hồi vs thời gian giữa các sự cố.
**Nguồn gốc:** Reliability engineering, gắn liền với MIL-HDBK tiêu chuẩn quân sự/hàng không vũ trụ.
**Giải quyết thế nào:** MTBF = trung bình thời gian giữa hai lần hỏng (càng lớn càng tốt). MTTR = trung bình thời gian phát hiện + sửa để phục hồi (càng nhỏ càng tốt). Availability ≈ MTBF/(MTBF+MTTR). MTTA (time to acknowledge) cũng quan trọng không kém MTTR.
*Liên quan: Availability Math (Five Nines), Error Budget, SLO/SLI*

### Overload Protection
*còn gọi: bảo vệ quá tải, admission control*

**Vấn đề khiến nó ra đời:** Không kiểm soát admission → service tiếp nhận nhiều hơn khả năng xử lý → sập hoàn toàn.
**Giải quyết thế nào:** Áp dụng admission control: từ chối request sớm tại edge/LB/API gateway dựa trên utilization, queue depth, active requests. Kết hợp rate limiting adaptive, load shedding, circuit breaker. Ưu tiên critical request trước shedable.
*Liên quan: Load Shedding, Rate Limiting (Adaptive), Circuit Breaker, Retry Budget*

### Queue Backpressure
*còn gọi: áp lực ngược hàng đợi, bounded queue, queue-full policy*

**Vấn đề khiến nó ra đời:** Hàng đợi không giới hạn luôn nhận thêm message trong khi producer nhanh hơn consumer, đến lúc OOM hoặc latency queue tăng lớn.
**Giải quyết thế nào:** Hàng đợi có giới hạn cứng; khi đầy, hành vi tường minh: block producer, drop (mới nhất/cũ nhất), hay trả lỗi — không bao giờ grow vô hạn. Kết hợp tín hiệu từ consumer lên producer để producer tự chậm lại; hàng đợi nhỏ giúp load shed sớm.
*Liên quan: Backpressure (Reactive), Shed Load vs Queue, Head-of-Line Blocking*

### Rate Limiting (Adaptive)
*còn gọi: giới hạn lưu lượng thích nghi, adaptive throttling, client-side throttling, token bucket rate limit*

**Vấn đề khiến nó ra đời:** Rate limit tĩnh (số request/giây) không biết backend đang yếu: giữ nguyên hạn mức trong lúc backend chậm lại thì càng đẩy nó chết thêm.
**Nguồn gốc:** Google SRE Book ch.21 'Handling Overload' (2016): client-side adaptive throttling theo tỷ lệ requests/accepts (hệ số K, hay dùng 2×), cộng per-customer limits và overload priority (CRITICAL/SHEDDABLE).
**Giải quyết thế nào:** Giới hạn dựa trên tín hiệu phản hồi từ hệ thống: client đếm số attempt và số accepted trong cửa sổ trượt; khi attempts vượt K×accepts thì bắt đầu drop probabilistic local (không gửi lên). Mức giới hạn tự nới/thắt theo capacity thật; có thể cộng token bucket giữ rate retry ổn định.
*Liên quan: Retry Budget, Load Shedding, Overload Protection, Circuit Breaker*

### Replication Lag Tolerance
*còn gọi: read-after-write consistency, replica lag, eventual consistency*

**Vấn đề khiến nó ra đời:** Đọc từ replica có thể thấy dữ liệu cũ sau khi ghi master (replication lag) gây hiển thị sai cho user.
**Giải quyết thế nào:** Có nhiều mức nhất quán: strong consistency (đọc luôn mới nhất, tốn độ trễ), read-after-write (user ghi xong đọc lại thấy mới nhất), monotonic reads, eventual consistency (cuối cùng đồng bộ). Cần chọn theo use case (cart/checkout cần mạnh hơn newsfeed).
*Liên quan: Quorum Read/Write, Redundancy/N+1 Redundancy*

### Shed Load vs Queue
*còn gọi: shed vs queue, drop vs buffer*

**Vấn đề khiến nó ra đời:** Chọn giữa xếp hàng (buffer) và từ chối ngay (shed) khi quá tải.
**Nguồn gốc:** Google SRE Book ch.22: 'small queues relative to thread counts' giúp reject sớm thay vì buffer lâu.
**Giải quyết thế nào:** Buffer phù hợp khi burst ngắn và có thể phục hồi nhanh; shed phù hợp khi overload kéo dài — giữ latency ổn định bằng cách từ chối dư thay vì phình queue. Quy tắc thực tế: queue nhỏ + rejection sớm tốt hơn queue lớn + chờ vô hạn.
*Liên quan: Load Shedding, Queue Backpressure, Head-of-Line Blocking*

### Stampeding Herd
*còn gọi: cache stampede, dogpile, hot key stampede*

**Vấn đề khiến nó ra đời:** Key hot trong cache hết hạn đúng 1 thời điểm → hàng nghìn request cùng đi đập vào backend tính lại.
**Giải quyết thế nào:** Khác với thundering herd: tập trung trên cache/key. Xử lý: jitter expiration, lock/single-flight cho key đang tính, stale-while-revalidate (trả giá trị cũ trong khi refresh), pre-warm trước TTL.
*Liên quan: Thundering Herd, Rate Limiting (Adaptive)*

### Thread Pool Sizing
*còn gọi: kích thước thread pool, executor pool*

**Vấn đề khiến nó ra đời:** Thread pool quá nhỏ → request xếp hàng lâu; quá lớn → context switch nhiều, memory cao.
**Giải quyết thế nào:** Tính theo loại workload: CPU-bound → ~number of cores; I/O-bound → cores × (1 + wait_time/service_time). Dùng queue bounded thay vì unbounded. Theo SRE ch.22: 'small queues relative to thread counts' giúp reject sớm. Monitor queue depth, active threads.
*Liên quan: Connection Pool Sizing, Bulkhead, Queue Backpressure*

### Zombie Connection
*còn gọi: kết nối ma, half-closed connection, stuck connection*

**Vấn đề khiến nó ra đời:** Client vẫn nghĩ kết nối mở trong khi server đã tắt → timeout/retry lan truyền.
**Giải quyết thế nào:** Xảy ra khi server đóng không đúng cách (không gửi FIN, process exit ngay), LB/endpoint cập nhật chậm, hoặc long-lived connection (WebSocket/gRPC) tồn tại sau khi listener đóng. Khắc phục: preStop sleep, server shutdown tuần tự (stop accepting → finish active → close idle), use keepalive + idle timeout.
*Liên quan: Drain Connections, Graceful Shutdown, Timeout*

## Bảo mật & Xác thực

### ABAC
*còn gọi: Attribute-Based Access Control*

**Vấn đề khiến nó ra đời:** RBAC cứng khi cần quy tắc phức tạp (thời gian, IP, tài sản cụ thể). Cần đánh giá dựa trên attributes (user/resource/environment).
**Nguồn gốc:** NIST ABAC model
**Giải quyết thế nào:** Policy đánh giá attributes: user.department==resource.ownerDept AND time in range. Linh hoạt hơn RBAC nhưng phức tạp hơn.
*Liên quan: RBAC, permission model*

### ABAC (Attribute-Based Access Control)
*còn gọi: phân quyền theo thuộc tính*

**Vấn đề khiến nó ra đời:** RBAC bế tắc khi quyền phụ thuộc ngữ cảnh động: 'chỉ sửa document của phòng mình VÀ đang là draft VÀ trong giờ hành chính VÀ từ IP công ty' — mỗi biến thể thêm một role, cuối cùng role nổ tung (role explosion) và không biểu diễn được điều kiện thời gian/địa điểm/giá trị số.
**Nguồn gốc:** Khái niệm cũ nhưng được NIST Systematized qua dự án ABAC (NIST SP 800-162); chuẩn XACML của OASIS
**Giải quyết thế nào:** Đánh giá policy trên tập thuộc tính của subject, object, action và environment (giờ, IP, mức độ rủi ro) thay vì role cố định — policy động, context-aware, biểu diễn được rule phức tạp mà không tạo role mới.
*Liên quan: RBAC, Principle of least privilege*

### API key

**Vấn đề khiến nó ra đời:** Cần đơn giản để gọi API (server-to-server hoặc đơn giản), nhưng nếu chỉ dùng secret cố định trong header, dễ bị rò rỉ (commit code, log). Cần quản lý vòng đời.
**Nguồn gốc:** Early web APIs
**Giải quyết thế nào:** Client gửi API key trong header/query. Đơn giản nhưng thiếu phân quyền chi tiết, khó thu hồi theo user context; nên hạn chế scope, quay vòng key.
*Liên quan: secrets management, key rotation*

### Argon2
*còn gọi: Argon2id, memory-hard hashing*

**Vấn đề khiến nó ra đời:** bcrypt chống được CPU brute-force nhưng là memory-light — GPU/ASIC hàng nghìn core song song đập hash vẫn rẻ hơn mong đợi, vì chúng mạnh về tính toán chứ không về bộ nhớ. Password Hashing Competition 2015 sinh ra để tìm thuật toán khiến phần cứng chuyên dụng (GPU miner) không còn lợi thế.
**Nguồn gốc:** Alex Biryukov, Daniel Dinu, Dmitry Khovratovich (ĐH Luxembourg) — thắng Password Hashing Competition 2015, chuẩn hóa RFC 9106 (9/2021)
**Giải quyết thế nào:** KDF memory-hard: buộc cấp phát mảng bộ nhớ lớn khi băm, tăng chi phí RAM (không chỉ CPU) nên GPU/ASIC không song song được hàng nghìn hash; 3 variant — Argon2id (lai, RFC 9106 khuyến nghị mặc định) cân bằng side-channel resistance và chống GPU.
*Liên quan: bcrypt, Password hashing, Salt*

### authorization code
*còn gọi: authorization code flow*

**Vấn đề khiến nó ra đời:** Cần ủy quyền an toàn nhất cho web app/confidential client. Tránh trả access token thẳng về user agent (trình duyệt) để giảm rò rỉ.
**Nguồn gốc:** RFC 6749
**Giải quyết thế nào:** User được redirect tới authorization server xác thực/đồng ý; server trả code về redirect URI. Client (backend) trao đổi code + client secret với token endpoint để lấy access token. Kết hợp PKCE cho public client.
*Liên quan: OAuth 2.0, PKCE*

### bcrypt/scrypt/argon2

**Vấn đề khiến nó ra đời:** Fast hash (SHA-256/MD5) quá nhanh với GPU/cloud, dễ brute force hàng triệu tỷ lần/giây. Cần password hash chậm, có thể điều chỉnh độ khó.
**Nguồn gốc:** bcrypt (Provos–Mazieres 1999), scrypt (Percival 2009), argon2 (Biryukov et al. 2015, PHC winner)
**Giải quyết thế nào:** bcrypt dùng work factor + Blowfish; scrypt thêm memory hardness chống ASIC/GPU; argon2id cân bằng resistance vs side-channels.
*Liên quan: password hashing, salting, brute force + rate limiting*

### brute force + rate limiting

**Vấn đề khiến nó ra đời:** Attacker có thể thử hàng nghìn password/login liên tục. Cần làm chậm hoặc chặn sau nhiều lần thất bại.
**Nguồn gốc:** Basic account lockout practices
**Giải quyết thế nào:** Rate limit theo IP/account (exponential backoff, sliding window), account lockout tạm thời, CAPTCHA, hoặc dùng login failure tracking. Kết hợp với MFA.
*Liên quan: password hashing, MFA/TOTP*

### certificate
*còn gọi: X.509 certificate, TLS certificate*

**Vấn đề khiến nó ra đời:** Khi dùng asymmetric, làm sao client biết public key nhận được thực sự thuộc về server đúng? Cần chứng chỉ số do CA đáng tin cậy ký.
**Nguồn gốc:** X.509 PKI
**Giải quyết thế nào:** Server có cert chứa public key+domain, ký bởi CA. Client kiểm tra chain of trust tới root CA. Cert hết hạn cần rotation.
*Liên quan: TLS handshake, digital signature, key rotation*

### client credentials

**Vấn đề khiến nó ra đời:** Khi service A cần gọi service B mà không có user context (machine-to-machine), không thể dùng authorization code. Cần flow cho client tự chứng minh để lấy token.
**Nguồn gốc:** RFC 6749 Section 4.4
**Giải quyết thế nào:** Client gửi client_id+client_secret tới token endpoint, nhận access token để gọi resource server.
*Liên quan: OAuth 2.0, mTLS*

### Command injection
*còn gọi: tiêm lệnh shell, OS command injection, shell injection*

**Vấn đề khiến nó ra đời:** Ứng dựng ghép user input vào chuỗi lệnh hệ điều hành (vd: `ping ` + host`) — input `; rm -rf /` hoặc `$(...)` chạy thêm lệnh tùy ý. Khác SQLi chỉ damage database, command injection cho attacker quyền trên toàn server, pivot sang hệ thống nội bộ khác — thông tin đánh giá ở PortSwigger: 'typically leading to full compromise of the application'.
**Nguồn gốc:** không rõ
**Giải quyết thế nào:** Cách duy nhất an toàn là không gọi shell — dùng API/platform function thay thế; nếu bắt buộc thì whitelist input nghiêm ngặt và không bao giờ dựa vào escape ký tự shell (quá dễ bypass).
*Liên quan: SQL injection, Input validation*

### digital signature

**Vấn đề khiến nó ra đời:** Với asymmetric, cần chứng minh ai tạo message và message không bị thay đổi, mà không cần chia sẻ secret.
**Nguồn gốc:** Diffie–Hellman context; RSA signatures
**Giải quyết thế nào:** Signer dùng private key ký hash(message); verifier dùng public key xác minh. Dùng trong JWT (RS256/ES256), SAML, certs.
*Liên quan: HMAC, JWT, certificate*

### HMAC
*còn gọi: Hash-based Message Authentication Code*

**Vấn đề khiến nó ra đời:** Cần đảm bảo tính toàn vẹn và xác thực nguồn gốc của message khi chỉ có shared secret. Hash thuần không đủ vì attacker có thể thay payload+hash nếu biết hash algo.
**Nguồn gốc:** RFC 2104 (Krawczyk et al., 1997)
**Giải quyết thế nào:** HMAC(K,m)=H((K^opad)||H((K^ipad)||m)). Chỉ ai có secret mới tính đúng MAC; dùng để verify webhook, API signature.
*Liên quan: digital signature, replay attack*

### IDOR
*còn gọi: Insecure Direct Object Reference*

**Vấn đề khiến nó ra đời:** App dùng ID từ request (orderId/userId) trực tiếp truy vấn object mà không kiểm tra quyền sở hữu. Chỉ đổi ID là truy cập được dữ liệu người khác.
**Nguồn gốc:** OWASP 2007 Top 10
**Giải quyết thế nào:** Luôn enforce authorization: kiểm tra current user có quyền truy cập object đó. Dùng indirect references nếu cần.
*Liên quan: permission model, RBAC*

### JWT
*còn gọi: JSON Web Token*

**Vấn đề khiến nó ra đời:** Khi nhiều service cần xác minh quyền truy cập mà không muốn gọi centralized session store mỗi request, cần định dạng token nhỏ gọn, self-contained chứa claims, có thể xác minh tính toàn vẹn.
**Nguồn gốc:** RFC 7519 (Jones et al., 2015)
**Giải quyết thế nào:** JWT gồm header.payload.signature (compact, URL-safe). Có thể ký (JWS) để đảm bảo toàn vẹn, hoặc mã hóa (JWE). Cần cẩn thận: alg confusion, 'none', key rotation, expiry (exp), jti để chống replay, không nhồi nhét dữ liệu nhạy cảm trừ khi encrypt.
*Liên quan: token, HMAC, digital signature, refresh token rotation*

### JWT (JSON Web Token)
*còn gọi: JSON Web Token, signed token*

**Vấn đề khiến nó ra đời:** Session lưu server-side khiến mỗi request phải tra DB/Redis, và khi phân tán nhiều service thì chia sẻ state session rất khó — service A không biết session do service B tạo. Cần cách mang claims (user id, scope, exp) xuyên services mà không tra store trung tâm.
**Nguồn gốc:** IETF RFC 7519
**Giải quyết thế nào:** Payload JSON được ký (JWS) hoặc mã hóa (JWE), cấu trúc `header.payload.signature` base64url — receiver xác minh chữ ký là tin được mà không cần query; đánh đổi: không tự revoke được, nên phải quản lý expiry ngắn và xử lý revocation riêng.
*Liên quan: Opaque token, OIDC, Refresh token rotation*

### key rotation

**Vấn đề khiến nó ra đời:** Nếu secret/key bị lộ mà không thay, attacker có thời gian dài khai thác. Cần quy trình xoay vòng định kỳ và khẩn cấp.
**Nguồn gốc:** NIST key management guidance
**Giải quyết thế nào:** Xoay JWT signing keys, DB credentials, API keys theo lịch. Hỗ trợ multiple active keys (key rollover) để tránh downtime.
*Liên quan: secrets management, JWT*

### least privilege

**Vấn đề khiến nó ra đời:** Nếu service/user có quyền quá rộng, một lỗ hổng nhỏ gây thiệt hại lớn. Cần cấp đúng mức quyền cần thiết.
**Nguồn gốc:** Saltzer–Schroeder principles (1975)
**Giải quyết thế nào:** DB user chỉ SELECT/INSERT cần thiết, service chỉ quyền truy cập resource cụ thể, role tối thiểu.
*Liên quan: RBAC, permission model, zero trust*

### mass assignment

**Vấn đề khiến nó ra đời:** Framework auto-bind toàn bộ request body vào model object. Attacker có thể gửi field nhạy cảm (isAdmin, role) để tự nâng quyền.
**Nguồn gốc:** OWASP; GitHub 2012 incident highlighted risk
**Giải quyết thế nào:** Dùng DTO/whitelist fields được phép update, không bind trực tiếp model. Enforce server-side validation.
*Liên quan: permission model*

### MFA/TOTP
*còn gọi: Multi-Factor Authentication, Time-based One-Time Password*

**Vấn đề khiến nó ra đời:** Password đơn lẻ dễ bị rò rỉ (phishing, breach). Cần thêm lớp xác thực thứ hai (factor khác).
**Nguồn gốc:** RFC 6238 (M'Raihi et al., 2011) for TOTP
**Giải quyết thế nào:** TOTP sinh code 6-8 số dựa trên shared secret + thời gian (30s). Authenticator app (Google Authenticator, Authy) hiển thị code; server verify. Kết hợp với password tạo MFA.
*Liên quan: brute force + rate limiting*

### mTLS
*còn gọi: mutual TLS*

**Vấn đề khiến nó ra đời:** TLS thông thường chỉ chứng minh server với client. Trong service-to-service hoặc zero trust, cần cả hai bên chứng minh danh tính (client cert) để ngăn truy cập trái phép.
**Nguồn gốc:** IETF TLS; widely used in service meshes
**Giải quyết thế nào:** Client cũng phải gửi certificate trong TLS handshake; server xác minh client cert bằng CA. Tránh dùng shared secrets đơn thuần.
*Liên quan: TLS handshake, certificate, zero trust*

### nonce

**Vấn đề khiến nó ra đời:** Khi cần đảm bảo request chỉ dùng một lần (login, payment), cần giá trị ngẫu nhiên duy nhất dùng trong phiên đó.
**Nguồn gốc:** Cryptographic protocols (Needham–Schroeder)
**Giải quyết thế nào:** Server phát nonce, client gửi kèm hash/signature; server kiểm tra chưa dùng trước đó.
*Liên quan: replay attack, HMAC*

### OAuth 2.0

**Vấn đề khiến nó ra đời:** Trước đây, app bên thứ ba muốn truy cập tài nguyên user phải xin password user — nguy hiểm (lưu password, không giới hạn quyền, không thu hồi). Cần cơ chế ủy quyền tách rời: user cấp quyền cho client qua authorization server.
**Nguồn gốc:** RFC 6749 (Hardt, 2012) replacing OAuth 1.0
**Giải quyết thế nào:** Roles: resource owner, client, authorization server, resource server. Flows: authorization code (recommended), implicit (deprecated), resource owner password (discouraged), client credentials (service-to-service).
*Liên quan: authorization code, PKCE, OpenID Connect*

### OAuth 2.0 (authorization framework)
*còn gọi: OAuth2, authorization code flow*

**Vấn đề khiến nó ra đời:** Trước OAuth, app bên thứ ba muốn truy cập dữ liệu người dùng thì buộc user đưa password thật — app lưu password plain-text, user không giới hạn scope/thời hạn, muốn thu hồi một app phải đổi mật khẩu (mất quyền mọi app), một app bị breach là password của mọi thứ chết theo. Đây là đúng chuỗi vấn đề RFC 6749 liệt kê.
**Nguồn gốc:** IETF RFC 6749 (thay OAuth 1.0 RFC 5849)
**Giải quyết thế nào:** Tách authorization layer: user đồng ý tại authorization server, client nhận access token giới hạn scope/thời hạn thay vì mật khẩu. Authorization code flow: redirect user sang server cấp code ngắn hạn, client đổi code → token tại backend (token không đi qua trình duyệt); implicit flow cũ bị loại dần vì token lộ trong URL.
*Liên quan: PKCE, OIDC, OAuth 2.1*

### Opaque token vs JWT (revocation trade-off)
*còn gọi: token đục, token tự xác minh vs token tra cứu*

**Vấn đề khiến nó ra đời:** JWT tự xác minh nhưng không thu hồi được khi user logout/đổi quyền — token đánh cắp sống hết hạn (có thể vài giờ/ngày). Ngược lại, opaque token (chuỗi ngẫu nhiên) revocable nhưng mỗi request phải gọi introspection/tra DB, tốn thêm round-trip. Đây là trade-off mọi team phải chọn khi làm auth, sai là gặp sự cố 'đã logout nhưng token vẫn hoạt động'.
**Nguồn gốc:** RFC 7662 (token introspection)
**Giải quyết thế nào:** Opaque token + endpoint introspection (RFC 7662) để resource server hỏi 'token này còn active không' theo thời gian thực; hoặc JWT ngắn hạn + refresh token rotation/danh sách đen để thu hồi. Lựa chọn theo yêu cầu: cần revocation tức thì → opaque hoặc short-TTL JWT.
*Liên quan: JWT, Refresh token rotation, OAuth 2.0*

### OpenID Connect
*còn gọi: OIDC*

**Vấn đề khiến nó ra đời:** OAuth 2.0 chỉ giải quyết ủy quyền, không chuẩn hóa 'ai đang đăng nhập'. Nhiều app cần identity layer chuẩn để SSO an toàn.
**Nguồn gốc:** OpenID Foundation (2014, OIDC 1.0 built on OAuth 2.0)
**Giải quyết thế nào:** OIDC thêm ID Token (JWT chứa claims về user) và UserInfo endpoint. Cho phép xác thực user và lấy thông tin cơ bản theo chuẩn.
*Liên quan: OAuth 2.0, SSO, JWT*

### OpenID Connect (OIDC)
*còn gọi: OIDC*

**Vấn đề khiến nó ra đời:** OAuth 2.0 thuần chỉ cho mượn quyền truy cập API, hoàn toàn không định nghĩa cách xác thực 'user này là ai' — developer tự bịa (gọi API /me rồi đoán)gây ra mỗi tích hợp login một kiểu, không standard. OAuth giải quyết authorization chứ không phải authentication.
**Nguồn gốc:** OpenID Connect Core 1.0 — bản cuối tháng 2/2014, errata set 2 ngày 15/12/2023
**Giải quyết thế nào:** Lớp identity trên OAuth 2.0: thêm scope `openid`, authorization server trả ID Token (JWT ký về sự kiện xác thực: issuer, subject, nonce, exp) — client verify ID Token là biết user đã đăng nhập ở đâu, tách bạch với access token dùng cho API.
*Liên quan: OAuth 2.0, JWT*

### OWASP Top 10

**Vấn đề khiến nó ra đời:** Cần danh sách ưu tiên các lỗ hổng web phổ biến nhất dựa trên dữ liệu thực tế để tập trung fix đúng thứ quan trọng.
**Nguồn gốc:** OWASP Top 10 project (first 2003, updated periodically; 2021 edition widely referenced)
**Giải quyết thế nào:** Liệt kê 10 rủi ro hàng đầu (vd. A01 Broken Access Control, A02 Cryptographic Failures, A03 Injection, A07 Identification/Auth Failures, v.v.) kèm ngữ cảnh/khuyến nghị.
*Liên quan: SQL injection, XSS, IDOR*

### permission model

**Vấn đề khiến nó ra đời:** Mỗi module (order, invoice) cần kiểm soát ai đọc/sửa/xóa. Nếu logic rải rác khắp controller dễ sai, khó audit.
**Nguồn gốc:** Access control design
**Giải quyết thế nào:** Thống nhất cách định nghĩa permissions (resource:action) + assignment (RBAC/ABAC) + enforcement (guards/policies).
*Liên quan: RBAC, ABAC, least privilege*

### PKCE
*còn gọi: Proof Key for Code Exchange*

**Vấn đề khiến nó ra đời:** Với public client (mobile app/native/spa) không có client secret, authorization code bị chặn giữa app và browser có thể bị ăn cắp để đổi token. Cần cơ chế chứng minh client thật sự là người nhận code.
**Nguồn gốc:** RFC 7636 (Sakimura et al., 2015)
**Giải quyết thế nào:** Client tạo code_verifier ngẫu nhiên, tính code_challenge (SHA256+base64url). Gửi challenge khi authorize, gửi verifier khi exchange code. Server so khớp — attacker không có verifier.
*Liên quan: authorization code, OAuth 2.0*

### PKCE (Proof Key for Code Exchange)
*còn gọi: code_challenge/code_verifier, bằng chứng trao đổi mã*

**Vấn đề khiến nó ra đời:** Native app đăng ký custom URI scheme chung (`myapp://callback`) — app độc hại cũng đăng ký cùng scheme và 'ăn cắp' authorization code từ redirect (authorization code interception attack). Public client không có client_secret để chứng minh mình là người đổi code, nên attacker lấy code là đổi được token ngay.
**Nguồn gốc:** IETF RFC 7636
**Giải quyết thế nào:** Client tạo random `code_verifier`, gửi bản hash (`code_challenge`) kèm request; đổi code thì gửi lại verifier — attacker intercept code nhưng không có verifier nên không đổi được token. RFC 7636 thiết kế cho public client, OAuth 2.1 bắt buộc cho mọi client.
*Liên quan: OAuth 2.0, OAuth 2.1, Authorization code flow*

### RBAC
*còn gọi: Role-Based Access Control*

**Vấn đề khiến nó ra đời:** Gán quyền trực tiếp cho từng user không scale (hàng ngàn user). Cần nhóm quyền theo vai trò.
**Nguồn gốc:** Ferraiolo–Kuhn (1992)
**Giải quyết thế nào:** Gán user vào role (admin/editor/viewer), role có permissions. Kiểm tra role khi truy cập resource.
*Liên quan: permission model, ABAC, least privilege*

### RBAC (Role-Based Access Control)
*còn gọi: phân quyền theo vai trò*

**Vấn đề khiến nó ra đời:** Hàng trăm user, hàng nghìn quyền mà admin cấp từng quyền cho từng người bằng tay — onboard nhân viên mới phải tick 40 checkbox, chuyển phòng ban phải gỡ và gắn lại mọi permission, sót quyền cũ thành lỗ hổng. Đây là nỗi đau khiến RBAC thay ACL trong tổ chức lớn.
**Nguồn gốc:** Ferraiolo & Kuhn 1992; Sandhu et al. 1996; chuẩn hóa ANSI/INCITS 359-2004 bởi NIST
**Giải quyết thế nào:** Gắn permission vào role theo chức năng (editor, admin...), user chỉ được gán role — quản lý quyền thành 'gán/ghé role', hỗ trợ role hierarchy và separation of duties.
*Liên quan: ABAC, Principle of least privilege*

### refresh token rotation
*còn gọi: Refresh token rotation & revocation, quay refresh token, token thu hồi*

**Vấn đề khiến nó ra đời:** Refresh token dài hạn nếu bị đánh cắp cho phép attacker lấy access token liên tục. Cần giảm thiệt hại: mỗi lần dùng refresh token cũ sẽ bị thu hồi và cấp token mới. Access token sống ngắn thì user phải đăng nhập lại liên tục; sống dài thì bị đánh cắp dùng được lâu. Refresh token giải quyết nhưng bị đánh cắp thì attacker tái tạo access token vô hạn — và nếu refresh token tĩnh (không đổi), server không phát hiện được token đã bị đánh cắp vì vẫn valid.
**Nguồn gốc:** OAuth 2.0 Security BCP (RFC 9700)
**Giải quyết thế nào:** Khi refresh, cấp cặp (access+new refresh), vô hiệu hóa refresh cũ. Nếu phát hiện reuse (refresh cũ bị dùng lại), thu hồi toàn bộ token chain. Mỗi lần dùng refresh token để lấy access token mới, server cấp refresh token mới (rotation) — token cũ bị đánh cắp mà dùng lại sẽ lệch chuỗi, server phát hiện breach và thu hồi cả family; kết hợp binding scope/resource như OAuth Security BCP yêu cầu.
*Liên quan: JWT, OAuth 2.0, Opaque token*

### replay attack

**Vấn đề khiến nó ra đời:** Attacker chặn request hợp lệ (token/cookie) và gửi lại sau để lặp lại hành động (vd. thanh toán). Cần ngăn dùng lại credential cũ.
**Nguồn gốc:** Network security literature
**Giải quyết thế nào:** Dùng jti trong JWT, nonce cho requests nhạy cảm, short expiry, TLS, one-time use codes.
*Liên quan: JWT, nonce, HMAC*

### SAML
*còn gọi: Security Assertion Markup Language*

**Vấn đề khiến nó ra đời:** Cần chuẩn trao đổi thông tin xác thực/ủy quyền giữa IdP và SP, đặc biệt trong enterprise (legacy). XML-based assertions.
**Nguồn gốc:** OASIS SAML 1.0 (2002), SAML 2.0 (2005)
**Giải quyết thế nào:** IdP phát SAML assertion (XML) chứa user identity/attributes, SP xác minh signature và cho phép truy cập.
*Liên quan: SSO, digital signature*

### secrets management
*còn gọi: Secrets management (Vault-style), quản lý bí mật tập trung, dynamic secrets*

**Vấn đề khiến nó ra đời:** API keys, DB passwords, JWT secrets dễ bị rò rỉ nếu commit vào git, log, hoặc hardcode. Cần lưu tập trung, kiểm soát truy cập, xoay vòng. API key/DB password nằm rải rác trong .env, config file, CI variable — xoay (rotate) key phải đổi hàng chục nơi, không ai biết ai đã đọc secret nào, và secret vẫn sống mãi sau khi employee nghỉ việc. Treasury/Security không audit được ai truy cập credential.
**Nguồn gốc:** DevSecOps practices
**Giải quyết thế nào:** Dùng secret store (Vault, AWS Secrets Manager), inject qua env/CI, scan secrets (gitleaks), tránh log secrets. Centralize secret vào vault riêng (HashiCorp Vault...): static + dynamic secrets (DB credentials tự sinh và tự hết hạn), mã hóa at-rest, audit log mọi truy cập bất kể thành công/thất bại, tích hợp rotation và identity-based auth.
*Liên quan: key rotation, API key, Principle of least privilege, mTLS*

### SQL injection
*còn gọi: SQLi*

**Vấn đề khiến nó ra đời:** Khi xây query bằng string concatenation với input user, input có thể chứa SQL meta-char làm thay đổi ý nghĩa query (đọc/xóa dữ liệu).
**Nguồn gốc:** First public discussions late 1990s; OWASP
**Giải quyết thế nào:** Parameterized queries/prepared statements là giải pháp chính. Validate allowlist, dùng least privilege DB user.
*Liên quan: IDOR*

### SSO
*còn gọi: Single Sign-On*

**Vấn đề khiến nó ra đời:** User phải nhớ/login nhiều hệ thống khác nhau gây phiền phức và tăng nguy cơ dùng password yếu/lặp lại. Cần đăng nhập một lần để truy cập nhiều app.
**Nguồn gốc:** Kerberos (MIT, 1988), later SAML/OIDC
**Giải quyết thế nào:** Central identity provider (IdP) xác thực user, phát token/assertion cho các service provider (SP). User không cần login lại.
*Liên quan: SAML, OpenID Connect*

### SSRF
*còn gọi: Server-Side Request Forgery*

**Vấn đề khiến nó ra đời:** Server được phép gọi HTTP tới internal services (metadata, DB admin). Nếu attacker kiểm soát URL, server có thể gọi internal endpoints người ngoài không thấy, tiết lộ thông tin nhạy cảm.
**Nguồn gốc:** OWASP Top 10 awareness; cloud metadata abuse
**Giải quyết thế nào:** Validate URL allowlist, chặn private IP ranges/loopback, không follow redirect tùy tiện, tách network cho internal calls.
*Liên quan: zero trust, least privilege*

### TLS handshake

**Vấn đề khiến nó ra đời:** HTTP plaintext bị nghe trộm/thay đổi. Cần thiết lập kênh mã hóa giữa client/server và xác minh server trước khi trao đổi dữ liệu.
**Nguồn gốc:** TLS evolved from SSL; TLS 1.3 (RFC 8446) simplified
**Giải quyết thế nào:** ClientHello -> ServerHello+cert -> key exchange -> encrypted channel. Server chứng minh qua certificate; TLS 1.3 rút ngắn handshake, bỏ cipher yếu.
*Liên quan: encryption symmetric vs asymmetric, certificate, mTLS*

### XSS
*còn gọi: Cross-Site Scripting*

**Vấn đề khiến nó ra đời:** Nếu app nhúng dữ liệu user vào HTML mà không sanitize, attacker có thể chèn JS chạy trong session victim, ăn cắp cookie/token, hành động thay user.
**Nguồn gốc:** CERT advisory early 2000s; OWASP
**Giải quyết thế nào:** Reflected/stored/DOM-based. Phòng: output encoding, CSP, HttpOnly/Secure cookies, tránh dùng innerHTML với data không tin cậy.
*Liên quan: CORS vs CSRF, secrets management*

## Kiểm thử & Chất lượng

### A/B test
*còn gọi: split test, A/B testing*

**Vấn đề khiến nó ra đời:** Không biết thay đổi UI/logic có thực sự cải thiện metric kinh doanh (conversion, click) hay chỉ ngẫu nhiên.
**Nguồn gốc:** Ronald Fisher statistics applied; web A/B popularized
**Giải quyết thế nào:** Chia user ngẫu nhiên thành A/B, so sánh metric với ý nghĩa thống kê trước khi quyết định roll out.
*Liên quan: canary analysis, feature flag testing*

### BDD
*còn gọi: Behavior-Driven Development*

**Vấn đề khiến nó ra đời:** Team kỹ thuật và nghiệp vụ nói khác ngôn ngữ, dẫn đến hiểu sai yêu cầu. Cần diễn đạt hành vi bằng ngôn ngữ gần business.
**Nguồn gốc:** Dan North
**Giải quyết thế nào:** Viết kịch bản hành vi Given-When-Then để cả PO/dev/QA cùng hiểu, sau đó mapping sang test code.
*Liên quan: TDD, acceptance test, contract test (Pact), Gherkin, Specification by example*

### Behavior verification

**Vấn đề khiến nó ra đời:** Trong một số trường hợp, trạng thái cuối cùng không đủ để chứng minh SUT đã tương tác đúng (ví dụ: phải gọi đúng service thanh toán đúng số lần), cần kiểm tra các lời gọi đã xảy ra.
**Nguồn gốc:** Gerard Meszaros (xUnit Test Patterns)
**Giải quyết thế nào:** Kiểm tra rằng SUT đã gửi đúng thông điệp/tương tác tới collaborator theo đúng kỳ vọng đã định trước.
*Liên quan: Mock, State verification*

### Branch coverage
*còn gọi: Decision coverage*

**Vấn đề khiến nó ra đời:** Statement coverage có thể bỏ sót: nếu một nhánh if/else không được chạy, lỗi trong nhánh đó vẫn không bị phát hiện dù statement coverage đã cao.
**Nguồn gốc:** không rõ
**Giải quyết thế nào:** Đảm bảo cả hai nhánh true/false của mỗi điều kiện rẽ nhánh đều được thực thi ít nhất một lần.
*Liên quan: Code coverage, Statement coverage*

### cyclomatic complexity
*còn gọi: McCabe complexity*

**Vấn đề khiến nó ra đời:** Hàm có quá nhiều nhánh if/switch/loop → khó hiểu, khó test đủ nhánh, dễ ẩn lỗi.
**Nguồn gốc:** Thomas J. McCabe (1976)
**Giải quyết thế nào:** Đếm số đường thực thi độc lập. Thường giữ thấp (< 10) để dễ test và maintain.
*Liên quan: static analysis, test coverage (line vs branch), technical debt*

### dead code
*còn gọi: unused code*

**Vấn đề khiến nó ra đời:** Code không còn dùng vẫn tồn tại → gây nhầm lẫn, tăng độ phức tạp, khó bảo trì, tiềm ẩn rủi ro bảo mật.
**Nguồn gốc:** Compiler/linting practice
**Giải quyết thế nào:** Xác định và xóa code không gọi đến, không khả thi. Cần cẩn trọng với feature flag hoặc dynamic call.
*Liên quan: technical debt, static analysis, lint*

### deterministic test
*còn gọi: deterministic*

**Vấn đề khiến nó ra đời:** Kết quả test phụ thuộc thời gian, random, order → flaky, không tin cậy.
**Nguồn gốc:** Test design principles
**Giải quyết thế nào:** Loại bỏ non-determinism: cố định time, seed random, không dùng wall clock, đảm bảo order-independent.
*Liên quan: flaky test, test isolation, hermetic test*

### Example-based testing

**Vấn đề khiến nó ra đời:** Cần phân biệt với property-based testing: cách viết test truyền thống dựa trên ví dụ cố định.
**Nguồn gốc:** không rõ
**Giải quyết thế nào:** Viết test với input và output cụ thể (vd. assert add(2,3) == 5) thay vì định nghĩa tính chất tổng quát.
*Liên quan: property-based test*

### feature flag testing
*còn gọi: feature toggle testing, feature flag*

**Vấn đề khiến nó ra đời:** Muốn release feature dần, test trên production-like mà không expose toàn bộ user. Cần kiểm soát bật/tắt an toàn.
**Nguồn gốc:** Martin Fowler (Feature Toggles)
**Giải quyết thế nào:** Dùng flag để bật/tắt feature. Test cả nhánh on/off, đảm bảo backward compatible khi tắt flag.
*Liên quan: canary analysis, A/B test, regression test*

### flaky test
*còn gọi: flaky, non-deterministic test*

**Vấn đề khiến nó ra đời:** Test đôi khi pass, đôi khi fail trên cùng code. Gây mất niềm tin vào CI, team dễ bỏ qua fail thật.
**Nguồn gốc:** Google Testing Blog (flakiness research)
**Giải quyết thế nào:** Xác định nguyên nhân: race condition, timeouts, shared state, order dependency. Cần làm test deterministic (test isolation).
*Liên quan: test isolation, deterministic test, parallel test execution, Test isolation, Hermetic test, Quarantine*

### load test
*còn gọi: load testing*

**Vấn đề khiến nó ra đời:** Hệ thống chạy tốt với 1 user nhưng chậm/mất phản hồi khi có hàng nghìn user truy cập đồng thời.
**Nguồn gốc:** Performance testing practice
**Giải quyết thế nào:** Mô phỏng tải dự kiến (expected load) để đo throughput, latency, error rate. Xác định ngưỡng ổn định.
*Liên quan: stress test, soak test, smoke test*

### mocking/stub/fake/spy
*còn gọi: mock, stub, fake, spy, test doubles*

**Vấn đề khiến nó ra đời:** Muốn test đơn vị nhưng phụ thuộc external (DB, API, time, filesystem) chậm, không ổn định, hoặc khó kiểm soát.
**Nguồn gốc:** Gerard Meszaros (Test Doubles)
**Giải quyết thế nào:** Stub: cung cấp dữ liệu cứng. Mock: xác minh tương tác. Fake: triển khai đơn giản (in-memory). Spy: ghi lại gọi.
*Liên quan: unit test, test isolation, contract test (Pact)*

### parallel test execution
*còn gọi: parallel testing*

**Vấn đề khiến nó ra đời:** Suite test ngày càng lớn → thời gian CI kéo dài, chậm feedback. Cần chạy song song để rút ngắn.
**Nguồn gốc:** CI/CD scaling
**Giải quyết thế nào:** Chia test chạy đồng thời trên nhiều worker. Yêu cầu test hoàn toàn độc lập (no shared state) để tránh race/flaky.
*Liên quan: test isolation, flaky test, deterministic test*

### refactoring
*còn gọi: code refactoring*

**Vấn đề khiến nó ra đời:** Code hoạt động nhưng khó đọc/sửa. Nếu sửa mà không có test, nguy cơ regression cao.
**Nguồn gốc:** Martin Fowler (Refactoring book)
**Giải quyết thế nào:** Thay đổi cấu trúc nội bộ mà giữ hành vi ngoài. Luôn có test bảo vệ, refactor nhỏ từng bước.
*Liên quan: TDD, red-green-refactor, technical debt, regression test*

### snapshot test
*còn gọi: snapshot testing*

**Vấn đề khiến nó ra đời:** Khi output lớn (UI, JSON) thay đổi, khó viết assertion thủ công cho từng field. Cần phát hiện thay đổi không mong muốn nhanh.
**Nguồn gốc:** Jest popularized snapshot testing
**Giải quyết thế nào:** Lưu output mẫu (snapshot) lần đầu, so sánh với output hiện tại. Chỉ update snapshot khi thay đổi có chủ đích.
*Liên quan: regression test, golden master*

### SOLID
*còn gọi: SOLID principles*

**Vấn đề khiến nó ra đời:** Class/module phụ thuộc chặt chẽ → thay đổi nhỏ gây ripple effect, khó test, khó mở rộng.
**Nguồn gốc:** Robert C. Martin (Uncle Bob)
**Giải quyết thế nào:** 5 nguyên tắc: SRP, OCP, LSP, ISP, DIP giúp giảm coupling, tăng cohesion, dễ test.
*Liên quan: refactoring, technical debt, test isolation*

### Specification by example

**Vấn đề khiến nó ra đời:** Khi yêu cầu chỉ mô tả trừu tượng, dễ dẫn đến hiểu sai — cần dùng ví dụ cụ thể để làm rõ kỳ vọng nghiệp vụ.
**Nguồn gốc:** Gojko Adzic (Specification by Example, 2011)
**Giải quyết thế nào:** Dùng các ví dụ cụ thể, có thể kiểm chứng được làm cầu nối giữa yêu cầu nghiệp vụ và test tự động (thường dùng với BDD/Gherkin).
*Liên quan: BDD, Gherkin*

### State verification

**Vấn đề khiến nó ra đời:** Cần xác minh kết quả cuối cùng của system under test sau khi thực thi (trạng thái trả về, dữ liệu thay đổi) thay vì cách nó đạt được kết quả đó.
**Nguồn gốc:** Gerard Meszaros (xUnit Test Patterns)
**Giải quyết thế nào:** Quan sát trạng thái bên ngoài của SUT sau hành động và so sánh với kỳ vọng, thường dùng với stub/fake.
*Liên quan: Stub, Fake, Behavior verification*

### static analysis
*còn gọi: static code analysis*

**Vấn đề khiến nó ra đời:** Nhiều bug (null deref, resource leak) khó phát hiện bằng test chạy, nhưng có thể phát hiện từ mã nguồn không chạy.
**Nguồn gốc:** Compiler theory + modern tools
**Giải quyết thế nào:** Phân tích AST/source mà không thực thi để tìm bug pattern, smell, security issue tiềm ẩn.
*Liên quan: SAST/DAST, lint, cyclomatic complexity*

### stress test
*còn gọi: stress testing*

**Vấn đề khiến nó ra đời:** Cần biết điểm gãy (breaking point) của hệ thống: khi nào CPU/memory/DB bị quá tải dẫn đến crash hoặc timeout.
**Nguồn gốc:** Performance engineering
**Giải quyết thế nào:** Tăng tải vượt ngưỡng dự kiến để quan sát hành vi khi quá tải (degradation, recovery).
*Liên quan: load test, soak test, chaos test*

### technical debt
*còn gọi: tech debt*

**Vấn đề khiến nó ra đời:** Chọn shortcut để release nhanh hôm nay → chi phí bảo trì tăng theo thời gian (khó sửa, khó mở rộng).
**Nguồn gốc:** Ward Cunningham
**Giải quyết thế nào:** Ghi nhận nợ có chủ đích (intentional) vs vô tình. Ưu tiên trả nợ theo tác động (critical path).
*Liên quan: refactoring, cyclomatic complexity, dead code*

### test coverage (line vs branch)
*còn gọi: code coverage, line coverage, branch coverage*

**Vấn đề khiến nó ra đời:** Team muốn biết "đã test đến đâu", nhưng chỉ đếm dòng không đủ: nhánh if/else chưa được test vẫn ẩn lỗi.
**Nguồn gốc:** Miller/Testing metrics
**Giải quyết thế nào:** Line coverage: % dòng thực thi. Branch coverage: % nhánh điều kiện (true/false) được đi qua. Dùng để gợi ý, không phải mục tiêu tuyệt đối.
*Liên quan: mutation testing, cyclomatic complexity, static analysis*

### test data management
*còn gọi: test data, TDM*

**Vấn đề khiến nó ra đời:** Dùng dữ liệu cố định gây xung đột khi chạy song song, khó tái tạo lỗi, khó maintain.
**Nguồn gốc:** Enterprise testing practice
**Giải quyết thế nào:** Quản lý dữ liệu test: factory, builder, fixtures, data seeding per test. Ưu tiên dữ liệu per-test thay vì shared.
*Liên quan: fixture, test isolation, parallel test execution, Test fixture, Test isolation*

### Test fixture

**Vấn đề khiến nó ra đời:** Nhiều test cần cùng một thiết lập ban đầu (dữ liệu, đối tượng) — lặp lại code thiết lập sẽ gây rườm rà và khó bảo trì.
**Nguồn gốc:** xUnit
**Giải quyết thế nào:** Thiết lập môi trường/common state cần thiết trước test (setup) và dọn dẹp sau (teardown), giúp đảm bảo test isolation.
*Liên quan: Test isolation, xUnit*

### test isolation
*còn gọi: isolated test*

**Vấn đề khiến nó ra đời:** Test A làm thay đổi state (DB, cache, file) ảnh hưởng test B chạy sau hoặc song song → kết quả không lặp lại được.
**Nguồn gốc:** xUnit/test design (Kent Beck, Gerard Meszaros)
**Giải quyết thế nào:** Mỗi test tự khởi tạo/dọn dẹp state, không phụ thuộc order. Dùng fixture, transaction rollback, in-memory, hoặc mock.
*Liên quan: flaky test, deterministic test, fixture, test data management, Flaky test, Test fixture, Hermetic test*

## DevOps & Triển khai

### Blue-green deploy
*còn gọi: blue/green, hai môi trường xanh chín, swap môi trường*

**Vấn đề khiến nó ra đời:** Rolling để hai phiên bản cùng xử lý lưu lượng; với migration database hay cấu hình không tương thích hai chiều thì trộn phiên bản là rủi ro thật. Cần cách chuyển sang bản mới gần như tức thì và quay lại ngay được nếu hỏng, thay vì dừng service giữa chừng.
**Nguồn gốc:** Martin Fowler, bliki 'Blue Green Deployment' ngày 1/3/2010 — giới thiệu kỹ thuật lấy từ mục blue-green trong cuốn Continuous Delivery của Dave Farley & Jez Humble (2010).
**Giải quyết thế nào:** Duy trì 2 môi trường sản xuất y hệt: blue đang live, green chứa bản mới được deploy + test khi trống; đổi router/load balancer sang green, blue giữ nguyên làm mục tiêu rollback tức thì.
*Liên quan: zero-downtime deploy (rolling deploy), canary deploy, rollback, release vs deploy*

### Config management
*còn gọi: quản lý cấu hình, Puppet, Chef, Ansible, CFEngine, cấu hình như code*

**Vấn đề khiến nó ra đời:** Mỗi server cấu hình tay: đổi cấu hình nginx thì server A được cập nhật, server B quên; dần dần production và staging lệch nhau tới mức 'bug chỉ reproduce được trên staging'. Không ai trả lời được câu 'cấu hình nào đang thực sự chạy trên máy đó'.
**Nguồn gốc:** CFEngine (Mark Burgess) năm 1993 đi trước; Puppet của Luke Kanies ra mắt 2005; Chef năm 2009; Ansible của Michael DeHaan năm 2012.
**Giải quyết thế nào:** Đặt cấu hình thành code và áp dụng idempotent, đồng nhất lên mọi node (Puppet/Chef/Ansible/Salt): chạy lại không làm hỏng, cấu hình thay đổi đi qua git, server tự converge về trạng thái khai báo.
*Liên quan: Infrastructure as Code (Terraform, Pulumi), environment (dev/staging/prod), secrets in runtime, immutable infrastructure*

### Deployment & Replica (ReplicaSet)
*còn gọi: Deployment, ReplicaSet, replicas, bản sao, replication*

**Vấn đề khiến nó ra đời:** Cần 3 bản sao service để chịu tải nên người ta tự nhân process trên 3 máy bằng script: khi 1 bản chết không ai khởi động lại, và mỗi lần upgrade là stop/start tay từng cái — có lúc traffic chạm cả version cũ lẫn mới cùng lúc, dữ liệu lẫn lộn.
**Nguồn gốc:** ReplicaSet (trước đó là ReplicationController) và Deployment là API gốc của Kubernetes từ các version đầu.
**Giải quyết thế nào:** Deployment khai báo số replica mong muốn; ReplicaSet giữ đúng số đó (tạo pod mới khi có pod chết), Deployment thêm chiến lược rollout (tạo bản mới, health check, thay dần, giữ bản cũ để dừng khi fail) — upgrade không làm mất bản đang serve.
*Liên quan: Kubernetes, pod, HPA, rolling deploy / zero-downtime, blue-green deploy*

### Feature flag
*còn gọi: feature toggle, feature switch, cờ tính năng, toggle*

**Vấn đề khiến nó ra đời:** Nhánh tính năng sống 2-3 tuần rồi merge là conflict dày đặc; và ngay cả khi merge xong, muốn bật cho 1% user hay tắt ngay khi tính năng mới làm cháy CPU giờ cao điểm thì vẫn phải deploy lại cả build — không có đòn bẩy nào ngoài roll back.
**Nguồn gốc:** không rõ người đặt ra đầu tiên; được hệ thống hóa bởi Pete Hodgson trên martinfowler.com năm 2017 (chia release/experiment/permissioning/operational toggles).
**Giải quyết thế nào:** Bọc code mới sau điều kiện runtime (if flag_enabled): nhánh được gộp sớm, code đã lên production nhưng hành vi chưa bật; tung dần theo % user, tắt được không cần deploy — và phải dọn flag sau khi rollout xong.
*Liên quan: release vs deploy, trunk-based vs git flow, canary deploy, rollback*

### Helm
*còn gọi: Helm chart, chart, package manager cho Kubernetes*

**Vấn đề khiến nó ra đời:** Deploy một app lên Kubernetes phải chuyền tay 10 file YAML (Deployment, Service, ConfigMap, Ingress...); đổi port hay image tag là sửa 10 chỗ, và không có khái niệm 'bản 1.4.2 của bộ manifest này' để promote qua các môi trường hay rollback theo version.
**Nguồn gốc:** Bắt đầu năm 2015 tại Deis ('Helm Classic', ra mắt ở KubeCon đầu tiên); tháng 1/2016 sáp nhập với Kubernetes Deployment Manager của Google; hiện là dự án CNCF graduated.
**Giải quyết thế nào:** Helm đóng gói manifest thành chart có version, tham số hóa bằng values.yaml theo môi trường, rồi `install`/`upgrade`/`rollback` một lệnh — apt/npm cho Kubernetes, quản lý được vòng đời (values, history, rollback).
*Liên quan: Kubernetes, GitOps, deployment & replica, rollback*

### Infrastructure as Code (Terraform, Pulumi)
*còn gọi: IaC, hạ tầng như mã, Terraform, Pulumi*

**Vấn đề khiến nó ra đời:** Nhấn 'tạo server' trên console cloud rồi quên ghi lại; 6 tháng sau dựng lại môi trường staging thì thiếu firewall rule, thiếu subnet, không ai giải thích được hạ tầng đang có gì. Hạ tầng không nằm trong git nên không diff được, không review được, không reproduce được.
**Nguồn gốc:** Terraform ra mắt bản 0.1 tháng 7/2014 (HashiCorp, Mitchell Hashimoto); Pulumi Corporation thành lập năm 2017 (Joe Duffy & Eric Rudder); gốc khái niệm đi từ configuration management.
**Giải quyết thế nào:** Mô tả hạ tầng bằng file code và thay đổi qua quy trình git: Terraform dùng HCL declarative với `plan` trước khi `apply`; Pulumi dùng TypeScript/Python/Golang thật. Môi trường dựng lại được từ 0, thay đổi ai sửa cũng trace được.
*Liên quan: config management, immutable infrastructure, GitOps, environment (dev/staging/prod)*

### Kubernetes
*còn gọi: K8s, kubernetes cluster, orchestrator container*

**Vấn đề khiến nó ra đời:** Sau khi có container, team deploy hàng chục service lên vài chục server bằng script tay: server chết thì service chết luôn, muốn thêm instance phải tự cấu hình load balancer, upgrade thì chạy script từng máy. Quy mô tăng từ 5 lên 50 service thì cách này vỡ hoàn toàn và chỉ vài người thuộc lòng server.
**Nguồn gốc:** Google công bố open-source tháng 8/2014, rút ra từ kinh nghiệm hệ thống nội bộ Borg; chuyển giao cho CNCF năm 2015.
**Giải quyết thế nào:** Khai báo mong muốn ('cần 3 bản sao của service này') dưới dạng API; control plane tự đối chiếu hiện trạng với mong muốn — schedule pod lên node phù hợp, khởi động lại khi chết, scale — con người lo việc khai báo, máy lo việc giữ đúng.
*Liên quan: pod, deployment & replica, service & ingress, HPA, helm, container (Docker, container image)*

### Monorepo vs Polyrepo
*còn gọi: monorepo, polyrepo, đa repo, single repo*

**Vấn đề khiến nó ra đời:** 100 repo riêng lẻ: đổi 1 interface dùng chung phải mở 100 PR, version dependency giữa các service lệch nhau, không thể atomic một thay đổi cross-service. Ngược lại, một repo khổng lồ không có tooling thì CI chậm, quyền truy cập thô, git operations ì ạch.
**Nguồn gốc:** Monorepo là thực hành lâu đời của Google (mô tả trong bài 'Large-Scale Cluster Management at Google with Bazel', SoCC 2016); polyrepo là mặc định của kỷ nguyên GitHub.
**Giải quyết thế nào:** Monorepo gom nhiều service/library vào 1 trunk: thay đổi cross-cutting atomic, code share và refactor toàn cục được (cần tool như Bazel/Nx/Turborepo). Polyrepo mỗi service 1 repo: ownership, quyền và deploy tách bạch rõ hơn. Chọn theo quy mô team và tooling, không theo trendy.
*Liên quan: trunk-based vs git flow, build artifact, CI (continuous integration)*

### Pod
*còn gọi: kubernetes pod, đơn vị nhỏ nhất K8s*

**Vấn đề khiến nó ra đời:** Container thuần túy chỉ là 1 process cách ly — orchestrator không biết 'một bộ ứng dụng' gồm nhiều container (app + log agent + proxy) nào thì nên nằm cùng nhau, cũng không biết cấp IP ra sao khi chúng phải nói chuyện nội bộ qua localhost.
**Nguồn gốc:** Là primitive gốc của Kubernetes (Google, 2014).
**Giải quyết thế nào:** Pod là đơn vị nhỏ nhất Kubernetes schedule: 1 container (thường) hoặc vài container chung network namespace, IP và volume, luôn sống cùng node; thay vì sửa đổi, ta kill và tạo pod mới.
*Liên quan: Kubernetes, deployment & replica, sidecar, container (Docker, container image)*

### Secrets in runtime
*còn gọi: quản lý secret, runtime secrets, Vault, secrets manager, bí mật khi chạy*

**Vấn đề khiến nó ra đời:** Đội để API key trong file .env và commit vào repo (hoặc hardcode trong code); key lộ thì không ai chắc key nào đang nằm ở server nào để thu hồi. Secret nằm trong git là secret đã chết, còn secret copy tay ra 10 server thì không rotate được.
**Nguồn gốc:** HashiCorp Vault ra mắt năm 2015; Kubernetes Secret có từ các version đầu; secret store quản lý của cloud (AWS Secrets Manager, Azure Key Vault) xuất hiện sau đó.
**Giải quyết thế nào:** Secret tách khỏi code và khỏi cấu hình tĩnh: nạp lúc runtime từ nguồn tập trung (HashiCorp Vault, AWS Secrets Manager, Kubernetes Secret), phân quyền theo service, ghi log redaction, rotate được mà không cần deploy lại toàn bộ.
*Liên quan: config management, environment (dev/staging/prod), GitOps, secrets không vào code*

### Service & Ingress (mạng Kubernetes)
*còn gọi: Service (ClusterIP/NodePort/LoadBalancer), Ingress, Ingress controller, mạng trong cluster*

**Vấn đề khiến nó ra đời:** Pod restart là đổi IP ngay nên client ghi IP cứng thì hỏng sau lần scale đầu tiên. Song song đó, mỗi service muốn ra internet lại phải mở port/load balancer riêng và khai báo domain tay — số service tăng thì việc quản lý đường vào rối không kiểm soát.
**Nguồn gốc:** Đều là API gốc của Kubernetes; Ingress controller phổ biến (nginx, Traefik) do cộng đồng triển khai.
**Giải quyết thế nào:** Service tạo IP ảo ổn định và load balance tới nhóm pod theo label (qua kube-proxy/IPVS); Ingress là tầng L7 trước Service, route theo host/path, gom TLS một chỗ — một cổng vào duy nhất cho nhiều service.
*Liên quan: Kubernetes, pod, deployment & replica, HPA*

### SRE vs DevOps
*còn gọi: Site Reliability Engineering, SRE, DevOps, vận hành kiểu kỹ sư*

**Vấn đề khiến nó ra đời:** DevOps nói về văn hóa gộp dev và ops, nhưng khi hỏi 'ai chịu trách nhiệm hệ thống lúc 3h sáng, SLI/SLO là gì, được phép downtime bao nhiêu phần trăm' thì không ai trả lời được: ops vẫn là nhóm bị gọi trong đêm, dev vẫn ném code qua hàng rào, SLO không tồn tại nên mọi incident đều là khẩn cấp.
**Nguồn gốc:** Google khởi xướng năm 2003; Ben Treynor Sloss là người đặt thuật ngữ 'Site Reliability Engineering'; sách Site Reliability Engineering của Google xuất bản 2016.
**Giải quyết thế nào:** SRE là cách Google vận hành DevOps bằng kỹ sư: viết automation thay việc tay, đặt SLI/SLO và error budget làm cơ chế quyết định (hết budget thì dừng release). DevOps là phong trào/cộng đồng rộng hơn; SRE là bộ phận + thực hành cụ thể kèm công cụ.
*Liên quan: GitOps, smoke test, rollback, CI (continuous integration)*

### Trunk-based development vs Git flow
*còn gọi: trunk-based development, TBD, git flow, mainline development, chiến lược nhánh*

**Vấn đề khiến nó ra đời:** Git flow với develop/release/hotfix để nhánh sống vài tuần khiến merge conflict dày đặc, mỗi nhánh là một state không ai test chung; trong khi đội cần deploy hàng ngày thì 'gộp nhánh' trở thành sự kiện lớn, rủi ro, phải book lịch.
**Nguồn gốc:** Git flow do Vincent Driessen xuất bản trên nvie.com (tháng 1/2010); trunk-based do Paul Hammant hệ thống hóa (trunkbaseddevelopment.com) và là thực hành chuẩn ở Google.
**Giải quyết thế nào:** Trunk-based: mọi người commit vào 1 trunk, nhánh sống dưới 1-2 ngày, luôn merge được, tính năng chưa xong che bằng feature flag. Git flow hợp với phần mềm đóng gói cần hỗ trợ nhiều version song song — chọn theo cách phát hành, không theo phong trào.
*Liên quan: feature flag, CI (continuous integration), monorepo vs polyrepo, CD (continuous delivery/deployment)*

### Zero-downtime deploy (rolling deploy)
*còn gọi: rolling deploy, rolling update, triển khai không downtime, zero downtime*

**Vấn đề khiến nó ra đời:** Mỗi lần deploy là dừng process vài chục giây: request giữa chừng bị drop, user đang tải trang thấy 502. Đau như vậy nên team gom code và release vào cuối tuần — càng ít lần deploy thì càng nhiều thay đổi dồn vào một lần, rủi ro tăng theo.
**Nguồn gốc:** không rõ (khái niệm lan rộng cùng continuous delivery; trong Kubernetes, rolling update là chiến lược mặc định của Deployment)
**Giải quyết thế nào:** Không bao giờ dừng toàn bộ: rolling deploy giữ N bản cũ đang serve, khởi động bản mới bên cạnh, chuyển traffic dần sau khi health check xanh, lặp tới hết — request luôn có nơi trả lời, downtime về 0.
*Liên quan: deployment & replica, blue-green deploy, canary deploy, CD (continuous delivery/deployment)*

# PHẦN 3 — NÂNG CAO (advanced)

Phân tán, đồng thời, thất bại từng phần — những thứ chỉ hiện ra khi hệ thống đủ lớn hoặc đủ căng. Đọc khi đã gặp đau thật, không đọc để thuộc lòng.

## Mạng & Giao thức

### BBR / CUBIC (congestion control algorithms)
*còn gọi: BBR Google, CUBIC Linux default*

**Vấn đề khiến nó ra đời:** AIMD kiểu Reno/CUBIC phản ứng với MẤT GÓI làm tín hiệu nghẽn — nhưng link không dây/mobile và buffer router lớn (bufferbloat) gây loss không phải vì nghẽn thật, khiến throughput giảm oan; ngoài ra loss-based không phân biệt được 'mất do nghẽn' và 'mất do wifi'. Network nhanh đường dài (BDP lớn) bị throughput kẹt.
**Nguồn gốc:** CUBIC: Sangtae Heo và cộng sự (mặc định Linux 2.6.19, 2006); BBR: Neal Cardwell & Yuchung Cheng (Google, 2016, Linux 4.9)
**Giải quyết thế nào:** CUBIC (mặc định Linux từ 2.6.19/2006) tăng cwnd theo hàm bậc ba kể từ lần nghẽn cuối, êm hơn BIC. BBR (Google, 2016, Linux 4.9+) ước lượng hai đại lượng: bottleneck bandwidth và RTT propagation, rồi điều khiển pacing cho vừa hai cái đó — không đợi mất gói; trên YouTube BBR tăng throughput trung bình ~4%. v2/v3 bổ sung tín hiệu loss/ECN để fair hơn.
*Liên quan: TCP congestion control, TCP slow start, RTT*

### CDN cache key
*còn gọi: khóa cache CDN, cache key normalization*

**Vấn đề khiến nó ra đời:** CDN có thể lưu cùng một URL hàng nghìn bản copy khác nhau nếu key không được kiểm soát: query string trùng thứ tự khác nhau (?a=1&b=2 vs ?b=2&a=1), cookie session vô nghĩa, header ngẫu nhiên — mỗi biến thể là một cache entry riêng, phần lớn chỉ hit một lần rồi bị evict, hit rate sập trong khi origin bị gọi liên tục. Đổi scheme SSL hoặc normalize URL sai còn vô tình bust toàn bộ cache.
**Nguồn gốc:** không rõ (khái niệm có ở mọi CDN; ví dụ cấu hình từ docs Cloudflare)
**Giải quyết thế nào:** Cache key = trích xuất có kiểm soát từ request (URL + query đã include/exclude/sort + header được phép + method-override headers). Cloudflare mặc định key theo full URL + Origin + các header forward; header như accept-*/user-agent chỉ cho include khi chỉ định giá trị cụ thể (1-10 giá trị). Best practice: dùng mặc định, exclude query param vô nghĩa, bật URL normalization để tránh cache poisoning, chỉ custom key khi thật sự cần (theo device/geo).
*Liên quan: Vary header / content negotiation cache, DNS TTL caching, HTTP caching với Cache-Control*

### Edge-triggered vs level-triggered
*còn gọi: ET/LT, EPOLLET, sẵn sàng vs chuyển tiếp*

**Vấn đề khiến nó ra đời:** Level-triggered cổ điển liên tục báo lại 'buffer còn data chưa đọc' — mỗi epoll_wait đều trả về dù không có gì mới, tốn CPU xử lý event trùng. Nhưng edge-triggered cực kỳ dễ sai: nếu nhận event mà không đọc hết buffer thì kernel không báo lại → kết nối treo vĩnh viễn, bug khó tìm nhất trong event-driven server.
**Nguồn gốc:** không rõ (epoll hỗ trợ từ đầu 2002; kqueue qua cờ EV_CLEAR)
**Giải quyết thế nào:** Level-triggered: trả về chừng điều kiện còn đúng (giống poll). Edge-triggered: chỉ báo khi CÓ sự kiện mới (data tới, socket đóng); bắt buộc developer phải đọc/ghi tới khi EAGAIN mới nghỉ. Kết hợp với non-blocking để không bao giờ block trong handler.
*Liên quan: epoll, kqueue, Event loop, Reactor pattern*

### Proactor pattern
*còn gọi: mẫu Proactor, completion-based I/O, IOCP*

**Vấn đề khiến nó ra đời:** Reactor vẫn là 'readiness-based': handler phải tự đọc/ghi sau khi báo sẵn sàng — nếu read() chỉ được nửa đường (partial), hoặc thao tác file không theo model readiness, developer phải tự viết state machine nối data. Với I/O thực sự asynchronous của OS (đọc xong mới báo), Reactor không khai thác được và code vẫn rối.
**Nguồn gốc:** Irfan Pyarali, Tim Harrison, Douglas C. Schmidt, Thomas D. Jordan — 'Proactor: An Object Behavioral Pattern...', PLoP '97 (tháng 9/1997)
**Giải quyết thế nào:** Proactor là completion-based: initiator nạp trước thao tác async + completion handler cho OS; khi I/O HOÀN TẤT OS mới gọi handler kèm kết quả (data đã đọc xong), không phải 'sẵn sàng'. Các thành phần: proactive initiator, asynchronous operation processor, completion dispatcher. Reactor vẫn có thể nằm trong Proactor để giải quyết phần blocking I/O.
*Liên quan: Reactor pattern, io_uring, I/O completion ports (IOCP)*

### TCP handshake (three-way handshake)
*còn gọi: bắt tay ba bước, SYN/SYN-ACK/ACK*

**Vấn đề khiến nó ra đời:** Hai bên cần đồng ý số sequence bắt đầu trước khi truyền byte — nếu client gửi dữ liệu ngay, server không biết bắt đầu đếm từ số mấy, không ACK được, không phân biệt được packet cũ của kết nối trước với kết nối mới (xâm phạm an toàn + lẫn lộn). Cần cơ chế hai chiều xác nhận cả hai bên đều sẵn sàng, tránh thêm round-trip thừa.
**Nguồn gốc:** Mô hình TCP trong RFC 793 (9/1981, biên tập Jon Postel); ý tưởng từ Cerf & Kahn 1974.
**Giải quyết thế nào:** Client gửi SYN (số seq random x) → server trả SYN-ACK (ack x+1, seq random y) → client gửi ACK (ack y+1): mỗi bên đều đã xác nhận số sequence của bên kia, tổng đúng 3 packet, trạng thái ESTABLISHED rồi mới truyền dữ liệu.
*Liên quan: TCP, TLS/SSL, HTTP/3 (QUIC), TTFB, SYN flood*

### TTFB
*còn gọi: Time To First Byte, thời gian đến byte đầu tiên*

**Vấn đề khiến nó ra đời:** Khi trang chậm, 'rất chậm' không phân biệt nổi lỗi ở đâu: DNS? TCP+TLS handshake? server code xử lý 2s? Hay chỉ là bandwidth tải body? Dev và team performance cần một con số tách backend ra khỏi mạng để biết phải fix cái gì trước.
**Nguồn gốc:** không rõ (khái niệm đo lường web performance phổ biến từ thập niên 2000, xuất hiện trong các công cụ như YSlow/PageSpeed).
**Giải quyết thế nào:** Đo từ lúc browser gửi request (hoặc bắt đầu navigation) đến lúc nhận byte response đầu tiên — TTFB cao dù file nhỏ ⇒ nghi backend/DB/reverse proxy; TTFB thấp nhưng tải lâu ⇒ nghi bandwidth/kích thước resource. Thường kèm metrics DNS time, connect time, TLS time để chẻ further.
*Liên quan: HTTP, TLS/SSL, TCP handshake, DNS, CDN, Keep-alive*

### Zero-copy (sendfile)
*còn gọi: copy không qua user space, sendfile(2)*

**Vấn đề khiến nó ra đời:** Phục vụ file tĩnh theo cách thông thường: read() kéo data từ page cache vào buffer user-space, rồi write() đẩy ngược từ user-space vào socket — mỗi byte bị sao chép nhiều lần qua biên giới kernel/user, tốn CPU memcpy và chiếm thêm memory bandwidth. Với server serve hàng GB/giây (static files, CDN origin), overhead sao chép trở thành nút thắt CPU.
**Nguồn gốc:** Linux 2.2, glibc 2.1 (sendfile64 thêm ở Linux 2.4 cho file lớn)
**Giải quyết thế nào:** sendfile(in_fd, out_fd) yêu cầu kernel tự chuyển data trực tiếp từ page cache của file sang socket, không đi qua user space. Hạn chế: in_fd phải là file hỗ trợ mmap (không phải socket), file không được sửa đổi khi đang đọc, mỗi lần tối đa ~2GB, không portable — fallback bằng read/write trên EINVAL/ENOSYS. Kết hợp TCP_CORK/MSG_MORE để gộp header.
*Liên quan: C10k problem, Non-blocking I/O, CDN cache key*

## Thiết kế API

### Dedup window
*còn gọi: deduplication window, idempotency window, message dedup*

**Vấn đề khiến nó ra đời:** Trùng event cách nhau vài phút thì check 'đã thấy trong RAM' không còn; lưu mãi thì tốn bộ nhớ - cần cửa sổ thời gian rõ ràng.
**Nguồn gốc:** Thực hành từ pattern idempotent consumer; AWS SQS FIFO có MessageDeduplicationId (cửa sổ 5 phút), Stripe idempotency key giữ 24h.
**Giải quyết thế nào:** Lưu key/event id kèm timestamp trong cửa sổ N (24h với idempotency API, vài phút với MQ). Quá cửa sổ mà message đến nữa thì coi là mới - tradeoff: tăng cửa sổ = tăng bộ nhớ, giảm rủi ro trùng lặp muộn. Cửa sổ phải ≥ thời gian retry tối đa của producer.
*Liên quan: Exactly-once illusion vs at-least-once, Idempotency key (Stripe pattern), Idempotent consumer*

### Exactly-once illusion vs at-least-once
*còn gọi: delivery semantics, at-most-once, effectively-once*

**Vấn đề khiến nó ra đời:** MQ hứa 'exactly-once' khiến team viết code lơ là; thực tế network chia đôi thì consumer xử lý 2 lần, side effect (gửi email, charge) bị lặp.
**Nguồn gốc:** Thuật ngữ delivery semantics trong distributed messaging (xem lại tài liệu Kafka/SQS); không có 1 RFC duy nhất - là khái niệm hệ thống phân tán.
**Giải quyết thế nào:** Transport thực tế chỉ bảo đảm at-most-once (mất) hoặc at-least-once (trùng). Exactly-once end-to-end phải ghép: idempotent consumer (dedup theo event id) + transaction với side effect = 'effectively once'. Stripe: webhook gửi lại là bình thường, consumer phải dedup theo event id.
*Liên quan: Idempotent consumer, Webhook (delivery, retries, signature), Dedup window*

### HATEOAS
*còn gọi: Hypermedia as the engine of application state, hypermedia controls*

**Vấn đề khiến nó ra đời:** Client hardcode URL và luồng chuyển trạng thái (biết trước PUT /orders/5/cancel); server đổi route hay quy tắc nghiệp vụ là client chết, không phân biệt được 'tài nguyên cho phép gì' theo trạng thái.
**Nguồn gốc:** Roy Fielding, luận án 2000 - ràng buộc của uniform interface trong REST. Ví dụ ngân hàng: account bị overdraft thì link 'withdraw' biến mất, chỉ còn 'deposit'.
**Giải quyết thế nào:** Mỗi response kèm link (rel) nói hành động kế tiếp và nơi thực hiện; client đi theo link thay vì nhớ route. Định dạng: JSON-HAL, JSON-LD+Hydra, Siren, Collection+JSON, JSON:API. Thực tế ít API đạt mức này vì JSON không phải hypermedia format tự nhiên như HTML.
*Liên quan: REST, Hyperlink media types, Richardson Maturity Model*

### Idempotency key (Stripe pattern)
*còn gọi: Idempotency-Key header, request deduplication*

**Vấn đề khiến nó ra đời:** POST /charges không idempotent: client timeout rồi retry = charge hai lần; refund sai thì mất tiền thật của khách.
**Nguồn gốc:** Stripe API 'Idempotent requests' - client sinh key (khuyến nghị UUIDv4), gửi header Idempotency-Key; server lưu kết quả lần đầu.
**Giải quyết thế nào:** Lần đầu thực thi và lưu status+body theo key; retry cùng key trả y chang kết quả (kể cả 500). Key ≤255 ký tự, không chứa PII; server prune key ≥24h - sau prune mà dùng lại thì coi là request mới nhưng so tham số, khác thì báo lỗi (chống dùng nhầm). Validation fail hoặc conflict trước khi thực thi thì KHÔNG lưu - được retry. Chỉ áp cho POST; GET/DELETE đã idempotent.
*Liên quan: Idempotency, Exactly-once illusion vs at-least-once, Dedup window*

### Idempotent consumer
*còn gọi: idempotent handler, deduplicating consumer, dedup consumer, inbox pattern, người tiêu thụ bất biến*

**Vấn đề khiến nó ra đời:** At-least-once delivery đảm bảo không mất nhưng đảm bảo trùng; handler charge 2 lần hoặc insert 2 row khi redelivery.
**Nguồn gốc:** Pattern phổ biến trong event-driven microservices (Chris Richardson - Microservices Patterns; liên quan outbox và saga).
**Giải quyết thế nào:** Ghi event id (hoặc business key) đã xử lý trong DB (unique constraint) trước/с cùng side effect trong 1 transaction; lần sau thấy id trùng thì skip. Webhook Stripe hướng dẫn log event id rồi bỏ qua id đã có. Đôi khi kết hợp natural idempotency (UPSERT theo business key).
*Liên quan: Exactly-once illusion vs at-least-once, Outbox pattern, Webhook (delivery, retries, signature), Idempotency, Exactly-once semantics, Transactional outbox*

## Cơ sở dữ liệu & Lưu trữ

### Backward compatibility (schema)
*còn gọi: tương thích ngược, expand-contract*

**Vấn đề khiến nó ra đời:** Rolling deploy giữa lúc schema đổi làm bản code cũ đọc hoặc ghi lỗi.
**Giải quyết thế nào:** Mở rộng trước (thêm cột nullable), migrate dữ liệu, code mới chạy trước rồi mới gỡ cột cũ.
*Liên quan: Schema migration, Forward engineering*

### BASE / Eventual consistency
*còn gọi: BASE, eventual consistency, nhất quán cuối cùng, basically available soft state*

**Vấn đề khiến nó ra đời:** Với tải ghi toàn cầu (multi-region, triệu request/giây), buộc mọi nút đồng bộ đồng thời (strong consistency) thì latency liên miền tăng hàng trăm ms và hệ thống dễ sập khi 1 region chết — ACID đánh đổi availability lấy đúng, không phù hợp khi availability là yêu cầu sinh tồn.
**Nguồn gốc:** Thuật ngữ BASE do Danny Pritchett (eBay) phổ biến trong "BASE: An Acid Alternative" (ACM Queue, 2008); ý tưởng eventual consistency đi kèm hệ Dynamo (Amazon, 2007)
**Giải quyết thế nào:** BASE: Basically available (luôn trả lời được), Soft state (trạng thái có thể thay đổi không cần input), Eventual consistency (các nốt cùng kết quả khi ngừng ghi) — replica nhận ghi bất đồng bộ, chấp nhận đọc cũ trong khoảng trễ. DNS/email là ví dụ kinh điển.
*Liên quan: CAP theorem, PACELC, Multi-master replication*

### CAP theorem
*còn gọi: định lý CAP, Brewer's conjecture, Consistency-Availability-Partition tolerance, CAP, nguyên lý CAP*

**Vấn đề khiến nó ra đời:** Hệ phân tán chạy nhiều node, mạng giữa chúng chắc chắn sẽ chập chờn (mất gói, partition). Lúc partition xảy ra, ta muốn vừa trả lời mọi request (Availability) vừa đảm bảo mọi client thấy dữ liệu mới nhất (Consistency) — định lý chỉ ra không thể đồng thời, nên kiến trúc phải chọn thay vì mơ có tất cả.
**Nguồn gốc:** Eric Brewer đưa ra giả thuyết 1998/2000 (PODC); Seth Gilbert & Nancy Lynch (MIT) chứng minh năm 2002
**Giải quyết thế nào:** Khi partition: chọn C (từ chối request để giữ nhất quán — CP) hoặc chọn A (phản hồi dữ liệu có thể cũ — AP). Mọi quyết định thiết kế NoSQL/replication đều nằm quanh tradeoff này.
*Liên quan: PACELC, BASE / eventual consistency, Replication (master-slave / read replica), Eventual consistency, Split brain & quorum, Linearizability*

### Cardinality estimation
*còn gọi: ước lượng số dòng*

**Vấn đề khiến nó ra đời:** Ước sai số dòng làm chọn nhầm thứ tự join, plan xấu đi theo cấp số nhân.
**Giải quyết thế nào:** Dùng histogram, số giá trị distinct và phỏng tuyến tính để dự đoán kết quả; thống kê sai là nguyên nhân plan tồi phổ biến.
*Liên quan: Cost-based optimizer, Index, Query planner*

### Cost-based optimizer
*còn gọi: CBO, tối ưu theo chi phí*

**Vấn đề khiến nó ra đời:** Tối ưu theo quy tắc chọn plan theo thứ tự viết SQL, không tính đặc điểm dữ liệu nên hay chọn sai.
**Nguồn gốc:** System R, Selinger và cộng sự, 1979
**Giải quyết thế nào:** Tính chi phí I/O và CPU cho từng plan dựa trên thống kê bảng và index, chọn tổng chi phí thấp nhất.
*Liên quan: Query planner, Cardinality estimation, JOIN algorithms (nested loop / hash / sort-merge)*

### Geospatial index
*còn gọi: chỉ mục địa lý, spatial index, R-tree, geohash, H3, quadtree, PostGIS*

**Vấn đề khiến nó ra đời:** Tìm "nhà hàng trong bán kính 5km" trên bảng triệu điểm mà WHERE lat/lon so sánh range thì không đủ — lat/lon là 2 chiều, phải quét O(n) mọi điểm rồi tính khoảng cách từng cái, tốn hàng giây và sai vì lat/lon không linear (1 độ lon khác nhau theo vĩ độ).
**Nguồn gốc:** R-tree: Antonin Guttman, 1984 (paper gốc UC Berkeley). Geohash: Gustavo Niemeyer, 2008
**Giải quyết thế nào:** Chỉ mục không gian (R-tree gộp bounding box theo cây, quadtree, geohash/H3 mã hoá toạ độ thành chuỗi prefix) cho phép query theo vùng (ST_DWithin, CONTAINS) chỉ chạm các vùng không gian liên quan — giảm từ O(n) xuống gần O(log n).
*Liên quan: GIN / GiST, Index (B-tree, hash, composite), Query plan / EXPLAIN*

### GIN / GiST index
*còn gọi: generalized inverted index, generalized search tree, inverted index, PostgreSQL GIN, PostgreSQL GiST*

**Vấn đề khiến nó ra đời:** B-tree không phục vụ được kiểu truy vấn "chứa", "giao", "toạ độ gần": WHERE tags @> '{db}' (mảng chứa phần tử), full-text search 'apple & banana', tìm điểm trong vùng... — dữ liệu JSONb/array/full-text ngày càng nhiều mà B-tree sinh ra cho so sánh thứ tự của 1 giá trị scalar.
**Nguồn gốc:** GiST: Hellerstein, Naughton & Pfeiffer, 1998 ("Generalized Search Trees for Database Systems"). GIN: O'Neil, Cheng, Gawlick & O'Neil, 2006 ("The GIN Inverted Index")
**Giải quyết thế nào:** GIN (inverted): index theo từng phần tử bên trong giá trị phức (mỗi tag/array element dẫn về danh sách row chứa nó) — trả lời "chứa X" gần O(log n). GiST: khung search tree tổng quát chứa cả R-tree (spatial), trigram... dùng cho nearest-neighbor, containment. Postgres chọn type bằng USING clause.
*Liên quan: Index (B-tree, hash, composite), Geospatial index, Query plan / EXPLAIN*

### LSM tree
*còn gọi: Log-Structured Merge Tree*

**Vấn đề khiến nó ra đời:** Ghi ngẫu hứng lên B+tree tạo random I/O chậm, khó scale khi workload ghi nhiều.
**Nguồn gốc:** Patrick O'Neil, 1996
**Giải quyết thế nào:** Ghi tuần tự vào memtable rồi flush thành SSTable, compaction gộp bản ghi; ghi nhanh, đổi lấy chi phí đọc và nền compaction.
*Liên quan: B+tree, Index, WAL*

### Multi-master replication
*còn gọi: multi-primary, master-master, đa master ghi*

**Vấn đề khiến nó ra đời:** Master-slave: master chết thì chỉ nhận read, không ghi được (hoặc failover trễ gây downtime ghi); ghi cho người dùng châu Á phải về master ở Mỹ — latency ghi cao. 1 nút ghi duy nhất là single point of failure và bottleneck địa lý.
**Nguồn gốc:** Không rõ tác giả — có trong các clustered DB thương mại (Oracle RAC, MySQL multi-master) từ thập niên 2000
**Giải quyết thế nào:** Nhiều nút cùng nhận ghi, đồng bộ sang nhau; node nào chết thì client chuyển node khác. Vấn đề mới sinh ra: conflict resolution — 2 nút cùng sửa 1 dòng thì phân giải thế nào (last-write-wins, vector clock, CRDT)? Dễ vi phạm ACID hơn, thường phải chấp nhận eventual consistency.
*Liên quan: Replication (master-slave / read replica), Split brain, BASE / eventual consistency*

### MVCC
*còn gọi: Multi-Version Concurrency Control*

**Vấn đề khiến nó ra đời:** Lock đọc-ghi truyền thống làm mọi đọc phải chờ ghi và ngược lại, bóp nghẹt throughput.
**Giải quyết thế nào:** Mỗi transaction thấy một snapshot; bản ghi giữ nhiều phiên bản kèm XID nên đọc không phải chờ ghi.
*Liên quan: Snapshot isolation, WAL, Isolation level*

### MVCC (Multiversion Concurrency Control)
*còn gọi: điều khiển đồng thời đa phiên bản, snapshot isolation*

**Vấn đề khiến nó ra đời:** Với locking đơn thuần, reader chặn writer và ngược lại — transaction đọc dài (báo cáo) giữ lock làm writer chờ hàng giây, hoặc transaction ghi lâu làm reader chờ. Dưới tải nhiều client, lock contention làm throughput sập; đọc được dữ liệu nửa vời của transaction chưa commit thì hỏng consistency.
**Nguồn gốc:** David P. Reed, dissertation MIT 1978; chi tiết hóa bởi Phil Bernstein & Goodman (1981); sản phẩm thương mại đầu tiên VAX Rdb/ELN (DEC, 1984, Jim Starkey)
**Giải quyết thế nào:** Mỗi ghi tạo version mới thay vì ghi đè; mỗi transaction thấy snapshot dữ liệu tại thời điểm bắt đầu — reader không chặn writer, writer không chặn reader. Version cũ được VACUUM/garbage-collect khi không transaction nào còn thấy. Đánh đổi: tốn storage + overhead dọn dẹp.
*Liên quan: Isolation level, Lock & deadlock, WAL*

### PACELC
*còn gọi: PACELC theorem*

**Vấn đề khiến nó ra đời:** CAP chỉ nói về lúc có partition — nhưng partition hiếm, phần lớn thời gian hệ thống chạy bình thường, khi đó vẫn phải chọn giữa latency và consistency (đọc từ replica trả lời nhanh nhưng có thể cũ; đợi replica đồng bộ thì đúng nhưng chậm). CAP không mô tả đánh đổi này nên kiến trúc đánh giá chưa đủ.
**Nguồn gốc:** Daniel Abadi (Yale University) — blog 2010, paper làm rõ 2012; chứng minh hình thức bởi Wojciech Golab, ACM SIGACT News 2018
**Giải quyết thế nào:** If Partition thì chọn A hay C; Else (không partition) thì chọn L (latency) hay C. Bắt trọn 4 kịch bản: PA/EL (Dynamo-style), PC/EC (transaction DB)... Chọn P/C/A/L cho đúng case thật thay vì label CP/AP chung chung.
*Liên quan: CAP theorem, BASE / eventual consistency, Replication (master-slave / read replica)*

### Sharding
*còn gọi: phân mảnh dữ liệu, phân vùng ngang*

**Vấn đề khiến nó ra đời:** Một node hết dung lượng và hết sức xử lý, còn tăng cấp dọc thì đắt.
**Giải quyết thế nào:** Chia bảng theo hàng dựa trên shard key sang nhiều node, mỗi node giữ phần dữ liệu và gánh phần tải.
*Liên quan: Consistent hashing, Replication (sync/async)*

### Sharding & consistent hashing
*còn gọi: phân mảnh phân tán, shard, consistent hashing, hash partitioning*

**Vấn đề khiến nó ra đời:** 1 node DB chạm giới hạn ghi/RAM/disk — thêm read replica chỉ giải load đọc, còn ghi vẫn kẹt 1 nơi. Đặt hết data 1 máy thì không scale write và chết là mất sạch. Hash data theo mod N node thì đổi N (thêm/bớt node) là phải remap gần toàn bộ key — không mở rộng nổi.
**Nguồn gốc:** Consistent hashing: David Karger et al. (MIT), 1997. Sharding: thuật ngữ phổ biến cộng đồng MySQL scalability đầu thập niên 2000 — không rõ tác giả duy nhất
**Giải quyết thế nào:** Sharding: chia data thành shard theo shard key, mỗi shard 1 DB riêng, thêm node = thêm shard. Consistent hashing: key và node cùng nằm trên vòng hash, node chết/thêm chỉ ảnh hưởng key của node đó (~1/N) thay vì remap tất cả. Đánh đổi: JOIN cross-shard khó, hot shard, rebalancing phức tạp.
*Liên quan: Partitioning (horizontal / vertical), CAP theorem, Split brain*

### Slotted page
*còn gọi: trang có bảng slot*

**Vấn đề khiến nó ra đời:** Trang chứa bản ghi biến đổi độ dài, chèn xóa làm fragment hóa và không xác định được vị trí bản ghi.
**Giải quyết thế nào:** Header giữ mảng slot trỏ tới offset từng bản ghi; xóa chỉ đánh dấu, slot được sắp lại để gom khoảng trống.
*Liên quan: Page, Heap file, B-tree*

### Snapshot isolation
*còn gọi: SI, cô lập snapshot*

**Vấn đề khiến nó ra đời:** Serializable quá mạnh làm chặn nhiều, còn Read Committed vẫn cho write skew.
**Nguồn gốc:** Berenson, 1995
**Giải quyết thế nào:** Transaction đọc theo snapshot đầu phiên; ghi trùng version còn sống bị abort, đầu tiên commit thắng.
*Liên quan: MVCC, Isolation level, Two-phase locking (2PL)*

### Split brain
*còn gọi: chia não, split-brain, network partition giữa 2 nút*

**Vấn đề khiến nó ra đời:** Hai nút trong cluster mất liên lạc với nhau nhưng cả hai vẫn sống và phục vụ client (mỗi nút nghĩ đối phương chết) — cả hai cùng nhận ghi làm dữ liệu phân nhánh: 2 phiên bản mâu thuẫn của cùng 1 record, khi heal mạng lại không biết bản nào đúng, resolve sai là mất dữ liệu.
**Nguồn gốc:** Không rõ tác giả — thuật ngữ từ hệ thống phân tán/cluster (thập niên 1990-2000, gắn với cao availability clustering và nghiên cứu quorum/Paxos)
**Giải quyết thế nào:** Quorum/majority (nút chỉ serve khi thấy đủ số nút còn sống), fencing (STONITH — kill node cũ trước khi cấp quyền nút mới), lease/epoch number để chặn nút "chết đi sống lại" ghi đè. Tránh để cả 2 cùng active-write.
*Liên quan: Two-phase commit, Multi-master replication, CAP theorem*

### Two-phase commit (2PC)
*còn gọi: giao dịch hai pha, 2PC, XA transaction*

**Vấn đề khiến nó ra đời:** Transaction cần ghi trên 2 DB khác nhau (đặt vé + trừ ví điện tử): nếu commit DB A rồi crash trước khi commit DB B thì dữ liệu 2 nơi mâu thuẫn vĩnh viễn — không cơ chế nào tự biết phía bên kia đã làm gì.
**Nguồn gốc:** Không xác minh được tác giả/năm trực tiếp từ nguồn chính thức (thường được nhắc cùng văn bản Jim Gray/IBM thập niên 1970-80)
**Giải quyết thế nào:** Pha 1 (prepare): coordinator hỏi mọi participant đã sẵn sàng chưa, participant ghi WAL sẵn commit nhưng chưa làm; pha 2: tất cả trả YES thì coordinator ra lệnh commit, có 1 nơi NO thì rollback tất cả. Đánh đổi lớn: protocol blocking — coordinator chết thì participant kẹt giữ lock chờ vô hạn.
*Liên quan: Transaction & ACID, WAL, Split brain*

### Two-phase locking (2PL)
*còn gọi: 2PL, hai pha khóa*

**Vấn đề khiến nó ra đời:** Cần cách chứng minh lịch song song đúng isolation mà không cấm hẳn đồng thời.
**Nguồn gốc:** Eswaran và cộng sự, 1976
**Giải quyết thế nào:** Pha lấy khóa không giải phóng, pha giải phóng không lấy thêm; giữ khóa đến commit thì được serializable.
*Liên quan: Isolation level, Deadlock detection, Snapshot isolation*

## Caching & Hiệu năng

### Backpressure
*còn gọi: áp suất ngược, khối áp lực ngược, flow control, buffering, buffer*

**Vấn đề khiến nó ra đời:** Producer bắn dữ liệu nhanh hơn consumer xử lý (stream log, message queue đầy, HTTP client quá mạnh) — buffer tràn RAM, message rơi mất, hoặc hệ thống sập dần theo kiểu congestion collapse: càng nhận nhiều càng xử lý chậm rồi treo.
**Nguồn gốc:** Thuật ngữ gốc từ thủy lực (điện khí học); không rõ ai đưa vào hệ thống phân tán trước tiên — spec Reactive Streams (2015) chuẩn hóa ở tầng API
**Giải quyết thế nào:** Consumer báo ngược lại producer 'chậm lại' (bounded queue → 503/HTTP 429, credit-based flow control của Reactive Streams/TCP window) — hệ thống tự điều tiết về mức chịu được thay vì sập; kèm exponential backoff + jitter ở client.
*Liên quan: Queue, Latency vs throughput, Batching, Debounce & throttle, Message queue, Stream processing vs batch, Apache Kafka*

### Cache penetration / breakdown / thundering herd
*còn gọi: cache penetration, cache breakdown, cache avalanche, cache stampede, dog-piling*

**Vấn đề khiến nó ra đời:** Ba kiểu sập cache theo kiểu khác nhau: (1) penetration — attacker hoặc bug query key không tồn tại ở cả cache lẫn DB (id=-1) nên mọi request đều miss, DB nhận toàn bộ traffic; (2) breakdown — một key hot vừa hết hạn, nghìn request đồng loạt miss cùng lúc cùng recompute; (3) avalanche — hàng nghìn key TTL giống hệt nhau hết hạn cùng một thời điểm. Kết quả: hit rate về 0, DB chết tải, có thể cascade sập toàn hệ thống (ví dụ render 3s × 10 req/s = 30 process tính đồng thời).
**Nguồn gốc:** Cache stampede có trong Jargon File; 3 thuật ngữ 'penetration/breakdown/avalanche' phổ biến trong cộng đồng kỹ thuật Trung Quốc (Alibaba/Meituan blogs); giải pháp probabilistic early expiration: Vattani et al., 2015
**Giải quyết thế nào:** Penetration: Bloom filter chặn key không tồn tại + cache negative result với TTL ngắn. Breakdown: mutex/single-flight chỉ 1 process recompute, phần còn chờ hoặc trả stale. Avalanche: TTL jitter ngẫu nhiên (không set trùng nhau) + probabilistic early expiration (Vattani et al. 2015 chứng minh phân phối mũ là tối ưu) + circuit breaker.
*Liên quan: Thundering herd, TTL, Hot key, Cache-aside, Single flight*

### Hot key
*còn gọi: khóa nóng, hotspot key*

**Vấn đề khiến nó ra đời:** Một key (sản phẩm flash-sale, tweet của người nổi tiếng) nhận hàng chục nghìn query/giây — dù đã cache, 1 Redis node duy nhất chứa key đó trở thành bottleneck CPU/network; xóa cache để refresh thì lập tức thousand-threads stampede cùng đọc DB.
**Nguồn gốc:** không rõ (bài toán hotspot phổ biến trong blog kỹ thuật Trung Quốc và tài liệu vận hành Redis/MySQL)
**Giải quyết thế nào:** Phân tán hot key: replica nhiều bản local (local cache + TTL ngắn), thêm random suffix rời rộ (key-1..key-N), hash về nhiều shard node, hoặc read replica DB cho key đó — chia đều tải thay vì để một điểm nóng gánh tất cả.
*Liên quan: Cache penetration / breakdown / thundering herd, Redis, Hot path, Connection pool*

### Hot path
*còn gọi: đường nóng, critical path hiệu năng*

**Vấn đề khiến nó ra đời:** Một request đi qua 30 lớp (auth, log, validate, 5 service call, serialize) nhưng chỉ 5% thời gian nằm ở đoạn tính toán — tối ưu nhầm đoạncold path vô ích, còn hot path (mỗi request đều đi qua, chiếm phần lớn latency) không ai động tới.
**Nguồn gốc:** không rõ
**Giải quyết thế nào:** Xác định đoạn code/request path chiếm phần lớn thời gian (qua tracing/profiling) rồi tối ưu tập trung đúng đó: cache kết quả, bỏ I/O thừa, giảm allocation — 80/20 của performance engineering; phần còn lại để nguyên.
*Liên quan: Profiling, Benchmark, Memoization, latency vs throughput*

### Materialized view
*còn gọi: view vật lý hóa, indexed view, view vật lý, precomputed view, bảng tổng hợp*

**Vấn đề khiến nó ra đời:** Báo cáo phải JOIN 5 bảng + GROUP BY triệu row mỗi lần chạy — query nặng lặp lại hàng giờ, BI team chờ mỏi, và view thường thì mỗi lần truy vấn vẫn tính lại toàn bộ.
**Nguồn gốc:** Oracle Database là hệ đầu tiên implement (trước đó gọi là snapshots); PostgreSQL native từ 9.3 (2013)
**Giải quyết thế nào:** Lưu kết quả query thành bảng vật lý thật (có index riêng), refresh định kỳ hoặc CONCURRENTLY — đọc báo cáo gần như tức thì; đánh đổi là data cũ theo chu kỳ refresh và tốn thêm disk. Oracle đi đầu (gọi trước là 'snapshots', query rewrite từ 8i), Postgres hỗ trợ từ 9.3, SQL Server gọi là Indexed Views (2000).
*Liên quan: Precomputation, Cache, Materialized view vs cache, Memoization, Denormalization, Replication (master-slave / read replica), Query plan / EXPLAIN*

### Precomputation
*còn gọi: tính trước, precompute*

**Vấn đề khiến nó ra đời:** Dashboard phải aggregate hàng triệu dòng mỗi lần mở (top seller, feed score) — query 3-5 giây, user chờ không nổi, và mỗi request đều tính lại y hệt kết quả cho dữ liệu gần như không đổi.
**Nguồn gốc:** không rõ
**Giải quyết thế nào:** Tính toán trước kết quả khi dữ liệu thay đổi (cron job, trigger, stream processor) rồi lưu lại; request chỉ đọc thành phẩm O(1) — đổi lấy độ trễ cập nhật (staleness window) và chi phí lưu trữ/refresh job.
*Liên quan: Materialized view, Memoization, Batching, Cache*

### Profiling
*còn gọi: chạy hồ sơ hiệu năng, CPU profile*

**Vấn đề khiến nó ra đời:** API chậm nhưng 'code nhìn không có gì nặng' — tối ưu mù các dòng code cảm tính (micro-optimize vòng lặp nhỏ) trong khi bottleneck thật là mộtregex compile lại mỗi request hoặc GC pause 200ms. Không profile thì tối ưu kiểu mò kim đáy bể.
**Nguồn gốc:** không rõ (profiler có từ hệ thống mainframe; flame graph do Brendan Gregg phổ biến năm 2011)
**Giải quyết thế nào:** Đo thật: CPU profile (sampling flame graph tìm hàm chiếm % CPU), memory profile (leak, allocation rate), wall-clock/race detector — chỉ ra chính xác dòng code tiêu tốn tài nguyên, tối ưu đúng chỗ rồi đo lại để xác nhận.
*Liên quan: Hot path, Benchmark, Hot key*

## Hiệu năng

### BBR congestion control
*còn gọi: BBR, Bottleneck Bandwidth and RTT, model-based congestion control*

**Vấn đề khiến nó ra đời:** Cubic/Reno đo xung đột bằng packet loss, nhưng mạng modern (WiFi, mobile, đường truyền đầy) mất tín hiệu: buffer đầy 100-500ms mới drop → throughput cao nhưng latency phình kinh khủng (bộ đệm đọng).
**Nguồn gốc:** Nhóm BBR của Google (Neal Cardwell, Yuchung Cheng, Soheil Hassas Yeganeh, Van Jacobson), công bố rộng năm 2016 (ACM Queue + list bbr-dev, github.com/google/bbr)
**Giải quyết thế nào:** Ước tính 2 tham số: bottleneck bandwidth (BtlBw) và minimum RTT (RTprop) bằng delivery rate, rồi giữ cwnd ≈ BtlBw × RTprop (BDP) — gửi đủ để lấp ống nhưng không phình buffer. Gồm 4 giai đoạn: Startup (slow start gain), Drain, ProbeBW, ProbeRTT. Ít loss hơn, latency ổn định hơn trong nhiều thực nghiệm Google/Cloudflare.
*Liên quan: Slow start, Bufferbloat, Bandwidth vs latency*

### cgroup limits, CPU throttling & noisy neighbor
*còn gọi: CFS throttling, cpu.max, container CPU limit, noisy neighbor, steal time*

**Vấn đề khiến nó ra đời:** Container có limit 1 CPU nhưng code dùng hết quota mỗi kỳ scheduler (100ms) rồi bị CFS throttle đến hết kỳ — latency nhảy vọt dù CPU trung bình chỉ 60%, hoặc VM trên cùng host bị 'steal time' do tenant khác.
**Nguồn gốc:** CFS bandwidth control (throttle theo quota) do Paul Turner và cộng sự phát triển cho Linux — từ cuối thập niên 2000/2010; 'noisy neighbor' là thuật ngữ cloud phổ biến từ ~2010s
**Giải quyết thế nào:** cgroup v2 cpu.max = quota/period; vượt quota → runnable nhưng bị dừng (throttled, cfs_throttled_count tăng). Noisy neighbor: hypervisor/shared storage contention làm steal/latency tăng không do code. Xử lý: period lớn hơn GC spike, tránh limit quá sát, monitor throttled_usec và steal, chọn dedicated/host resources khi cần.
*Liên quan: CPU pinning, Performance budget, SLO-driven optimization*

### Coordinated omission
*còn gọi: omission được điều phối, Gil Tene coordinated omission*

**Vấn đề khiến nó ra đời:** Benchmark gửi request theo lịch cố định; khi server kẹt 10 giây, client 'bỏ lỡ' hàng trăm lần gửi, các lần gửi tiếp theo chỉ đo được latency khi hệ thống đã hồi phục — số liệu đẹp hoàn toàn giả.
**Nguồn gốc:** Gil Tene (Azul Systems), talk 'How NOT to Measure Latency', QCon San Francisco 2015
**Giải quyết thế nào:** Lỗi đo lường: thời gian bị miss không được ghi nhận nên histogram thiếu đúng các mẫu xấu nhất. Cách sửa: bắn request theo lịch trình đều từ thời điểm cố định (open-loop load gen, như wrk2/hdrhistogram ' coordinated omission correction'), hoặc ghi lại cả khoảng trống vào histogram để percentile phản ánh đúng trải nghiệm.
*Liên quan: HDR Histogram, Tail latency, Microbenchmark*

### False sharing
*còn gọi: chia sẻ ảo, false sharing cache*

**Vấn đề khiến nó ra đời:** Bốn thread cộng biến đếm riêng trên cùng một mảng nguyên – mỗi luồng 'chỉ sở hữu' một phần, nhưng hiệu năng tụt 4-10x vì core liên tục giành lại cùng một cache line.
**Giải quyết thế nào:** Cache chia sẻ theo cache line (thường 64 byte); hai biến độc lập nằm chung một dòng cache bị invalidate liên tục khi core khác ghi. Fix: pad biên mảng/struct cho đủ cache line, tách biến hot của các thread ra xa, dùng per-thread counter rồi giảm ở cuối.
*Liên quan: CPU cache line, Cache locality, NUMA*

### fsync cost & SSD vs HDD latency
*còn gọi: fsync, durability, độ trễ ghi bền, SSD latency, fsync fdatasync*

**Vấn đề khiến nó ra đời:** WAL ghi mỗi transaction kèm fsync: HDD tốn ~5-15ms mỗi lần (seek), SSD ~0.05-0.5ms — cùng code, cùng ổ 'đĩa', khác HDD thì throughput chỉ vài trăm ghi/giây.
**Giải quyết thế nào:** fsync đảm bảo dữ liệu trong cache trang đã về thiết bị bền (power-loss safe); overhead chủ yếu do seek/commit internal của ổ. Tối ưu: group commit (gộp fsync nhiều transaction), ghi log tuần tự thay vì random, fdatasync khi metadata không đổi, dùng NVMe/PLP SSD cho OLTP. Benchmark phải đo cả mixed workload với QD thực.
*Liên quan: Disk IOPS, Zero-copy, Write amplification*

### Head-of-line blocking
*còn gọi: HOL blocking, đầu hàng bị chặn, queue head blocking, chặn đầu hàng, chặn hàng đầu, đứng hàng đầu dòng*

**Vấn đề khiến nó ra đời:** Một packet mất trên đường truyền khiến request A chưa xong kéo theo B, C (không liên quan) chờ dù chúng hoàn toàn sẵn sàng — HTTP/2 'multiplexing' vẫn chậm sau một loss.
**Nguồn gốc:** Hiện tượng đã được mô tả trong networking hàng thập niên; trở nên nổi bật với HOL của HTTP/1.1 pipelining và HOL của HTTP/2-over-TCP
**Giải quyết thế nào:** Hàng đợi chỉ dịch chuyển khi phần tử đầu xử lý xong. HTTP/1.1: response đến theo thứ tự nên response chậm chặn response nhanh (giải quyết bằng nhiều connection/pipelining có giới hạn). HTTP/2: gỡ HOL ứng dụng nhưng giữ HOL vận chuyển ở tầng TCP. HTTP/3 (QUIC) tách stream riêng — loss của stream này không chặn stream khác.
*Liên quan: HTTP/2 multiplexing, Head-of-line, BBR, Queue Backpressure, Thread Pool Sizing, Tail Latency, Bottleneck Analysis, TCP, HTTP/2, HTTP/3 (QUIC), UDP, Multiplexing*

### io_uring
*còn gọi: Linux async I/O, io_uring SQE CQE, async syscall Linux, io_uring SQ/CQ*

**Vấn đề khiến nó ra đời:** Mô hình epoll + read/write vẫn tốn syscall cho từng bước (submit, complete), và AIO cổ điển của Linux chỉ hỗ trợ I/O đĩa không làm được socket/nhánh khác — server rất nhanh nhưng bị bottleneck ở chuyển ngữ cảnh.
**Nguồn gốc:** Jens Axboe, giới thiệu trong Linux 5.1 (2019) — theo kernelnewbies.org/Linux_5.1
**Giải quyết thế nào:** Hai vòng shared memory (submission queue / completion queue) giữa user và kernel: xếp hàng nhiều request I/O (read/write/accept/timeout...) mà không cần syscall mỗi cái, batch submit/batch reap, đăng ký fixed buffer và fd. Giảm syscall + cache-line ping-pong, đạt throughput I/O cao với ít luồng.
*Liên quan: Syscall batching, Zero-copy, Event loop, Proactor pattern, Non-blocking I/O, epoll, Context switch cost*

### NUMA & CPU pinning
*còn gọi: non-uniform memory access, numactl, CPU affinity, core pinning, isolcpus*

**Vấn đề khiến nó ra đời:** Process ghi dữ liệu từ node 0 nhưng thread chạy ở node 1: mỗi truy cập RAM phải qua QPI/UPI interconnect — hiệu năng tụt 10-30% khó hiểu vì 'cùng một máy'.
**Giải quyết thế nào:** NUMA: mỗi socket có RAM cục bộ; truy cập remote node chậm hơn (độ trễ khác nhau — 'không đều'). Tối ưu: numactl --cpunodebind/--membind, thread pool locality theo socket,allocate gần CPU xử lý. CPU pinning (taskset/cgroup cpuset) tránh di chuyển thread → cache ấm, jitter giảm; hữu ích cho hot path và benchmark.
*Liên quan: False sharing, Context switch cost, Huge page*

### Page fault, swap & OOM killer
*còn gọi: page fault, major/minor fault, swapping, OOM killer, out of memory*

**Vấn đề khiến nó ra đời:** Dịch vụ đột nhiên treo 1-2 giây rồi bị kill (exit 137) khi container chạm limit: trang bị trục xuất ra swap hoặc OOM killer chọn kill process.
**Giải quyết thế nào:** Page fault: truy cập trang chưa nạp — minor (cập nhật bảng trang), major (đọc từ disk, hàng ms). Swap/region trục xuất: fault major khi truy cập lại → latency spike. OOM: kernel/cgroup vượt bộ nhớ → kill process (oom_score). Xử lý: bật/đo memory.swap, giới hạn heap rõ ràng, tránh overcommit liều, set memory request/limit hợp lý.
*Liên quan: Cgroup limits, NUMA, Stop-the-world*

### Regression detection trong benchmark & A/B perf testing
*còn gọi: performance regression, perf A/B test, canary benchmark, benchmark CI*

**Vấn đề khiến nó ra đời:** Hàng trăm commit mỗi tuần, mỗi commit thêm vài % overhead tích lũy — không ai phát hiện đến khi hệ thống chậm gấp đôi sau 3 tháng.
**Giải quyết thế nào:** Chạy benchmark cố định (máy chuyên dụng hoặc container có pin CPU) trên mỗi commit/PR, so sánh với baseline bằng test thống kê (không chỉ so 1 con số), cảnh báo vượt ngưỡng noise. A/B perf: song song 2 version trên cùng traffic/workload, so p50/p99 với CI. Kết hợp canary deploy + synthetic probe production.
*Liên quan: Statistical significance in benchmarks, Microbenchmark, Capacity test*

### Tail latency
*còn gọi: độ trễ đuôi, tail latency at scale, p99 latency, latency tail*

**Vấn đề khiến nó ra đời:** Hệ thống hàng nghìn máy có request phải chờ nhiều service: dù mỗi service chỉ 1% request chậm, fan-out 100 nhánh khiến xác suất ít nhất 1 nhánh chậm là ~63%, user thấy chậm thường xuyên hơn nhiều so với con số p99 từng service.
**Nguồn gốc:** Jeff Dean & Luis Barroso, 'The Tail at Scale', ACM CACM tháng 3/2013
**Giải quyết thế nào:** Đo và đặt ngân sách cho phần đuôi phân phối (p99/p99.9) thay vì trung bình. Kiến trúc giảm tail: hedged request (gửi bản sao sau ngưỡng trễ), tách cụm riêng cho tenant chậm, ưu tiên request, giảm fan-out. Theo đuôi qua histogram, không qua mean.
*Liên quan: Phân vị p50/p95/p99, Fan-out, Latency histogram, Head-of-Line Blocking, Latency SLO, Deadline Propagation*

### TLS handshake cost, session resumption, OCSP stapling
*còn gọi: TLS handshake, session resumption, OCSP stapling, 0-RTT, session ticket*

**Vấn đề khiến nó ra đời:** TLS 1.2 full handshake thêm 2 RTT (+ chứng chỉ vài KB) mỗi kết nối mới; OCSP check riêng làm chậm thêm; client ở đường truyền 200ms thấy chậm rõ rệt.
**Nguồn gốc:** OCSP stapling mô tả tại RFC 6960 (2013) và RFC 6066 (session ticket, 2011)
**Giải quyết thế nào:** Session resumption (session ID/ticket TLS 1.2, PSK TLS 1.3) bỏ đi phần trao đổi chứng chỉ. TLS 1.3 rút handshake còn 1-RTT (0-RTT với replay risk). OCSP stapling: server tự staple phản hồi OCSP tươi (CRL/OCSP check) thay vì browser tự hỏi CA — giảm 1 chu kỳ mạng và lỗi CA-down.
*Liên quan: TLS handshake cost, Keep-alive, Speed of light RTT*

### Warmup & statistical significance trong benchmark
*còn gọi: warm-up, độ tin cậy thống kê, confidence interval benchmark, noise floor*

**Vấn đề khiến nó ra đời:** So sánh 2 commit, bản A nhanh hơn 3% rồi 'merge đi' — chạy lại 10 lần thì khác biệt nằm trong noise, rồi 'performance regression' ảo kéo dài hàng tuần.
**Giải quyết thế nào:** Warmup: cho JIT/OS/page cache/branch predictor ổn định trước khi đo (JVM, DB buffer pool). Ý nghĩa thống kê: chạy đủ mẫu (n≥10-30), loại outlier có lý do, tính CI/p-value hoặc ít nhất là overlap của median±IQR; ngưỡng regression phải vượt noise floor đo được (vd >5% và CI không giao).
*Liên quan: Microbenchmark, Regression detection in benchmarks, JIT warmup*

### Zero-copy file: mmap & huge page
*còn gọi: memory-mapped file, mmap, huge pages, transparent huge pages*

**Vấn đề khiến nó ra đời:** Đọc file lớn rồi copy vào buffer user (read+memcpy 2 lần), hoặc cấu trúc dữ liệu khổng lồ bị TLB miss liên tục do trang 4KB thông thường.
**Giải quyết thế nào:** mmap: map file vào vùng địa chỉ, page fault nạp trang khi chạm (không copy explicit) — tiện cho random access, nhưng page fault first-touch và writeback bất ngờ có thể gây spike. Huge page (2MB/1GB) giảm số entry TLB và fault overhead; THP Linux cần kiểm tra vì compaction có thể gây pause. Tradeoff: mmap phức tạp với I/O đồng bộ và invalidate.
*Liên quan: Page fault, NUMA, Zero-copy*

## Phân tán & Đồng thời

### Actor model, CSP & goroutine
*còn gọi: actor model, CSP, Communicating Sequential Processes, goroutine, channel, Go scheduler*

**Vấn đề khiến nó ra đời:** Shared-memory concurrency quá dễ sai: mutation ẩn sau mỗi lock, deadlock/starvation khó tìm, khó test. Các hệ thống lớn ( Erlang/OTP, Go, Akka) cần mô hình mà nhiều unit chạy song song nhưng không bao giờ đụng bộ nhớ chung — và spawn một OS thread cho mỗi concurrency thì quá đắt (stack ~MB, context switch nặng).
**Nguồn gốc:** Actor: Carl Hewitt, Peter Bishop & Richard Steiger, 'A Universal Modular Actor Formalism for Artificial Intelligence', 1973. CSP: Tony Hoare, 1978. Goroutine: ngôn ngữ Go (Google, công bố 2009).
**Giải quyết thế nào:** Actor (Hewitt 1973): mỗi actor có mailbox riêng, chỉ giao tiếp qua message, không share state → cách ly theo thiết kế; CSP (Hoare 1978): process trao đổi qua channel đồng bộ. Goroutine của Go hiện thực hóa hướng CSP theo M:N scheduling — hàng nghìn goroutine nhẹ (stack vài KB, grow on demand) multiplex lên số thread OS nhỏ, runtime lo blocked I/O.
*Liên quan: Thread, Concurrency vs Parallelism, Race condition*

### Byzantine fault & BFT
*còn gọi: Byzantine fault, fault của Byzantine, BFT, Byzantine Generals Problem, lỗi quân bất lương*

**Vấn đề khiến nó ra đời:** Crash-based consensus giả định node 'chết thì im lặng' — nhưng node hỏng phần mềm hoặc bị tấn công có thể gửi thông tin sai, và sai khác nhau cho từng node khác (nói A cho nhóm này, nói B cho nhóm kia): với 3 node có 1 nói dối, hai nhóm còn lại quyết định trái chiều, cluster kết luận giá trị sai mà không hề crash.
**Nguồn gốc:** Robert Shostak (SRI, dự án SIFT) 1978; Marshall Pease tổng quát hóa; Lamport, Pease & Shostak, 'Reaching Agreement in the Presence of Faults', JACM 1980; biểu tượng 'Byzantine Generals Problem' do Lamport đưa ra 1982 — đoạt Dijkstra Prize 2005.
**Giải quyết thế nào:** BFT cần n > 3f (không chữ ký) hoặc n > f+1 (có chữ ký số) để luôn chọn được giá trị đúng bất kể f node hành xử tùy tiện; broadcast consistency — chỉ chặn được node gửi nội dung khác nhau, không chặn node gửi cùng một giá trị sai cho tất cả.
*Liên quan: Consensus, FLP impossibility, Split brain & quorum*

### Consensus
*còn gọi: đồng thuận phân tán, distributed consensus*

**Vấn đề khiến nó ra đời:** N nodes đều cần kết luận cùng một giá trị ('giá trị config nào đúng', 'log entry thứ 5 là gì') trong khi tin nhắn đến chậm, mất, hoặc node crash giữa chừng — tự quyết định riêng thì cluster phân mảnh, hai bên ghi log khác nhau và không bao giờ heal được. Bỏ phiếu không quy tắc (ad-hoc) để lại các corner case chết người không được chứng minh.
**Nguồn gốc:** không rõ (nền gắn với state machine replication của Lamport; xem Paxos/Raft).
**Giải quyết thế nào:** Đề xuất → chấp thuận qua quorum: giá trị chỉ được chọn khi đủ số đông đồng ý, và mọi proposal sau phải tôn trọng giá trị đã chọn (safety); liveness phải chấp nhận đánh đổi vì FLP. Paxos và Raft là hai cách hiện thực hóa; consensus là nền của replicated state machine.
*Liên quan: Paxos, Raft, FLP impossibility*

### CRDT
*còn gọi: conflict-free replicated data type, delta CRDT, state-based / op-based CRDT*

**Vấn đề khiến nó ra đời:** Replicas ghi song song không cần coordination (offline app, multi-master, geo-replication) thì divergence là tất yếu: nếu conflict phải phân giải bằng cách hủy update của một bên thì user mất dữ liệu — trong khi chờ 'merge thủ công' thì hệ thống không bao giờ nhất quán được. Ngăn cản ghi đồng thời (như Paxos) thì triệt tiêu luôn lý do phân tán.
**Nguồn gốc:** Marc Shapiro, Nuno Preguiça, Carlos Baquero & Marek Zawirski, 'Conflict-Free Replicated Data Types', hội nghị SSS 2011.
**Giải quyết thế nào:** Thiết kế cấu trúc dữ liệu sao cho phép ghi độc lập trên từng replica, merge là toán học đảm bảo hội tụ (CRDT counter, G-Counter/PN-Counter, OR-Set, LWW-register): mọi thao tác đồng thời đều được giữ, mâu thuẫn phân giải trong chính datatype — eventual consistency trở thành đảm bảo, không còn hy vọng.
*Liên quan: Eventual consistency, Lamport timestamp & Vector clock, Linearizability*

### FLP impossibility
*còn gọi: FLP, impossibility of distributed consensus, bất khả thi FLP*

**Vấn đề khiến nó ra đời:** Kỹ sư tưởng thuật toán consensus deterministic có thể chống crash hoàn hảo — chạy thế nào cũng kết luận được. FLP chứng minh ngược lại: trong mô hình bất đồng bộ với chỉ một process crash, không thuật toán deterministic nào guarantee termination — giải thích vì sao Paxos có thể stall vô hạn và consensus thực tế luôn phải dựa vào timeout giả định về thời gian.
**Nguồn gốc:** Michael Fischer, Nancy Lynch, Michael Paterson, 'Impossibility of distributed consensus with one faulty process', JACM 1985 — đoạt Dijkstra Prize; proof đã được máy kiểm chứng.
**Giải quyết thế nào:** Chứng minh: khi một fault mù mờ (không biết crash hay chỉ chậm), scheduler có thể trì hoãn message để mọi bước tiếp theo của algorithm không diễn ra. Thực tế lách bằng randomized algorithm (safety tuyệt đối, liveness với xác suất cao → gần như chắc chắn) hoặc timeout/heuristic phi lý thuyết.
*Liên quan: Consensus, Paxos, Byzantine fault*

### Lamport timestamp & Vector clock
*còn gọi: Lamport clock, logical clock, vector clock, hệ thống logic, happened-before*

**Vấn đề khiến nó ra đời:** Hệ thống phân tán không có đồng hồ chung: sự kiện ở hai node đến theo thứ tự network khác với thứ tự thật, không biết sự kiện nào 'trước' sự kiện nào để đồng bộ hóa resource. Lamport scalar thì dùng được nhưng đánh đồng cả 'xảy ra trước thật' lẫn 'chỉ tình cờ đến trước' — không phân biệt được causality với coincidence.
**Nguồn gốc:** Lamport, 'Time, clocks, and the ordering of events in a distributed system', CACM 1978; vector clock do Colin Fidge và Friedemann Mattern độc lập công bố năm 1988.
**Giải quyết thế nào:** Lamport clock (1978): mỗi process tăng counter, gửi kèm message, nhận thì lấy max — được thứ tự nhân quả một chiều nhưng không phát hiện event đồng thời. Vector clock: mỗi process một đồng hồ, VC(a) < VC(b) nghĩa là a xảy ra trước b; hai vector không so sánh được thì là concurrent — cho phép phát hiện xung đột thật sự.
*Liên quan: Linearizability, CRDT, Consensus*

### Linearizability
*còn gọi: tính tuyến tính, atomic consistency, Herlihy-Wing*

**Vấn đề khiến nó ra đời:** Đọc một cache/DB trả kết quả xong, ngay sau đó client khác thấy giá trị 'cũ hơn' — hệ thống có vẻ atomic nhưng không tôn trọng thời gian thực; các định nghĩa atomicity cũ mờ hồ về 'operation bắt đầu và kết thúc lúc nào' nên tranh cãi 'đúng hay sai' không có tiêu chí chung, nhất là khi compose nhiều object.
**Nguồn gốc:** Maurice Herlihy & Jeannette Wing — giới thiệu 1987 (POPL, 'Axioms for concurrent objects'), xử lý chặt 1990 (TOPLAS, 'Linearizability: A Correctness Condition for Concurrent Objects').
**Giải quyết thế nào:** Đòi hỏi mỗi operation 'xảy ra tức thì' tại một điểm nào đó giữa invocation và response, và thứ tự thực thời được giữ: A kết thúc trước khi B bắt buộc thì A đứng trước trong mọi linearization — mạnh enough để suy luận về nhiều object, và là tính chất 'atomic' mà programmer thực sự cần.
*Liên quan: Eventual consistency, Lamport timestamp & Vector clock, CAP theorem*

### Paxos
*còn gọi: The Part-Time Parliament, Multi-Paxos*

**Vấn đề khiến nó ra đời:** Replicate state machine sang nhiều node để chịu lỗi crash: log thứ tự sai lệch giữa replica thì FSM phân kỳ (một node cộng tiền, node kia không) — cần thuật toán đồng thuận có chứng minh an toàn, thay vì tự nghĩ 'nhờ đa số confirm' rồi để lọt corner case khi acceptor chết giữa chừng.
**Nguồn gốc:** Leslie Lamport — nộp 1989, xuất bản 'The Part-Time Parliament', ACM Transactions on Computer Systems, 1998.
**Giải quyết thế nào:** Qua hai phase (prepare/accept): đa số acceptor chấp nhận một giá trị cho mỗi slot log; khi một giá trị đã được chọn thì mọi round sau phải re-propose đúng giá trị đó — an toàn dưới mọi kiểu crash, nhưng không guarantee terminate (theo FLP), nên thực tế dựa vào tiến trình mới.
*Liên quan: Consensus, Raft, FLP impossibility*

### Raft
*còn gọi: leader-based consensus*

**Vấn đề khiến nó ra đời:** Paxos khó hiểu đến mức không ai implement đúng: nhiều diễn giải/phép chứng minh khác nhau, debug cực xa, đội ngũ không nắm được thì consensus bí ẩn trở thành rủi ro production. Ongaro & Ousterhout muốn thuật toán consensus giảng được, sửa được, vẫn chứng minh được an toàn.
**Nguồn gốc:** Diego Ongaro & John Ousterhout (Stanford), 'In Search of an Understandable Consensus Algorithm', 2013.
**Giải quyết thế nào:** Tách bài toán thành ba module độc lập — leader election, log replication, safety — chỉ một leader nhận write, replication cần đa số xác nhận, term number cắt leader cũ; thao đổi: chịu được failure model đơn giản hơn so với Paxos đầy đủ nhưng cùng mức an toàn cho use case phổ biến.
*Liên quan: Consensus, Paxos, Leader election*

## Messaging & Bất đồng bộ

### Apache Kafka
*còn gọi: Kafka, event log, distributed log*

**Vấn đề khiến nó ra đời:** Queue truyền thống consume xong là xóa tin nhắn: mỗi loại người đọc cần một queue riêng (nhân bản dữ liệu), muốn đọc lại lịch sử hay replay sau bug thì không được — LinkedIn có luồng dữ liệu tỉ event/ngày cần nhiều team đọc cùng một luồng và đọc lại được.
**Nguồn gốc:** LinkedIn — Jay Kreps, Neha Narkhede, Jun Rao; open-source đầu 2011, tốt nghiệp Apache Incubator 23/10/2012
**Giải quyết thế nào:** Log append-only phân tán giữ dữ liệu theo retention; nhiều consumer group đọc độc lập từ offset của riêng mình; throughput cao nhờ ghi tuần tự trên đĩa + zero-copy — queue 'không xóa, chỉ trỏ tới'.
*Liên quan: Kafka topic / partition / consumer group, Stream processing vs batch, Exactly-once semantics, Event sourcing*

### CQRS
*còn gọi: Command Query Responsibility Segregation, tách đọc-ghi*

**Vấn đề khiến nó ra đời:** Một model kiêm hai việc: command phải validate business rule phức tạp, query dashboard phải đọc triệu dòng (đọc gấp viết 10-100 lần) — chung một table thì indexes/phép tắc phục vụ cả hai và mỗi bên làm yếu bên kia; read replica chỉ tăng sức đọc chứ không tách được model.
**Nguồn gốc:** Greg Young đặt thuật ngữ CQRS (Martin Fowler ghi nhận nghe mô tả đầu 2011), kế thừa CQS của Bertrand Meyer
**Giải quyết thế nào:** Tách model ghi (bảo toàn business rule) và model đọc (denormalize/cache riêng), scale độc lập, đồng bộ qua event — chi phí là eventual consistency và hai codebase model, Fowler cảnh báo chỉ dùng trong Bounded Context hẹp.
*Liên quan: Event sourcing, Event-driven architecture, Apache Kafka*

### Event sourcing
*còn gọi: lưu nguồn sự kiện, event replay*

**Vấn đề khiến nó ra đời:** Chỉ lưu state hiện tại (UPDATE số dư = 100): không trả lời được 'lúc 10h số dư bao nhiêu', không audit ai đổi khi nào, bug ghi nhầm thì dữ liệu quá khứ vĩnh viễn mất — không còn gì để tra hay replay khi debug.
**Nguồn gốc:** Martin Fowler, bài 'Event Sourcing' ngày 12/12/2005
**Giải quyết thế nào:** Ghi mọi thay đổi thành dãy event bất biến (append-only); state hiện tại là kết quả fold(events); rebuild từ đầu, query tại thời điểm quá khứ, phát lại event cũ vào môi trường test đều được.
*Liên quan: Event-driven architecture, CQRS, Apache Kafka, Stream processing vs batch*

### Exactly-once semantics
*còn gọi: exactly-once, effectively-once, đúng một lần*

**Vấn đề khiến nó ra đời:** Timeout không nói được tiền đã vào nên producer gửi lại → bản sao; consumer xử lý xong nhưng crash trước khi commit offset → đọc lại và xử lý lần hai. End-to-end exactly-once trong distributed system không guarantee được thuần — trùng giao dịch thẻ là hậu quả thật của niềm tin sai này.
**Giải quyết thế nào:** Chỉ guarantee được trong phạm vi broker kiểm soát: idempotent producer (sequence number loại bản trùng khi retry) + transaction ghi output và commit offset atomically (consumer read_committed); side effect ngoài broker vẫn phải idempotent — gọi là effectively-once.
*Liên quan: Idempotent consumer, Transactional outbox, Idempotency, Apache Kafka*

### Kafka topic / partition / consumer group
*còn gọi: partition, consumer group, offset, topic*

**Vấn đề khiến nó ra đời:** Cần vừa giữ thứ tự theo từng người dùng (10 event cùng user không được đảo) vừa xử lý song song triệu msg/s — ép thứ tự toàn topic thì chặn hết, hoàn toàn không thứ tự thì sai business; số consumer vượt số partition thì phần dư không có việc.
**Nguồn gốc:** Cùng nguồn với Kafka — LinkedIn, 2011
**Giải quyết thế nào:** Topic chia partition — đơn vị của thứ tự lẫn song song; trong một consumer group mỗi partition gán độc quyền cho đúng một consumer (vừa giữ thứ tự vừa chia tải), group mới đọc lại từ offset đầu; xử lý fail thì giữ offset chưa commit để đọc lại.
*Liên quan: Apache Kafka, FIFO / Message ordering, Stream processing vs batch*

### Mailbox (actor model)
*còn gọi: actor model, mailbox, hộp thư actor*

**Vấn đề khiến nó ra đời:** Nhiều thread sửa chung biến global: thêm lock để tránh race thì dễ deadlock và priority inversion, quên lock thì data corrupt, race condition khó reproduce trên máy dev — lock là gốc của phần lớn lỗi đồng hành khó tìm trong hệ thống concurrent.
**Nguồn gốc:** Actor model — Carl Hewitt, Peter Bishop, Richard Steiger, 1973
**Giải quyết thế nào:** Mỗi actor/process có mailbox riêng và state riêng tư, giao tiếp chỉ qua gửi message theo địa chỉ — không có memory chung thì không cần lock, lỗi cách ly theo process (Erlang/OTP dùng supervision tree restart process hỏng).
*Liên quan: Message queue, Event-driven architecture, Pub/Sub*

### Stream processing vs batch
*còn gọi: streaming, stream vs batch, Lambda architecture, Kappa architecture*

**Vấn đề khiến nó ra đời:** Batch (Hadoop/ETL đêm) cho kết quả đúng trên toàn bộ dữ liệu nhưng dashboard trễ hàng giờ — không kịp phát hiện gian lận realtime; xử lý stream từng event thì state chỉ một phần và khó đảm bảo độ đúng, mặt khác phải duy trì hai codebase xử lý hoàn toàn khác nhau.
**Nguồn gốc:** Lambda architecture — Nathan Marz, blog 2011 (gốc gọi là 'batch/realtime architecture'); Kappa do Jay Kreps đề xuất
**Giải quyết thế nào:** Stream xử lý liên tục theo window + checkpoint (Flink, Kafka Streams, Storm) cho độ trễ thấp; batch xử lý toàn bộ cho chính xác — Lambda architecture xếp hai lớp (batch + speed) còn Kappa bỏ lớp batch, chạy thuần stream một codebase.
*Liên quan: Apache Kafka, Event sourcing, Backpressure*

### Transactional outbox
*còn gọi: outbox pattern, dual-write fix*

**Vấn đề khiến nó ra đời:** Dual write: một business transaction phải vừa ghi database vừa publish event cho broker — không có transaction chung: gửi giữa transaction thì event sống sót cả khi rollback, gửi sau commit thì crash đúng giữa hai bước là event mất vĩnh viễn; 2PC với broker thì không thực tế.
**Nguồn gốc:** Chris Richardson — microservices.io
**Giải quyết thế nào:** Ghi event vào bảng outbox CÙNG transaction với row business; relay (polling bảng hoặc CDC đọc transaction log) đẩy outbox ra broker — database là nguồn sự thật duy nhất; consumer vẫn cần idempotent vì relay crash giữa 'đã gửi' và 'đã đánh dấu' có thể gửi trùng.
*Liên quan: Idempotent consumer, Event-driven architecture, Event sourcing, Exactly-once semantics*

## Kiến trúc & Khả năng mở rộng

### Bounded Context
*còn gọi: ngữ cảnh giới hạn*

**Vấn đề khiến nó ra đời:** Trong hệ thống lớn, từ 'Customer' với team billing nghĩa là 'người trả tiền', với team shipping là 'người nhận hàng', với team marketing là 'lead'. Ép tất cả dùng chung một model Customer thì model đó trở nên vô nghĩa vì mỗi team hiểu khác nhau. Bounded context ra đời để mỗi team có model riêng, rõ ràng, không đụng nhau.
**Nguồn gốc:** Eric Evans giới thiệu trong cuốn 'Domain-Driven Design' (2003); Martin Fowler mô tả chi tiết trên bliki (BoundedContext.html).
**Giải quyết thế nào:** Chia hệ thống thành các context, mỗi context có ubiquitous language và model riêng, nội bộ nhất quán. Các context giao tiếp qua context map với các relationship rõ ràng (anti-corruption layer, shared kernel, customer-supplier...).
*Liên quan: DDD, modular monolith, ubiquitous language*

### Cell-Based Architecture
*còn gọi: kiến trúc phân ô*

**Vấn đề khiến nó ra đời:** Hệ thống lớn phục vụ hàng triệu user, khi một service fail, deploy lỗi, hoặc lỗi chiếm hết tài nguyên, toàn bộ user bị ảnh hưởng — blast radius quá lớn. Cell-based architecture ra đời để chia hệ thống thành nhiều 'cell' độc lập: fail một cell chỉ ảnh hưởng tập user của cell đó, không lan ra toàn hệ thống.
**Nguồn gốc:** Amazon phổ biến qua AWS Builders Library (bài 'Avoiding overload in distributed systems by putting cell-based architecture in place').
**Giải quyết thế nào:** Mỗi cell là một bản sao đầy đủ của hệ thống (API, service, DB). Router phân user vào cell dựa trên shard key (user ID, region). Cell sập thì router redirect sang cell khác; deploy theo từng cell để rollout từng phần, không cần outage toàn hệ thống.
*Liên quan: multi-tenancy, geo-replication, blast radius*

### DDD (Domain-Driven Design)
*còn gọi: thiết kế hướng domain*

**Vấn đề khiến nó ra đời:** Dev hiểu business ít hơn domain expert, code implement sai logic nghiệp vụ vì yêu cầu bị dịch qua nhiều lớp (BA → spec → code), và model code ngày càng lệch khỏi model business thật. DDD ra đời để dev và domain expert nói chung một ngôn ngữ, model code phản ánh đúng model nghiệp vụ.
**Nguồn gốc:** Eric Evans, cuốn 'Domain-Driven Design: Tackling Complexity in the Heart of Software' (2003).
**Giải quyết thế nào:** Strategic design: bounded context, context map, ubiquitous language. Tactical design: entity, value object, aggregate, repository, domain service, domain event. Tách model kỹ thuật (database tables) khỏi domain model.
*Liên quan: bounded context, aggregate, microservices*

### Fallacies of Distributed Computing
*còn gọi: 8 ngộ nhận về tính toán phân tán*

**Vấn đề khiến nó ra đời:** Dev quen viết app trên một máy, khi chuyển sang hệ thống phân tán vẫn giả định 'mạng luôn chạy, latency = 0, bandwidth vô hạn...' — dẫn đến app treo khi mạng rớt, timeout sai, không retry, security lỏng. 8 fallacies ra đời để cảnh tỉnh những giả định sai lầm này.
**Nguồn gốc:** L. Peter Deutsch (Sun Microsystems Fellow) công bố 7 fallacies năm 1994 (dựa trên 4 fallacy của Bill Joy và Dave Lyon); James Gosling thêm fallacy thứ 8 khoảng năm 1997.
**Giải quyết thế nào:** 8 fallacies: (1) mạng đáng tin, (2) latency = 0, (3) bandwidth vô hạn, (4) mạng bảo mật, (5) topology không đổi, (6) chỉ có 1 admin, (7) chi phí transport = 0, (8) mạng đồng nhất. Thiết kế phải đối mặt từng cái: timeout + retry, circuit breaker, backpressure, encryption, service discovery, graceful degradation.
*Liên quan: service discovery, circuit breaker, geo-replication*

### Geo-Replication
*còn gọi: nhân bản địa lý*

**Vấn đề khiến nó ra đời:** User ở Việt Nam gọi API đặt server tại US mất ~200ms mỗi round-trip; và nếu US region chết (mất điện, thảm họa) thì toàn bộ user không truy cập được. Geo-replication ra đời để copy data sang nhiều region: user đọc từ region gần nhất, region khác takeover khi một region sập.
**Nguồn gốc:** Xuất hiện cùng các hệ thống distributed database lớn: Google Spanner (2012-2013), Apache Cassandra (Facebook, 2010), và tính năng replication của PostgreSQL/MySQL từ những năm 2000s.
**Giải quyết thế nào:** Đồng bộ data giữa datacenter ở các region khác nhau. Đồng bộ (synchronous): strong consistency nhưng chậm. Bất đồng bộ (asynchronous): nhanh nhưng eventual consistency. Thường ghép với global load balancer route user tới region gần nhất và để failover khi region chết.
*Liên quan: consistency, cell-based, CDN*

### Orchestration vs Choreography
*còn gọi: điều phối vs biên đạo*

**Vấn đề khiến nó ra đời:** Business transaction (đặt hàng → trừ kho → trừ tiền → giao hàng) cần nhiều service phối hợp. Orchestration: có một 'nhạc trưởng' điều khiển tất cả — dễ theo dõi nhưng nhạc trưởng thành single point of failure và bottleneck. Choreography: mỗi service tự biết khi nào làm gì qua event — loose coupling nhưng logic ẩn trong event flow, rất khó debug và không ai thấy được bức tranh toàn cảnh.
**Nguồn gốc:** Mượn từ business process management (BPM); được mô tả trong pattern catalog của Chris Richardson (microservices.io) và Azure Architecture Center (choreography pattern).
**Giải quyết thế nào:** Orchestration: orchestrator phát lệnh tới từng service, nhận kết quả, quyết định bước tiếp theo — dễ trace nhưng coupling cao. Choreography: service A xong publish event, B lắng nghe và làm việc của B rồi publish tiếp cho C — không có điểm trung tâm nhưng phải dùng distributed tracing + correlation ID mới theo dõi được.
*Liên quan: event bus, saga, microservices*

### Service Mesh
*còn gọi: lưới dịch vụ*

**Vấn đề khiến nó ra đời:** 100 microservices đều cần retry, timeout, mTLS, tracing, rate limit. Nếu mỗi service tự implement thì 100 codebase khác nhau, không nhất quán, mỗi lần upgrade framework phải sửa cả trăm chỗ. Service mesh ra đời để tách networking logic ra khỏi app code, nhét vào layer hạ tầng.
**Nguồn gốc:** Linkerd (Buoyant, 2016) là service mesh mã nguồn mở đầu tiên — bản thân là 'Finagle wrapped in proxy form'; Istio (Google/IBM/Lyft, 2017) phổ biến hóa khái niệm. Trước đó là library thế hệ: Netflix Hystrix, Twitter Finagle, Google Stubby.
**Giải quyết thế nào:** Mỗi service instance chạy kèm sidecar proxy (Envoy). Mọi traffic vào/ra đi qua proxy. Control plane push config, certificate, routing policy xuống proxy. App không sửa code vẫn có mTLS, retry, circuit breaking, metrics, traffic split (canary).
*Liên quan: sidecar, service discovery, mTLS*

### Sidecar
*còn gọi: mẫu sidecar, sidecar container, pattern sidecar, container phụ*

**Vấn đề khiến nó ra đời:** App viết bằng 5 ngôn ngữ khác nhau, nhưng tất cả đều cần logging, metrics, mTLS, service discovery, retry. Viết lại cùng logic cho 5 ngôn ngữ thì tốn công và không nhất quán giữa các team. Sidecar ra đời để gắn một container phụ chạy cạnh app chính, lo cross-cutting concern đúng một lần bằng một ngôn ngữ.
**Nguồn gốc:** Pattern được Microsoft mô tả trong Azure Architecture Center (Sidecar Pattern); phổ biến cùng Kubernetes (native sidecar containers) và service mesh (Istio, Linkerd).
**Giải quyết thế nào:** Mỗi app instance chạy kèm một sidecar container cùng lifecycle, chia sẻ network namespace (gọi nhau qua localhost). Sidecar lo proxy traffic, collect metrics, inject headers, handle retry — app không cần biết sidecar tồn tại, không cần sửa code.
*Liên quan: service mesh, container, service discovery, pod, Kubernetes, service & ingress, container (Docker, container image)*

## Độ tin cậy & Quan sát được

### Anomaly Detection
*còn gọi: anomaly_detection*

**Vấn đề khiến nó ra đời:** Threshold tĩnh khó bắt biến đổi phức tạp (seasonality, traffic spike hợp lý) dẫn đến false positive/negative.
**Nguồn gốc:** Google SRE Book - Chapter 6 (Monitoring Distributed Systems)
**Giải quyết thế nào:** Phát hiện bất thường dựa trên pattern (statistical/time-series) thay vì threshold cứng. Kết hợp với alert on symptoms, dashboard, tránh dựa hoàn toàn vào ML phức tạp không giải thích được.
*Liên quan: alert_fatigue, four_golden_signals, burn_rate*

### Burn Rate
*còn gọi: burn_rate*

**Vấn đề khiến nó ra đời:** Cần phát hiện sớm việc tiêu hao error budget dù window lớn (30 ngày) mà không làm nhiễu alert.
**Nguồn gốc:** Google SRE Workbook - Alerting on SLOs
**Giải quyết thế nào:** Burn rate là tốc độ tiêu hao error budget so với SLO (1.0 = tiêu đúng theo kế hoạch đến hết window). Dùng multi-window (ví dụ 1h/6h) để cân bằng giữa detection time và precision.
*Liên quan: error_budget, SLO, alert_fatigue*

### Burn rate & multiwindow multi-burn-rate alerting
*còn gọi: burn rate, alert đa cửa sổ, fast burn/slow burn*

**Vấn đề khiến nó ra đời:** Alert 'error rate > 0.1%' thì quá nhạy — spike vài phút cũng page, on-call thức dậy vì việc hết lỗi ngay; còn alert theo SLO 30 ngày thì quá chậm, phát hiện xong thì error budget đã cạn. Window ngắn thì sau khi recovery alert vẫn kêu thêm hàng giờ (reset time kém).
**Nguồn gốc:** Google SRE Workbook, chương 5 'Alerting on SLOs' (2018)
**Giải quyết thế nào:** Đo tốc độ tiêu error budget (burn rate), kết hợp nhiều cửa sổ: 1h/5m ở burn 14.4 + 6h/30m ở burn 6 để bắt cháy nhanh; cửa sổ ngắn xác nhận đang cháy nên tắt alert ~5 phút sau khi hết lỗi. Burn rate 1 = tiêu hết budget đúng bằng kỳ SLO.
*Liên quan: Error budget, SLI / SLO, Alert fatigue*

### Cardinality Explosion
*còn gọi: cardinality_explosion, high_cardinality*

**Vấn đề khiến nó ra đời:** Dùng label có cardinality cao (user_id, request_id, email...) tạo ra số lượng time series khổng lồ, làm tăng chi phí lưu trữ/queries.
**Nguồn gốc:** Prometheus Best Practices - Metric and Label Naming
**Giải quyết thế nào:** Mỗi tổ hợp (metric_name + label key-values) là 1 time series. Tránh label unbounded; ưu tiên label có số giá trị hữu hạn, ổn định. Giám sát cardinality.
*Liên quan: metrics, time_series, sampling*

### Cascading Failures
*còn gọi: cascading_failure, cascade*

**Vấn đề khiến nó ra đời:** Lỗi tại 1 điểm có thể lan truyền nhanh qua chain dependencies gây outage toàn hệ thống.
**Nguồn gốc:** Google SRE Book - Chapter 22 (Addressing Cascading Failures)
**Giải quyết thế nào:** Nguyên nhân thường gặp: retry storm, missed deadlines, CPU/memory exhaustion, GC vicious cycle. Giảm thiểu bằng backpressure, timeouts hợp lý, circuit breaker, load shedding, retry budget.
*Liên quan: circuit_breaker, retry_budget, retry_storm*

### Chaos Engineering
*còn gọi: chaos_engineering, kỹ thuật hỗn loạn, chaos experiments*

**Vấn đề khiến nó ra đời:** Hệ thống phân tán phức tạp có lỗi tương tác khó lường trước, cần kiểm chứng bằng thực nghiệm.
**Nguồn gốc:** Principles of Chaos Engineering (Netflix, 2017+; updated 2019)
**Giải quyết thế nào:** Thực hiện experiment có kiểm soát: xác định steady state -> giả thuyết steady state tiếp tục -> inject biến số phản ánh real-world (crash, network partition, latency) -> cố gắng bác bỏ giả thuyết để tìm weakness trước production.
*Liên quan: game_day, blast_radius, fault_injection, Fault Injection, Error Budget, Graceful Degradation*

### Circuit Breaker
*còn gọi: circuit_breaker, circuit_breaking, ngắt mạch, circuit breaker pattern*

**Vấn đề khiến nó ra đời:** Lỗi phụ thuộc lan truyền (cascading) khi upstream chậm/trả lỗi liên tục gây cạn tài nguyên.
**Nguồn gốc:** Michael T. Nygard - Release It!; Martin Fowler (Bliki) - CircuitBreaker, 2014-03-06
**Giải quyết thế nào:** Bao bọc remote call bằng state machine (Closed/Open/Half-Open). Khi thất bại đạt ngưỡng -> mở mạch (trả lỗi ngay, không gọi upstream). Sau timeout thử lại Half-Open để phục hồi an toàn.
*Liên quan: cascading_failures, retry_budget, timeout, Bulkhead, Timeout, Fallback, Graceful Degradation*

### Exemplars
*còn gọi: exemplar, mẫu chứng, metric gắn trace*

**Vấn đề khiến nó ra đời:** Histogram/metric tổng hợp mất chi tiết trace cụ thể của outlier (p99/p999).
**Nguồn gốc:** Grafana/OpenTelemetry - Exemplars concept
**Giải quyết thế nào:** Exemplar là trace representative của một measurement trong interval, liên kết điểm metric (bucket/value) với 1 trace cụ thể để drill-down từ dashboard metric sang trace.
*Liên quan: histogram, trace, metrics, Distributed tracing, Prometheus scrape model, Observability*

### Head-based Sampling
*còn gọi: head_sampling*

**Vấn đề khiến nó ra đời:** Cần giảm volume telemetry sớm mà vẫn có tính đại diện, đặc biệt ở throughput cao.
**Nguồn gốc:** OpenTelemetry Concepts - Sampling
**Giải quyết thế nào:** Quyết định sample/drop ngay khi tạo span (trước khi biết toàn bộ trace). Thường dùng Consistent Probability Sampling. Tiết kiệm tài nguyên, nhưng khó chọn dựa trên kết quả toàn trace.
*Liên quan: sampling, tail_based_sampling, OpenTelemetry*

### Head-based vs tail-based sampling
*còn gọi: lấy mẫu trace, trace sampling, tail sampling*

**Vấn đề khiến nó ra đời:** Ghi full trace ở 10k req/s làm chi phí lưu trữ và băng thông phình (nhiều backend tính tiền theo GB), nhưng sampling mù 1% đầu thì incident hiếm (lỗi 0.01%) lại chính là thứ bị loại bỏ — không có dữ liệu để điều tra.
**Nguồn gốc:** không rõ (tài liệu OpenTelemetry mô tả chi tiết)
**Giải quyết thế nào:** Head-based: quyết định ngay lúc bắt đầu theo % trace ID (đơn giản, rẻ, nhưng không biết trace có lỗi hay không); tail-based: quyết định sau khi xem đủ span của trace → luôn giữ trace lỗi/chậm, đổi lại cần component trạng thái phức tạp và tốn tài nguyên. Hệ thống lớn thường kết hợp cả hai.
*Liên quan: Distributed tracing, OpenTelemetry, Exemplars*

### Log sampling & rate limiting
*còn gọi: log sampling, rate limit log, giới hạn tần suất log*

**Vấn đề khiến nó ra đời:** Black Friday traffic ×100 kéo log ×100: full-text index không chịu nổi hoặc chi phí ingest phình đột biến, thậm chí log pipeline tự sập đúng lúc cần nó nhất; nhưng bỏ hết log thì mất dấu vết điều tra.
**Nguồn gốc:** không rõ
**Giải quyết thế nào:** Giữ 100% log mức ERROR/event bất thường, sampling log happy-path (VD 1/100 hoặc 1 dòng/giây/stream), rate limit theo label; ưu tiên giữ cái bất thường, loại cái dự đoán được.
*Liên quan: Log aggregation & ELK Stack, Loki, Metric cardinality*

### Metrics, Logs, Traces Correlation
*còn gọi: signals_correlation, telemetry_correlation*

**Vấn đề khiến nó ra đời:** Các signal riêng rẽ (metrics/logs/traces) khó kết nối để gỡ lỗi nhanh xuyên service.
**Nguồn gốc:** OpenTelemetry Project - Context Propagation
**Giải quyết thế nào:** Context propagation (traceparent) cho phép liên kết: trace+span ID có thể inject vào log records, exemplars liên kết metric buckets với trace representative, giúp chuyển từ symptom (metric) -> trace -> logs nhanh hơn.
*Liên quan: OpenTelemetry, traceparent, exemplars*

### Multi-Region / Active-Active
*còn gọi: active_active, multi_region, multi_site*

**Vấn đề khiến nó ra đời:** Cần RPO/RTO gần 0 cho workload mission-critical, chấp nhận chi phí cao hơn.
**Nguồn gốc:** AWS Disaster Recovery Options (Well-Architected/Whitepapers)
**Giải quyết thế nào:** Toàn bộ môi trường chạy đồng thời ở nhiều region, traffic phân bố (active-active). Gần zero RPO/RTO, phức tạp về consistency/split-brain cần xử lý cẩn thận.
*Liên quan: warm_standby, RPO, RTO, split_brain*

### Normalize Load
*còn gọi: load_normalization, return_excess_requests*

**Vấn đề khiến nó ra đời:** Khi backend overload, client retry không kiểm soát làm tăng tải nhanh (retry storm).
**Nguồn gốc:** Google SRE Book - Chapter 21 (Handling Overload)
**Giải quyết thế nào:** Trả lỗi overload sớm, client xử lý backpressure (retry có budget), tránh retry đồng loạt. Mục tiêu 'shed load gracefully' thay vì để hệ thống sụp đổ cascading.
*Liên quan: retry_budget, circuit_breaker, overload*

### OpenTelemetry Collector / observability pipeline
*còn gọi: OTel Collector, telemetry gateway, observability pipeline*

**Vấn đề khiến nó ra đời:** Để app push thẳng vào từng backend thì đổi backend phải sửa hàng trăm service, mỗi app tự lo retry/batch; spike traffic metric/log đè thẳng vào backend khiến observability stack sập cùng lúc hệ thống đang có sự cố.
**Nguồn gốc:** OpenTelemetry (CNCF) — thành phần Collector
**Giải quyết thế nào:** Đặt agent/gateway tập trung nhận OTLP (push), xử lý batch/filter/redact/enrich/sampling ở giữa pipeline rồi fan-out sang nhiều backend; app chỉ biết một endpoint, backend thay bằng cách đổi config gateway.
*Liên quan: OpenTelemetry (OTel), Metric cardinality, Log sampling*

### Pilot Light
*còn gọi: pilot_light*

**Vấn đề khiến nó ra đời:** Cần DR với chi phí hợp lý nhưng vẫn có khả năng phục hồi nhanh (không chỉ backup thuần túy).
**Nguồn gốc:** AWS Disaster Recovery Options (Well-Architected/Whitepapers)
**Giải quyết thế nào:** Core infrastructure luôn chạy ở DR region (ví dụ DB/storage replication), application servers 'tắt' (hoặc không deployed) và được bật/quy mô lại khi failover. RPO/RTO trung bình (phút-giờ).
*Liên quan: RPO, RTO, warm_standby, disaster_recovery*

### Retry Budget
*còn gọi: retry_budget, ngân sách retry, retry ratio limit*

**Vấn đề khiến nó ra đời:** Retry không kiểm soát tạo ra retry storm, làm tăng tải và làm trầm trọng thêm tình trạng overload.
**Nguồn gốc:** Google SRE Book - Chapter 21 (Handling Overload)
**Giải quyết thế nào:** Giới hạn retry: per-request retry budget (ví dụ tối đa 3 lần) và per-client retry budget (tỷ lệ retry < ngưỡng, ví dụ 10%). Ngăn tăng tải nhân đôi/bội số do retry khi cluster đang overload.
*Liên quan: circuit_breaker, retry_storm, overload, Exponential Backoff, Rate Limiting (Adaptive), Overload Protection*

### Tail-based Sampling
*còn gọi: tail_sampling*

**Vấn đề khiến nó ra đời:** Head sampling không thể ưu tiên trace quan trọng (có lỗi, latency cao, thuộc service mới...).
**Nguồn gốc:** OpenTelemetry Concepts - Sampling
**Giải quyết thế nào:** Quyết định sau khi thu thập hầu hết span trong trace (hoặc xem xét toàn trace). Cho phép rule phức tạp (luôn sample trace có error, dựa trên p95/attributes...). Trade-off: phức tạp hơn, cần buffer.
*Liên quan: sampling, head_based_sampling, OpenTelemetry*

### Trace Context Propagation
*còn gọi: trace_context, w3c_tracecontext*

**Vấn đề khiến nó ra đời:** Cần lan truyền context (trace/span ID) nhất quán xuyên ranh giới service để có thể liên kết signal.
**Nguồn gốc:** W3C TraceContext specification
**Giải quyết thế nào:** Lan truyền context qua headers (mặc định traceparent: version-trace-id-parent-id-trace-flags) để các service có thể tạo span con thuộc cùng trace.
*Liên quan: trace, span, traceparent*

### Traceparent
*còn gọi: traceparent_header*

**Vấn đề khiến nó ra đời:** Cần định dạng header chuẩn để trao đổi trace context giữa các hệ thống khác nhau.
**Nguồn gốc:** W3C TraceContext specification
**Giải quyết thế nào:** Header chuẩn W3C định dạng <version>-<trace-id>-<parent-id>-<trace-flags>, dùng để inject/extract context xuyên service boundaries.
*Liên quan: trace_context, trace, span*

### Warm Standby
*còn gọi: warm_standby*

**Vấn đề khiến nó ra đời:** Pilot Light cần thời gian scale-up; cần môi trường DR sẵn sàng hơn để giảm RTO.
**Nguồn gốc:** AWS Disaster Recovery Options (Well-Architected/Whitepapers)
**Giải quyết thế nào:** Bản sao thu nhỏ nhưng đầy đủ chức năng của production chạy liên tục ở DR region (reduced capacity). Khi failover chỉ cần scale up. RTO thấp hơn pilot light.
*Liên quan: pilot_light, active_active, RTO*

## Bền vững & Chị tải

### Backpressure (Reactive)
*còn gọi: reactive backpressure, subscriber.request(n), demand-driven flow*

**Vấn đề khiến nó ra đời:** Producer nhanh hơn consumer trong reactive streams → buffer vô hạn.
**Nguồn gốc:** Reactive Streams initiative: collaboration giữa Kaazing, Lightbend, Netflix, Pivotal, Red Hat, Twitter và nhiều others; Java API v1.0.4 phát hành 2022-05-26; java.util.concurrent.Flow trong JDK 9 tương đương 1:1.
**Giải quyết thế nào:** Demand-driven: Subscriber gọi Subscription.request(n) để yêu cầu n element; Publisher chỉ gửi tối đa n element (onNext) cho đến khi đủ demand. Request cộng dồn; request <= 0 → onError. Tránh stop-and-wait (request 1). Giữ buffer bounded theo demand.
*Liên quan: Queue Backpressure, Reactive Streams, Head-of-Line Blocking*

### Deadline Propagation
*còn gọi: truyền hạn chót, cancellation propagation*

**Vấn đề khiến nó ra đời:** RPC đi qua nhiều tầng; khi client đã bỏ cuộc, các tầng sau vẫn tiếp tục xử lý và tiêu tốn thread/CPU cho kết quả không ai đọc.
**Nguồn gốc:** Được mô tả trong Google SRE Book ch.22 'Addressing Cascading Failures' (2016), thực hành của Google RPC stack.
**Giải quyết thế nào:** Client đặt một absolute deadline (thời điểm hết hạn tuyệt đối) và truyền theo từng hop; mỗi service kiểm tra thời gian còn lại trước mỗi bước xử lý, nếu đã hết hạn thì fail-fast và hủy (cancel) call xuống tầng con — cắt hẳn chuỗi xử lý vô ích.
*Liên quan: Timeout, Load Shedding, Graceful Shutdown*

### Queueing Theory Basics (M/M/1)
*còn gọi: M/M/1 queue, Kendall notation*

**Vấn đề khiến nó ra đời:** Hiểu hành vi queue để dự đoán latency khi utilization cao.
**Nguồn gốc:** D. G. Kendall giới thiệu Kendall's notation năm 1953 ('Stochastic Processes Occurring in the Theory of Queues...', Annals of Mathematical Statistics, 24(3): 338–354). Erlang có công trình trước đó về telephone traffic.
**Giải quyết thế nào:** M/M/1: arrivals Poisson (M), service times exponential (M), 1 server. Utilization ρ=λ/μ < 1. Mean response time E[T]=1/(μ-λ), mean wait E[W]=ρ/(μ-λ). ρ tiến gần 1 → latency tăng nhanh (non-linear).
*Liên quan: Little's Law, Head-of-Line Blocking, Capacity Planning*

### Quorum Read/Write
*còn gọi: quorum, r+w>n, weighted voting*

**Vấn đề khiến nó ra đời:** Cân bằng giữa consistency, availability, partition tolerance khi replica bị lag/lỗi.
**Nguồn gốc:** David K. Gifford, 'Weighted voting for replicated data', SOSP '79 (ACM, 1979); Dynamo-style r+w>n phổ biến sau này.
**Giải quyết thế nào:** Với n replica: yêu cầu write quorum w, read quorum r với r+w>n → mọi read luôn giao với ít nhất 1 replica có dữ liệu mới nhất. Gifford dùng weighted voting (mỗi copy có số phiếu). Vw > V/2 đảm bảo hai write không xung đột.
*Liên quan: Replication Lag Tolerance, Redundancy/N+1 Redundancy*

## Bảo mật & Xác thực

### ACME (Automatic Certificate Management Environment)
*còn gọi: giao thức cấp cert tự động, Let's Encrypt protocol*

**Vấn đề khiến nó ra đời:** Trước ACME, gắn HTTPS là thủ công: generate CSR, paste vào web CA, chứng minh sở hữu domain qua email/HTTP, tải cert về cài tay — người làm web mất 1–3 giờ mỗi cert, và cert expire vì quên gia hạn khiến site sập. Hàng triệu site nhỏ không đủ resources nên web toàn cầu vẫn HTTP plaintext.
**Nguồn gốc:** IETF RFC 8555 (3/2019) — R. Barnes (Cisco), J. Hoffman-Andrews (EFF), D. McCarney (Let's Encrypt), J. Kasten (UMich); phát triển qua IETF ACME WG
**Giải quyết thế nào:** Giao thức machine-to-machine: client đăng ký account, submit order, chứng minh quyền kiểm soát domain qua challenge (http-01/dns-01), finalize với CSR, tải cert — mọi bước tự động, kèm auto-renew; Let's Encrypt cấp cert miễn phí hàng triệu domain.
*Liên quan: X.509 & PKI, mTLS*

### capability token
*còn gọi: capability-based token*

**Vấn đề khiến nó ra đời:** Access token truyền thống thường đại diện cho identity (who), nhưng để kiểm soát chặt 'có quyền làm gì với resource nào', cần token mang theo quyền hạn (capability) thay vì chỉ identity.
**Nguồn gốc:** Capability-based security (Dennis–Van Horn 1966), modern incarnations (macaroons, Biscuit)
**Giải quyết thế nào:** Token chứa danh sách quyền (capabilities) và có thể bị thu hẹp (attenuation), ký để xác minh. Client chỉ trình token có đúng capability khi gọi API.
*Liên quan: JWT, permission model*

### mTLS (mutual TLS)
*còn gọi: TLS hai chiều, mutual TLS*

**Vấn đề khiến nó ra đời:** TLS một chiều chỉ server chứng minh danh tính với client — service A gọi service B qua HTTPS vẫn không biết ai đang gọi mình; trong service mesh/microservice, endpoint nội bộ không auth thì pod bị compromise là attacker gọi thoải mái mọi API nội bộ ('internal ≠ trusted'). API key header thì gửi plaintext trong header, steal được là dùng được ở máy khác.
**Nguồn gốc:** không rõ (kéo dài từ TLS + X.509 client certificate authentication)
**Giải quyết thế nào:** Client cũng phải presenting X.509 certificate và server verify nó trước khi handshake — cả hai bên xác thực qua PKI, token/cert bound với sender; dùng trong service mesh (Istio/Linkerd), API cấp doanh nghiệp, và trong OAuth làm sender-constrained token.
*Liên quan: X.509 / PKI, OAuth 2.1, Secrets management*

### OAuth 2.1 & Security BCP
*còn gọi: OAuth 2.1, sender-constrained tokens, DPoP*

**Vấn đề khiến nó ra đời:** OAuth 2.0 (RFC 6749, 2012) còn để lại nhiều feature được chứng minh bất an toàn qua thực tế: implicit flow lộ token trong URL, không bắt PKCE (code injection), refresh token tĩnh bị replay. Các lỗ hổng này bị khai thác thật trong tích hợp mobile/SPA nên IETF phải gộp các bản security BCP thành một spec mới.
**Nguồn gốc:** draft-ietf-oauth-v2-1 (IETF, thay RFC 6749); RFC 9700 (Security BCP)
**Giải quyết thế nào:** OAuth 2.1 bỏ implicit + resource-owner-password grant, bắt buộc PKCE, siết redirect URI matching, refresh token rotation; RFC 9700 thêm sender-constrained tokens (DPoP/mTLS bind token vào client cụ thể để token đánh cắp không dùng được ở nơi khác).
*Liên quan: OAuth 2.0, PKCE, mTLS, Refresh token rotation*

### X.509 & PKI certificate management
*còn gọi: chứng chỉ số, PKI, certificate chain, CRL/OCSP*

**Vấn đề khiến nó ra đời:** Không có cách chuẩn để chứng minh 'public key này thuộc về domain này' — MITM tự sinh key thì attacker đứng giữa mọi kết nối. Và sau khi phát hiện cert bị compromise hoặc domain bị chiếm, cần cơ chế thu hồi trước khi hết hạn (cert 90 ngày mà attacker dùng được 90 ngày = tai nạn).
**Nguồn gốc:** ITU-T X.509 (chuẩn format public key certificate); PKIX profile của IETF (RFC 5280 cho CRL)
**Giải quyết thế nào:** X.509 bind identity ↔ public key qua chữ ký của CA, xác minh theo chain lên trust anchor; thu hồi qua CRL (danh sách đen ký) hoặc OCSP (hỏi real-time). Quản lý lifecycle: issuance, renewal, rotation, revocation — sai khâu nào cũng mở lỗ hổng.
*Liên quan: mTLS, ACME, Certificate pinning*

### zero trust
*còn gọi: Zero Trust Architecture*

**Vấn đề khiến nó ra đời:** Mô hình perimeter cũ (trust internal network) không còn phù hợp với cloud, remote work, BYOD. Giả định mạng có thể bị xâm nhập; cần không tin tưởng ngầm, luôn xác minh.
**Nguồn gốc:** NIST SP 800-207 (Rose et al., 2020)
**Giải quyết thế nào:** Nguyên tắc: never trust, always verify; xác thực+ủy quyền mọi request (user/device/context); micro-segmentation; assume breach; focus on resources thay vì network perimeter.
*Liên quan: least privilege, mTLS, RBAC*

## Kiểm thử & Chất lượng

### canary analysis
*còn gọi: canary testing, canary release*

**Vấn đề khiến nó ra đời:** Deploy toàn bộ user cùng lúc gây outage lớn. Cần phát hiện vấn đề sớm với tập nhỏ user trước khi lan rộng.
**Nguồn gốc:** Coal mining canary + modern CD (Google/SRE practices)
**Giải quyết thế nào:** Phát hành version mới cho % nhỏ user (canary), theo dõi metric quan trọng (error rate, latency). Nếu ổn định mới tăng dần.
*Liên quan: A/B test, feature flag testing, chaos test*

### chaos test
*còn gọi: chaos engineering, chaos testing*

**Vấn đề khiến nó ra đời:** Hệ thống phân tán fail theo cách không lường trước (network partition, pod crash). Production vẫn fail dù dev/test ổn định.
**Nguồn gốc:** Netflix (Chaos Monkey)
**Giải quyết thế nào:** Thử nghiệm chủ động: gây gián đoạn có kiểm soát (kill instance, delay network) để xác minh hệ thống chịu lỗi và tự phục hồi.
*Liên quan: stress test, canary analysis*

### Characterization test
*còn gọi: Golden master test*

**Vấn đề khiến nó ra đời:** Legacy code không có test, không có tài liệu rõ ràng — không thể biết hành vi hiện tại là đúng hay sai, nhưng cần bảo vệ hành vi đó khi refactor.
**Nguồn gốc:** Michael Feathers (Working Effectively with Legacy Code)
**Giải quyết thế nào:** Quan sát hành vi thực tế của code với input cụ thể, lưu output hiện tại làm "golden master", sau đó viết test so sánh output mới với golden master. Test chỉ phát hiện thay đổi, không khẳng định tính đúng đắn.
*Liên quan: Regression test, Legacy code, Golden master*

### consumer-driven contract
*còn gọi: CDC*

**Vấn đề khiến nó ra đời:** Provider không biết consumer cần gì. Việc "đồng thuận contract" thường muộn, gây xung đột khi tích hợp.
**Nguồn gốc:** Ian Robinson (Consumer-Driven Contracts)
**Giải quyết thế nào:** Consumer định nghĩa yêu cầu contract của mình, Provider phải đáp ứng. Ưu tiên nhu cầu thực tế thay vì design một chiều.
*Liên quan: contract test (Pact), integration test, Contract testing, Pact*

### contract test (Pact)
*còn gọi: contract testing, Pact*

**Vấn đề khiến nó ra đời:** Consumer và Provider (API) triển khai độc lập. Consumer test pass nhưng Provider thay đổi contract → tích hợp fail ở môi trường thật.
**Nguồn gốc:** Pact Foundation / Matt Fellows et al.
**Giải quyết thế nào:** Consumer tạo contract (Pact file), Provider verify contract đó. Giúp phát hiện breaking change sớm trước khi deploy.
*Liên quan: consumer-driven contract, integration test, e2e test*

### Contract testing

**Vấn đề khiến nó ra đời:** Trong kiến trúc microservices, service consumer và provider thường được triển khai độc lập — integration test toàn hệ thống chậm, đắt và dễ brittle; cần đảm bảo hợp đồng giao tiếp (API contract) vẫn tương thích.
**Nguồn gốc:** Matt Fellows / Pact (Pact.io)
**Giải quyết thế nào:** Consumer định nghĩa kỳ vọng (contract) dựa trên những gì nó thực sự dùng; provider xác minh (verify) có đáp ứng đúng contract đó. Giúp phát hiện breaking change sớm mà không cần deploy cả hai cùng lúc.
*Liên quan: Consumer-driven contract, Pact, Integration test*

### golden master
*còn gọi: characterization test, golden file*

**Vấn đề khiến nó ra đời:** Legacy code không có test, khó refactor mà không biết hành vi hiện tại. Cần "bắt" hành vi đúng như đang chạy.
**Nguồn gốc:** Michael Feathers (Working Effectively with Legacy Code)
**Giải quyết thế nào:** Lưu output thực tế làm golden master. Khi refactor, so sánh output mới với golden master để đảm bảo không thay đổi hành vi.
*Liên quan: snapshot test, refactoring, regression test, Characterization test*

### hermetic test
*còn gọi: hermetic testing*

**Vấn đề khiến nó ra đời:** Test phụ thuộc external (network, service bên ngoài) → không chạy được offline, không ổn định trong CI.
**Nguồn gốc:** Google Testing Blog (hermetic servers/tests)
**Giải quyết thế nào:** Test chạy hoàn toàn độc lập: dùng fake/in-memory, mock network, không gọi external service. Đảm bảo reproducible.
*Liên quan: test isolation, deterministic test, mocking/stub/fake/spy, Test isolation, Flaky test*

### mutation testing
*còn gọi: mutation analysis*

**Vấn đề khiến nó ra đời:** Test coverage cao nhưng vẫn không bắt lỗi: test có thể pass dù logic đã bị thay đổi sai (mutant sống).
**Nguồn gốc:** Richard Lipton (1971), DeMillo et al.
**Giải quyết thế nào:** Tạo mutant (thay đổi nhỏ code), chạy test. Nếu tất cả test pass → mutant sống (test yếu). Mục tiêu giết mutant.
*Liên quan: test coverage (line vs branch), regression test, Code coverage, Test suite quality*

### Pact

**Vấn đề khiến nó ra đời:** Cần công cụ thực thi consumer-driven contract testing một cách tự động trong CI.
**Nguồn gốc:** Matt Fellows và cộng đồng Pact (Pact Foundation)
**Giải quyết thế nào:** Framework mã nguồn mở cho contract testing: consumer sinh ra file pact, provider verify file pact đó trong pipeline CI để bắt breaking change.
*Liên quan: Contract testing, Consumer-driven contract*

### property-based test
*còn gọi: property-based testing, PBT*

**Vấn đề khiến nó ra đời:** Example-based test chỉ kiểm tra vài trường hợp. Dễ bỏ sót edge case (empty, boundary, negative). Ví dụ-based test chỉ kiểm tra một vài trường hợp cụ thể, dễ bỏ sót trường hợp biên ngẫu nhiên gây lỗi; cần kiểm tra tính chất (property) phải đúng với mọi input hợp lệ.
**Nguồn gốc:** Koen Claessen & John Hughes (QuickCheck)
**Giải quyết thế nào:** Định nghĩa thuộc tính (property) phải đúng với mọi input. Tool sinh ngẫu nhiên hàng trăm input để tìm counterexample. Developer định nghĩa thuộc tính phải luôn đúng (vd. reverse(reverse(xs)) == xs), công cụ sinh ngẫu nhiên hàng trăm input để tìm trường hợp vi phạm, sau đó rút gọn (shrinking) về trường hợp đơn giản nhất gây fail.
*Liên quan: unit test, TDD, deterministic test, Example-based testing, QuickCheck, Shrinking*

### Quarantine

**Vấn đề khiến nó ra đời:** Khi một test flaky đã được xác nhận nhưng chưa sửa ngay, nó vẫn có thể chặn toàn bộ pipeline CI — cần cách ngăn nó làm fail build mà vẫn theo dõi được.
**Nguồn gốc:** Google (Flaky test handling)
**Giải quyết thế nào:** Đánh dấu test đã biết là flaky và chạy riêng/quá trình đánh giá tách biệt (không fail CI mặc định) để tránh chặn team, đồng thời theo dõi tần suất fail để ưu tiên sửa.
*Liên quan: Flaky test*

### QuickCheck

**Vấn đề khiến nó ra đời:** Cần công cụ để tự động sinh test case từ property thay vì phải viết thủ công hàng loạt example.
**Nguồn gốc:** Koen Claessen & John Hughes (1999), Haskell
**Giải quyết thế nào:** Thư viện gốc Haskell cho property-based testing, sau này được triển khai lại trên nhiều ngôn ngữ (Hypothesis Python, RapidCheck C++, ScalaCheck...).
*Liên quan: property-based test, Shrinking*

### SAST/DAST
*còn gọi: SAST, DAST, Static Application Security Testing, Dynamic Application Security Testing*

**Vấn đề khiến nó ra đời:** Lỗ hổng bảo mật (SQLi, XSS) thường phát hiện muộn. Cần quét cả mã nguồn và ứng dụng đang chạy.
**Nguồn gốc:** OWASP-aligned tooling
**Giải quyết thế nào:** SAST: quét source không chạy. DAST: quét ứng dụng đang chạy (black-box) để tìm lỗ hổng thực tế.
*Liên quan: static analysis, chaos test, lint*

### Shrinking

**Vấn đề khiến nó ra đời:** Khi property-based test tìm thấy input gây fail, input đó thường phức tạp và khó debug; cần tự động đơn giản hóa về dạng tối thiểu nhất.
**Nguồn gốc:** Koen Claessen & John Hughes (QuickCheck)
**Giải quyết thế nào:** Thử loại bỏ hoặc đơn giản hóa từng phần của input thất bại cho đến khi không thể rút gọn thêm mà vẫn gây fail — giúp nhanh chóng xác định nguyên nhân.
*Liên quan: property-based test, QuickCheck*

### soak test
*còn gọi: endurance test, soak testing*

**Vấn đề khiến nó ra đời:** Hệ thống chạy tốt 1 giờ nhưng sau 8-24h xuất hiện memory leak, connection pool exhausted, disk full.
**Nguồn gốc:** Performance testing
**Giải quyết thế nào:** Chạy tải ổn định trong thời gian dài (hours) để phát hiện lỗi tích lũy (resource leak).
*Liên quan: load test, stress test*

## DevOps & Triển khai

### Canary deploy
*còn gọi: canary release, canary rollout, phát hành dần, chim hoàng yến*

**Vấn đề khiến nó ra đời:** Bug chỉ lộ với 1% traffic thật (dữ liệu thật, khu vực thật, timezone thật); tung toàn bộ rồi phát hiện thì toàn bộ user đã bị ảnh hưởng và rollback cũng đau. Blue-green chỉ test được môi trường trống — vẫn không trả lời được 'bản mới có chịu nổi user thật không'.
**Nguồn gốc:** Cái tên lấy từ metaphor 'chim hoàng yến trong mỏ than' (canary in the coal mine) — con nhạy với khí độc hơn người nên chết trước để cảnh báo; kỹ thuật được Google/Facebook dùng rộng và phổ biến qua cộng đồng continuous delivery.
**Giải quyết thế nào:** Đưa bản mới cho một phần rất nhỏ lưu lượng (1-5% user hoặc một node) trước, quan sát error rate/latency/metrics so với baseline; ổn thì tăng dần tới 100%, bất ổn thì dừng và rollback chỉ phần đó, 99% user không biết chuyện gì xảy ra.
*Liên quan: blue-green deploy, feature flag, zero-downtime deploy (rolling deploy), rollback, smoke test*

### Expand-contract (database migration trong deploy)
*còn gọi: expand-contract, parallel change, expand and contract, migration không downtime*

**Vấn đề khiến nó ra đời:** Deploy code mới đổi tên cột users.name → users.full_name: migration chạy trước thì app cũ vỡ, code mới chạy trước thì vỡ vì schema cũ — kẹt cứng vì hai version phải sống song song. Thêm cột NOT NULL trên bảng triệu dòng còn lock bảng hàng phút, user thấy timeout giữa lúc deploy.
**Nguồn gốc:** Được gọi là 'parallel change (expand and contract)' trong bliki của Danilo Sato trên martinfowler.com ngày 13/5/2014; kỹ thuật shadow table/online DDL ứng dụng thực tế có pt-online-schema-change của Percona Toolkit.
**Giải quyết thế nào:** Chia 3 pha: expand (thêm schema mới song song, code cũ vẫn chạy), migrate (code mới đọc/ghi cả hai và backfill dữ liệu dần, an toàn roll forward), contract (gỡ schema cũ khi không còn client nào dùng). Deployment và schema change không bao giờ phải dừng hệ thống để đi cùng nhau.
*Liên quan: zero-downtime deploy (rolling deploy), blue-green deploy, rollback, release vs deploy, CD (continuous delivery/deployment)*

### GitOps
*còn gọi: Argo CD, Flux, reconcile từ git, deploy qua pull request*

**Vấn đề khiến nó ra đời:** Đội apply YAML tay từ laptop lên cluster: ai apply cái gì, khi nào, trên cluster nào không ai biết; drift tích tụ vì có người sửa trực tiếp trên cluster, audit bằng... trí nhớ, rollback bằng cách... cố nhớ lại bản cũ. Ops thành điểm nghẽn cho mọi thay đổi hạ tầng.
**Nguồn gốc:** Thuật ngữ do Alexis Richardson (CEO Weaveworks) đặt trong bài blog ngày 2/3/2017.
**Giải quyết thế nào:** Git là single source of truth: mọi thay đổi hạ tầng/ứng dụng là PR vào git, agent trong cluster (Argo CD, Flux) tự đối chiếu trạng thái thực với trạng thái khai báo và reconcile; rollback = revert commit, mọi thứ có audit sẵn trong git history.
*Liên quan: Infrastructure as Code (Terraform, Pulumi), immutable infrastructure, Kubernetes, helm, secrets in runtime*

### HPA (Horizontal Pod Autoscaler)
*còn gọi: Horizontal Pod Autoscaler, autoscaling, tự động scale ngang, HPA*

**Vấn đề khiến nó ra đời:** Số pod cố định từ trước: đêm giao thừa hay Black Friday traffic x10, CPU chạm 95% và user thấy timeout; báo ops tăng replica thì mất 10-20 phút qua ticket, xong lại quên giảm khi traffic về — chi phí đội lên mà SLO vẫn vỡ.
**Nguồn gốc:** Là autoscaling API của Kubernetes, có từ các version đầu; về sau mở rộng cho custom/external metrics (metrics-server, Prometheus adapter).
**Giải quyết thế nào:** HPA quan sát metrics (CPU/memory, custom từ Prometheus, external) theo chu kỳ, tính số replica cần để chạm target rồi tự sửa replicas của workload — scale ngang nhiều bản, không chờ người; kết hợp với min/maxReplicas để không bao giờ scale vô hạn.
*Liên quan: deployment & replica, Kubernetes, pod, scheduler*

### Immutable infrastructure
*còn gọi: hạ tầng bất biến, immutable server, cattle not pets, infrastructure bất biến*

**Vấn đề khiến nó ra đời:** Server sống hàng tháng bị patch tay, cài package, sửa cấu hình trực tiếp: không server nào giống server nào, không thể reproduce lỗi ở môi trường khác, và mỗi lần vá là một mission có thể làm hỏng thứ đang chạy — vì server đã biến thành 'con thú cưng' không ai dám đụng.
**Nguồn gốc:** Thuật ngữ 'immutable infrastructure' do Chad Fowler đặt trong bài blog 'Trash Your Servers and Burn Your Code' năm 2013 (theo O'Reilly).
**Giải quyết thế nào:** Không bao giờ sửa server đang sống: mọi thay đổi (code, config, patch) đều tạo image/version mới, rồi thay cả cụm bằng bản mới; rollback = quay về image trước đó. Máy hỏng thì thay bằng instance dựng từ image, không 'vá lại cái cũ'.
*Liên quan: container (Docker, container image), GitOps, build artifact, Infrastructure as Code (Terraform, Pulumi), rollback*
