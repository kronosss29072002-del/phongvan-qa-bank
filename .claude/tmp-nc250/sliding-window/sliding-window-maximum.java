// Canonical: sliding-window-maximum (LeetCode 239) — family "window-deque".
// Algorithm: monotonic deque of indices whose VALUES are decreasing. When a
// new element arrives, pop the back while it is <= the new value (those older
// elements can never be the window max again: they are smaller AND expire
// earlier), then push the new index. The front of the deque is the current
// window max; evict the front once it falls outside the window.
// Deque operations are amortized O(1), each index pushed/popped once.
// Time O(n), space O(k) worst case for the deque.
import java.util.*;
class SlidingWindowMaximum {
    static int[] maxSlidingWindow(int[] nums, int k) {
        if (nums.length == 0 || k == 0) return new int[0];
        int n = nums.length;
        int[] result = new int[n - k + 1];
        Deque<Integer> deque = new ArrayDeque<>(); // indices, values strictly decreasing
        int w = 0;
        for (int i = 0; i < n; i++) {
            while (!deque.isEmpty() && nums[deque.peekLast()] <= nums[i]) deque.pollLast();
            deque.addLast(i);
            if (deque.peekFirst() <= i - k) deque.pollFirst(); // aged out of the window
            if (i >= k - 1) result[w++] = nums[deque.peekFirst()];
        }
        return result;
    }

    // Oracle: naive per-window scan.
    static int[] oracle(int[] nums, int k) {
        int n = nums.length;
        if (n == 0 || k == 0) return new int[0];
        int[] result = new int[n - k + 1];
        for (int l = 0; l + k <= n; l++) {
            int m = Integer.MIN_VALUE;
            for (int i = l; i < l + k; i++) m = Math.max(m, nums[i]);
            result[l] = m;
        }
        return result;
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
        check(Arrays.equals(maxSlidingWindow(new int[]{1, 3, -1, -3, 5, 3, 6, 7}, 3),
                new int[]{3, 3, 5, 5, 6, 7}), "example 1: k=3 textbook");
        check(Arrays.equals(maxSlidingWindow(new int[]{1}, 1), new int[]{1}), "example 2: single");
        check(Arrays.equals(maxSlidingWindow(new int[]{7, 7, 7, 7}, 2), new int[]{7, 7, 7}),
                "edge: all equal");
        check(Arrays.equals(maxSlidingWindow(new int[]{1, 2, 3, 4, 5}, 3), new int[]{3, 4, 5}),
                "edge: strictly increasing");
        check(Arrays.equals(maxSlidingWindow(new int[]{5, 4, 3, 2, 1}, 3), new int[]{5, 4, 3}),
                "edge: strictly decreasing");
        check(Arrays.equals(maxSlidingWindow(new int[]{}, 3), new int[]{}), "edge: empty");
        System.out.println("PASS fixed cases");
        Random rng = new Random(20260918L);
        int rounds = 300;
        for (int r = 0; r < rounds; r++) {
            int n = 1 + rng.nextInt(60);
            int k = 1 + rng.nextInt(n);
            int[] a = new int[n];
            for (int i = 0; i < n; i++) a[i] = rng.nextInt(2001) - 1000;
            int[] fast = maxSlidingWindow(a, k);
            int[] slow = oracle(a, k);
            if (!Arrays.equals(fast, slow)) throw new AssertionError("stress mismatch n=" + n + " k=" + k);
        }
        System.out.println("PASS stress (" + rounds + " rounds vs per-window scan oracle)");
        int[] big = new int[100000];
        for (int i = 0; i < big.length; i++) big[i] = rng.nextInt();
        timeIt("maxSlidingWindow(n=10^5, k=5000) x100", 100, () -> SINK += maxSlidingWindow(big, 5000).length);
        System.out.println("checksum " + SINK + " (prevents dead-code elimination)");
        System.out.println("PASS SlidingWindowMaximum");
    }
}