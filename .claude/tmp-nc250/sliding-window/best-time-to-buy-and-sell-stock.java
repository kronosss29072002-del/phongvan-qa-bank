// Family "window-prefix-min", canonical: best-time-to-buy-and-sell-stock
// (LeetCode 121).
// Algorithm: one pass keeping the minimum price seen so far; the best profit
// ending at day i is prices[i] - minSeen. That is a degenerate sliding window
// (left edge = the argmin, refreshed whenever a new low appears) and the
// running min makes it O(1) extra space.
// Time O(n), space O(1).
import java.util.*;
class BestTimeToBuyAndSellStock {
    static int maxProfit(int[] prices) {
        int minSeen = Integer.MAX_VALUE, best = 0;
        for (int p : prices) {
            if (p < minSeen) minSeen = p; // new buy candidate
            best = Math.max(best, p - minSeen);
        }
        return best;
    }

    // Oracle: all pairs (buy day <= sell day).
    static int oracle(int[] prices) {
        int best = 0;
        for (int i = 0; i < prices.length; i++)
            for (int j = i + 1; j < prices.length; j++)
                best = Math.max(best, prices[j] - prices[i]);
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
        check(maxProfit(new int[]{7, 1, 5, 3, 6, 4}) == 5, "example 1: buy 1 sell 6 -> 5");
        check(maxProfit(new int[]{7, 6, 4, 3, 1}) == 0, "example 2: strictly falling -> 0");
        check(maxProfit(new int[]{1}) == 0, "edge: single day");
        check(maxProfit(new int[]{2, 4, 1}) == 2, "edge: peak before valley");
        check(maxProfit(new int[]{5, 5, 5}) == 0, "edge: flat");
        System.out.println("PASS fixed cases");
        Random rng = new Random(20260918L);
        int rounds = 500;
        for (int r = 0; r < rounds; r++) {
            int n = 1 + rng.nextInt(60);
            int[] a = new int[n];
            for (int i = 0; i < n; i++) a[i] = rng.nextInt(1000);
            int fast = maxProfit(a);
            int slow = oracle(a);
            if (fast != slow) throw new AssertionError("stress mismatch n=" + n);
        }
        System.out.println("PASS stress (" + rounds + " rounds vs all-pairs oracle)");
        int[] big = new int[100000];
        for (int i = 0; i < big.length; i++) big[i] = (i * 7919) % 100000;
        timeIt("maxProfit(n=10^5) x5000", 5000, () -> SINK += maxProfit(big));
        System.out.println("checksum " + SINK + " (prevents dead-code elimination)");
        System.out.println("PASS BestTimeToBuyAndSellStock");
    }
}