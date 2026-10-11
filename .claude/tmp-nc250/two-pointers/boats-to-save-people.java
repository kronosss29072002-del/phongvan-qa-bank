// Canonical: boats-to-save-people (LeetCode 881) — family "greedy-pairing".
// Algorithm: sort by weight; the heaviest person either rides alone (if the
// lightest remaining cannot join: weight[light] + weight[heavy] > limit) or
// pairs with the lightest (greedy choice is safe: pairing the lightest with
// the heaviest frees the most capacity for everyone else).
// Each iteration ships exactly one boat: either the heavy alone or both ends.
// Time O(n log n) for the sort + O(n) scan, space O(log n) sort stack.
import java.util.*;
class BoatsToSavePeople {
    static int numRescueBoats(int[] people, int limit) {
        Arrays.sort(people);
        int l = 0, r = people.length - 1, boats = 0;
        while (l <= r) {
            if (people[l] + people[r] <= limit) l++; // pair the lightest with the heaviest
            r--;                                     // heaviest always leaves on this boat
            boats++;
        }
        return boats;
    }

    // Oracle: brute force over subsets via recursion on the sorted array.
    // Ships the heaviest first and tries both choices (pair with some other person
    // or alone), recursing on the rest. Optimal substructure, exponential worst
    // case, fine for n <= 9 in the stress loop.
    static int best = Integer.MAX_VALUE;
    static int oracle(int[] people, int limit) {
        best = Integer.MAX_VALUE;
        rec(people, limit, 0, new boolean[people.length], 0);
        return best;
    }
    static void rec(int[] people, int limit, int shipped, boolean[] used, int boats) {
        if (boats >= best) return;
        if (shipped == people.length) { best = Math.min(best, boats); return; }
        int first = -1;
        for (int i = 0; i < people.length; i++) if (!used[i]) { first = i; break; }
        used[first] = true;
        rec(people, limit, shipped + 1, used, boats + 1); // rides alone
        for (int j = first + 1; j < people.length; j++) {
            if (!used[j] && people[first] + people[j] <= limit) {
                used[j] = true;
                rec(people, limit, shipped + 2, used, boats + 1);
                used[j] = false;
            }
        }
        used[first] = false;
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
        check(numRescueBoats(new int[]{1, 2}, 3) == 1, "example 1: [1,2] limit 3");
        check(numRescueBoats(new int[]{3, 2, 2, 1}, 3) == 3, "example 2: [3,2,2,1] limit 3");
        check(numRescueBoats(new int[]{3, 5, 3, 4}, 5) == 4, "example 3: [3,5,3,4] limit 5");
        check(numRescueBoats(new int[]{5}, 5) == 1, "edge: single person");
        check(numRescueBoats(new int[]{3, 3, 3, 3}, 6) == 2, "edge: all pairs fit");
        check(numRescueBoats(new int[]{2, 2, 2, 2}, 3) == 4, "edge: no pair fits (2+2>3)");
        check(numRescueBoats(new int[]{1, 1, 1, 1}, 2) == 2, "edge: all pairs fit exactly");
        System.out.println("PASS fixed cases");
        Random rng = new Random(20260918L);
        int rounds = 300;
        for (int r = 0; r < rounds; r++) {
            int n = 1 + rng.nextInt(9);
            int limit = 3 + rng.nextInt(8);
            int[] a = new int[n];
            for (int i = 0; i < n; i++) a[i] = 1 + rng.nextInt(limit); // always shippable
            int fast = numRescueBoats(a, limit);
            int slow = oracle(a, limit);
            if (fast != slow) throw new AssertionError("stress mismatch n=" + n + " limit=" + limit);
        }
        System.out.println("PASS stress (" + rounds + " rounds vs backtracking oracle, n up to 9)");
        int[] big = new int[100000];
        for (int i = 0; i < big.length; i++) big[i] = 1 + (i % 20000);
        timeIt("numRescueBoats(n=10^5) x200", 200, () -> SINK += numRescueBoats(big, 20000));
        System.out.println("checksum " + SINK + " (prevents dead-code elimination)");
        System.out.println("PASS BoatsToSavePeople");
    }
}