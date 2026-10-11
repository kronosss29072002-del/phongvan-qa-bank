// Canonical: find-k-closest-elements (LeetCode 658) — family "k-closest-binary".
// Algorithm: binary search on the START index of the k-window, not on values.
// The window [mid, mid+k) is valid iff x - arr[mid] <= arr[mid+k] - x
// (the element just after the window is farther from x than the first element
// of the window) — if the inequality holds the window can move right,
// otherwise it must move left. Window start converges to the k closest.
// Tie-breaks (equal distance) resolve to the smaller index window because the
// comparison uses left-anchored distance, and the binary search prefers the
// leftmost window that satisfies the invariant.
// Time O(log(n-k) + k), space O(k) for the result list.
import java.util.*;
class FindKClosestElements {
    static List<Integer> findClosestElements(int[] arr, int k, int x) {
        int l = 0, r = arr.length - k;
        while (l < r) {
            int mid = (l + r) >>> 1;
            if (x - arr[mid] > arr[mid + k] - x) l = mid + 1; // window better one step right
            else r = mid;
        }
        List<Integer> result = new ArrayList<>(k);
        for (int i = l; i < l + k; i++) result.add(arr[i]);
        return result;
    }

    // Oracle: sort a copy by (distance to x, value), take the k best, re-sort.
    static List<Integer> oracle(int[] arr, int k, int x) {
        Integer[] boxed = new Integer[arr.length];
        for (int i = 0; i < arr.length; i++) boxed[i] = arr[i];
        int target = x;
        Arrays.sort(boxed, (a, b) -> {
            int da = Math.abs(a - target), db = Math.abs(b - target);
            return da != db ? Integer.compare(da, db) : Integer.compare(a, b);
        });
        List<Integer> best = new ArrayList<>(List.of(Arrays.copyOfRange(boxed, 0, k)));
        Collections.sort(best);
        return best;
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
        check(findClosestElements(new int[]{1, 2, 3, 4, 5}, 4, 3).equals(List.of(1, 2, 3, 4)),
                "example 1: k=4 x=3 -> [1,2,3,4]");
        check(findClosestElements(new int[]{1, 2, 3, 4, 5}, 4, -1).equals(List.of(1, 2, 3, 4)),
                "example 2: x below all -> leftmost 4");
        check(findClosestElements(new int[]{1, 2, 3, 4, 5}, 1, 3).equals(List.of(3)),
                "edge: k=1 at exact value");
        check(findClosestElements(new int[]{1, 1, 1, 10, 10, 10}, 1, 9).equals(List.of(10)),
                "edge: 10 closer than 1 (dist 1 vs 8)");
        check(findClosestElements(new int[]{1, 2, 3, 4, 5}, 5, 3).equals(List.of(1, 2, 3, 4, 5)),
                "edge: k = arr length");
        check(findClosestElements(new int[]{1}, 1, 0).equals(List.of(1)), "edge: single elem");
        check(findClosestElements(new int[]{0, 1, 1, 1, 2, 3, 6, 7, 8, 9}, 4, 5)
                        .equals(List.of(2, 3, 6, 7)),
                "tie-break: dist 3 ties between 2 and 8; smaller values win");
        System.out.println("PASS fixed cases");
        Random rng = new Random(20260918L);
        int rounds = 400;
        for (int r = 0; r < rounds; r++) {
            int n = 1 + rng.nextInt(30);
            int k = 1 + rng.nextInt(n);
            int[] a = new int[n];
            a[0] = rng.nextInt(20) - 10;
            for (int i = 1; i < n; i++) a[i] = a[i - 1] + rng.nextInt(3); // sorted, maybe dupes
            int x = rng.nextInt(20) - 10;
            List<Integer> fast = findClosestElements(a, k, x);
            List<Integer> slow = oracle(a, k, x);
            if (!fast.equals(slow)) throw new AssertionError("stress mismatch arr=" + Arrays.toString(a) + " k=" + k + " x=" + x);
        }
        System.out.println("PASS stress (" + rounds + " rounds vs sort-by-distance oracle)");
        int[] big = new int[100000];
        for (int i = 0; i < big.length; i++) big[i] = i;
        timeIt("findClosestElements(n=10^5, k=10, x=50000) x500", 500, () -> SINK += findClosestElements(big, 10, 50000).get(0));
        System.out.println("checksum " + SINK + " (prevents dead-code elimination)");
        System.out.println("PASS FindKClosestElements");
    }
}