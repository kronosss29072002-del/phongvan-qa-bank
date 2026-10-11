// Canonical: two-sum-ii-input-array-is-sorted (LeetCode 167) — family "opposite-sum".
// Copies in this family: 3sum, 4sum (same two-pointer shrink loop, dedupe added),
// two-pointers/3sum.java, two-pointers/4sum.java are separately compiled extenders.
// Algorithm: array is sorted ascending, so moving the right pointer left only
// decreases the sum and moving the left pointer right only increases it.
// Start l=0, r=n-1; if sum < target advance l, if sum > target retreat r.
// That monotone search cannot skip the answer, same argument as binary search.
// Time O(n), space O(1).
import java.util.*;
class TwoSumIIInputArrayIsSorted {
    static int[] twoSum(int[] numbers, int target) {
        int l = 0, r = numbers.length - 1;
        while (l < r) {
            int sum = numbers[l] + numbers[r];
            if (sum == target) return new int[]{l + 1, r + 1}; // output is 1-indexed
            if (sum < target) l++;
            else r--;
        }
        return new int[]{-1, -1}; // unreachable: the problem guarantees one answer
    }

    // Brute-force oracle for the stress loop: checks every pair.
    static int[] oracle(int[] numbers, int target) {
        for (int i = 0; i < numbers.length; i++)
            for (int j = i + 1; j < numbers.length; j++)
                if (numbers[i] + numbers[j] == target) return new int[]{i + 1, j + 1};
        return new int[]{-1, -1};
    }

    static long SINK;
    static void check(boolean cond, String label) {
        if (!cond) throw new AssertionError("FAIL: " + label);
        System.out.println("ok: " + label);
    }
    static void checkPair(int[] got, int[] exp, String label) {
        check(got.length == 2 && got[0] == exp[0] && got[1] == exp[1], label);
    }
    static void timeIt(String label, long iterations, Runnable task) {
        task.run(); // warmup for JIT
        long total = 0;
        for (int run = 0; run < 3; run++) {
            long t0 = System.nanoTime();
            for (long i = 0; i < iterations; i++) task.run();
            total += System.nanoTime() - t0;
        }
        System.out.printf("Timing %s: %.2f ms (avg of 3)%n", label, total / 3 / 1_000_000.0);
    }

    public static void main(String[] args) {
        checkPair(twoSum(new int[]{2, 7, 11, 15}, 9), new int[]{1, 2}, "example 1: [2,7,11,15] target 9");
        checkPair(twoSum(new int[]{2, 3, 4}, 6), new int[]{1, 3}, "example 2: [2,3,4] target 6");
        checkPair(twoSum(new int[]{-1, 0}, -1), new int[]{1, 2}, "example 3: [-1,0] target -1");
        checkPair(twoSum(new int[]{1, 1}, 2), new int[]{1, 2}, "edge: duplicates at both ends");
        checkPair(twoSum(new int[]{-1000000000, 1000000000}, 0), new int[]{1, 2}, "extreme ints, sum 0");
        checkPair(twoSum(new int[]{5, 25, 75}, 100), new int[]{2, 3}, "classic 5/25/75 example");
        System.out.println("PASS fixed cases");
        Random rng = new Random(20260918L);
        int rounds = 500;
        for (int r = 0; r < rounds; r++) {
            int n = 2 + rng.nextInt(99);
            int[] a = new int[n];
            for (int i = 0; i < n; i++) a[i] = rng.nextInt(2001) - 1000;
            Arrays.sort(a);
            int[] oraclePair = oracle(a, 0); // search a target that MIGHT exist? no: pick real pair
            // ensure at least one valid pair exists: pick two random indices, compute target
            int i = rng.nextInt(n), j = rng.nextInt(n - 1);
            if (j >= i) j++;
            int target = a[i] + a[j];
            int[] fast = twoSum(a, target);
            if (fast[0] == -1) throw new AssertionError("stress: twoSum returned nothing for valid target");
            if (a[fast[0] - 1] + a[fast[1] - 1] != target || fast[0] >= fast[1])
                throw new AssertionError("stress mismatch: " + Arrays.toString(fast) + " target " + target);
        }
        System.out.println("PASS stress (" + rounds + " rounds, two-pointer vs validated-pair)");
        int[] big = new int[100000];
        for (int i = 0; i < big.length; i++) big[i] = i;
        timeIt("twoSum(1..100000, 199999) x1000", 1000, () -> SINK += twoSum(big, 199999)[0] + twoSum(big, 199999)[1]);
        System.out.println("checksum " + SINK + " (prevents dead-code elimination)");
        System.out.println("PASS TwoSumIIInputArrayIsSorted");
    }
}