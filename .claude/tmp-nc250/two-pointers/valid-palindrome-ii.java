// Family "palindrome-check", member: valid-palindrome-ii (LeetCode 680).
// Same two-pointer scan as valid-palindrome, but a single deletion is allowed:
// when chars at l and r mismatch, the whole string is a valid palindrome-ii iff
// either s[l+1..r] or s[l..r-1] is a plain palindrome (one of the two chars is
// the one to delete). Cost: one extra O(n) sub-scan only on the first mismatch.
// Time O(n), space O(1).
import java.util.*;
class ValidPalindromeII {
    static boolean validPalindrome(String s) {
        int l = 0, r = s.length() - 1;
        while (l < r) {
            if (s.charAt(l) != s.charAt(r))
                return isPlainPalindrome(s, l + 1, r) || isPlainPalindrome(s, l, r - 1);
            l++; r--;
        }
        return true;
    }

    // Helper: strict palindrome check on [from..to] without deletion allowance.
    static boolean isPlainPalindrome(String s, int from, int to) {
        while (from < to) {
            if (s.charAt(from) != s.charAt(to)) return false;
            from++; to--;
        }
        return true;
    }

    // Oracle: delete each index once, check remainder for plain palindrome.
    static boolean oracle(String s) {
        if (isPlainPalindrome(s, 0, s.length() - 1)) return true;
        for (int i = 0; i < s.length(); i++) {
            String t = s.substring(0, i) + s.substring(i + 1);
            if (t.isEmpty() || isPlainPalindrome(t, 0, t.length() - 1)) return true;
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
        check(validPalindrome("aba"), "example: aba is already a palindrome");
        check(validPalindrome("abca"), "example: delete 'c' -> aba");
        check(!validPalindrome("abc"), "example: abc needs 2 deletions -> false");
        check(validPalindrome(""), "edge: empty");
        check(validPalindrome("a"), "edge: single char");
        check(validPalindrome("ab"), "edge: two chars, one deletion enough");
        check(!validPalindrome("abcdefghijklmnopqrstuvwxyzabc"), "edge: long non-palindrome");
        check(validPalindrome("aguokepatgbnvfqmgmlcupuufxoohdfpgjdmysgvhmvffcnqxjjxqncffvmhvgsymdjgpfdhooxfuupuculmgmqfvnbgtapekouga"),
                "trap: e/be case from the problem, skips in the middle");
        System.out.println("PASS fixed cases");
        Random rng = new Random(20260918L);
        int rounds = 400;
        for (int r = 0; r < rounds; r++) {
            int n = 1 + rng.nextInt(25);
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < n; i++) sb.append((char) ('a' + rng.nextInt(26)));
            String t = sb.toString();
            boolean fast = validPalindrome(t);
            boolean slow = oracle(t);
            if (fast != slow) throw new AssertionError("stress mismatch on " + t);
        }
        System.out.println("PASS stress (" + rounds + " rounds vs delete-each-index oracle)");
        char[] big = new char[100000];
        for (int i = 0; i < big.length; i++) big[i] = (char) ('a' + i % 26);
        big[50000] = 'Z'; // single mismatch in the middle
        String bigS = new String(big);
        timeIt("validPalindrome(n=100000) x5000", 5000, () -> SINK += validPalindrome(bigS) ? 1 : 0);
        System.out.println("checksum " + SINK + " (prevents dead-code elimination)");
        System.out.println("PASS ValidPalindromeII");
    }
}