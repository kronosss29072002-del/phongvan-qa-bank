// Canonical: remove-duplicates-from-sorted-array (LeetCode 26) — family "dedupe-array".
// Algorithm: the write pointer w only advances when a NEW value is seen; the
// read pointer i scans the whole array. Because input is sorted, "new" means
// different from the last written value, so a duplicate run collapses to one
// write. Values after w are irrelevant (LeetCode only checks the prefix).
// Time O(n), space O(1).
import java.util.*;
class RemoveDuplicatesFromSortedArray {
    static int removeDuplicates(int[] nums) {
        if (nums.length == 0) return 0;
        int w = 1;
        for (int i = 1; i < nums.length; i++)
            if (nums[i] != nums[w - 1]) nums[w++] = nums[i];
        return w;
    }

    // Oracle: collectors partition via LinkedHashSet, then re-write prefix.
    static int oracle(int[] nums) {
        LinkedHashSet<Integer> distinct = new LinkedHashSet<>();
        for (int v : nums) distinct.add(v);
        int w = 0;
        for (int v : distinct) nums[w++] = v;
        return w;
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
    static int removeAndCheck(int[] nums, int[] expectedPrefix, String label) {
        int k = removeDuplicates(nums);
        check(Arrays.equals(Arrays.copyOf(nums, k), expectedPrefix), label + " (prefix=" + k + ")");
        return k;
    }

    public static void main(String[] args) {
        check(removeAndCheck(new int[]{1, 1, 2}, new int[]{1, 2}, "example 1: [1,1,2]") == 2, "k=2");
        check(removeAndCheck(new int[]{0, 0, 1, 1, 1, 2, 2, 3, 3, 4}, new int[]{0, 1, 2, 3, 4},
                "example 2: [0,0,1,1,1,2,2,3,3,4]") == 5, "k=5");
        check(removeAndCheck(new int[]{}, new int[]{}, "edge: empty") == 0, "k=0");
        check(removeAndCheck(new int[]{7}, new int[]{7}, "edge: single") == 1, "k=1");
        check(removeAndCheck(new int[]{5, 5, 5, 5}, new int[]{5}, "edge: all duplicates") == 1, "k=1");
        check(removeAndCheck(new int[]{-3, -3, -1, 0, 0}, new int[]{-3, -1, 0}, "edge: negatives") == 3, "k=3");
        System.out.println("PASS fixed cases");
        Random rng = new Random(20260918L);
        int rounds = 500;
        for (int r = 0; r < rounds; r++) {
            int n = rng.nextInt(40);
            int[] a = new int[n];
            for (int i = 0; i < n; i++) a[i] = rng.nextInt(15); // small range -> many duplicates
            Arrays.sort(a);
            int[] copy = a.clone();
            int ka = removeDuplicates(a);
            int kb = oracle(copy);
            if (ka != kb || !Arrays.equals(Arrays.copyOf(a, ka), Arrays.copyOf(copy, kb)))
                throw new AssertionError("stress mismatch");
        }
        System.out.println("PASS stress (" + rounds + " rounds vs set-oracle)");
        int[] big = new int[100000];
        for (int i = 0; i < big.length; i++) big[i] = i / 2; // 50k distinct, heavy dupes
        int[] bigc = big.clone();
        timeIt("removeDuplicates(n=10^5) x2000", 2000, () -> {
            int[] c = bigc.clone();
            SINK += removeDuplicates(c);
        });
        System.out.println("checksum " + SINK + " (prevents dead-code elimination)");
        System.out.println("PASS RemoveDuplicatesFromSortedArray");
    }
}