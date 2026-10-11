// Family "greedy-extrema", member: trapping-rain-water (LeetCode 42).
// container-with-most-water's two-pointer sweep, with a "carry the max" twist:
// water above index i is bounded by maxLeft and maxRight seen so far. Walking
// from both ends, the side whose running max is smaller is the side that is
// locked (its bar cannot be raised by anything further inward), so water there
// is decided immediately: min(maxL, maxR) - height[i].
// Time O(n), space O(1).
import java.util.*;
class TrappingRainWater {
    static int trap(int[] height) {
        int l = 0, r = height.length - 1, maxL = 0, maxR = 0, water = 0;
        while (l <= r) {
            if (maxL <= maxR) {
                // left bound locked by maxL; contribution is decided now
                maxL = Math.max(maxL, height[l]);
                water += maxL - height[l];
                l++;
            } else {
                maxR = Math.max(maxR, height[r]);
                water += maxR - height[r];
                r--;
            }
        }
        return water;
    }

    // Oracle: per-position min(maxLeft, maxRight) - height, two passes with arrays.
    static int oracle(int[] height) {
        int n = height.length;
        int[] maxL = new int[n], maxR = new int[n];
        int m = 0;
        for (int i = 0; i < n; i++) { m = Math.max(m, height[i]); maxL[i] = m; }
        m = 0;
        for (int i = n - 1; i >= 0; i--) { m = Math.max(m, height[i]); maxR[i] = m; }
        int water = 0;
        for (int i = 0; i < n; i++) water += Math.min(maxL[i], maxR[i]) - height[i];
        return water;
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
        check(trap(new int[]{0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1}) == 6, "example 1: textbook 6");
        check(trap(new int[]{4, 2, 0, 3, 2, 5}) == 9, "example 2: 9");
        check(trap(new int[]{}) == 0, "edge: empty");
        check(trap(new int[]{5}) == 0, "edge: single");
        check(trap(new int[]{3, 3, 3}) == 0, "edge: flat, no water");
        check(trap(new int[]{5, 0, 5}) == 5, "edge: two walls one valley");
        check(trap(new int[]{0, 0, 0, 0}) == 0, "edge: all zero");
        System.out.println("PASS fixed cases");
        Random rng = new Random(20260918L);
        int rounds = 400;
        for (int r = 0; r < rounds; r++) {
            int n = rng.nextInt(120);
            int[] a = new int[n];
            for (int i = 0; i < n; i++) a[i] = rng.nextInt(50);
            int fast = trap(a);
            int slow = oracle(a);
            if (fast != slow) throw new AssertionError("stress mismatch on n=" + n);
        }
        System.out.println("PASS stress (" + rounds + " rounds vs prefix-max oracle)");
        int[] big = new int[100000];
        for (int i = 0; i < big.length; i++) big[i] = (int) Math.abs(Math.sin(i)) * 10000;
        timeIt("trap(n=10^5) x2000", 2000, () -> SINK += trap(big));
        System.out.println("checksum " + SINK + " (prevents dead-code elimination)");
        System.out.println("PASS TrappingRainWater");
    }
}