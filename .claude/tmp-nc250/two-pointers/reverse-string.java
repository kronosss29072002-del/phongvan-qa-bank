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
        System.out.println("PASS stress (" + rounds + " rounds swap-vs-swap oracle)");
        char[] big = new char[1000000];
        for (int i = 0; i < big.length; i++) big[i] = (char) ('a' + i % 26);
        char[] bigCopy = big.clone();
        timeIt("reverseString(n=10^6) x200", 200, () -> {
            char[] c = big.clone();
            reverseString(c);
            SINK += c[0];
        });
        System.out.println("checksum " + SINK + " (prevents dead-code elimination)");
        System.out.println("PASS ReverseString");
    }
}