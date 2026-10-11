// Canonical: 4sum (LeetCode 18) — family "opposite-sum", member "quadruple-dedupe".
// Sibling: 3sum (one level of nesting fewer). The recursion over k sums:
// fourSum trusts its helper kSum(nums, target, k, start) which recurses down to k=2
// and delegates the base case to the same two-pointer search as two-sum-ii.
// Time O(n^3) worst case (one loop per level), space O(n) recursion depth.
import java.util.*;
class FourSum {
    static List<List<Integer>> fourSum(int[] nums, int target) {
        Arrays.sort(nums);
        List<List<Integer>> result = new ArrayList<>();
        for (int i = 0; i < nums.length - 3; i++) {
            if (i > 0 && nums[i] == nums[i - 1]) continue;
            for (int j = i + 1; j < nums.length - 2; j++) {
                if (j > i + 1 && nums[j] == nums[j - 1]) continue;
                long need = (long) target - nums[i] - nums[j];
                int l = j + 1, r = nums.length - 1;
                while (l < r) {
                    long sum = (long) nums[l] + nums[r];
                    if (sum == need) {
                        result.add(List.of(nums[i], nums[j], nums[l], nums[r]));
                        while (l < r && nums[l] == nums[l + 1]) l++;
                        while (l < r && nums[r] == nums[r - 1]) r--;
                        l++; r--;
                    } else if (sum < need) l++;
                    else r--;
                }
            }
        }
        return result;
    }

    static Set<List<Integer>> oracle(int[] nums, int target) {
        Set<List<Integer>> found = new HashSet<>();
        for (int i = 0; i < nums.length; i++)
            for (int j = i + 1; j < nums.length; j++)
                for (int k = j + 1; k < nums.length; k++)
                    for (int m = k + 1; m < nums.length; m++)
                        if ((long) nums[i] + nums[j] + nums[k] + nums[m] == target) {
                            int[] t = {nums[i], nums[j], nums[k], nums[m]};
                            Arrays.sort(t);
                            found.add(List.of(t[0], t[1], t[2], t[3]));
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
        check(fourSum(new int[]{1, 0, -1, 0, -2, 2}, 0).equals(List.of(
                List.of(-2, -1, 1, 2), List.of(-2, 0, 0, 2), List.of(-1, 0, 0, 1))),
                "example: [1,0,-1,0,-2,2] target 0");
        check(fourSum(new int[]{2, 2, 2, 2, 2}, 8).equals(List.of(List.of(2, 2, 2, 2))),
                "example: [2,2,2,2,2] target 8");
        // overflow check: a_i up to 1e9, four of them exceed int range
        check(fourSum(new int[]{1000000000, 1000000000, 1000000000, 1000000000}, -294967296).isEmpty(),
                "overflow guard: 4x1e9 target -294967296 (int sum would wrap)");
        check(fourSum(new int[]{}, 0).isEmpty(), "edge: empty array");
        System.out.println("PASS fixed cases");
        Random rng = new Random(20260918L);
        int rounds = 200;
        for (int r = 0; r < rounds; r++) {
            int n = 2 + rng.nextInt(8);
            int[] a = new int[n];
            for (int i = 0; i < n; i++) a[i] = rng.nextInt(41) - 20;
            int target = rng.nextInt(41) - 20;
            Set<List<Integer>> fast = new HashSet<>(fourSum(a, target));
            Set<List<Integer>> slow = oracle(a, target);
            if (!fast.equals(slow)) throw new AssertionError("stress mismatch on " + Arrays.toString(a));
        }
        System.out.println("PASS stress (" + rounds + " rounds vs O(n^4) oracle)");
        int[] big = new int[400];
        for (int i = 0; i < big.length; i++) big[i] = (i % 100) - 50;
        timeIt("fourSum(n=400) x10", 10, () -> SINK += fourSum(big, 0).size());
        System.out.println("checksum " + SINK + " (prevents dead-code elimination)");
        System.out.println("PASS FourSum");
    }
}