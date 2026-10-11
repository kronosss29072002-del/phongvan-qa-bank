// Family "window-distinct", member: minimum-window-substring (LeetCode 76).
// Same expand-then-shrink loop as longest-substring-without-repeating-characters
// but bidirectional: expand r until the window CONTAINS all of t (counts), then
// shrink l while it still does, recording the smallest valid window. The
// needed/missing counter makes the contains-check O(1) instead of recounting.
// Time O(n + m), space O(1) (two fixed 128-slot tables).
import java.util.*;
class MinimumWindowSubstring {
    static String minWindow(String s, String t) {
        if (s.length() < t.length() || t.isEmpty()) return "";
        int[] need = new int[128];
        for (char c : t.toCharArray()) need[c]++;
        int missing = t.length(); // distinct-char count to satisfy
        int l = 0, bestL = 0, bestLen = Integer.MAX_VALUE;
        for (int r = 0; r < s.length(); r++) {
            char c = s.charAt(r);
            if (need[c] > 0) missing--; // this char was still wanted
            need[c]--;
            while (missing == 0) { // window covers t; try to shrink from the left
                int len = r - l + 1;
                if (len < bestLen) { bestLen = len; bestL = l; }
                char out = s.charAt(l);
                need[out]++;
                if (need[out] > 0) missing++; // removed a char that t requires
                l++;
            }
        }
        return bestLen == Integer.MAX_VALUE ? "" : s.substring(bestL, bestL + bestLen);
    }

    // Oracle: fixed-length brute force over all windows, smallest first.
    // Checking lengths from small to large stops at the first full cover.
    static String oracle(String s, String t) {
        if (s.length() < t.length() || t.isEmpty()) return "";
        for (int len = t.length(); len <= s.length(); len++) {
            for (int l = 0; l + len <= s.length(); l++) {
                String win = s.substring(l, l + len);
                int[] need = new int[128];
                for (char c : t.toCharArray()) need[c]++;
                int missing = t.length();
                for (char c : win.toCharArray()) if (need[c]-- > 0) missing--;
                if (missing == 0) return win;
            }
        }
        return "";
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
        check(minWindow("ADOBECODEBANC", "ABC").equals("BANC"), "example 1: ADOBECODEBANC/ABC -> BANC");
        check(minWindow("a", "a").equals("a"), "example 2: single match");
        check(minWindow("a", "aa").equals(""), "example 3: impossible");
        check(minWindow("", "a").equals(""), "edge: empty s");
        check(minWindow("ab", "").equals(""), "edge: empty t");
        check(minWindow("aa", "aa").equals("aa"), "edge: duplicate requirement");
        check(minWindow("abc", "cba").equals("abc"), "edge: full string is the window");
        System.out.println("PASS fixed cases");
        Random rng = new Random(20260918L);
        int rounds = 300;
        for (int r = 0; r < rounds; r++) {
            int ns = rng.nextInt(18), nt = rng.nextInt(4);
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < ns; i++) sb.append((char) ('A' + rng.nextInt(3)));
            String s = sb.toString();
            StringBuilder tb = new StringBuilder();
            for (int i = 0; i < nt; i++) tb.append((char) ('A' + rng.nextInt(3)));
            String t = tb.toString();
            String fast = minWindow(s, t);
            String slow = oracle(s, t);
            // The oracle returns the FIRST full cover by length order; the fast
            // solution returns the same minimal length; compare on length+content
            // validity, not identity (ties can pick different windows).
            if (fast.length() != slow.length()) throw new AssertionError("stress len mismatch s=" + s + " t=" + t);
            if (fast.length() > 0 && !covers(fast, t)) throw new AssertionError("stress cover mismatch");
        }
        System.out.println("PASS stress (" + rounds + " rounds vs length-order oracle)");
        StringBuilder big = new StringBuilder();
        for (int i = 0; i < 100000; i++) big.append((char) ('A' + (i % 4)));
        timeIt("minWindow(n=10^5, t=ABC) x200", 200, () -> SINK += minWindow(big.toString(), "ABC").length());
        System.out.println("checksum " + SINK + " (prevents dead-code elimination)");
        System.out.println("PASS MinimumWindowSubstring");
    }
    static boolean covers(String window, String t) {
        int[] need = new int[128];
        for (char c : t.toCharArray()) need[c]++;
        for (char c : window.toCharArray()) need[c]--;
        for (char c : t.toCharArray()) if (need[c] > 0) return false;
        return true;
    }
}