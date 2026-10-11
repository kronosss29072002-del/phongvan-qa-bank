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
        System.out.println("PASS stress (" + rounds + " rounds vs O(n^2) oracle, n up to 100)");
        int[] big = new int[100000];
        for (int i = 0; i < big.length; i++) big[i] = i % 10000;
        timeIt("maxArea(n=10^5) x2000", 2000, () -> SINK += maxArea(big));
        System.out.println("checksum " + SINK + " (prevents dead-code elimination)");
        System.out.println("PASS ContainerWithMostWater");
    }
}