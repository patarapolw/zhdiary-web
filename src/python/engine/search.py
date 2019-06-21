from typing import Callable, Any, Union
import re
import functools
from datetime import timedelta
import math


def mongo_filter(cond: dict) -> Callable[[dict], bool]:
    def inner_filter(item: dict) -> bool:
        for k, v in cond.items():
            if k[0] == "$":
                if k == "$and":
                    return all(mongo_filter(x)(item) for x in v)
                elif k == "$or":
                    return any(mongo_filter(x)(item) for x in v)
                elif k == "$not":
                    return not mongo_filter(v)(item)
            else:
                item_k = dot_getter(item, k)

                if isinstance(v, dict) and any(k0[0] == "$" for k0 in v.keys()):
                    return _mongo_compare(item_k, v)
                elif isinstance(item_k, list):
                    if v not in item_k:
                        return False
                elif item_k != v:
                    return False

        return True

    return inner_filter


def parse_timedelta(s: str) -> timedelta:
    if s == "NOW":
        return timedelta()

    m = re.search("([-+]?\\d+)(\\S*)", s)
    if m:
        if m[2] in {"m", "min"}:
            return timedelta(minutes=int(m[1]))
        elif m[2] in {"h", "hr"}:
            return timedelta(hours=int(m[1]))
        elif m[2] in {"d"}:
            return timedelta(days=int(m[1]))
        elif m[2] in {"w", "wk"}:
            return timedelta(weeks=int(m[1]))
        elif m[2] in {"M", "mo"}:
            return timedelta(days=30 * int(m[1]))
        elif m[2] in {"y", "yr"}:
            return timedelta(days=365 * int(m[1]))

    return timedelta()


def sorter(sort_by: str, desc: bool) -> Callable[[Any], bool]:
    def pre_cmp(a, b):
        m = _sort_convert(a)
        n = _sort_convert(b)

        if isinstance(m, (float, int, str)):
            if type(m) == type(n):
                return 1 if m > n else 0 if m == n else -1
            elif isinstance(m, str):
                return 1
            else:
                return -1
        else:
            return 0

    return functools.cmp_to_key(lambda x, y: -pre_cmp(dot_getter(x, sort_by, False), dot_getter(y, sort_by, False))
        if desc else pre_cmp(dot_getter(x, sort_by, False), dot_getter(y, sort_by, False)))


def dot_getter(d: dict, k: str, get_data: bool = True) -> Any:
    if k[0] == "@":
        return data_getter(d, k[1:])

    v = d

    for kn in k.split("."):
        if isinstance(v, dict):
            if kn == "*":
                v = list(v.values())
            else:
                v = v.get(kn, dict())
        elif isinstance(v, list):
            try:
                v = v[int(kn)]
            except (IndexError, ValueError):
                v = None
                break
        else:
            break

    if isinstance(v, dict) and len(v) == 0:
        v = None

    if get_data and k not in {"nextReview", "srsLevel"}:
        data = data_getter(d, k)
        if data is not None:
            if v is not None:
                if isinstance(data, list):
                    if isinstance(v, list):
                        v = [*v, *data]
                    elif v is not None:
                        v = [v, *data]
                    else:
                        v = data
                else:
                    if isinstance(v, list):
                        v = [*v, data]
                    elif v is not None:
                        v = [v, data]
                    else:
                        v = data
            else:
                v = data

    return v


def data_getter(d: dict, k: str) -> Union[str, list, None]:
    k = k.lower()

    try:
        if k == "*":
            return [v0["value"] for v0 in d["data"] if not v0["value"].startswith("@nosearch\n")]
        else:
            for v0 in d["data"]:
                if v0["key"].lower() == k:
                    return v0["value"]
    except AttributeError:
        pass

    return None


def _mongo_compare(v, v_obj: dict) -> bool:
    for op, v0 in v_obj.items():
        try:
            if op == "$regex":
                if isinstance(v, list):
                    return any(re.search(str(v0), str(b), flags=re.IGNORECASE) for b in v)
                else:
                    return re.search(str(v0), str(v), flags=re.IGNORECASE) is not None
            elif op == "$substr":
                if isinstance(v, list):
                    return any(str(v0) in str(b) for b in v)
                else:
                    return str(v0) in str(v)
            elif op == "$startswith":
                if isinstance(v, list):
                    return any(str(b).startswith(str(v0)) for b in v)
                else:
                    return str(v).startswith(str(v0))
            elif op == "$exists":
                return (v is not None) == v0
            else:
                try:
                    _v = int(v)
                    _v0 = int(v0)
                    v, v0 = _v, _v0
                except ValueError:
                    pass

                if op == "$gte":
                    return v >= v0
                elif op == "$gt":
                    return v > v0
                elif op == "$lte":
                    return v <= v0
                elif op == "$lt":
                    return v < v0
        except TypeError:
            pass

    return False


def _sort_convert(x) -> Union[float, str]:
    if x is None:
        return -math.inf
    elif isinstance(x, bool):
        return math.inf if x else -math.inf
    elif isinstance(x, int):
        return float(x)

    return str(x)
