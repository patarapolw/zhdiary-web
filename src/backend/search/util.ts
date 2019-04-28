export function mongoToFilter(cond: any): (item: any) => boolean {
    return (item: any) => {
        for (const k of Object.keys(cond)) {
            if (k[0] === "$") {
                if (k === "$and") {
                    const ck: any[] = cond[k];
                    return ck.every((c) => mongoToFilter(c)(item));
                } else if (k === "$or") {
                    const ck: any[] = cond[k];
                    return ck.some((c) => mongoToFilter(c)(item));
                } else if (k === "$not") {
                    return !mongoToFilter(cond[k])(item);
                }
            } else {
                const ck: any = cond[k];

                if (ck && typeof ck === "object" && Object.keys(ck).some((c) => c[0] === "$")) {
                    return mongoCompare(item[k], ck);
                } else {
                    if (Array.isArray(item[k])) {
                        if (item[k].indexOf(ck) === -1) {
                            return false;
                        }
                    } else {
                        if (item[k] !== ck) {
                            return false;
                        }
                    }
                }
            }
        }

        return true;
    };
}

function mongoCompare(v: any, ck: any): boolean {
    for (const op of Object.keys(ck)) {
        const v0 = ck[op];

        if (op === "$regex") {
            if (Array.isArray(v)) {
                return v.some((b) => new RegExp(v0.toString()).test(b));
            } else {
                return new RegExp(v0.toString()).test(v);
            }
        } else if (op === "$gte") {
            return v >= v0;
        } else if (op === "$gt") {
            return v > v0;
        } else if (op === "$lte") {
            return v <= v0;
        } else if (op === "$lt") {
            return v < v0;
        } else if (op === "$exists") {
            return (v !== undefined) === v0;
        } else if (op === "$in") {
            return (v0 as any[]).some((a) => a === v);
        }
    }

    return false;
}

export interface IJoinCollection<T> {
    data: T[];
    key: keyof T;
}

export function fullJoin<T, U>(
    colL: IJoinCollection<T>,
    colR: IJoinCollection<U>,
    mapFn: (l: T, r: U) => any
): any[] {
    const joinMapL: any = {};
    const joinMapR: any = {};
    const result: any[] = [];

    for (const rowR of colR.data) {
        const v = rowR[colR.key];

        if (v) {
            joinMapR[v] = joinMapR[v] || [];
            joinMapR[v].push(rowR);
        } else {
            result.push({} as T, rowR);
        }
    }

    for (const rowL of colL.data) {
        const v = rowL[colL.key];

        if (v) {
            for (const vR of joinMapR[v] || [{}]) {
                result.push(mapFn(rowL, vR));
            }
        } else {
            result.push(mapFn(rowL, {} as U));
        }
    }

    return result;
}