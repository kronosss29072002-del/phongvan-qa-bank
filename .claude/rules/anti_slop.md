# 🚫 KHÔNG SLOP — Quy tắc chống AI-slop cho nội dung

> **Áp dụng cho:** mọi session và mọi subagent viết prose trong project này (ai-content-eng, seo-content-analyst, seed writers, copywriter) — đặc biệt file body `*-bodies/*.md`, template string trong seed scripts, và mọi `*.md`.
> **Nguyên tắc vàng:** Slop không phải là "do AI viết" — nó là nội dung sinh ra vô thức, không ai đọc lại, đẩy vào mặt người không yêu cầu (Willison 2024). Viết bằng máy, đọc bằng người; máy soạn xong, người phải kiểm tra.
> **Cách dùng:** Quét **MỘT pattern mỗi lượt sửa** (không dọn cả 10 thứ cùng lúc — auroris rule). Flag, đừng tự sửa máy móc; chỗ nào nghi ngờ false positive, đánh dấu [FP] thay vì im lặng bỏ qua.
> **Trạng thái:** v1.0.0 draft (2026-09-15) — bắt buộc calibrate 2 tuần trên corpus 1663 body trước khi bật gate/CI.

---

## 1. TIER 1 — KILL ON SIGHT (cấm tuyệt đối trong prose)

### Tiếng Việt
| Cụm | Thay bằng |
|---|---|
| "Hãy cùng (khám phá/tìm hiểu/đi sâu)" | Bỏ hẳn — viết thẳng luận điểm |
| "Trong bài viết này, chúng ta sẽ (khám phá/tìm hiểu)" | Chỉ giữ khi liệt kê cấu trúc thực (mục lục) |
| "đi sâu vào" (từng dùng 195/1663 body) | "trình bày chi tiết", "giải thích kỹ" |
| "mở khóa (tiềm năng/sức mạnh)" | "dùng được", "đạt được" |
| "hành trình (khám phá/học)" nghĩa bóng (122 body) | "cách học", "trình tự", "lộ trình" (lộ trình kỹ thuật thật thì được) |
| "bức tranh (tổng thể/toàn cảnh)" (94 body) | "tổng quan", "cấu trúc", "toàn bộ hệ thống" |
| "chìa khóa (để/dẫn đến/thành công)" (81 body) | "điều kiện tiên quyết", "cách", "điểm mấu chốt" |
| "nền tảng vững chắc", "nền móng vững chắc" | "kiến thức nền", "tiền đề" |
| "vô cùng quan trọng", "cực kỳ quan trọng" | "quan trọng vì [lý do cụ thể]" |
| "không thể phủ nhận", "chắc chắn sẽ" | Nói đúng mức độ; thiếu chứng cứ thì bỏ |
| "đáng chú ý là", "điều đáng chú ý" (96 body) | "Ví dụ:", hoặc bỏ hẳn |
| "cần lưu ý rằng" | Chính lưu ý đó, không cần báo trước |
| "khi nói đến" | "Với X", "Ở khía cạnh X" |
| "hãy tưởng tượng", "tưởng tượng bạn" | Cho ví dụ thực, không dựng kịch bản giả |
| "câu hỏi đặt ra là" / "câu trả lời là" (hỏi-đáp tu từ) | Trình bày trực tiếp, trừ khi cố ý diễn ngôn |
| "đừng bỏ lỡ", "đừng quên" | Bỏ hẳn (clickbait) |
| "được mệnh danh", "được ví như" | "được gọi là" + lý do thực |
| "đóng vai trò quan trọng trong", "giữ vai trò then chốt" | "dùng để [việc cụ thể]" |
| "một trong những ... quan trọng nhất" | "X nằm trong nhóm ... vì [bằng chứng]" |
| "không chỉ X mà còn Y" (652 body) dùng làm tu từ | Kiểm tra: bỏ nửa phủ định — mất "trang trí" chứ không mất ý → xóa cả cấu trúc (xem mục 2.1) |
| "không phải X mà là Y" (dùng tu từ) | Như trên |
| "thế giới công nghệ", "trong thời đại công nghệ số" | Bỏ hẳn — mở bài vào thẳng đề |

### Tiếng Anh (giữ nguyên — xuất hiện trong nội dung song ngữ)
delve, dive into, tapestry, landscape (nghĩa bóng), realm, testament, beacon, journey (nghĩa bóng), embark, leverage (động từ), utilize, facilitate, streamline, unleash, unlock, harness, empower, foster, elevate, underscore, bolster, pivotal, crucial, robust (khi khen chung chung), comprehensive (khi khen), seamless, cutting-edge, game-changing, revolutionary, state-of-the-art (trừ khi thực sự đúng), innovative (khi đứng 1 mình khen), holistic, paradigm (shift), synergy, multifaceted, nuanced (khi rỗng), vibrant, meticulous, intricate, invaluable, groundbreaking, delve → explore; showcase → show; enhance → improve; navigate → handle.

## 2. TIER 2 — SUSPICIOUS IN CLUSTERS (tối đa 2 lần trong 1 mục ###)

Một từ riêng lẻ có thể chính đáng; 3+ từ trong cùng một section = tín hiệu cluster, phải viết lại:
- EN: moreover, furthermore, additionally (chuyển hướng bài viết), noteworthy, notably, significantly (khen chung), unlock, journey, seamless, robust, comprehensive, innovative, optimal, transformative, empower, foster, leverage, in conclusion, ultimately, at its core, in the realm of.
- VI: "cực kỳ" (236 body), "vô cùng", "đặc biệt" (khi đứng đầu câu khen), "mạnh mẽ", "toàn diện", "linh hoạt", "tối ưu", "hiệu quả" (khen-suông: "một cách hiệu quả"), "liền mạch", "tinh gọn", "thông minh" (khen-suông), "nâng cao" (trừ tên kỹ thuật thật), "ngày càng", "tương lai của", "xu hướng".
- Chuẩn kiểm tra: tính từ khen đi kèm danh từ chung mà **không có số liệu/so sánh** ("giải pháp mạnh mẽ", "hiệu suất ấn tượng") = praise adjacency → xóa hoặc gắn metric.

## 3. TIER 3 — FILLERS (xóa thẳng, không cần thay)

"ngoài ra", "hơn nữa", "bên cạnh đó", "thêm vào đó", "nhìn chung", "nói chung", "điều này có nghĩa là", "điều đó cho thấy", "như đã đề cập ở trên", "xét về tổng thể", "it's important to note that", "it's worth noting that", "let's dive in", "when it comes to", "a myriad of", "plays a crucial role in", "stands as a testament to", "in today's fast-paced world", "not only... but also", "in summary", "in essence".

## 4. QUY TẮC CẤU TRÚC (structural tells)

1. **Cấm phép tu từ phủ định** "không chỉ X mà còn Y" / "không phải X mà là Y": nếu bỏ nửa phủ định mà câu vẫn nguyên ý → nửa đó là trang trí, xóa cả cấu trúc.
2. **Cấm staccato triplet** — 3 câu ngắn đứng liền cùng kiểu ("Không vendor. Không black box. Không đàm phán."). Tối đa 1 cụm 3 nhịp có chủ đích cho cả bài.
3. **Cadence** — không quá 3 câu liên tiếp cùng độ dài (±5 từ); không mở 3 câu liền cùng một từ (trừ thuật ngữ). Độ dài đoạn phải lệch nhau (cấm "bức tường rectangles" — mọi đoạn đều 3 dòng).
4. **Mở bài**: cấm global opener. Rule "xóa 10% đầu": nếu 2 đoạn đầu có thể xóa mà không mất thông tin → xóa. Đoạn 1 phải chứa luận điểm + một chi tiết cụ thể (theo giọng ai-19: cầu nối tới kiến thức backend).
5. **Kết bài**: cấm applause line (câu ngắn sáo rỗng khép lại: "Sức mạnh nằm ở chính sự đơn giản") và cấm recap-conclusion. Kết = chốt điều đã chứng minh + cầu nối hành động/đọc tiếp. Body kết bằng mục "Nguồn" như convention.
6. **Cấm announcement sentences**: "Trong phần này, chúng ta sẽ thấy...", "Điều quan trọng cần nhấn mạnh là...", "Notably,...". Trình bày thẳng.
7. **Hedge stacking**: "có thể/thường/đôi khi/trong một số trường hợp" — tối đa 2 trong 1 câu. Ngược lại, **cấm absurd certainty** ("luôn luôn", "không bao giờ", "solved", "chắc chắn") — thay bằng "thường", "trong thực tế", "với cấu hình này".
8. **Em dash (—)**: tối đa 1/đoạn; trong 1 đoạn có 2+ em dash thì ít nhất 1 bị lạm dụng (auroris rule). Khi nghi ngờ — dùng dấu phẩy hoặc tách câu.
9. **"chính là"** (759/1663 body): tối đa 1 lần/đoạn. Nó là nhấn mạnh tự nhiên của tiếng Việt, nhưng chất đống = tic AI. Kiểu "X chính là Y" lặp 3 lần trong bài → sửa 2 chỗ.
10. **Superlative inflation**: mọi khẳng định mức độ ("nhanh nhất", "đơn giản nhất", "cực kỳ", "vượt trội") phải kèm con số hoặc đối chứng ("nhanh hơn 2x so với..."). Không có số → hạ giọng.
11. **Câu hỏi tu từ đặt ở đầu mục để "mở bài"** ("Vậy SQL injection nguy hiểm thế nào?") — chỉ dùng khi có dự định trả lời ngay bằng phân tích, không dùng làm hook rẻ tiền.
12. **Tone**: thị trường chứng khoán "thought leader" bị cấm (LinkedIn/X style). Giữ giọng ai-19: luận điểm trước, cầu nối với kiến thức sẵn có của backend reader, code chạy được, "không bịa". Trang trọng khi cần, được phép lạnh lùng và cụ thể.

## 5. CHECKLIST — TRƯỚC KHI BÁO CÁO / RENDER

- [ ] 0 từ Tier 1 trong body (grep theo wordlist — hook sẽ tự báo)
- [ ] Không mục ### nào có ≥3 từ Tier 2 (cluster)
- [ ] 0 "không chỉ...mà còn" / "không phải...mà là" tu từ
- [ ] Không có 3 câu ngắn liền nhau; không 3 câu cùng độ dài liên tiếp
- [ ] Đoạn 1 có luận điểm + chi tiết cụ thể (không phải global opener)
- [ ] Mục kết mỗi ## có takeaway chứa thông tin (không phải applause)
- [ ] Mọi số liệu/benchmark có nguồn trong NOTE gần nhất
- [ ] "chính là" ≤ 1/đoạn; em dash ≤ 1/đoạn
- [ ] Không khen-suông không có metric ("mạnh mẽ", "toàn diện", "một cách hiệu quả")
- [ ] Đọc to 1 đoạn bất kỳ: có câu nào mình sẽ không bao giờ nói vậy không?
- [ ] Phân biệt [FP]: nếu quy tắc bắt nhầm chỗ dùng chính đáng → đánh dấu, không tự sửa mù

## 6. NGUỒN (đã verify 2026-09-15)

Simon Willison, "Slop is the new name for unwanted AI-generated content" (2024-05-08); Wikipedia "AI slop"; AiSDR 11 words (Schiefelbein 2024/2026); Metric37 common AI words (Meshram 2026); Grammarly common AI words (2026-02); refine.so 17 words; Olivia Cal AI-writing tells; hardikpandya/stop-slop; petergyang/no-ai-slop; realrossmanngroup/no_ai_slop_writing_rules; adenaufal/anti-slop-writing; auroris "LLM Writing Guide"; archvalmiki "How I check my writing for AI slop"; Anthropic prompting best practices (tell what TO do) & Best practices 2026 blog. Số liệu corpus (chính là 759/1663 body...) là scan cục bộ repo ngày 2026-09-15.

---
**Version:** 1.0.1 (2026-09-15) | **Maintainer:** QA/content team | Wordlist chính thức: `.claude/rules/slop-wordlist.json` (tracked — hook + CI dùng chung file này; sửa đổi phải đồng bộ cả 3 nơi: rule doc, wordlist JSON, CI config)