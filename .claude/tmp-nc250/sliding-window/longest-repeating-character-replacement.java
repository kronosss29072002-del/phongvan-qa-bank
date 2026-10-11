// Family "window-distinct", member: longest-repeating-character-replacement
// (LeetCode 424).
// longest-substring-without-repeating-characters' expand-shrink loop, with a
// budget instead of a hard duplicate rule: the window is valid when
// windowLen - maxFreq <= k (replace every non-majority char). Note the window
// only ever GROWS or stays put — we never need to shrink on a violation
// because the answer is a max: once best is found, sliding l forward by 1
// keeps len the same and maxFreq can only drop, so a violation cannot be
// repaired into a longer window. This makes the shrinking branch unnecessary
// and the code O(n) with a single pass and a 26-slot frequency table.
// Time O(n), space O(1).
import java.util.*;
class LongestRepeatingCharacterReplacement {
    static int characterReplacement(String s, int k) {
        int[] freq = new int[26];
        int l = 0, maxFreq = 0, best = 0;
        for (int r = 0; r < s.length(); r++) {
            int idx = s.charAt(r) - 'A';
            freq[idx]++;
            maxFreq = Math.max(maxFreq, freq[idx]);
            int windowLen = r - l + 1;
            if (windowLen - maxFreq > k) { // budget exhausted: shrink by exactly 1
                freq[s.charAt(l) - 'A']--;
                l++;
            }
            best = Math.max(best, r - l + 1);
        }
        return best;
    }

    // Oracle: per start index, extend while the budget holds.
    static int oracle(String s, int k) {
        int best = 0;
        for (int l = 0; l < s.length(); l++) {
            int[] freq = new int[26];
            int maxFreq = 0;
            for (int r = l; r < s.length(); r++) {
                int idx = s.charAt(r) - 'A';
                freq[idx]++;
                maxFreq = Math.max(maxFreq, freq[idx]);
                if (r - l + 1 - maxFreq > k) break;
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
        check(characterReplacement("ABAB", 2) == 4, "example 1: ABAB k=2 -> 4");
        check(characterReplacement("AABABBA", 1) == 4, "example 2: AABABBA k=1 -> 4");
        check(characterReplacement("A", 0) == 1, "edge: single char k=0");
        check(characterReplacement("A", 5) == 1, "edge: single char huge k");
        check(characterReplacement("AAAA", 2) == 4, "edge: already uniform, k unused");
        check(characterReplacement("", 0) == 0, "edge: empty");
        System.out.println("PASS fixed cases");
        Random rng = new Random(20260918L);
        int rounds = 400;
        for (int r = 0; r < rounds; r++) {
            int n = rng.nextInt(60);
            int k = rng.nextInt(6);
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < n; i++) sb.append((char) ('A' + rng.nextInt(4))); // small alphabet
            String t = sb.toString();
            int fast = characterReplacement(t, k);
            int slow = oracle(t, k);
            if (fast != slow) throw new AssertionError("stress mismatch on " + t + " k=" + k);
        }
        System.out.println("PASS stress (" + rounds + " rounds vs per-start oracle)");
        StringBuilder big = new StringBuilder();
        for (int i = 0; i < 100000; i++) big.append((char) ('A' + (i % 3))); // 100k
        timeIt("characterReplacement(n=10^5, k=10) x500", 500, () -> SINK += characterReplacement(big.toString(), 10));
        System.out.println("checksum " + SINK + " (prevents dead-code elimination)");
        System.out.println("PASS LongestRepeatingCharacterReplacement");
    }
}