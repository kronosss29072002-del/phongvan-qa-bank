// Canonical: 3sum (LeetCode 15) — family "opposite-sum", member "triplet-dedupe".
// Copies in this family: two-sum-ii-input-array-is-sorted (no dedupe needed),
// 4sum (adds an outer j loop and k-sum nesting; same dedupe rule).
// Algorithm: sort once, then for each index i run the two-sum-two-pointer search
// on nums[i+1..n-1]. The sorted order makes skipping duplicate i/l/r values safe:
// any triplet starting at a duplicate i is identical to one already emitted.
// O(n^2) time, O(log n) space for the sort (Arrays.sort uses dual-pivot quicksort).
import java.util.*;
class ThreeSum {
    static List<List<Integer>> threeSum(int[] nums) {
        Arrays.sort(nums);
        List<List<Integer>> result = new ArrayList<>();
        for (int i = 0; i < nums.length - 2; i++) {
            if (i > 0 && nums[i] == nums[i - 1]) continue; // skip duplicate pivots
            int target = -nums[i];
            int l = i + 1, r = nums.length - 1;
            while (l < r) {
                int sum = nums[l] + nums[r];
                if (sum == target) {
                    result.add(List.of(nums[i], nums[l], nums[r]));
                    while (l < r && nums[l] == nums[l + 1]) l++; // skip duplicate left
                    while (l < r && nums[r] == nums[r - 1]) r--; // skip duplicate right
                    l++; r--;
                } else if (sum < target) l++;
                else r--;
            }
        }
        return result;
    }

    // Brute-force oracle: enumerate every triple, dedupe via a sorted-string set.
    static Set<List<Integer>> oracle(int[] nums) {
        Set<List<Integer>> found = new HashSet<>();
        for (int i = 0; i < nums.length; i++)
            for (int j = i + 1; j < nums.length; j++)
                for (int k = j + 1; k < nums.length; k++)
                    if (nums[i] + nums[j] + nums[k] == 0) {
                        int[] t = {nums[i], nums[j], nums[k]};
                        Arrays.sort(t);
                        found.add(List.of(t[0], t[1], t[2]));
                    }
        return found;
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
        check(threeSum(new int[]{-1, 0, 1, 2, -1, -4}).equals(List.of(List.of(-1, -1, 2), List.of(-1, 0, 1))),
                "example: [-1,0,1,2,-1,-4] -> [[-1,-1,2],[-1,0,1]]");
        check(threeSum(new int[]{0, 1, 1}).isEmpty(), "example: [0,1,1] -> []");
        check(threeSum(new int[]{0, 0, 0}).equals(List.of(List.of(0, 0, 0))), "example: [0,0,0] -> [[0,0,0]]");
        check(threeSum(new int[]{}).isEmpty(), "edge: empty array");
        check(threeSum(new int[]{-5, -5, -5, 10}).equals(List.of(List.of(-5, -5, 10))), "edge: triple duplicate pivot");
        System.out.println("PASS fixed cases");
        Random rng = new Random(20260918L);
        int rounds = 300;
        for (int r = 0; r < rounds; r++) {
            int n = 1 + rng.nextInt(12);
            int[] a = new int[n];
            for (int i = 0; i < n; i++) a[i] = rng.nextInt(41) - 20;
            Set<List<Integer>> fast = new HashSet<>(threeSum(a));
            Set<List<Integer>> slow = oracle(a);
            if (!fast.equals(slow)) throw new AssertionError("stress mismatch on " + Arrays.toString(a));
        }
        System.out.println("PASS stress (" + rounds + " rounds, two-pointer vs O(n^3) set-oracle)");
        int[] big = new int[2000];
        for (int i = 0; i < big.length; i++) big[i] = (i % 500) - 250;
        timeIt("threeSum(n=2000) x20", 20, () -> SINK += threeSum(big).size());
        System.out.println("checksum " + SINK + " (prevents dead-code elimination)");
        System.out.println("PASS ThreeSum");
    }
}