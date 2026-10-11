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
        System.out.println("PASS stress (" + rounds + " rounds vs per-start oracle)");
        String big = "abcdefghijklmnopqrstuvwxyz".repeat(4000); // n = 104k, all distinct in window
        timeIt("lengthOfLongestSubstring(n=104k) x500", 500, () -> SINK += lengthOfLongestSubstring(big));
        System.out.println("checksum " + SINK + " (prevents dead-code elimination)");
        System.out.println("PASS LongestSubstringWithoutRepeatingCharacters");
    }
}