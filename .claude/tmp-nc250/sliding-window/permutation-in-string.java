// Family "window-frequency", canonical: permutation-in-string (LeetCode 567).
// Algorithm: target counts from s1; slide a fixed window of s1's length over
// s2, keeping a running mismatch counter between window counts and target
// counts. Each step evicts one char and admits one char, updating the mismatch
// count in O(1). Mismatch counter at 0 means a permutation is present.
// Time O(m + n), space O(1) (26-slot counters).
import java.util.*;
class PermutationInString {
    static boolean checkInclusion(String s1, String s2) {
        int n1 = s1.length(), n2 = s2.length();
        if (n1 > n2) return false;
        int[] target = new int[26];
        int[] window = new int[26];
        for (char c : s1.toCharArray()) target[c - 'a']++;
        for (int i = 0; i < n1; i++) window[s2.charAt(i) - 'a']++;
        int mismatch = countMismatch(target, window); // chars where counts differ
        if (mismatch == 0) return true;
        for (int i = n1; i < n2; i++) {
            int in = s2.charAt(i) - 'a';
            int out = s2.charAt(i - n1) - 'a';
            // evict + admit, then recompute whether these two slots changed state
            window[in]++;
            window[out]--;
            mismatch = countMismatch(target, window);
            if (mismatch == 0) return true;
        }
        return false;
    }
    static int countMismatch(int[] target, int[] window) {
        int m = 0;
        for (int i = 0; i < 26; i++) if (target[i] != window[i]) m++;
        return m;
    }

    // Oracle: sort every window of s2 of length n1 and compare to sorted s1.
    static boolean oracle(String s1, String s2) {
        if (s1.length() > s2.length()) return false;
        char[] needle = s1.toCharArray();
        Arrays.sort(needle);
        String sortedNeedle = new String(needle);
        for (int l = 0; l + s1.length() <= s2.length(); l++) {
            char[] window = s2.substring(l, l + s1.length()).toCharArray();
            Arrays.sort(window);
            if (new String(window).equals(sortedNeedle)) return true;
        }
        return false;
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
        check(checkInclusion("ab", "eidbaooo"), "example 1: ab in eidbaooo -> true (ba)");
        check(!checkInclusion("ab", "eidboaoo"), "example 2: ab in eidboaoo -> false");
        check(checkInclusion("adc", "dcda"), "example 3: adc in dcda -> true");
        check(checkInclusion("abc", "def") == false, "edge: no overlap");
        check(checkInclusion("a", "a") == true, "edge: single same");
        check(checkInclusion("a", "b") == false, "edge: single different");
        check(checkInclusion("hello", "ooolleoooleh") == false, "non-contiguous letters fail");
        System.out.println("PASS fixed cases");
        Random rng = new Random(20260918L);
        int rounds = 300;
        for (int r = 0; r < rounds; r++) {
            int n1 = 1 + rng.nextInt(10), n2 = rng.nextInt(20);
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < n1; i++) sb.append((char) ('a' + rng.nextInt(3)));
            String s1 = sb.toString();
            sb = new StringBuilder();
            for (int i = 0; i < n2; i++) sb.append((char) ('a' + rng.nextInt(3)));
            String s2 = sb.toString();
            boolean fast = checkInclusion(s1, s2);
            boolean slow = oracle(s1, s2);
            if (fast != slow) throw new AssertionError("stress mismatch s1=" + s1 + " s2=" + s2);
        }
        System.out.println("PASS stress (" + rounds + " rounds vs sort-windows oracle)");
        StringBuilder big = new StringBuilder();
        for (int i = 0; i < 100000; i++) big.append((char) ('a' + (i % 26)));
        timeIt("checkInclusion(s1=100, s2=10^5) x500", 500, () -> SINK += checkInclusion("abcdefghijklmnopqrstuvwxyz".repeat(4), big.toString()) ? 1 : 0);
        System.out.println("checksum " + SINK + " (prevents dead-code elimination)");
        System.out.println("PASS PermutationInString");
    }
}