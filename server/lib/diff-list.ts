function findOptimalMerges<T>(
    computePairScore: (lhs: T, rhs: Partial<T>, parent?: string) => number,
    minSimilarity: number,
    knowns: T[],
    provideds: Partial<T>[],
    parentId?: string
): [T, Partial<T>][] {
    const scoreMatrix: number[][] = [];
    for (let i = 0; i < knowns.length; i++) {
        scoreMatrix.push([]);
        for (let j = 0; j < provideds.length; j++) {
            scoreMatrix[i][j] = computePairScore(knowns[i], provideds[j], parentId);
        }
    }

    // Use a greedy strategy: find the first pairing that maximizes similarity,
    // then remove both columns; then find the pairing that maximizes
    // similarity, etc.

    const duplicateCandidates: [T, Partial<T>][] = [];

    while (knowns.length && provideds.length) {
        let max = minSimilarity;
        let indexes: null | { i: number; j: number } = null;

        // Find max.
        for (let i = 0; i < knowns.length; i++) {
            for (let j = 0; j < provideds.length; j++) {
                if (scoreMatrix[i][j] > max) {
                    max = scoreMatrix[i][j];
                    indexes = { i, j };
                }
            }
        }

        if (indexes === null) {
            break;
        }

        const pair: [T, Partial<T>] = [
            knowns.splice(indexes.i, 1)[0],
            provideds.splice(indexes.j, 1)[0],
        ];

        // Remove line indexes.i and column indexes.j from the score matrix.
        for (let i = 0; i < scoreMatrix.length; i++) {
            scoreMatrix[i].splice(indexes.j, 1);
        }
        scoreMatrix.splice(indexes.i, 1);

        duplicateCandidates.push(pair);
    }

    return duplicateCandidates;
}

interface DiffReturn<T> {
    perfectMatches: [T, Partial<T>][];
    providerOrphans: Partial<T>[];
    knownOrphans: T[];
    duplicateCandidates: [T, Partial<T>][];
}

interface MakeDiffReturn<T> {
    (known: T[], provided: Partial<T>[], parentId?: string): DiffReturn<T>;
}

// Given a list of `known` objects (known to Kresus and saved into the
// database), and a list of objects `provided` by the source backend, compute
// a diff between the twos. Returns an object containing the following fields:
//
// - perfectMatches: An array consisting of pairs of objects that are surely
// the same, meaning most information is the same.
// - providerOrphans: a list of orphan objects only known by the provider, not
// by Kresus.
// - knownOrphans: a list of orphan objects only known by Kresus but not by
// the provider.
// - duplicateCandidates: a list of potential duplicate accounts. That happens
// when two objects are not perfect matches but they could be. In this case,
// Kresus tries to infer what's the most likely match, and will return only
// this one.
// Warning: this function modifies the `provided` array passed in parameter by
// removing the "perfect match" duplicates.
export default function makeDiff<T>(
    isPerfectMatch: (lhs: T, rhs: Partial<T>) => boolean,
    computePairScore: (lhs: T, rhs: Partial<T>, parentId?: string) => number,
    minSimilarity: number
): MakeDiffReturn<T> {
    return (known: T[], provided: Partial<T>[], parentId?: string): DiffReturn<T> => {
        let unprocessed = known;
        const nextUnprocessed: T[] = [];

        // 1. Find perfect matches.
        const perfectMatches: [T, Partial<T>][] = [];
        for (const target of unprocessed) {
            let matchIndex: number | null = null;
            for (let i = 0; i < provided.length; i++) {
                if (isPerfectMatch(target, provided[i])) {
                    matchIndex = i;
                    break;
                }
            }
            if (matchIndex !== null) {
                perfectMatches.push([target, provided[matchIndex]]);
                provided.splice(matchIndex, 1);
            } else {
                nextUnprocessed.push(target);
            }
        }

        unprocessed = nextUnprocessed;

        // 2. Find potential duplicates.

        const duplicateCandidates = findOptimalMerges<T>(
            computePairScore,
            minSimilarity,
            unprocessed,
            provided,
            parentId
        );

        // 3. Conclude.

        const knownOrphans = unprocessed;
        const providerOrphans = provided;

        return {
            perfectMatches,
            providerOrphans,
            knownOrphans,
            duplicateCandidates,
        };
    };
}
