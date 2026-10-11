// Family "window-distinct", member: minimum-size-subarray-sum (LeetCode 209).
// minimum-window-substring's expand-shrink loop, simplified: no target counts,
// only a running total. Expand r until sum >= target, then shrink l while the
// sum still satisfies the target, tracking the smallest window length.
// Time O(n), space O(1).
import java.util.*;
class MinimumSizeSubarraySum {
    static int minSubArrayLen(int target, int[] nums) {
        int l = 0, sum = 0, best = Integer.MAX_VALUE;
        for (int r = 0; r < nums.length; r++) {
            sum += nums[r];
            while (sum >= target) { // shrink the window while it still qualifies
                best = Math.min(best, r - l + 1);
                sum -= nums[l];
                l++;
            }
        }
        return best == Integer.MAX_VALUE ? 0 : best;
    }

    // Oracle: per start index, extend until the sum crosses target.
    static int oracle(int target, int[] nums) {
        int best = Integer.MAX_VALUE;
        for (int l = 0; l < nums.length; l++) {
            int sum = 0;
            for (int r = l; r < nums.length; r++) {
                sum += nums[r];
                if (sum >= target) { best = Math.min(best, r - l + 1); break; }
            }
        }
        return best == Integer.MAX_VALUE ? 0 : best;
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
        check(minSubArrayLen(7, new int[]{2, 3, 1, 2, 4, 3}) == 2, "example: target 7 -> 2 ([4,3])");
        check(minSubArrayLen(4, new int[]{1, 4, 4}) == 1, "example: single element already enough");
        check(minSubArrayLen(11, new int[]{1, 1, 1, 1, 1, 1, 1, 1}) == 0, "example: impossible");
        check(minSubArrayLen(3, new int[]{1, 1}) == 0, "edge: not enough total");
        check(minSubArrayLen(1, new int[]{1}) == 1, "edge: minimal equal");
        check(minSubArrayLen(100, new int[]{100}) == 1, "edge: exact single");
        System.out.println("PASS fixed cases");
        Random rng = new Random(20260918L);
        int rounds = 500;
        for (int r = 0; r < rounds; r++) {
            int n = rng.nextInt(60);
            int target = 1 + rng.nextInt(199); // LC constraint: target >= 1
            int[] a = new int[n];
            for (int i = 0; i < n; i++) a[i] = 1 + rng.nextInt(50);
            int fast = minSubArrayLen(target, a);
            int slow = oracle(target, a);
            if (fast != slow) throw new AssertionError("stress mismatch target=" + target);
        }
        System.out.println("PASS stress (" + rounds + " rounds vs per-start oracle)");
        int[] big = new int[100000];
        for (int i = 0; i < big.length; i++) big[i] = 1;
        timeIt("minSubArrayLen(n=10^5, target=10^5) x500", 500, () -> SINK += minSubArrayLen(100000, big));
        System.out.println("checksum " + SINK + " (prevents dead-code elimination)");
        System.out.println("PASS MinimumSizeSubarraySum");
    }
}