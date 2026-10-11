// Family "reverse-array", member: rotate-array (LeetCode 189).
// reverse-string's swap loop, reused three times: reverse whole array, then
// reverse [0,k) and [k,n) — the double reversal places the last k elements first
// while keeping each block's relative order. k is normalized first:
// rotating right by k and by k mod n are the same motion.
// Time O(n), space O(1).
import java.util.*;
class RotateArray {
    static void rotate(int[] nums, int k) {
        int n = nums.length;
        if (n == 0) return;
        k = k % n;
        reverse(nums, 0, n - 1);
        reverse(nums, 0, k - 1);
        reverse(nums, k, n - 1);
    }
    static void reverse(int[] a, int from, int to) {
        while (from < to) {
            int t = a[from]; a[from] = a[to]; a[to] = t;
            from++; to--;
        }
    }

    // Oracle: straight shift into a result array (extra memory allowed in oracle).
    static int[] oracle(int[] nums, int k) {
        int n = nums.length;
        if (n == 0) return nums;
        k = k % n;
        int[] res = new int[n];
        for (int i = 0; i < n; i++) res[(i + k) % n] = nums[i];
        return res;
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
        int[] a = {1, 2, 3, 4, 5, 6, 7};
        rotate(a, 3);
        check(Arrays.toString(a).equals("[5, 6, 7, 1, 2, 3, 4]"), "example 1: 7-elem rotate 3");
        int[] b = {-1, -100, 3, 99};
        rotate(b, 2);
        check(Arrays.toString(b).equals("[3, 99, -1, -100]"), "example 2: 4-elem rotate 2");
        int[] c = {1, 2, 3};
        rotate(c, 0);
        check(Arrays.toString(c).equals("[1, 2, 3]"), "edge: k=0");
        int[] d = {1};
        rotate(d, 5);
        check(Arrays.toString(d).equals("[1]"), "edge: k > n on tiny array");
        int[] e = {1, 2, 3, 4};
        rotate(e, 4);
        check(Arrays.toString(e).equals("[1, 2, 3, 4]"), "edge: k multiple of n");
        System.out.println("PASS fixed cases");
        Random rng = new Random(20260918L);
        int rounds = 500;
        for (int r = 0; r < rounds; r++) {
            int n = rng.nextInt(40);
            int[] arr = new int[n];
            for (int i = 0; i < n; i++) arr[i] = rng.nextInt(200) - 100;
            int k = rng.nextInt(120); // includes k > n
            int[] got = arr.clone();
            rotate(got, k);
            int[] exp = oracle(arr, k);
            if (!Arrays.equals(got, exp)) throw new AssertionError("stress mismatch");
        }
        System.out.println("PASS stress (" + rounds + " rounds vs index-shift oracle)");
        int[] big = new int[100000];
        for (int i = 0; i < big.length; i++) big[i] = i;
        timeIt("rotate(n=10^5, k=56789) x2000", 2000, () -> {
            int[] working = big.clone();
            rotate(working, 56789);
            SINK += working[0];
        });
        System.out.println("checksum " + SINK + " (prevents dead-code elimination)");
        System.out.println("PASS RotateArray");
    }
}