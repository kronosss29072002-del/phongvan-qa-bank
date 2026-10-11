// Canonical: merge-sorted-array (LeetCode 88) — family "merge-sequences".
// Copies in this family: merge-strings-alternately (same filling-a-result
// advance-the-smaller pattern, but no in-place constraint and char arrays).
// Algorithm: nums1 has n extra trailing zeros reserved. Filling from the BACK
// cannot clobber values not yet read: the largest remaining value is always
// written to the highest free slot, so both pointers only ever read cells
// still holding original data. No extra array.
// Time O(m+n), space O(1).
import java.util.*;
class MergeSortedArray {
    static void merge(int[] nums1, int m, int[] nums2, int n) {
        int i = m - 1, j = n - 1, w = m + n - 1;
        while (j >= 0) { // nums2 empty -> nothing to do; nums1 tail is already in place
            if (i >= 0 && nums1[i] > nums2[j]) nums1[w--] = nums1[i--];
            else nums1[w--] = nums2[j--];
        }
    }

    // Oracle: standard two-pointer merge into a fresh array.
    static int[] oracle(int[] nums1, int m, int[] nums2, int n) {
        int[] res = new int[m + n];
        int i = 0, j = 0, w = 0;
        while (i < m && j < n)
            res[w++] = nums1[i] <= nums2[j] ? nums1[i++] : nums2[j++];
        while (i < m) res[w++] = nums1[i++];
        while (j < n) res[w++] = nums2[j++];
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
    static void mergeInto(int[] nums1, int m, int[] nums2, int n, int[] expected, String label) {
        merge(nums1, m, nums2, n);
        check(Arrays.equals(nums1, expected), label);
    }

    public static void main(String[] args) {
        mergeInto(new int[]{1, 2, 3, 0, 0, 0}, 3, new int[]{2, 5, 6}, 3,
                new int[]{1, 2, 2, 3, 5, 6}, "example: [1,2,3] + [2,5,6]");
        mergeInto(new int[]{1}, 1, new int[]{}, 0, new int[]{1}, "example: nums2 empty");
        mergeInto(new int[]{0}, 0, new int[]{1}, 1, new int[]{1}, "example: nums1 empty");
        mergeInto(new int[]{2, 0}, 1, new int[]{1}, 1, new int[]{1, 2}, "edge: all nums2 smaller than nums1");
        mergeInto(new int[]{1, 1, 0, 0}, 2, new int[]{1, 1}, 2, new int[]{1, 1, 1, 1}, "edge: all equal");
        System.out.println("PASS fixed cases");
        Random rng = new Random(20260918L);
        int rounds = 500;
        for (int r = 0; r < rounds; r++) {
            int m = rng.nextInt(30), n = rng.nextInt(30);
            int[] a = new int[m], b = new int[n];
            for (int i = 0; i < m; i++) a[i] = rng.nextInt(100) - 50;
            for (int i = 0; i < n; i++) b[i] = rng.nextInt(100) - 50;
            Arrays.sort(a); Arrays.sort(b);
            int[] nums1 = Arrays.copyOf(a, m + n);
            int[] exp = oracle(a, m, b, n);
            merge(nums1, m, b, n);
            if (!Arrays.equals(nums1, exp)) throw new AssertionError("stress mismatch");
        }
        System.out.println("PASS stress (" + rounds + " rounds vs fresh-array merge oracle)");
        int[] big1 = new int[200000], big2 = new int[100000];
        for (int i = 0; i < 100000; i++) { big1[i] = i; big2[i] = i + 50000; }
        int[] big1c = big1.clone();
        timeIt("merge(m=10^5, n=10^5) x200", 200, () -> {
            int[] c = Arrays.copyOf(big1c, 200000);
            merge(c, 100000, big2, 100000);
            SINK += c[199999];
        });
        System.out.println("checksum " + SINK + " (prevents dead-code elimination)");
        System.out.println("PASS MergeSortedArray");
    }
}