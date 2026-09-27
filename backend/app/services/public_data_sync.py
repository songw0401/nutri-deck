import base64
import csv
import gzip
import io
import json
import os
import re
import time
import unicodedata
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple

PROJECT_ROOT = Path(__file__).resolve().parents[3]
NATIONAL_DB_FILE = PROJECT_ROOT / "data" / "reference" / "national_food_10_4.tsv.gz.b64"
GAME_DATA_FILE = PROJECT_ROOT / "data" / "processed" / "game_foods.json"
FRONTEND_FOOD_FILE = PROJECT_ROOT / "frontend" / "data" / "foods.json"
SYNC_META_FILE = PROJECT_ROOT / "data" / "processed" / "data_sync_meta.json"
BACKEND_ENV_FILE = PROJECT_ROOT / "backend" / ".env"

NUTRIENT_KEYS = (
    "energy_kcal",
    "carbohydrate_g",
    "protein_g",
    "fat_g",
    "fiber_g",
    "sugar_g",
    "sodium_mg",
)

ENDPOINT_CANDIDATES = (
    "https://apis.data.go.kr/1390803/AgriFood/FdFoodCkry1/getKoreanFoodFdFoodCkryList1",
    "https://apis.data.go.kr/1390803/AgriFood/FdFoodCkry1/getKoreanFoodFdFoodCkryList",
    "https://apis.data.go.kr/1390802/AgriFood/FdFoodCkry/getKoreanFoodFdFoodCkryList",
    "http://apis.data.go.kr/1390802/AgriFood/FdFoodCkry/getKoreanFoodFdFoodCkryList",
)


def load_backend_env() -> None:
    if not BACKEND_ENV_FILE.exists():
        return
    for raw_line in BACKEND_ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key:
            os.environ.setdefault(key, value)


def env_flag(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in ("1", "true", "yes", "y", "on")


def _text(node: Optional[ET.Element], tag: str, default: str = "") -> str:
    if node is None:
        return default
    child = node.find(tag)
    if child is None or child.text is None:
        return default
    return child.text.strip()


def _normalize_name(value: str) -> str:
    value = unicodedata.normalize("NFKC", value or "").strip()
    value = re.sub(r"\s+", " ", value)
    value = re.sub(r"\s*,\s*", ", ", value)
    return value


def _to_float(value: str) -> Optional[float]:
    value = (value or "").strip()
    if not value or value.lower() == "null":
        return None
    try:
        return float(value)
    except ValueError:
        return None


def _parse_gateway_error(root: ET.Element) -> Optional[str]:
    auth = root.find(".//returnAuthMsg")
    reason = root.find(".//returnReasonCode")
    err = root.find(".//errMsg")
    values = [
        auth.text.strip() if auth is not None and auth.text else "",
        reason.text.strip() if reason is not None and reason.text else "",
        err.text.strip() if err is not None and err.text else "",
    ]
    message = " / ".join(value for value in values if value)
    return message or None


def parse_menuzen_xml(text: str) -> Dict[str, object]:
    root = ET.fromstring(text)
    gateway_error = _parse_gateway_error(root)
    if gateway_error:
        raise RuntimeError("공공데이터포털 API 오류: " + gateway_error)

    header = root.find(".//header")
    body = root.find(".//body")
    result_code = _text(header, "result_Code") or _text(header, "resultCode")
    result_msg = _text(header, "result_Msg") or _text(header, "resultMsg")
    if result_code and result_code not in ("200", "00"):
        raise RuntimeError("메뉴젠 API 오류 {0}: {1}".format(result_code, result_msg))
    if body is None:
        raise RuntimeError("메뉴젠 API 응답에 body가 없습니다.")

    total_text = _text(body, "total_Count") or _text(body, "totalCount") or "0"
    total_count = int(float(total_text))
    menus: List[Dict[str, str]] = []
    ingredients: List[Dict[str, str]] = []

    items = body.find("items")
    if items is None:
        items = body.find(".//items")
    item_nodes: Iterable[ET.Element] = [] if items is None else items.findall("item")

    for item in item_nodes:
        menu = {
            "fd_Code": _text(item, "fd_Code"),
            "upper_Fd_Grupp_Nm": _text(item, "upper_Fd_Grupp_Nm"),
            "fd_Grupp_Nm": _text(item, "fd_Grupp_Nm"),
            "fd_Nm": _text(item, "fd_Nm"),
            "fd_Wgh": _text(item, "fd_Wgh"),
            "food_Cnt": _text(item, "food_Cnt"),
        }
        if menu["fd_Code"]:
            menus.append(menu)

        food_list = item.find("food_List")
        if food_list is not None:
            for food in food_list.findall("food"):
                ingredients.append(
                    {
                        "fd_Code": _text(food, "fd_Code") or menu["fd_Code"],
                        "fd_Nm": menu["fd_Nm"],
                        "food_Code": _text(food, "food_Code"),
                        "food_Nm": _text(food, "food_Nm"),
                        "food_Eng_Nm": _text(food, "food_Eng_Nm"),
                        "nation_Std_Food_Grupp_Code_Nm": _text(
                            food, "nation_Std_Food_Grupp_Code_Nm"
                        ),
                        "origin_Code_Nm": _text(food, "origin_Code_Nm"),
                        "food_Wgh": _text(food, "food_Wgh"),
                        "allrgy_Info": _text(food, "allrgy_Info"),
                    }
                )

    return {
        "result_code": result_code,
        "result_msg": result_msg,
        "total_count": total_count,
        "menus": menus,
        "ingredients": ingredients,
    }


def _build_url(endpoint: str, service_key: str, page: int, page_size: int) -> str:
    decoded_key = urllib.parse.unquote(service_key.strip())
    query = urllib.parse.urlencode(
        {
            "serviceKey": decoded_key,
            "service_Type": "xml",
            "Page_No": page,
            "Page_Size": page_size,
        }
    )
    return endpoint + "?" + query


def _call_page(
    endpoint: str, service_key: str, page: int, page_size: int
) -> Dict[str, object]:
    url = _build_url(endpoint, service_key, page, page_size)
    last_error: Optional[Exception] = None
    for attempt in range(4):
        try:
            request = urllib.request.Request(
                url,
                headers={"User-Agent": "Nutri-Deck/1.0 (+public-data-contest)"},
            )
            with urllib.request.urlopen(request, timeout=45) as response:
                body = response.read().decode("utf-8", errors="replace")
            parsed = parse_menuzen_xml(body)
            parsed["request_url"] = url.split("serviceKey=")[0] + "serviceKey=***"
            return parsed
        except Exception as exc:
            last_error = exc
            time.sleep(1.0 + attempt * 1.5)
    raise RuntimeError("메뉴젠 API 호출에 실패했습니다: {0}".format(last_error))


def _discover_endpoint(
    service_key: str, page_size: int
) -> Tuple[str, Dict[str, object]]:
    errors: List[str] = []
    for endpoint in ENDPOINT_CANDIDATES:
        try:
            first = _call_page(endpoint, service_key, 1, page_size)
            if int(first.get("total_count", 0)) > 0:
                return endpoint, first
            errors.append(endpoint + " -> 데이터 0건")
        except Exception as exc:
            errors.append(endpoint + " -> " + str(exc))
    raise RuntimeError(
        "사용 가능한 메뉴젠 API endpoint를 찾지 못했습니다.\n" + "\n".join(errors)
    )


def fetch_menuzen(
    service_key: str, page_size: int = 20
) -> Tuple[str, List[Dict[str, str]], List[Dict[str, str]]]:
    endpoint, first = _discover_endpoint(service_key, page_size)
    total_count = int(first["total_count"])
    menus = list(first["menus"])
    ingredients = list(first["ingredients"])

    total_pages = max(1, (total_count + page_size - 1) // page_size)
    for page in range(2, total_pages + 1):
        result = _call_page(endpoint, service_key, page, page_size)
        menus.extend(result["menus"])
        ingredients.extend(result["ingredients"])
        time.sleep(0.08)

    menu_by_code: Dict[str, Dict[str, str]] = {}
    for menu in menus:
        code = menu.get("fd_Code", "")
        if code:
            menu_by_code[code] = menu
    return endpoint, list(menu_by_code.values()), ingredients


def _load_national_db() -> List[Dict[str, object]]:
    if not NATIONAL_DB_FILE.exists():
        raise FileNotFoundError("국가표준식품성분 DB 기준 파일이 없습니다: {0}".format(NATIONAL_DB_FILE))
    try:
        encoded = NATIONAL_DB_FILE.read_text(encoding="ascii").strip()
        packed = base64.b64decode(encoded, validate=True)
        text = gzip.decompress(packed).decode("utf-8")
    except Exception as exc:
        raise RuntimeError("국가표준식품성분 DB 기준 파일을 해제하지 못했습니다: {0}".format(exc))

    rows: List[Dict[str, object]] = []
    with io.StringIO(text) as handle:
        for raw in csv.DictReader(handle, delimiter="\t"):
            row: Dict[str, object] = dict(raw)
            for key in NUTRIENT_KEYS:
                value = str(row.get(key, "")).strip()
                row[key] = None if value == "" else float(value)
            rows.append(row)
    if not rows:
        raise ValueError("국가표준식품성분 DB 기준 데이터가 비어 있습니다.")
    return rows


def _build_unique_name_index(
    rows: List[Dict[str, object]]
) -> Tuple[Dict[str, Dict[str, object]], int]:
    buckets: Dict[str, List[Dict[str, object]]] = defaultdict(list)
    for row in rows:
        name = _normalize_name(str(row.get("food_name", "")))
        if name:
            buckets[name].append(row)
    unique = {name: items[0] for name, items in buckets.items() if len(items) == 1}
    duplicate_name_count = sum(1 for items in buckets.values() if len(items) > 1)
    return unique, duplicate_name_count


def build_game_foods(
    menus: List[Dict[str, str]], ingredients: List[Dict[str, str]]
) -> Tuple[List[Dict[str, object]], Dict[str, object]]:
    national_rows = _load_national_db()
    national_by_name, duplicate_name_count = _build_unique_name_index(national_rows)

    ingredients_by_menu: Dict[str, List[Dict[str, str]]] = defaultdict(list)
    for ingredient in ingredients:
        menu_code = (ingredient.get("fd_Code") or "").strip()
        if menu_code:
            ingredients_by_menu[menu_code].append(ingredient)

    game_foods: List[Dict[str, object]] = []
    mapped_rows = 0
    unmatched_rows = 0
    invalid_weight_menus = 0
    missing_nutrient_menus = 0
    no_ingredient_menus = 0

    for menu in menus:
        menu_code = (menu.get("fd_Code") or "").strip()
        menu_name = (menu.get("fd_Nm") or "").strip()
        if not menu_code or not menu_name:
            continue

        menu_ingredients = ingredients_by_menu.get(menu_code, [])
        if not menu_ingredients:
            no_ingredient_menus += 1
            continue

        sums = {key: 0.0 for key in NUTRIENT_KEYS}
        usable = True
        has_invalid_weight = False
        has_missing_nutrient = False

        for ingredient in menu_ingredients:
            normalized_name = _normalize_name(ingredient.get("food_Nm", ""))
            matched = national_by_name.get(normalized_name)
            if matched is None:
                unmatched_rows += 1
                usable = False
                continue
            mapped_rows += 1

            weight = _to_float(ingredient.get("food_Wgh", ""))
            if weight is None or weight < 0:
                usable = False
                has_invalid_weight = True
                continue

            for key in NUTRIENT_KEYS:
                value = matched.get(key)
                if value is None:
                    usable = False
                    has_missing_nutrient = True
                else:
                    sums[key] += float(value) * weight / 100.0

        if not usable:
            if has_invalid_weight:
                invalid_weight_menus += 1
            if has_missing_nutrient:
                missing_nutrient_menus += 1
            continue

        category = (
            (menu.get("fd_Grupp_Nm") or "").strip()
            or (menu.get("upper_Fd_Grupp_Nm") or "").strip()
            or "기타"
        )
        game_foods.append(
            {
                "food_code": menu_code,
                "food_name": menu_name,
                "category": category,
                "energy_kcal": round(sums["energy_kcal"]),
                "carbohydrate_g": round(sums["carbohydrate_g"], 1),
                "protein_g": round(sums["protein_g"], 1),
                "fat_g": round(sums["fat_g"], 1),
                "fiber_g": round(sums["fiber_g"], 1),
                "sugar_g": round(sums["sugar_g"], 1),
                "sodium_mg": round(sums["sodium_mg"]),
                "image": "",
            }
        )

    denominator = mapped_rows + unmatched_rows
    metadata: Dict[str, object] = {
        "menu_count": len(menus),
        "ingredient_row_count": len(ingredients),
        "national_reference_rows": len(national_rows),
        "national_duplicate_food_name_count": duplicate_name_count,
        "mapped_ingredient_rows": mapped_rows,
        "unmatched_ingredient_rows": unmatched_rows,
        "ingredient_mapping_coverage": round(mapped_rows / denominator, 6)
        if denominator
        else 0,
        "usable_game_menu_count": len(game_foods),
        "excluded_menu_count": len(menus) - len(game_foods),
        "menus_with_missing_required_nutrients": missing_nutrient_menus,
        "menus_with_invalid_weight": invalid_weight_menus,
        "menus_without_ingredients": no_ingredient_menus,
    }
    return game_foods, metadata


def _atomic_write_json(path: Path, data: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + ".tmp")
    temp.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    temp.replace(path)


def get_sync_status() -> Dict[str, object]:
    if not SYNC_META_FILE.exists():
        return {
            "status": "never_synced",
            "cache_exists": GAME_DATA_FILE.exists(),
        }
    try:
        metadata = json.loads(SYNC_META_FILE.read_text(encoding="utf-8"))
    except Exception as exc:
        return {
            "status": "metadata_error",
            "cache_exists": GAME_DATA_FILE.exists(),
            "error": str(exc),
        }
    metadata["status"] = "ok"
    metadata["cache_exists"] = GAME_DATA_FILE.exists()
    return metadata


def sync_menuzen_data(
    service_key: Optional[str] = None, page_size: Optional[int] = None
) -> Dict[str, object]:
    load_backend_env()
    key = service_key or os.getenv("DATA_GO_KR_SERVICE_KEY", "").strip()
    if not key:
        raise RuntimeError(
            "DATA_GO_KR_SERVICE_KEY가 없습니다. backend/.env에 공공데이터포털 서비스키를 설정하세요."
        )

    if page_size is None:
        page_size = int(os.getenv("MENUZEN_PAGE_SIZE", "20"))
    page_size = max(1, min(int(page_size), 100))

    endpoint, menus, ingredients = fetch_menuzen(key, page_size=page_size)
    game_foods, stats = build_game_foods(menus, ingredients)
    if not game_foods:
        raise RuntimeError(
            "API 수집은 완료됐지만 검증을 통과한 게임 메뉴가 0건입니다. 기존 캐시는 덮어쓰지 않았습니다."
        )

    _atomic_write_json(GAME_DATA_FILE, game_foods)
    _atomic_write_json(FRONTEND_FOOD_FILE, game_foods)

    metadata: Dict[str, object] = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "data_mode": "menuzen_openapi_with_versioned_national_reference",
        "menuzen_source": "공공데이터포털 15143502 / 농식품 식단관리(메뉴젠) 음식, 재료 및 조리 정보",
        "national_db_source": "국가표준식품성분 Database 10.4",
        "mapping_rule": "normalized exact food-name match against unique national reference names",
        "endpoint": endpoint,
        "page_size": page_size,
    }
    metadata.update(stats)
    _atomic_write_json(SYNC_META_FILE, metadata)
    return metadata
