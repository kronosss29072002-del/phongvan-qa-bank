// Family "window-set", canonical: contains-duplicate-ii (LeetCode 219).
// Algorithm: a set that holds exactly the values of the current window of size
// k. Expand r; if the new value is already in the set, a duplicate pair within
// distance k exists; else add it and evict the value at index r-k when the
// window grows past k. The set is the "frequencies" structure of the window.
// Time O(n), space O(min(n, k)).
import java.util.*;
class ContainsDuplicateII {
    static boolean containsNearbyDuplicate(int[] nums, int k) {
        Set<Integer> window = new HashSet<>();
        for (int r = 0; r < nums.length; r++) {
            if (!window.add(nums[r])) return true; // duplicate within distance <= k
            if (window.size() > k) window.remove(nums[r - k]); // keep window at size k
        }
        return false;
    }

    // Oracle: pair scan bounded by distance k.
    static boolean oracle(int[] nums, int k) {
        for (int i = 0; i < nums.length; i++)
            for (int j = i + 1; j < nums.length && j - i <= k; j++)
                if (nums[i] == nums[j]) return true;
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
        check(containsNearbyDuplicate(new int[]{1, 2, 3, 1}, 3), "example 1: 1 at 0 and 3, k=3");
        check(containsNearbyDuplicate(new int[]{1, 0, 1, 1}, 1), "example 2: 1 at 2 and 3, k=1");
        check(!containsNearbyDuplicate(new int[]{1, 2, 3, 1, 2, 3}, 2), "example 3: no pair within 2");
        check(!containsNearbyDuplicate(new int[]{1, 2, 3}, 2), "edge: no duplicates at all");
        check(containsNearbyDuplicate(new int[]{1, 2, 3, 4, 5, 1}, 6), "edge: k >= n catches far pair");
        check(!containsNearbyDuplicate(new int[]{1, 2, 1}, 0), "edge: k=0, distance must be < 1 -> false");
        System.out.println("PASS fixed cases");
        Random rng = new Random(20260918L);
        int rounds = 400;
        for (int r = 0; r < rounds; r++) {
            int n = rng.nextInt(50);
            int k = rng.nextInt(8);
            int[] a = new int[n];
            for (int i = 0; i < n; i++) a[i] = rng.nextInt(6);
            boolean fast = containsNearbyDuplicate(a, k);
            boolean slow = oracle(a, k);
            if (fast != slow) throw new AssertionError("stress mismatch n=" + n + " k=" + k);
        }
        System.out.println("PASS stress (" + rounds + " rounds vs pair-scan oracle)");
        int[] big = new int[100000];
        for (int i = 0; i < big.length; i++) big[i] = i; // distinct -> always false, exercises evictions
        timeIt("containsNearbyDuplicate(n=10^5, k=100) x500", 500, () -> SINK += containsNearbyDuplicate(big, 100) ? 1 : 0);
        System.out.println("checksum " + SINK + " (prevents dead-code elimination)");
        System.out.println("PASS ContainsDuplicateII");
    }
}