// Family "merge-sequences", member: merge-strings-alternately (LeetCode 1768).
// merge-sorted-array's advance-the-smaller pointer pattern, without the
// in-place back-fill twist; the append order is fixed (word1 char, word2 char)
// and the remaining tail of the longer word is copied after one word runs out.
// Time O(m+n), space O(m+n) for the result string.
import java.util.*;
class MergeStringsAlternately {
    static String mergeAlternately(String word1, String word2) {
        StringBuilder merged = new StringBuilder(word1.length() + word2.length());
        int i = 0, j = 0;
        while (i < word1.length() && j < word2.length()) {
            merged.append(word1.charAt(i++));
            merged.append(word2.charAt(j++));
        }
        // only one of the two tails is non-empty here
        if (i < word1.length()) merged.append(word1, i, word1.length());
        if (j < word2.length()) merged.append(word2, j, word2.length());
        return merged.toString();
    }

    // Oracle: same interleave, written with explicit index math into a char[].
    static String oracle(String word1, String word2) {
        char[] res = new char[word1.length() + word2.length()];
        int w = 0, i = 0, j = 0;
        while (i < word1.length() || j < word2.length()) {
            if (i < word1.length()) res[w++] = word1.charAt(i++);
            if (j < word2.length()) res[w++] = word2.charAt(j++);
        }
        return new String(res);
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
        check(mergeAlternately("abc", "pqr").equals("apbqcr"), "example 1: abc + pqr");
        check(mergeAlternately("ab", "pqrs").equals("apbqrs"), "example 2: ab + pqrs");
        check(mergeAlternately("abcd", "pq").equals("apbqcd"), "example 3: abcd + pq");
        check(mergeAlternately("a", "").equals("a"), "edge: empty second word");
        check(mergeAlternately("", "z").equals("z"), "edge: empty first word");
        check(mergeAlternately("", "").equals(""), "edge: both empty");
        System.out.println("PASS fixed cases");
        Random rng = new Random(20260918L);
        int rounds = 500;
        for (int r = 0; r < rounds; r++) {
            int n1 = rng.nextInt(20), n2 = rng.nextInt(20);
            StringBuilder s1 = new StringBuilder(), s2 = new StringBuilder();
            for (int i = 0; i < n1; i++) s1.append((char) ('a' + rng.nextInt(26)));
            for (int i = 0; i < n2; i++) s2.append((char) ('a' + rng.nextInt(26)));
            String a = s1.toString(), b = s2.toString();
            String fast = mergeAlternately(a, b);
            String slow = oracle(a, b);
            if (!fast.equals(slow)) throw new AssertionError("stress mismatch on " + a + " + " + b);
        }
        System.out.println("PASS stress (" + rounds + " rounds vs char[] oracle)");
        String w1 = "a".repeat(50000), w2 = "b".repeat(50000);
        timeIt("mergeAlternately(50k+50k) x2000", 2000, () -> SINK += mergeAlternately(w1, w2).length());
        System.out.println("checksum " + SINK + " (prevents dead-code elimination)");
        System.out.println("PASS MergeStringsAlternately");
    }
}