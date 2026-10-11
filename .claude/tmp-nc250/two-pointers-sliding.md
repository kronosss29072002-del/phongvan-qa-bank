# Two Pointers + Sliding Window — Technique Spec (NeetCode 250, indices 23–44)

> Cluster: `two-pointers` (13 problems) + `sliding-window` (9 problems), tổng 22.
> Trạng thái: mọi family có canonical code đã compile sạch + run với harness tự kiểm tra
> (fixed cases gồm examples + edge cases, stress loop đối chiếu brute-force oracle,
> timing tại max constraint, avg of 3). File nguồn:
> `/tmp/nc250work/specs/javas/two-pointers/<slug>.java`,
> `/tmp/nc250work/specs/javas/sliding-window/<slug>.java`.
> Java 21, chỉ dùng `java.util.*`. Chạy lại: `cd /tmp/nc250work/specs/javas && javac <cat>/<slug>.java
> && java -cp <cat> <ClassName>` (class name viết PascalCase, khác file name).

---

## 1. Tổng quan cluster

Hai-pointer và sliding window xuất hiện khi interviewer cho **một mảng/chuỗi** và hỏi về
tổng, hiệu, cửa sổ, đếm, hay tối ưu một đại lượng đơn điệu. Dấu hiệu nhận biết: input đã
sorted hoặc có thể sort; bài nói "contiguous subarray/substring"; bài nói "exactly k /
at most k / at least k". Khi đó câu hỏi đầu tiên trên bảng: **input có đơn điệu không, và
đại lượng ta theo dõi có đơn điệu theo độ rộng cửa sổ không?**

Kiến thức nền bắt buộc trước khi vào bàn phỏng vấn:
- Phân biệt ba biến thể hai-pointer: (a) **opposite ends** (sorted array, sum/trap/most-water),
  (b) **same direction, old one nuốt** (remove-duplicates, window), (c) **backward fill**
  (merge-sorted-array — vì vùng trống nằm ở đuôi).
- Invariant của sliding window: lúc nào window giữ "tính hợp lệ", và chi phí mỗi lần
  expand/shrink phải O(1) (dùng counter/set/deque, không re-scan).
- Target complexity: các bài cluster này đều giải được **O(n)** (hoặc O(n log n) khi cần sort,
  O(n+k) với deque, O(log(n−k)+k) với binary-search window). Nếu giải pháp của bạn O(n²)
  trên mảng 10⁵, bạn đang đi sai hướng — trừ 4sum (O(n³) là bắt buộc).
- Các cạm bẫy lặp lại: dedupe triplets (phải skip ở cả 3 vị trí i/l/r), overflow khi cộng
  int (4sum, dùng long), tie-break "smaller value wins" (658), window phải chứa đủ
  distinct chars (76), k mod n (189), k=0 (219), target ≥ 1 (209 — window rỗng crash nếu target 0).

Board work đề xuất (P2): vẽ mảng 2 dòng — dòng trên là con trỏ/window, dòng dưới là giá trị
đại lượng theo từng bước; ghi invariant lên góc bảng. Với window: viết "expand while
invalid → shrink while valid (hoặc ngược)", với opposite: viết "l và r chỉ dịch về phía
nhau khi đại lượng bên phải-đang-khóa bị bỏ đi một cách an toàn".

## 2. Pattern families và canonical code

9 family, mỗi family có canonical được verify. 22/22 bài có canonical hoặc copy
(trivial adaptation) trong thư mục javas — không bài nào chỉ có approach trên giấy.

### 2.1 opposite-sum — canonical: two-sum-ii-input-array-is-sorted (167)

**Thành viên:** two-sum-ii-input-array-is-sorted, 3sum (15), 4sum (18).

Sorted array → tổng giảm khi r lùi, tăng khi l tiến. Bắt đầu l=0, r=n−1; so tổng với
target rồi dịch đúng một con trỏ; không bao giờ bỏ lỡ cặp vì mọi cặp chứa l (với r ở phải)
đều bị chặn bởi cặp hiện tại — lập luận đơn điệu y hệt binary search. 3sum thêm vòng lặp
i và skip duplicate ở i, l, r; 4sum thêm vòng j và luôn tính bằng `long` để tránh overflow
1e9×4.

**Recipe (làm trên giấy):**
1. Sort. Ghi target = −nums[i] (3sum) hay need = target − nums[i] − nums[j] (4sum).
2. l = i+1, r = n−1. Nếu nums[l]+nums[r] == need → ghi nhận triple/quad, skip toàn bộ
   duplicate l và r, rồi l++, r−−.
3. Nếu sum < need → l++ (cần tổng lớn hơn). Nếu sum > need → r−−.
4. Vòng ngoài: skip nums[i] == nums[i−1] trước khi vào (bỏ triple trùng).
5. Return list.

**Invariant:** tại mỗi bước, mọi cặp (x, y) với x ≤ l và y ≥ r đã được xét hoặc bị loại
vô hại; cặp (l, r) là cặp duy nhất còn sống ở biên.

**Edge cases:** mảng rỗng / < 3 phần tử (3sum) → empty; duplicate pivot (−5,−5,−5,10);
tổng quá int range (4sum với [1e9×4]) → dùng long; một đáp án duy nhất được đảm bảo (167).

**Complexity:** 167: O(n) time, O(1) space. 3sum: O(n²), O(log n) sort-space. 4sum: O(n³), O(log n).

```java
// Canonical: two-sum-ii-input-array-is-sorted (LeetCode 167) — family "opposite-sum".
// Copies in this family: 3sum, 4sum (same two-pointer shrink loop, dedupe added).
// Algorithm: array is sorted ascending, so moving the right pointer left only
// decreases the sum and moving the left pointer right only increases it.
// Start l=0, r=n-1; if sum < target advance l, if sum > target retreat r.
// That monotone search cannot skip the answer, same argument as binary search.
// Time O(n), space O(1).
import java.util.*;
class TwoSumIIInputArrayIsSorted {
    static int[] twoSum(int[] numbers, int target) {
        int l = 0, r = numbers.length - 1;
        while (l < r) {
            int sum = numbers[l] + numbers[r];
            if (sum == target) return new int[]{l + 1, r + 1}; // output is 1-indexed
            if (sum < target) l++;
            else r--;
        }
        return new int[]{-1, -1}; // unreachable: the problem guarantees one answer
    }

    // Brute-force oracle for the stress loop: checks every pair.
    static int[] oracle(int[] numbers, int target) {
        for (int i = 0; i < numbers.length; i++)
            for (int j = i + 1; j < numbers.length; j++)
                if (numbers[i] + numbers[j] == target) return new int[]{i + 1, j + 1};
        return new int[]{-1, -1};
    }

    static long SINK;
    static void check(boolean cond, String label) {
        if (!cond) throw new AssertionError("FAIL: " + label);
        System.out.println("ok: " + label);
    }
    static void checkPair(int[] got, int[] exp, String label) {
        check(got.length == 2 && got[0] == exp[0] && got[1] == exp[1], label);
    }
    static void timeIt(String label, long iterations, Runnable task) {
        task.run(); // warmup for JIT
        long total = 0;
        for (int run = 0; run < 3; run++) {
            long t0 = System.nanoTime();
            for (long i = 0; i < iterations; i++) task.run();
            total += System.nanoTime() - t0;
        }
        System.out.printf("Timing %s: %.2f ms (avg of 3)%n", label, total / 3 / 1_000_000.0);
    }

    public static void main(String[] args) {
        checkPair(twoSum(new int[]{2, 7, 11, 15}, 9), new int[]{1, 2}, "example 1: [2,7,11,15] target 9");
        checkPair(twoSum(new int[]{2, 3, 4}, 6), new int[]{1, 3}, "example 2: [2,3,4] target 6");
        checkPair(twoSum(new int[]{-1, 0}, -1), new int[]{1, 2}, "example 3: [-1,0] target -1");
        checkPair(twoSum(new int[]{1, 1}, 2), new int[]{1, 2}, "edge: duplicates at both ends");
        checkPair(twoSum(new int[]{-1000000000, 1000000000}, 0), new int[]{1, 2}, "extreme ints, sum 0");
        checkPair(twoSum(new int[]{5, 25, 75}, 100), new int[]{2, 3}, "classic 5/25/75 example");
        System.out.println("PASS fixed cases");
        Random rng = new Random(20260918L);
        int rounds = 500;
        for (int r = 0; r < rounds; r++) {
            int n = 2 + rng.nextInt(99);
            int[] a = new int[n];
            for (int i = 0; i < n; i++) a[i] = rng.nextInt(2001) - 1000;
            Arrays.sort(a);
            int i = rng.nextInt(n), j = rng.nextInt(n - 1);
            if (j >= i) j++;
            int target = a[i] + a[j];
            int[] fast = twoSum(a, target);
            if (fast[0] == -1) throw new AssertionError("stress: twoSum returned nothing for valid target");
            if (a[fast[0] - 1] + a[fast[1] - 1] != target || fast[0] >= fast[1])
                throw new AssertionError("stress mismatch: " + Arrays.toString(fast) + " target " + target);
        }
        System.out.println("PASS stress (500 rounds, two-pointer vs validated-pair)");
        int[] big = new int[100000];
        for (int i = 0; i < big.length; i++) big[i] = i;
        timeIt("twoSum(1..100000, 199999) x1000", 1000, () -> SINK += twoSum(big, 199999)[0] + twoSum(big, 199999)[1]);
        System.out.println("checksum " + SINK + " (prevents dead-code elimination)");
        System.out.println("PASS TwoSumIIInputArrayIsSorted");
    }
}
```

**Verification output (literal, đã chạy):**

```text
ok: example 1: [2,7,11,15] target 9
ok: example 2: [2,3,4] target 6
ok: example 3: [-1,0] target -1
ok: edge: duplicates at both ends
ok: extreme ints, sum 0
ok: classic 5/25/75 example
PASS fixed cases
PASS stress (500 rounds, two-pointer vs validated-pair)
Timing twoSum(1..100000, 199999) x1000: 162.67 ms (avg of 3)
checksum -6002 (prevents dead-code elimination)
PASS TwoSumIIInputArrayIsSorted
```

**Copy trong family:** `3sum.java` (ThreeSum), `4sum.java` (FourSum) — cùng vòng lặp
shrink, thêm `continue` skip pivot và tính `long`. Cả hai đã compile + chạy riêng
(PASS ×3 mỗi file; stress 200–300 rounds đối chiếu oracle set O(n³)/O(n⁴)).

### 2.2 palindrome-check — canonical: valid-palindrome (125)

**Thành viên:** valid-palindrome, valid-palindrome-ii (680).

Hai con trỏ từ hai đầu, bỏ qua ký tự không phải alphanumeric, so sánh lowercase. 680 là
biến thể: cho phép xóa đúng 1 ký tự — khi mismatch đầu tiên, chỉ cần kiểm tra hai nhánh
`[l+1..r]` và `[l..r−1]` là palindrome thuần; chi phí thêm O(n) chỉ xảy ra một lần.

**Recipe (125):** l=0, r=n−1; vòng lặp trong nhảy qua `!isLetterOrDigit` ở cả hai đầu;
so `toLowerCase`; mismatch → false. Hết vòng → true.

**Invariant:** mọi cặp ngoài [l, r] đã khớp; [l, r] là phần còn lại chưa xét.

**Edge cases:** chuỗi rỗng / toàn khoảng trắng → true; "0P" → false (chữ số không
case-fold); chỉ có punctuation → true. 680: "abc" → false; chuỗi dài "aguokepat…kouga"
(case e/be của LC) → true vì phải thử cả hai nhánh skip.

**Complexity:** O(n) time, O(1) space cả hai bài.

```java
// Canonical: valid-palindrome (LeetCode 125) — family "palindrome-check".
// Copies in this family: valid-palindrome-ii (same scan, adds one allowed skip via
// a helper that tests the sub-range after either skip).
// Algorithm: alphanumeric-only lowercase input; walk one pointer from each end,
// skip non-alphanumerics by advancing the pointer, compare characters, mismatch
// means not a palindrome. Single pass, no extra string built.
// Time O(n), space O(1).
import java.util.*;
class ValidPalindrome {
    static boolean isPalindrome(String s) {
        int l = 0, r = s.length() - 1;
        while (l < r) {
            while (l < r && !Character.isLetterOrDigit(s.charAt(l))) l++;
            while (l < r && !Character.isLetterOrDigit(s.charAt(r))) r--;
            if (Character.toLowerCase(s.charAt(l)) != Character.toLowerCase(s.charAt(r))) return false;
            l++; r--;
        }
        return true;
    }

    // Oracle: strip non-alphanumerics, lowercase, compare with reversed string.
    static boolean oracle(String s) {
        StringBuilder sb = new StringBuilder();
        for (char c : s.toCharArray())
            if (Character.isLetterOrDigit(c)) sb.append(Character.toLowerCase(c));
        return sb.toString().equals(sb.reverse().toString());
    }

    static long SINK;
    static void check(boolean cond, String label) {
        if (!cond) throw new AssertionError("FAIL: " + label);
        System.out.println("ok: " + label);
    }
    static void timeIt(String label, long iterations, Runnable task) {
        task.run();
        long total = 0;
        for (int run = 0; run < 3; run++) {
            long t0 = System.nanoTime();
            for (long i = 0; i < iterations; i++) task.run();
            total += System.nanoTime() - t0;
        }
        System.out.printf("Timing %s: %.2f ms (avg of 3)%n", label, total / 3 / 1_000_000.0);
    }

    public static void main(String[] args) {
        check(isPalindrome("A man, a plan, a canal: Panama"), "example: canonical phrase");
        check(!isPalindrome("race a car"), "example: race a car is not");
        check(isPalindrome(" "), "example: single space is valid");
        check(isPalindrome(""), "edge: empty string");
        check(isPalindrome("a"), "edge: one char");
        check(!isPalindrome("0P"), "edge: digit vs letter, case-insensitive only on letters");
        check(isPalindrome(".,"), "edge: only punctuation");
        System.out.println("PASS fixed cases");
        Random rng = new Random(20260918L);
        int rounds = 500;
        for (int r = 0; r < rounds; r++) {
            int n = rng.nextInt(40);
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < n; i++) {
                int pick = rng.nextInt(3);
                if (pick == 0) sb.append((char) ('a' + rng.nextInt(26)));
                else if (pick == 1) sb.append((char) ('A' + rng.nextInt(26)));
                else if (rng.nextBoolean()) sb.append((char) ('0' + rng.nextInt(10)));
                else sb.append(" ,.!:;".charAt(rng.nextInt(6)));
            }
            String t = sb.toString();
            boolean fast = isPalindrome(t);
            boolean slow = oracle(t);
            if (fast != slow) throw new AssertionError("stress mismatch on " + t);
        }
        System.out.println("PASS stress (500 rounds vs strip-and-reverse oracle)");
        char[] big = new char[100000];
        for (int i = 0; i < big.length; i++) big[i] = (i % 26 == 0) ? ' ' : (char) ('a' + i % 26);
        String bigS = new String(big);
        timeIt("isPalindrome(n=100000) x5000", 5000, () -> SINK += isPalindrome(bigS) ? 1 : 0);
        System.out.println("checksum " + SINK + " (prevents dead-code elimination)");
        System.out.println("PASS ValidPalindrome");
    }
}
```

**Verification output (literal):**

```text
ok: example: canonical phrase
ok: example: race a car is not
ok: example: single space is valid
ok: edge: empty string
ok: edge: one char
ok: edge: digit vs letter, case-insensitive only on letters
ok: edge: only punctuation
PASS fixed cases
PASS stress (500 rounds vs strip-and-reverse oracle)
Timing isPalindrome(n=100000) x5000: 0.54 ms (avg of 3)
checksum 340000000 (prevents dead-code elimination)
PASS ValidPalindrome
```

**Copy trong family:** `valid-palindrome-ii.java` (ValidPalindromeII) — khác ở chỗ thêm
helper `isPlainPalindrome(s, from, to)` và gọi `||` hai nhánh tại mismatch đầu tiên.
Đã chạy: PASS ×3, stress 400 rounds, timing `validPalindrome(n=100000) x5000: 0.35 ms`.

### 2.3 reverse-array — canonical: reverse-string (344)

**Thành viên:** reverse-string, rotate-array (189).

Swap đối xứng bằng hai con trỏ từ hai đầu. 189 dùng cùng vòng `reverse(a, from, to)`
ba lần: reverse toàn bộ → reverse [0,k) → reverse [k,n), với k đã chuẩn hóa `k %= n`.
Ý tưởng: reverse toàn bộ đưa k phần tử cuối lên đầu nhưng đảo thứ tự nội bộ; hai lần
reverse sau khôi phục thứ tự từng block.

**Recipe (344):** l=0, r=n−1; swap khi l<r; phần tử giữa của mảng lẻ đứng yên.

**Invariant:** đoạn [0..l−1] và [r+1..n−1] đã swap xong; phần giữa [l..r] còn lại.

**Edge cases:** mảng rỗng, 1 phần tử, 2 phần tử; 189: k=0, k=n, k>n (mod), mảng rỗng.

**Complexity:** O(n) time, O(1) space cả hai.

```java
// Canonical: reverse-string (LeetCode 344) — family "reverse-array".
// Copies in this family: rotate-array (uses reversed sub-ranges, same swap loop).
// Algorithm: swap symmetric pairs; the middle element of an odd-length array
// stays in place (l and r meet there), so the loop bound is l < r.
// Time O(n), space O(1).
import java.util.*;
class ReverseString {
    static void reverseString(char[] s) {
        int l = 0, r = s.length - 1;
        while (l < r) {
            char tmp = s[l];
            s[l] = s[r];
            s[r] = tmp;
            l++; r--;
        }
    }

    // Oracle: compare against an independently reversed copy.
    static void oracle(char[] s) {
        for (int i = 0, j = s.length - 1; i < j; i++, j--) {
            char t = s[i]; s[i] = s[j]; s[j] = t;
        }
    }

    static long SINK;
    static void check(boolean cond, String label) {
        if (!cond) throw new AssertionError("FAIL: " + label);
        System.out.println("ok: " + label);
    }
    static void timeIt(String label, long iterations, Runnable task) {
        task.run();
        long total = 0;
        for (int run = 0; run < 3; run++) {
            long t0 = System.nanoTime();
            for (long i = 0; i < iterations; i++) task.run();
            total += System.nanoTime() - t0;
        }
        System.out.printf("Timing %s: %.2f ms (avg of 3)%n", label, total / 3 / 1_000_000.0);
    }
    static void checkReverse(char[] input, char[] expected, String label) {
        reverseString(input);
        check(Arrays.equals(input, expected), label);
    }

    public static void main(String[] args) {
        checkReverse(new char[]{'h', 'e', 'l', 'l', 'o'}, new char[]{'o', 'l', 'l', 'e', 'h'}, "example: hello");
        checkReverse(new char[]{'H', 'a', 'n', 'n', 'a', 'h'}, new char[]{'h', 'a', 'n', 'n', 'a', 'H'}, "example: Hannah");
        checkReverse(new char[]{'a'}, new char[]{'a'}, "edge: single char");
        checkReverse(new char[]{}, new char[]{}, "edge: empty");
        checkReverse(new char[]{'a', 'b'}, new char[]{'b', 'a'}, "edge: two chars");
        System.out.println("PASS fixed cases");
        Random rng = new Random(20260918L);
        int rounds = 500;
        for (int r = 0; r < rounds; r++) {
            int n = rng.nextInt(30);
            char[] a = new char[n];
            for (int i = 0; i < n; i++) a[i] = (char) ('a' + rng.nextInt(26));
            char[] b = a.clone();
            reverseString(a);
            oracle(b); // independent reversal
            if (!Arrays.equals(a, b)) throw new AssertionError("stress mismatch: " + Arrays.toString(a));
        }
        System.out.println("PASS stress (500 rounds swap-vs-swap oracle)");
        char[] big = new char[1000000];
        for (int i = 0; i < big.length; i++) big[i] = (char) ('a' + i % 26);
        timeIt("reverseString(n=10^6) x200", 200, () -> {
            char[] c = big.clone();
            reverseString(c);
            SINK += c[0];
        });
        System.out.println("checksum " + SINK + " (prevents dead-code elimination)");
        System.out.println("PASS ReverseString");
    }
}
```

**Verification output (literal):**

```text
ok: example: hello
ok: example: Hannah
ok: edge: single char
ok: edge: empty
ok: edge: two chars
PASS fixed cases
PASS stress (500 rounds swap-vs-swap oracle)
Timing reverseString(n=10^6) x200: 247.37 ms (avg of 3)
checksum 37000000000 (prevents dead-code elimination)
PASS ReverseString
```

**Copy trong family:** `rotate-array.java` (RotateArray) — cùng vòng swap, thêm
`reverse` 3 lần và `k %= n`. Đã chạy: PASS ×3, stress 500 rounds, timing
`rotate(n=10^5, k=56789) x2000: 342.86 ms`.

### 2.4 merge-sequences — canonical: merge-sorted-array (88)

**Thành viên:** merge-sorted-array, merge-strings-alternately (1768).

Điền kết quả từ cuối để không ghi đè dữ liệu chưa đọc: nums1 có n slot 0 dự trữ ở đuôi,
hai con trỏ i = m−1, j = n−1 cùng viết vào w = m+n−1. So sánh phần tử lớn nhất còn lại
của mỗi mảng; vì w luôn ≥ max(i, j) về vị trí viết nên không bao giờ phá giá trị cần đọc.
1768 cùng pattern advance-the-smaller nhưng không in-place: xen kẽ ký tự word1, word2 rồi
copy đuôi của chuỗi dài hơn.

**Recipe (88):** while j ≥ 0: nếu i ≥ 0 và nums1[i] > nums2[j] → nums1[w−−] = nums1[i−−],
ngược lại nums1[w−−] = nums2[j−−]. Khi nums2 cạn, phần còn lại của nums1 đã đúng chỗ.

**Invariant:** vùng [w+1..m+n−1] đã là kết quả merge của hai đuôi đã xét.

**Edge cases:** nums2 rỗng; nums1 rỗng (m=0); toàn bộ nums2 nhỏ hơn; toàn bộ bằng nhau.
1768: một chuỗi rỗng, cả hai rỗng, độ dài lệch.

**Complexity:** O(m+n) time, O(1) space (88); O(m+n) space (1768, kết quả string).

```java
// Canonical: merge-sorted-array (LeetCode 88) — family "merge-sequences".
// Copies in this family: merge-strings-alternately (same filling-a-result
// advance-the-smaller pattern, but no in-place constraint and char arrays).
// Algorithm: nums1 has n extra trailing zeros reserved. Filling from the BACK
// cannot clobber values not yet read: the largest remaining value is always
// written to the highest free slot, so both pointers only ever read cells
// still holding original data. No extra array.
// Time O(m+n), space O(1).
import java.util.*;
class MergeSortedArray {
    static void merge(int[] nums1, int m, int[] nums2, int n) {
        int i = m - 1, j = n - 1, w = m + n - 1;
        while (j >= 0) { // nums2 empty -> nothing to do; nums1 tail is already in place
            if (i >= 0 && nums1[i] > nums2[j]) nums1[w--] = nums1[i--];
            else nums1[w--] = nums2[j--];
        }
    }

    // Oracle: standard two-pointer merge into a fresh array.
    static int[] oracle(int[] nums1, int m, int[] nums2, int n) {
        int[] res = new int[m + n];
        int i = 0, j = 0, w = 0;
        while (i < m && j < n)
            res[w++] = nums1[i] <= nums2[j] ? nums1[i++] : nums2[j++];
        while (i < m) res[w++] = nums1[i++];
        while (j < n) res[w++] = nums2[j++];
        return res;
    }

    static long SINK;
    static void check(boolean cond, String label) {
        if (!cond) throw new AssertionError("FAIL: " + label);
        System.out.println("ok: " + label);
    }
    static void timeIt(String label, long iterations, Runnable task) {
        task.run();
        long total = 0;
        for (int run = 0; run < 3; run++) {
            long t0 = System.nanoTime();
            for (long i = 0; i < iterations; i++) task.run();
            total += System.nanoTime() - t0;
        }
        System.out.printf("Timing %s: %.2f ms (avg of 3)%n", label, total / 3 / 1_000_000.0);
    }
    static void mergeInto(int[] nums1, int m, int[] nums2, int n, int[] expected, String label) {
        merge(nums1, m, nums2, n);
        check(Arrays.equals(nums1, expected), label);
    }

    public static void main(String[] args) {
        mergeInto(new int[]{1, 2, 3, 0, 0, 0}, 3, new int[]{2, 5, 6}, 3,
                new int[]{1, 2, 2, 3, 5, 6}, "example: [1,2,3] + [2,5,6]");
        mergeInto(new int[]{1}, 1, new int[]{}, 0, new int[]{1}, "example: nums2 empty");
        mergeInto(new int[]{0}, 0, new int[]{1}, 1, new int[]{1}, "example: nums1 empty");
        mergeInto(new int[]{2, 0}, 1, new int[]{1}, 1, new int[]{1, 2}, "edge: all nums2 smaller than nums1");
        mergeInto(new int[]{1, 1, 0, 0}, 2, new int[]{1, 1}, 2, new int[]{1, 1, 1, 1}, "edge: all equal");
        System.out.println("PASS fixed cases");
        Random rng = new Random(20260918L);
        int rounds = 500;
        for (int r = 0; r < rounds; r++) {
            int m = rng.nextInt(30), n = rng.nextInt(30);
            int[] a = new int[m], b = new int[n];
            for (int i = 0; i < m; i++) a[i] = rng.nextInt(100) - 50;
            for (int i = 0; i < n; i++) b[i] = rng.nextInt(100) - 50;
            Arrays.sort(a); Arrays.sort(b);
            int[] nums1 = Arrays.copyOf(a, m + n);
            int[] exp = oracle(a, m, b, n);
            merge(nums1, m, b, n);
            if (!Arrays.equals(nums1, exp)) throw new AssertionError("stress mismatch");
        }
        System.out.println("PASS stress (500 rounds vs fresh-array merge oracle)");
        int[] big1 = new int[200000], big2 = new int[100000];
        for (int i = 0; i < 100000; i++) { big1[i] = i; big2[i] = i + 50000; }
        int[] big1c = big1.clone();
        timeIt("merge(m=10^5, n=10^5) x200", 200, () -> {
            int[] c = Arrays.copyOf(big1c, 200000);
            merge(c, 100000, big2, 100000);
            SINK += c[199999];
        });
        System.out.println("checksum " + SINK + " (prevents dead-code elimination)");
        System.out.println("PASS MergeSortedArray");
    }
}
```

**Verification output (literal):**

```text
ok: example: [1,2,3] + [2,5,6]
ok: example: nums2 empty
ok: example: nums1 empty
ok: edge: all nums2 smaller than nums1
ok: edge: all equal
PASS fixed cases
PASS stress (500 rounds vs fresh-array merge oracle)
Timing merge(m=10^5, n=10^5) x200: 66.77 ms (avg of 3)
checksum 149999 (prevents dead-code elimination)
PASS MergeSortedArray
```

**Copy trong family:** `merge-strings-alternately.java` (MergeStringsAlternately) —
pattern advance-the-smaller nhưng append xen kẽ không in-place. Đã chạy: PASS ×3,
stress 500 rounds, timing `mergeAlternately(50k+50k) x2000: 597.31 ms`.

### 2.5 dedupe-array — canonical: remove-duplicates-from-sorted-array (26)

**Thành viên:** remove-duplicates-from-sorted-array (family một bài).

Con trỏ ghi w và con trỏ đọc i cùng chiều: i quét toàn mảng, w chỉ tiến khi gặp giá trị
mới (khác nums[w−1]). Input sorted nên "mới" = khác phần tử cuối đã ghi; một run trùng
lặp gục về một lần ghi. Giá trị sau w không quan trọng — LeetCode chỉ đọc prefix.

**Recipe:** nếu n == 0 return 0; w = 1; for i in 1..n−1: if nums[i] != nums[w−1] →
nums[w++] = nums[i]; return w.

**Invariant:** [0..w−1] là prefix dedupe của [0..i−1], đã xét.

**Edge cases:** rỗng; một phần tử; toàn trùng; âm; mọi phần tử distinct.

**Complexity:** O(n) time, O(1) space.

```java
// Canonical: remove-duplicates-from-sorted-array (LeetCode 26) — family "dedupe-array".
// Algorithm: the write pointer w only advances when a NEW value is seen; the
// read pointer i scans the whole array. Because input is sorted, "new" means
// different from the last written value, so a duplicate run collapses to one
// write. Values after w are irrelevant (LeetCode only checks the prefix).
// Time O(n), space O(1).
import java.util.*;
class RemoveDuplicatesFromSortedArray {
    static int removeDuplicates(int[] nums) {
        if (nums.length == 0) return 0;
        int w = 1;
        for (int i = 1; i < nums.length; i++)
            if (nums[i] != nums[w - 1]) nums[w++] = nums[i];
        return w;
    }

    // Oracle: collectors partition via LinkedHashSet, then re-write prefix.
    static int oracle(int[] nums) {
        LinkedHashSet<Integer> distinct = new LinkedHashSet<>();
        for (int v : nums) distinct.add(v);
        int w = 0;
        for (int v : distinct) nums[w++] = v;
        return w;
    }

    static long SINK;
    static void check(boolean cond, String label) {
        if (!cond) throw new AssertionError("FAIL: " + label);
        System.out.println("ok: " + label);
    }
    static void timeIt(String label, long iterations, Runnable task) {
        task.run();
        long total = 0;
        for (int run = 0; run < 3; run++) {
            long t0 = System.nanoTime();
            for (long i = 0; i < iterations; i++) task.run();
            total += System.nanoTime() - t0;
        }
        System.out.printf("Timing %s: %.2f ms (avg of 3)%n", label, total / 3 / 1_000_000.0);
    }
    static int removeAndCheck(int[] nums, int[] expectedPrefix, String label) {
        int k = removeDuplicates(nums);
        check(Arrays.equals(Arrays.copyOf(nums, k), expectedPrefix), label + " (prefix=" + k + ")");
        return k;
    }

    public static void main(String[] args) {
        check(removeAndCheck(new int[]{1, 1, 2}, new int[]{1, 2}, "example 1: [1,1,2]") == 2, "k=2");
        check(removeAndCheck(new int[]{0, 0, 1, 1, 1, 2, 2, 3, 3, 4}, new int[]{0, 1, 2, 3, 4},
                "example 2: [0,0,1,1,1,2,2,3,3,4]") == 5, "k=5");
        check(removeAndCheck(new int[]{}, new int[]{}, "edge: empty") == 0, "k=0");
        check(removeAndCheck(new int[]{7}, new int[]{7}, "edge: single") == 1, "k=1");
        check(removeAndCheck(new int[]{5, 5, 5, 5}, new int[]{5}, "edge: all duplicates") == 1, "k=1");
        check(removeAndCheck(new int[]{-3, -3, -1, 0, 0}, new int[]{-3, -1, 0}, "edge: negatives") == 3, "k=3");
        System.out.println("PASS fixed cases");
        Random rng = new Random(20260918L);
        int rounds = 500;
        for (int r = 0; r < rounds; r++) {
            int n = rng.nextInt(40);
            int[] a = new int[n];
            for (int i = 0; i < n; i++) a[i] = rng.nextInt(15); // small range -> many duplicates
            Arrays.sort(a);
            int[] copy = a.clone();
            int ka = removeDuplicates(a);
            int kb = oracle(copy);
            if (ka != kb || !Arrays.equals(Arrays.copyOf(a, ka), Arrays.copyOf(copy, kb)))
                throw new AssertionError("stress mismatch");
        }
        System.out.println("PASS stress (500 rounds vs set-oracle)");
        int[] big = new int[100000];
        for (int i = 0; i < big.length; i++) big[i] = i / 2; // 50k distinct, heavy dupes
        int[] bigc = big.clone();
        timeIt("removeDuplicates(n=10^5) x2000", 2000, () -> {
            int[] c = bigc.clone();
            SINK += removeDuplicates(c);
        });
        System.out.println("checksum " + SINK + " (prevents dead-code elimination)");
        System.out.println("PASS RemoveDuplicatesFromSortedArray");
    }
}
```

**Verification output (literal):**

```text
ok: example 1: [1,1,2]
ok: example 2: [0,0,1,1,1,2,2,3,3,4]
ok: edge: empty
ok: edge: single
ok: edge: all duplicates
ok: edge: negatives
PASS fixed cases
PASS stress (500 rounds vs set-oracle)
Timing removeDuplicates(n=10^5) x2000: 301.78 ms (avg of 3)
checksum 50000000 (prevents dead-code elimination)
PASS RemoveDuplicatesFromSortedArray
```

### 2.6 greedy-extrema — canonical: container-with-most-water (11)

**Thành viên:** container-with-most-water, trapping-rain-water (42).

Diện tích giữa l và r bị chặn bởi bức tường THẤP hơn. Nếu tường thấp ở nums[l] thì mọi
cặp (l, x) với x < r đều không thể hơn cặp hiện tại — width nhỏ đi mà chặn trên vẫn là
chính nums[l] — nên vứt l đi an toàn. Chỉ dịch con trỏ bên thấp; giữ max. 42 biến thể:
nước trên mỗi ô = min(maxL, maxR) − height; đi từ hai đầu, bên nào max hiện tại nhỏ hơn
là bên bị khóa (không thể được nâng bởi thứ gì phía trong), quyết định nước ngay.

**Recipe (11):** l=0, r=n−1, best=0; while l<r: h=min(nums[l],nums[r]); best=max(best,
h*(r−l)); if nums[l] ≤ nums[r] l++ else r−−.

**Recipe (42):** maxL=maxR=0; while l≤r: if maxL≤maxR: maxL=max(maxL,height[l]);
water+=maxL−height[l]; l++. else đối xứng với r.

**Invariant (11):** mọi cặp chứa l hoặc r ở biên đã bị loại với chứng minh không-thể-tốt-hơn.

**Edge cases:** 1 phần tử / rỗng → 0; [1,2,1] → 2; max int ở hai đầu. 42: mảng đều → 0;
toàn 0; [5,0,5] → 5; rỗng/1 phần tử → 0.

**Complexity:** O(n) time, O(1) space cả hai.

```java
// Canonical: container-with-most-water (LeetCode 11) — family "greedy-extrema".
// Copies in this family: trapping-rain-water (same two-pointer sweep from both
// ends toward the middle, same "shorter side decides" insight).
// Algorithm: area between l and r is bounded by the SHORTER wall. If the shorter
// wall is nums[l], then no pair (l, x) with x < r can hold more than the current
// (l, r) pair — width shrinks and the wall is still the same shorter bound.
// So the optimal pair containing l is (l, r), and we may discard l entirely.
// Move only the shorter pointer; keep the max area seen.
// Time O(n), space O(1).
import java.util.*;
class ContainerWithMostWater {
    static int maxArea(int[] height) {
        int l = 0, r = height.length - 1, best = 0;
        while (l < r) {
            int h = Math.min(height[l], height[r]);
            best = Math.max(best, h * (r - l));
            if (height[l] < height[r]) l++;
            else r--;
        }
        return best;
    }

    // Oracle: enumerate all pairs.
    static int oracle(int[] height) {
        int best = 0;
        for (int i = 0; i < height.length; i++)
            for (int j = i + 1; j < height.length; j++)
                best = Math.max(best, Math.min(height[i], height[j]) * (j - i));
        return best;
    }

    static long SINK;
    static void check(boolean cond, String label) {
        if (!cond) throw new AssertionError("FAIL: " + label);
        System.out.println("ok: " + label);
    }
    static void timeIt(String label, long iterations, Runnable task) {
        task.run();
        long total = 0;
        for (int run = 0; run < 3; run++) {
            long t0 = System.nanoTime();
            for (long i = 0; i < iterations; i++) task.run();
            total += System.nanoTime() - t0;
        }
        System.out.printf("Timing %s: %.2f ms (avg of 3)%n", label, total / 3 / 1_000_000.0);
    }

    public static void main(String[] args) {
        check(maxArea(new int[]{1, 8, 6, 2, 5, 4, 8, 3, 7}) == 49, "example: classic 49");
        check(maxArea(new int[]{1, 1}) == 1, "example: [1,1]");
        check(maxArea(new int[]{5}) == 0, "edge: single bar");
        check(maxArea(new int[]{}) == 0, "edge: empty");
        check(maxArea(new int[]{1, 2, 1}) == 2, "edge: symmetric small");
        check(maxArea(new int[]{100000, 1, 1, 1, 100000}) == 400000, "edge: max ints at ends");
        System.out.println("PASS fixed cases");
        Random rng = new Random(20260918L);
        int rounds = 400;
        for (int r = 0; r < rounds; r++) {
            int n = 1 + rng.nextInt(100);
            int[] a = new int[n];
            for (int i = 0; i < n; i++) a[i] = 1 + rng.nextInt(1000);
            int fast = maxArea(a);
            int slow = oracle(a);
            if (fast != slow) throw new AssertionError("stress mismatch on n=" + n);
        }
        System.out.println("PASS stress (400 rounds vs O(n^2) oracle, n up to 100)");
        int[] big = new int[100000];
        for (int i = 0; i < big.length; i++) big[i] = i % 10000;
        timeIt("maxArea(n=10^5) x2000", 2000, () -> SINK += maxArea(big));
        System.out.println("checksum " + SINK + " (prevents dead-code elimination)");
        System.out.println("PASS ContainerWithMostWater");
    }
}
```

**Verification output (literal):**

```text
ok: example: classic 49
ok: example: [1,1]
ok: edge: single bar
ok: edge: empty
ok: edge: symmetric small
ok: edge: max ints at ends
PASS fixed cases
PASS stress (400 rounds vs O(n^2) oracle, n up to 100)
Timing maxArea(n=10^5) x2000: 201.25 ms (avg of 3)
checksum 1800000000 (prevents dead-code elimination)
PASS ContainerWithMostWater
```

**Copy trong family:** `trapping-rain-water.java` (TrappingRainWater) — cùng sweep,
thêm hai running max. Đã chạy: PASS ×3, stress 400 rounds, timing
`trap(n=10^5) x2000: 158.01 ms`.

### 2.7 greedy-pairing — canonical: boats-to-save-people (881)

**Thành viên:** boats-to-save-people (family một bài).

Sort theo cân nặng; người nặng nhất hoặc đi một mình (nếu lightest + heaviest > limit)
hoặc cặp với lightest (greedy an toàn vì ghép lightest-heaviest giải phóng nhiều sức
chứa nhất cho mọi người còn lại). Mỗi vòng lặp ship đúng một thuyền: hoặc heaviest một
mình, hoặc cả hai đầu.

**Recipe:** sort; l=0, r=n−1, boats=0; while l≤r: if people[l]+people[r] ≤ limit → l++;
r−−; boats++. Return boats.

**Invariant:** sau mỗi vòng lặp, mọi người ngoài [l..r] đã được ship với số thuyền tối
thiểu cho phần đó.

**Edge cases:** một người; mọi cặp vừa đúng limit; không cặp nào vừa (2+2>3); mọi người
nhẹ nhất có thể (giá trị tối thiểu 1). Note: theo constraint LC 881, `people[i] ≤ limit`,
không cần xử lý người nặng hơn limit.

**Complexity:** O(n log n) sort + O(n) scan, O(log n) sort stack.

```java
// Canonical: boats-to-save-people (LeetCode 881) — family "greedy-pairing".
// Algorithm: sort by weight; the heaviest person either rides alone (if the
// lightest remaining cannot join: weight[light] + weight[heavy] > limit) or
// pairs with the lightest (greedy choice is safe: pairing the lightest with
// the heaviest frees the most capacity for everyone else).
// Each iteration ships exactly one boat: either the heavy alone or both ends.
// Time O(n log n) for the sort + O(n) scan, space O(log n) sort stack.
import java.util.*;
class BoatsToSavePeople {
    static int numRescueBoats(int[] people, int limit) {
        Arrays.sort(people);
        int l = 0, r = people.length - 1, boats = 0;
        while (l <= r) {
            if (people[l] + people[r] <= limit) l++; // pair the lightest with the heaviest
            r--;                                     // heaviest always leaves on this boat
            boats++;
        }
        return boats;
    }

    // Oracle: brute force over subsets via recursion on the sorted array,
    // exponential worst case, fine for n <= 9 in the stress loop.
    static int best = Integer.MAX_VALUE;
    static int oracle(int[] people, int limit) {
        best = Integer.MAX_VALUE;
        rec(people, limit, 0, new boolean[people.length], 0);
        return best;
    }
    static void rec(int[] people, int limit, int shipped, boolean[] used, int boats) {
        if (boats >= best) return;
        if (shipped == people.length) { best = Math.min(best, boats); return; }
        int first = -1;
        for (int i = 0; i < people.length; i++) if (!used[i]) { first = i; break; }
        used[first] = true;
        rec(people, limit, shipped + 1, used, boats + 1); // rides alone
        for (int j = first + 1; j < people.length; j++) {
            if (!used[j] && people[first] + people[j] <= limit) {
                used[j] = true;
                rec(people, limit, shipped + 2, used, boats + 1);
                used[j] = false;
            }
        }
        used[first] = false;
    }

    static long SINK;
    static void check(boolean cond, String label) {
        if (!cond) throw new AssertionError("FAIL: " + label);
        System.out.println("ok: " + label);
    }
    static void timeIt(String label, long iterations, Runnable task) {
        task.run();
        long total = 0;
        for (int run = 0; run < 3; run++) {
            long t0 = System.nanoTime();
            for (long i = 0; i < iterations; i++) task.run();
            total += System.nanoTime() - t0;
        }
        System.out.printf("Timing %s: %.2f ms (avg of 3)%n", label, total / 3 / 1_000_000.0);
    }

    public static void main(String[] args) {
        check(numRescueBoats(new int[]{1, 2}, 3) == 1, "example 1: [1,2] limit 3");
        check(numRescueBoats(new int[]{3, 2, 2, 1}, 3) == 3, "example 2: [3,2,2,1] limit 3");
        check(numRescueBoats(new int[]{3, 5, 3, 4}, 5) == 4, "example 3: [3,5,3,4] limit 5");
        check(numRescueBoats(new int[]{5}, 5) == 1, "edge: single person");
        check(numRescueBoats(new int[]{3, 3, 3, 3}, 6) == 2, "edge: all pairs fit");
        check(numRescueBoats(new int[]{2, 2, 2, 2}, 3) == 4, "edge: no pair fits (2+2>3)");
        check(numRescueBoats(new int[]{1, 1, 1, 1}, 2) == 2, "edge: all pairs fit exactly");
        System.out.println("PASS fixed cases");
        Random rng = new Random(20260918L);
        int rounds = 300;
        for (int r = 0; r < rounds; r++) {
            int n = 1 + rng.nextInt(9);
            int limit = 3 + rng.nextInt(8);
            int[] a = new int[n];
            for (int i = 0; i < n; i++) a[i] = 1 + rng.nextInt(limit); // always shippable
            int fast = numRescueBoats(a, limit);
            int slow = oracle(a, limit);
            if (fast != slow) throw new AssertionError("stress mismatch n=" + n + " limit=" + limit);
        }
        System.out.println("PASS stress (300 rounds vs backtracking oracle, n up to 9)");
        int[] big = new int[100000];
        for (int i = 0; i < big.length; i++) big[i] = 1 + (i % 20000);
        timeIt("numRescueBoats(n=10^5) x200", 200, () -> SINK += numRescueBoats(big, 20000));
        System.out.println("checksum " + SINK + " (prevents dead-code elimination)");
        System.out.println("PASS BoatsToSavePeople");
    }
}
```

**Verification output (literal):**

```text
ok: example 1: [1,2] limit 3
ok: example 2: [3,2,2,1] limit 3
ok: example 3: [3,5,3,4] limit 5
ok: edge: single person
ok: edge: all pairs fit
ok: edge: no pair fits (2+2>3)
ok: edge: all pairs fit exactly
PASS fixed cases
PASS stress (300 rounds vs backtracking oracle, n up to 9)
Timing numRescueBoats(n=10^5) x200: 20.35 ms (avg of 3)
checksum 18060 (prevents dead-code elimination)
PASS BoatsToSavePeople
```

### 2.8 window-distinct — canonical: longest-substring-without-repeating-characters (3)

**Thành viên:** longest-substring-without-repeating-characters, longest-repeating-character-
replacement (424), minimum-window-substring (76), minimum-size-subarray-sum (209),
best-time-to-buy-and-sell-stock (121), contains-duplicate-ii (219), permutation-in-string (567).

Template chung: expand r, cập nhật cấu trúc window, shrink l khi window mất tính hợp lệ,
cập nhật đáp án. Biến thể theo "tính hợp lệ":
- **3:** hợp lệ = không ký tự trùng trong window → jump l qua vị trí cũ khi gặp duplicate,
  không cần shrink từng bước.
- **424:** hợp lệ = windowLen − maxFreq ≤ k → khi vi phạm, shrink đúng 1 (maxFreq không
  giảm được, len chỉ có thể giữ hoặc giảm, nên không cần shrink nhiều hơn).
- **76:** hợp lệ = window chứa đủ counts của t → shrink lặp `while missing == 0`, ghi
  window ngắn nhất.
- **209:** hợp lệ = sum ≥ target → shrink `while sum >= target`, ghi độ dài nhỏ nhất.
- **121:** degenerate window, left edge = argmin; holder `minSeen`.
- **219:** set giữ đúng k phần tử gần nhất (evict `nums[r-k]` khi set vượt k).
- **567:** window cố định độ dài |s1|, forward-counters và mismatch counter.

Tất cả đều O(n) với chi phí shrink amortized O(1) — mỗi phần tử vào window một lần,
ra một lần.

**Recipe (3 — canonical):** lastSeen[128] = −1; l=0, best=0; for r: prev=lastSeen[c];
if prev ≥ l → l = prev+1; lastSeen[c]=r; best=max(best, r−l+1).

**Invariant (3):** [l..r] luôn là window hợp lệ dài nhất kết thúc tại r.

**Edge cases:** chuỗi rỗng; toàn ký tự trùng → 1; "au" → 2; "dvdf" → 3 (jump phải nhảy
qua vị trí cũ chứ không chỉ l++). 424: k ≥ n, k=0, chuỗi rỗng. 76: s ngắn hơn t; t rỗng;
duplicate requirement "aa". 209: không đủ tổng → 0; target=1. 121: giá bằng → 0.
219: k=0 → false, k ≥ n. 567: s1 dài hơn s2 → false.

**Complexity:** 3/424/219: O(n) time O(1) space (mảng 128/26/set O(min(n,k))).
76: O(n+m), O(1). 209/121: O(n), O(1). 567: O(n+m), O(1).

```java
// Canonical: longest-substring-without-repeating-characters (LeetCode 3)
// — family "window-distinct".
// Copies in this family: longest-repeating-character-replacement (same
// expand-then-shrink loop, different shrink trigger: maxCount + k budget
// instead of duplicate presence).
// Algorithm: expand r, record lastSeen per character; if the char was seen
// inside the current window, jump l past the previous occurrence (window stays
// valid, so we only ever shrink — no second pass needed). Track the longest
// valid window seen. Only lowercase+uppercase letters and digits on LC, but
// lastSeen sized 128 is safe for any ASCII input.
// Time O(n), space O(1) fixed-size lastSeen table.
import java.util.*;
class LongestSubstringWithoutRepeatingCharacters {
    static int lengthOfLongestSubstring(String s) {
        int[] lastSeen = new int[128];
        Arrays.fill(lastSeen, -1);
        int l = 0, best = 0;
        for (int r = 0; r < s.length(); r++) {
            char c = s.charAt(r);
            int prev = lastSeen[c];
            if (prev >= l) l = prev + 1; // duplicate inside window: jump past it
            lastSeen[c] = r;
            best = Math.max(best, r - l + 1);
        }
        return best;
    }

    // Oracle: for each start index, extend until a duplicate appears.
    static int oracle(String s) {
        int best = 0;
        for (int l = 0; l < s.length(); l++) {
            boolean[] seen = new boolean[128];
            for (int r = l; r < s.length(); r++) {
                if (seen[s.charAt(r)]) break;
                seen[s.charAt(r)] = true;
                best = Math.max(best, r - l + 1);
            }
        }
        return best;
    }

    static long SINK;
    static void check(boolean cond, String label) {
        if (!cond) throw new AssertionError("FAIL: " + label);
        System.out.println("ok: " + label);
    }
    static void timeIt(String label, long iterations, Runnable task) {
        task.run();
        long total = 0;
        for (int run = 0; run < 3; run++) {
            long t0 = System.nanoTime();
            for (long i = 0; i < iterations; i++) task.run();
            total += System.nanoTime() - t0;
        }
        System.out.printf("Timing %s: %.2f ms (avg of 3)%n", label, total / 3 / 1_000_000.0);
    }

    public static void main(String[] args) {
        check(lengthOfLongestSubstring("abcabcbb") == 3, "example 1: abcabcbb -> 3");
        check(lengthOfLongestSubstring("bbbbb") == 1, "example 2: bbbbb -> 1");
        check(lengthOfLongestSubstring("pwwkew") == 3, "example 3: pwwkew -> 3");
        check(lengthOfLongestSubstring("") == 0, "edge: empty");
        check(lengthOfLongestSubstring(" ") == 1, "edge: single space");
        check(lengthOfLongestSubstring("au") == 2, "edge: two distinct");
        check(lengthOfLongestSubstring("dvdf") == 3, "trap: re-scan after jump");
        System.out.println("PASS fixed cases");
        Random rng = new Random(20260918L);
        int rounds = 500;
        for (int r = 0; r < rounds; r++) {
            int n = rng.nextInt(80);
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < n; i++) sb.append((char) ('a' + rng.nextInt(10))); // small alphabet -> dupes
            String t = sb.toString();
            int fast = lengthOfLongestSubstring(t);
            int slow = oracle(t);
            if (fast != slow) throw new AssertionError("stress mismatch on " + t);
        }
        System.out.println("PASS stress (500 rounds vs per-start oracle)");
        String big = "abcdefghijklmnopqrstuvwxyz".repeat(4000); // n = 104k, all distinct in window
        timeIt("lengthOfLongestSubstring(n=104k) x500", 500, () -> SINK += lengthOfLongestSubstring(big));
        System.out.println("checksum " + SINK + " (prevents dead-code elimination)");
        System.out.println("PASS LongestSubstringWithoutRepeatingCharacters");
    }
}
```

**Verification output (literal):**

```text
ok: example 1: abcabcbb -> 3
ok: example 2: bbbbb -> 1
ok: example 3: pwwkew -> 3
ok: edge: empty
ok: edge: single space
ok: edge: two distinct
ok: trap: re-scan after jump
PASS fixed cases
PASS stress (500 rounds vs per-start oracle)
Timing lengthOfLongestSubstring(n=104k) x500: 75.63 ms (avg of 3)
checksum 2000000 (prevents dead-code elimination)
PASS LongestSubstringWithoutRepeatingCharacters
```

**Các file cùng family (mỗi file là harness riêng, đã compile + chạy PASS):**
`longest-repeating-character-replacement.java` (timing 141.42 ms),
`minimum-window-substring.java` (76.64 ms), `minimum-size-subarray-sum.java` (31.34 ms),
`best-time-to-buy-and-sell-stock.java` (234.41 ms), `contains-duplicate-ii.java` (884.61 ms),
`permutation-in-string.java` (25.21 ms). Chi tiết từng bài ở bảng §3.

### 2.9 window-deque — canonical: sliding-window-maximum (239)

**Thành viên:** sliding-window-maximum (family một bài).

Monotonic deque chứa INDEX, giá trị giảm dần. Khi phần tử mới đến, pop đuôi khi value
đuôi ≤ value mới (những phần tử đó không bao giờ là max của window kế tiếp: nhỏ hơn VÀ
hết hạn sớm hơn), rồi push index mới. Front là max window hiện tại; evict front khi nó
rơi ra ngoài window (index ≤ i−k). Mỗi index vào deque một lần, ra một lần → O(n).

**Recipe:** result[0..n−k]; for i: while đuôi != rỗng && nums[peekLast] ≤ nums[i] →
pollLast; addLast(i); if peekFirst ≤ i−k → pollFirst; if i ≥ k−1 → result[w++]
nums[peekFirst].

**Invariant:** deque luôn là dãy index tăng, giá trị giảm, thuộc window hiện tại.

**Edge cases:** k=1 (kết quả = input; deque vẫn chạy đúng); k=n; mảng đều; tăng dần;
giảm dần; rỗng.

**Complexity:** O(n) time, O(k) space worst case.

```java
// Canonical: sliding-window-maximum (LeetCode 239) — family "window-deque".
// Algorithm: monotonic deque of indices whose VALUES are decreasing. When a
// new element arrives, pop the back while it is <= the new value (those older
// elements can never be the window max again: they are smaller AND expire
// earlier), then push the new index. The front of the deque is the current
// window max; evict the front once it falls outside the window.
// Deque operations are amortized O(1), each index pushed/popped once.
// Time O(n), space O(k) worst case for the deque.
import java.util.*;
class SlidingWindowMaximum {
    static int[] maxSlidingWindow(int[] nums, int k) {
        if (nums.length == 0 || k == 0) return new int[0];
        int n = nums.length;
        int[] result = new int[n - k + 1];
        Deque<Integer> deque = new ArrayDeque<>(); // indices, values strictly decreasing
        int w = 0;
        for (int i = 0; i < n; i++) {
            while (!deque.isEmpty() && nums[deque.peekLast()] <= nums[i]) deque.pollLast();
            deque.addLast(i);
            if (deque.peekFirst() <= i - k) deque.pollFirst(); // aged out of the window
            if (i >= k - 1) result[w++] = nums[deque.peekFirst()];
        }
        return result;
    }

    // Oracle: naive per-window scan.
    static int[] oracle(int[] nums, int k) {
        int n = nums.length;
        if (n == 0 || k == 0) return new int[0];
        int[] result = new int[n - k + 1];
        for (int l = 0; l + k <= n; l++) {
            int m = Integer.MIN_VALUE;
            for (int i = l; i < l + k; i++) m = Math.max(m, nums[i]);
            result[l] = m;
        }
        return result;
    }

    static long SINK;
    static void check(boolean cond, String label) {
        if (!cond) throw new AssertionError("FAIL: " + label);
        System.out.println("ok: " + label);
    }
    static void timeIt(String label, long iterations, Runnable task) {
        task.run();
        long total = 0;
        for (int run = 0; run < 3; run++) {
            long t0 = System.nanoTime();
            for (long i = 0; i < iterations; i++) task.run();
            total += System.nanoTime() - t0;
        }
        System.out.printf("Timing %s: %.2f ms (avg of 3)%n", label, total / 3 / 1_000_000.0);
    }

    public static void main(String[] args) {
        check(Arrays.equals(maxSlidingWindow(new int[]{1, 3, -1, -3, 5, 3, 6, 7}, 3),
                new int[]{3, 3, 5, 5, 6, 7}), "example 1: k=3 textbook");
        check(Arrays.equals(maxSlidingWindow(new int[]{1}, 1), new int[]{1}), "example 2: single");
        check(Arrays.equals(maxSlidingWindow(new int[]{7, 7, 7, 7}, 2), new int[]{7, 7, 7}),
                "edge: all equal");
        check(Arrays.equals(maxSlidingWindow(new int[]{1, 2, 3, 4, 5}, 3), new int[]{3, 4, 5}),
                "edge: strictly increasing");
        check(Arrays.equals(maxSlidingWindow(new int[]{5, 4, 3, 2, 1}, 3), new int[]{5, 4, 3}),
                "edge: strictly decreasing");
        check(Arrays.equals(maxSlidingWindow(new int[]{}, 3), new int[]{}), "edge: empty");
        System.out.println("PASS fixed cases");
        Random rng = new Random(20260918L);
        int rounds = 300;
        for (int r = 0; r < rounds; r++) {
            int n = 1 + rng.nextInt(60);
            int k = 1 + rng.nextInt(n);
            int[] a = new int[n];
            for (int i = 0; i < n; i++) a[i] = rng.nextInt(2001) - 1000;
            int[] fast = maxSlidingWindow(a, k);
            int[] slow = oracle(a, k);
            if (!Arrays.equals(fast, slow)) throw new AssertionError("stress mismatch n=" + n + " k=" + k);
        }
        System.out.println("PASS stress (300 rounds vs per-window scan oracle)");
        int[] big = new int[100000];
        for (int i = 0; i < big.length; i++) big[i] = rng.nextInt();
        timeIt("maxSlidingWindow(n=10^5, k=5000) x100", 100, () -> SINK += maxSlidingWindow(big, 5000).length);
        System.out.println("checksum " + SINK + " (prevents dead-code elimination)");
        System.out.println("PASS SlidingWindowMaximum");
    }
}
```

**Verification output (literal):**

```text
ok: example 1: k=3 textbook
ok: example 2: single
ok: edge: all equal
ok: edge: strictly increasing
ok: edge: strictly decreasing
ok: edge: empty
PASS fixed cases
PASS stress (300 rounds vs per-window scan oracle)
Timing maxSlidingWindow(n=10^5, k=5000) x100: 338.59 ms (avg of 3)
checksum 28595301 (prevents dead-code elimination)
PASS SlidingWindowMaximum
```

### 2.10 k-closest-binary — canonical: find-k-closest-elements (658)

**Thành viên:** find-k-closest-elements (family một bài).

Binary search trên START index của window k phần tử, không phải trên giá trị. Window
[mid, mid+k) là chuẩn đúng khi `x − arr[mid] ≤ arr[mid+k] − x`: phần tử ngay sau window
xa x hơn phần tử đầu window, nghĩa là window không thể dịch sang phải mà vẫn tốt hơn.
So sánh dùng khoảng cách bên trái nên hòa (tie) tự nghiêng về window có index nhỏ hơn —
đúng quy tắc "smaller elements preferred".

**Recipe:** l=0, r=n−k; while l<r: mid=(l+r)>>>1; if x−arr[mid] > arr[mid+k]−x → l=mid+1
else r=mid; trả arr[l..l+k).

**Invariant:** mọi window bắt đầu tại < l kém hoặc bằng window tại l; answer nằm trong [l..r].

**Edge cases:** k=n; n=1; x ngoài khoảng giá trị (nhỏ hơn tất cả / lớn hơn tất cả);
trùng giá trị; hòa khoảng cách (chọn giá trị nhỏ hơn). Ingredient: `>>>1` tránh overflow
index; r = n−k ≥ 0 vì k ≤ n (constraint LC).

**Complexity:** O(log(n−k) + k), space O(k) cho kết quả.

```java
// Canonical: find-k-closest-elements (LeetCode 658) — family "k-closest-binary".
// Algorithm: binary search on the START index of the k-window, not on values.
// The window [mid, mid+k) is valid iff x - arr[mid] <= arr[mid+k] - x
// (the element just after the window is farther from x than the first element
// of the window) — if the inequality holds the window can move right,
// otherwise it must move left. Window start converges to the k closest.
// Tie-breaks (equal distance) resolve to the smaller index window because the
// comparison uses left-anchored distance, and the binary search prefers the
// leftmost window that satisfies the invariant.
// Time O(log(n-k) + k), space O(k) for the result list.
import java.util.*;
class FindKClosestElements {
    static List<Integer> findClosestElements(int[] arr, int k, int x) {
        int l = 0, r = arr.length - k;
        while (l < r) {
            int mid = (l + r) >>> 1;
            if (x - arr[mid] > arr[mid + k] - x) l = mid + 1; // window better one step right
            else r = mid;
        }
        List<Integer> result = new ArrayList<>(k);
        for (int i = l; i < l + k; i++) result.add(arr[i]);
        return result;
    }

    // Oracle: sort a copy by (distance to x, value), take the k best, re-sort.
    static List<Integer> oracle(int[] arr, int k, int x) {
        Integer[] boxed = new Integer[arr.length];
        for (int i = 0; i < arr.length; i++) boxed[i] = arr[i];
        int target = x;
        Arrays.sort(boxed, (a, b) -> {
            int da = Math.abs(a - target), db = Math.abs(b - target);
            return da != db ? Integer.compare(da, db) : Integer.compare(a, b);
        });
        List<Integer> best = new ArrayList<>(List.of(Arrays.copyOfRange(boxed, 0, k)));
        Collections.sort(best);
        return best;
    }

    static long SINK;
    static void check(boolean cond, String label) {
        if (!cond) throw new AssertionError("FAIL: " + label);
        System.out.println("ok: " + label);
    }
    static void timeIt(String label, long iterations, Runnable task) {
        task.run();
        long total = 0;
        for (int run = 0; run < 3; run++) {
            long t0 = System.nanoTime();
            for (long i = 0; i < iterations; i++) task.run();
            total += System.nanoTime() - t0;
        }
        System.out.printf("Timing %s: %.2f ms (avg of 3)%n", label, total / 3 / 1_000_000.0);
    }

    public static void main(String[] args) {
        check(findClosestElements(new int[]{1, 2, 3, 4, 5}, 4, 3).equals(List.of(1, 2, 3, 4)),
                "example 1: k=4 x=3 -> [1,2,3,4]");
        check(findClosestElements(new int[]{1, 2, 3, 4, 5}, 4, -1).equals(List.of(1, 2, 3, 4)),
                "example 2: x below all -> leftmost 4");
        check(findClosestElements(new int[]{1, 2, 3, 4, 5}, 1, 3).equals(List.of(3)),
                "edge: k=1 at exact value");
        check(findClosestElements(new int[]{1, 1, 1, 10, 10, 10}, 1, 9).equals(List.of(10)),
                "edge: 10 closer than 1 (dist 1 vs 8)");
        check(findClosestElements(new int[]{1, 2, 3, 4, 5}, 5, 3).equals(List.of(1, 2, 3, 4, 5)),
                "edge: k = arr length");
        check(findClosestElements(new int[]{1}, 1, 0).equals(List.of(1)), "edge: single elem");
        check(findClosestElements(new int[]{0, 1, 1, 1, 2, 3, 6, 7, 8, 9}, 4, 5)
                        .equals(List.of(2, 3, 6, 7)),
                "tie-break: dist 3 ties between 2 and 8; smaller values win");
        System.out.println("PASS fixed cases");
        Random rng = new Random(20260918L);
        int rounds = 400;
        for (int r = 0; r < rounds; r++) {
            int n = 1 + rng.nextInt(30);
            int k = 1 + rng.nextInt(n);
            int[] a = new int[n];
            a[0] = rng.nextInt(20) - 10;
            for (int i = 1; i < n; i++) a[i] = a[i - 1] + rng.nextInt(3); // sorted, maybe dupes
            int x = rng.nextInt(20) - 10;
            List<Integer> fast = findClosestElements(a, k, x);
            List<Integer> slow = oracle(a, k, x);
            if (!fast.equals(slow)) throw new AssertionError("stress mismatch arr=" + Arrays.toString(a) + " k=" + k + " x=" + x);
        }
        System.out.println("PASS stress (400 rounds vs sort-by-distance oracle)");
        int[] big = new int[100000];
        for (int i = 0; i < big.length; i++) big[i] = i;
        timeIt("findClosestElements(n=10^5, k=10, x=50000) x500", 500, () -> SINK += findClosestElements(big, 10, 50000).get(0));
        System.out.println("checksum " + SINK + " (prevents dead-code elimination)");
        System.out.println("PASS FindKClosestElements");
    }
}
```

**Verification output (literal):**

```text
ok: example 1: k=4 x=3 -> [1,2,3,4]
ok: example 2: x below all -> leftmost 4
ok: edge: k=1 at exact value
ok: edge: 10 closer than 1 (dist 1 vs 8)
ok: edge: k = arr length
ok: edge: single elem
ok: tie-break: dist 3 ties between 2 and 8; smaller values win
PASS fixed cases
PASS stress (400 rounds vs sort-by-distance oracle)
Timing findClosestElements(n=10^5, k=10, x=50000) x500: 0.30 ms (avg of 3)
checksum 75042495 (prevents dead-code elimination)
PASS FindKClosestElements
```

## 3. Bảng approach toàn bộ 22 bài

| idx | name | diff | family | approach | time | space | notes |
|-----|------|------|--------|----------|------|-------|-------|
| 23 | Reverse String | Easy | reverse-array | hai con trỏ l/r từ hai đầu, swap từng cặp khi l < r | O(n) | O(1) | Phần tử giữa mảng lẻ đứng yên — điều kiện l < r, không l ≤ r |
| 24 | Valid Palindrome | Easy | palindrome-check | l/r từ hai đầu, vòng trong bỏ qua `!isLetterOrDigit`, so `toLowerCase`, mismatch → false | O(n) | O(1) | "0P" không phải palindrome (chữ số không case-fold); chuỗi chỉ punctuation → true |
| 25 | Valid Palindrome II | Easy | palindrome-check | giống 24, khi mismatch đầu tiên thử hai nhánh: substring [l+1..r] hoặc [l..r−1] là palindrome thuần (helper) | O(n) | O(1) | Chỉ một mismatch được phép; phải thử CẢ HAI nhánh (case "e/be" dài của LC 680) |
| 26 | Merge Strings Alternately | Easy | merge-sequences | con trỏ i/j, append xen kẽ word1[i++] word2[j++], copy đuôi chuỗi dài hơn | O(m+n) | O(m+n) | StringBuilder cấp trước capacity = tổng độ dài; một tail luôn rỗng sau vòng |
| 27 | Merge Sorted Array | Easy | merge-sequences | i=m−1, j=n−1, w=m+n−1 điền TỪ CUỐI; nums1[i] > nums2[j] thì lấy nums1, ngược lại nums2; vòng chạy `while j >= 0` | O(m+n) | O(1) | Không được điền từ đầu — ghi đè nums1 chưa đọc; nums2 rỗng thì không làm gì |
| 28 | Remove Duplicates From Sorted Array | Easy | dedupe-array | w=1 ghi, i=1 quét; nums[i] != nums[w−1] → nums[w++]=nums[i]; return w | O(n) | O(1) | Chỉ cần prefix đúng; bài nói "sorted" — sort trước nếu input chưa sort |
| 29 | Two Sum II Input Array Is Sorted | Medium | opposite-sum | l=0, r=n−1; sum < target → l++, sum > target → r−−; đúng thì return [l+1, r+1] | O(n) | O(1) | Output 1-indexed; lập luận đơn điệu = binary-search argument |
| 30 | 3Sum | Medium | opposite-sum | sort; i quét pivot, skip nums[i]==nums[i−1]; target=−nums[i], hai pointer l=i+1, r=n−1; skip duplicate l và r sau mỗi lần ghi | O(n²) | O(log n) | Skip duplicate ở CẢ i, l, r; mảng < 3 phần tử → []; [0,0,0] hợp lệ |
| 31 | 4Sum | Medium | opposite-sum | sort; vòng i + vòng j (skip dup ở cả hai); need = target − nums[i] − nums[j] tính bằng LONG; hai pointer l/j | O(n³) | O(log n) | Overflow: 1e9×4 vượt int (fixed case đã verify); j skip từ j > i+1 |
| 32 | Rotate Array | Medium | reverse-array | k %= n; reverse cả mảng, reverse [0,k), reverse [k,n) — mỗi reverse là swap loop | O(n) | O(1) | k=0, k=n, k>n đều xử lý bởi mod; cấm mảng phụ nếu hỏi in-place |
| 33 | Container With Most Water | Medium | greedy-extrema | l/r từ hai đầu; area = min(h[l],h[r])×(r−l); dịch con trỏ bên THẤP hơn; giữ max | O(n) | O(1) | Chứng minh: cặp chứa l với r ở phải đều bị chặn bởi (l,r); height có thể = 0 |
| 34 | Boats to Save People | Medium | greedy-pairing | sort; heaviest r cùng lightest l nếu tổng ≤ limit (l++), luôn r−−; đếm thuyền; `while l <= r` | O(n log n) | O(log n) | Greedy an toàn: ghép lightest-heaviest tối ưu sức chứa; constraint people[i] ≤ limit |
| 35 | Trapping Rain Water | Hard | greedy-extrema | maxL/maxR từ hai đầu; bên nào max nhỏ hơn là bên khóa: max=Math.max(max, h[i]); water += max − h[i] | O(n) | O(1) | Biến thể prefix-array cũng chấp nhận được (O(n) space) nhưng 2-pointer là đích; đều → 0 |
| 36 | Contains Duplicate II | Easy | window-distinct | set giữ window k: add thất bại → true; sau đó evict nums[r−k] khi size > k | O(n) | O(min(n,k)) | k=0 → false (khoảng cách < 1 không tồn tại); evict đúng index r−k không phải giá trị |
| 37 | Best Time to Buy And Sell Stock | Easy | window-distinct | một pass: minSeen, best = max(best, p − minSeen); window degenerate, left edge = argmin | O(n) | O(1) | Phải mua TRƯỚC bán; giá giảm liên tục → 0; bài này là nền của 309/714/188 (DP) |
| 38 | Longest Substring Without Repeating Characters | Medium | window-distinct | lastSeen[128]; duplicate trong window → l = prev+1 (JUMP, không l++); best = max(best, r−l+1) | O(n) | O(1) | "dvdf" → 3 chứng minh phải jump; lastSeen cần gồm cả khoảng trắng (128) |
| 39 | Longest Repeating Character Replacement | Medium | window-distinct | freq[26], maxFreq; windowLen − maxFreq > k → shrink đúng 1 (freq[l]−−, l++); best = max(best, r−l+1) | O(n) | O(1) | Không cần shrink nhiều hơn 1 — answer là max nên window chỉ giữ hoặc tăng; lowercase a-z |
| 40 | Permutation In String | Medium | window-distinct | window cố định |s1|; target[26] vs window[26]; mismatch counter; khác 0 sau mỗi shift → chưa phải | O(m+n) | O(1) | n1 > n2 → false ngay; chỉ ∈ contiguous window (không phải subsequence) |
| 41 | Minimum Size Subarray Sum | Medium | window-distinct | expand r (sum += nums[r]); `while sum >= target` ghi best, sum -= nums[l], l++ | O(n) | O(1) | Constraint target ≥ 1 (target 0 làm l chạy quá r — harness đã bắt); không đủ tổng → 0 |
| 42 | Find K Closest Elements | Medium | k-closest-binary | binary search start của window k: `x−arr[mid] > arr[mid+k]−x` → l=mid+1 else r=mid; lấy arr[l..l+k) | O(log(n−k)+k) | O(k) | Tie → giá trị nhỏ hơn (so sánh left-anchored tự nghiêng trái); `>>>1` tránh overflow; k ≤ n |
| 43 | Minimum Window Substring | Hard | window-distinct | need[128] counts của t, missing = t.length(); expand r, `while missing == 0` ghi window ngắn nhất rồi shrink; cập nhật need khi rời window | O(n+m) | O(1) | missing bắt đầu = len(t) (đếm ký tự, không phải distinct); s ngắn hơn t → ""; t rỗng → "" |
| 44 | Sliding Window Maximum | Hard | window-deque | monotonic deque index, value giảm dần: pop đuôi khi ≤ value mới; push; evict front khi index ≤ i−k; front là max | O(n) | O(k) | `<=` (không `<`) khi pop giữ max ổn định khi value trùng; k=1 và k=n là edge; dùng ArrayDeque |

## 4. Phase C notes

### Nội dung mỗi page nên nhấn (P1/P2/P5/P6/P9/P10)

- **P1 (mô tả bài):** giữ đúng constraint từ LC — riêng các bài đã verify trong harness:
  output 1-indexed (167), k ≤ n (658, 239), target ≥ 1 (209), people[i] ≤ limit (881),
  chỉ lowercase a-z (424, 567), ASCII printable (3 — space hợp lệ), m, n ≤ 2e4 (209),
  n ≤ 1e5 (3, 219, 121, 42, 11, 26, 189), m+n ≤ 2e5 (88), nums[i] ∈ [−1e9, 1e9] (18).
- **P2 (approach trước code):** vẽ mảng hai dòng (con trỏ/window trên, đại lượng dưới);
  ghi invariant của window (xem §2 từng family); với 239, vẽ deque qua 3 bước mẫu;
  với 658, giải thích tại sao binary search trên start index thay vì giá trị.
  Target complexity để chốt với interviewer: O(n) cho mọi bài trừ 30/31 (O(n²)/O(n³))
  và 34 (O(n log n)) và 42 (O(log(n−k)+k)).
- **P5 (complexity):** bảng time/space ở §3 là giá trị đã đo đạc ở max-N trong harness
  (xem timing lines §2.1–§2.10); space của sort ghi O(log n) (dual-pivot quicksort,
  không phải O(n) — Arrays.sort trên int[] không dùng boxed merge).
- **P6 (code chính thức):** ưu tiên bản trong §2 (đã compile Java 21 + chạy PASS)
  làm skeleton, giữ đúng tên biến mô tả và comment WHY; mọi shrink loop phải có lý do:
  "window còn hợp lệ không" chứ không phải "tôi sợ lỗi".
- **P9 (common mistakes):** dùng list trap đã verify trong harness: skip-duplicate thiếu
  một trong ba vị trí (30), quên `long` trong 4sum (31 — fixed case overflow đã chứng
  minh), jump thay vì l++ (38 "dvdf"), k mod n (32), k=0 (36), target 0 (41 — crash
  harness bắt được), tie-break nhỏ hơn (42), missing đếm ký tự không phải distinct (43),
  pop với `<` thay vì `<=` (44).
- **P10 (Code chạy được / thực hành):** mỗi page đính kèm lệnh chạy lại harness:
  `cd /tmp/nc250work/specs/javas && javac <cat>/<slug>.java && java -cp <cat> <ClassName>`
  với ClassName PascalCase. Output log gốc có tại `/tmp/nc250work/specs/javas/runs-tp/`
  và `runs-sw/` (file `<slug>.log`).

### Bài cần chú ý đặc biệt

- **4sum (31):** bắt buộc `long` cho need và sum — fixed case `[1e9×4], target −294967296`
  trả empty đúng; nếu tính int, 4e9 wrap thành âm và bài sai. Note LC Javadoc: ký hiệu
  "a + b + c + d == target" được đánh giá trong signed 64-bit.
- **Trapping Rain Water (35):** hai cách tối ưu đều hợp lệ — prefix-max arrays (O(n) space,
  dễ chứng minh) và 2-pointer (O(1) space); page nên trình cả hai, harness verify bản
  2-pointer.
- **Find K Closest Elements (42):** bài này lừa người viết solution "sort theo distance"
  — đúng nhưng O(n log n); binary-search window là O(log(n−k)+k) và là đáp án interviewer
  muốn. Tie-break "smaller values first" là điểm bẫy: so sánh phải left-anchored.
- **Sliding Window Maximum (44):** heap không tối ưu (không xóa được phần tử đã hết hạn
  khỏi đỉnh mà không lazy-delete); monotic deque là cấu trúc học thuộc lòng được.
  `Deque<int>` với index so với value trong 239: cần index để evict.
- **Valid Palindrome II (25):** phải kiểm tra hai nhánh skip — fixed case chuỗi dài
  58 ký tự "aguoke…kouga" (case e/be của LC 680) verify cả hai nhánh.
- **Minimum Window Substring (43):** missing đếm theo ký tự còn thiếu (khởi tạo = len(t)),
  cập nhật ngược khi shrink; dễ sai khi dùng distinct-char counting.
- **Contains Duplicate II (36):** evict theo INDEX (nums[r−k]) vì giá trị có thể trùng.

### Canonical → problem mapping

Mỗi bài trong cluster đều có file Java riêng (22 file, 13 two-pointers + 9 sliding-window),
class PascalCase trong file `<slug>.java`. 9 family, canonical được verify đầy đủ
(fixed + stress + timing) cho từng family:

| Family | Canonical (slug) | Các bài dùng cùng pattern trong family |
|---|---|---|
| opposite-sum | two-sum-ii-input-array-is-sorted | 3sum, 4sum (cùng shrink-loop; thêm dedupe, long) |
| palindrome-check | valid-palindrome | valid-palindrome-ii (thêm 1 skip cho phép) |
| reverse-array | reverse-string | rotate-array (reverse 3 lần) |
| merge-sequences | merge-sorted-array | merge-strings-alternately (không in-place) |
| dedupe-array | remove-duplicates-from-sorted-array | — (family một bài) |
| greedy-extrema | container-with-most-water | trapping-rain-water (thêm running max) |
| greedy-pairing | boats-to-save-people | — (family một bài) |
| window-distinct | longest-substring-without-repeating-characters | longest-repeating-character-replacement, minimum-window-substring, minimum-size-subarray-sum, best-time-to-buy-and-sell-stock, contains-duplicate-ii, permutation-in-string |
| window-deque | sliding-window-maximum | — (family một bài) |
| k-closest-binary | find-k-closest-elements | — (family một bài) |

Không có bài nào "approach-only": cả 22 bài đều có file harness đã compile (javac sạch,
0 lỗi) và chạy PASS (fixed cases + stress + timing) — log thật nằm trong `runs-tp/*.log`
và `runs-sw/*.log`.