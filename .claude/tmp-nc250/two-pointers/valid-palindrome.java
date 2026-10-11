// Canonical: valid-palindrome (LeetCode 125) — family "palindrome-check".
// Copies in this family: valid-palindrome-ii (same scan, adds one allowed skip via
// a helper that tests the sub-range after either skip; the skip differs only in
// the recursive/helper call, everything else identical).
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
        System.out.println("PASS stress (" + rounds + " rounds vs strip-and-reverse oracle)");
        char[] big = new char[100000];
        for (int i = 0; i < big.length; i++) big[i] = (i % 26 == 0) ? ' ' : (char) ('a' + i % 26);
        String bigS = new String(big);
        timeIt("isPalindrome(n=100000) x5000", 5000, () -> SINK += isPalindrome(bigS) ? 1 : 0);
        System.out.println("checksum " + SINK + " (prevents dead-code elimination)");
        System.out.println("PASS ValidPalindrome");
    }
}