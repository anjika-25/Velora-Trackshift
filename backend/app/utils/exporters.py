from __future__ import annotations

import pathlib
from typing import Iterable

import pandas as pd
import ujson


def export_csv(rows: Iterable[dict], path: str | pathlib.Path) -> None:
    df = pd.DataFrame(list(rows))
    df.to_csv(path, index=False)


def export_json(data: dict, path: str | pathlib.Path) -> None:
    with open(path, "w", encoding="utf-8") as f:
        ujson.dump(data, f)



