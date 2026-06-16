"""
Minecraft texture pack extraction utility.
Extracts block textures from a ZIP archive, filters out non-solid blocks
(containing any fully transparent pixels), and formats them into
horizontal 6-face strips required by the Three.js voxel engine.
Generates TypeScript definition and configuration files dynamically.
"""

import json
import os
import shutil
import sys
import zipfile
from typing import Dict, List, Optional, Tuple
from PIL import Image


class BlockTextureBuilder:
    """Handles resolving, filtering, and assembling textures for blocks."""

    def __init__(
        self,
        block_name: str,
        faces_dict: Dict[str, str],
        zip_ref: zipfile.ZipFile
    ) -> None:
        """Initializes the builder with block metadata and zip reference."""
        self.block_name = block_name
        self.faces_dict = faces_dict
        self.zip_ref = zip_ref

    def build(self) -> Optional[Image.Image]:
        """Resolves all faces, checks transparency, and assembles the strip."""
        faces = self._resolve_faces()

        # If any face contains fully transparent pixels (alpha == 0), skip it
        # (Exception: keep glass blocks)
        if "glass" not in self.block_name and any(self._has_transparency(img) for img in faces.values()):
            return None

        return self._assemble_strip(faces)

    def _find_entry(self, candidates: List[str]) -> Optional[str]:
        """Searches the ZIP archive for a candidate entry path."""
        for entry in self.zip_ref.namelist():
            for c in candidates:
                if entry.lower().endswith(c.lower()):
                    return entry
        return None

    def _load_image(self, entry: str) -> Image.Image:
        """Loads, crops, and processes an image from the ZIP."""
        actual_entry = self._find_entry([entry])
        if not actual_entry:
            raise FileNotFoundError(f"Entry {entry} not found in archive.")

        with self.zip_ref.open(actual_entry) as f:
            raw_img = Image.open(f)
            raw_img.load()

        img: Image.Image = raw_img.convert("RGBA")
        w, h = img.size

        # Crop first frame of animated textures
        if h > w and h % w == 0:
            img = img.crop((0, 0, w, w))

        return img

    def _load_face(self, key: str, fallback_entry: str) -> Image.Image:
        """Loads a block face with fallback support."""
        entry = self.faces_dict.get(key, fallback_entry)
        return self._load_image(entry)

    def _resolve_faces(self) -> Dict[str, Image.Image]:
        """Resolves individual images for all 6 faces of the block."""
        base_entry = self.faces_dict.get("all")
        if not base_entry and self.faces_dict:
            base_entry = list(self.faces_dict.values())[0]

        if not base_entry:
            raise ValueError(f"No textures found for block {self.block_name}")

        top_entry = self.faces_dict.get("top", base_entry)
        top_img = self._load_face("top", base_entry)
        bottom_img = self._load_face("bottom", top_entry)
        side_entry = self.faces_dict.get("side", base_entry)

        return {
            "top": top_img,
            "bottom": bottom_img,
            "left": self._load_face("left", side_entry),
            "right": self._load_face("right", side_entry),
            "back": self._load_face("back", side_entry),
            "front": self._load_face("front", side_entry)
        }

    def _has_transparency(self, img: Image.Image) -> bool:
        """Checks if an image has fully transparent pixels (alpha == 0)."""
        rgba = img.convert("RGBA")
        alpha = rgba.split()[-1]
        extrema = alpha.getextrema()
        return bool(extrema[0] == 0)

    def _assemble_strip(self, faces: Dict[str, Image.Image]) -> Image.Image:
        """Assembles 6 faces side by side into a horizontal strip."""
        w_size = max(img.size[0] for img in faces.values())
        strip = Image.new("RGBA", (6 * w_size, w_size))

        # Three.js layout: Top (+Y), Back (-Z), Right (+X),
        # Front (+Z), Left (-X), Bottom (-Y)
        layout = [
            faces["top"],
            faces["back"],
            faces["right"],
            faces["front"],
            faces["left"],
            faces["bottom"]
        ]

        for i, face_img in enumerate(layout):
            if face_img.size != (w_size, w_size):
                face_img = face_img.resize(
                    (w_size, w_size), Image.Resampling.NEAREST
                )
            strip.paste(face_img, (i * w_size, 0))

        return strip


class TexturePackExtractor:
    """Manages the full ZIP scanning and block extraction pipeline."""

    def __init__(
        self, zip_path: str, output_dir: str, colors_json_path: str
    ) -> None:
        """Initializes the extractor with inputs and output paths."""
        self.zip_path = zip_path
        self.output_dir = output_dir
        self.colors_json_path = colors_json_path

    def extract(self) -> None:
        """Executes the extraction process from ZIP to output directory."""
        if not os.path.exists(self.zip_path):
            print(f"Error: ZIP file not found at {self.zip_path}")
            sys.exit(1)

        if os.path.exists(self.output_dir):
            print(f"Clearing existing textures directory: {self.output_dir}")
            shutil.rmtree(self.output_dir)
        os.makedirs(self.output_dir, exist_ok=True)

        print(f"Opening texture pack: {self.zip_path}")
        block_colors: Dict[str, str] = {}
        with zipfile.ZipFile(self.zip_path, "r") as zip_ref:
            entries = self._scan_zip(zip_ref)
            print(f"Found {len(entries)} block PNG textures in zip.")

            groups = self._group_textures(entries)
            print(f"Grouped textures into {len(groups)} unique blocks.")

            processed_count = 0
            skipped_count = 0

            for block_name, faces_dict in groups.items():
                try:
                    builder = BlockTextureBuilder(
                        block_name,
                        faces_dict,
                        zip_ref
                    )
                    strip = builder.build()

                    if strip is None:
                        skipped_count += 1
                        continue

                    # Save regular block
                    filename = f"{block_name}.png"
                    strip.save(os.path.join(self.output_dir, filename))

                    # Calculate average color
                    avg_color = calculate_average_color(strip)
                    block_colors[block_name] = format_hex_color(avg_color)

                    processed_count += 1

                except Exception as e:
                    print(f"Skipping block '{block_name}': {e}")

            print(
                f"Successfully processed {processed_count} solid blocks."
            )
            print(
                f"Skipped {skipped_count} non-solid blocks containing "
                f"transparency."
            )

        # Write generated block colors map to json
        print(f"Writing block colors to: {self.colors_json_path}")
        with open(self.colors_json_path, "w", encoding="utf-8") as f_json:
            json.dump(block_colors, f_json, indent=2)

        # Generate the TypeScript configuration files
        types_path = "frontend/src/types/block.ts"
        config_path = "frontend/src/config/block.ts"
        generate_typescript_files(block_colors, types_path, config_path)

    def _scan_zip(self, zip_ref: zipfile.ZipFile) -> List[str]:
        """Scans the ZIP namelist and filters valid block textures."""
        valid_entries = []
        for entry in zip_ref.namelist():
            if entry.endswith("/"):
                continue
            is_block = (
                "textures/block/" in entry or "textures/blocks/" in entry
            )
            if is_block and entry.lower().endswith(".png"):
                if not entry.lower().endswith(".png.mcmeta"):
                    valid_entries.append(entry)
        return valid_entries

    def _group_textures(self, entries: List[str]) -> Dict[str, Dict[str, str]]:
        """Groups entries by parent block name based on naming convention."""
        groups: Dict[str, Dict[str, str]] = {}
        for entry in entries:
            filename = os.path.basename(entry)
            parent, face = parse_block_name(filename)
            if parent not in groups:
                groups[parent] = {}
            groups[parent][face] = entry
        return groups


def parse_block_name(filename: str) -> Tuple[str, str]:
    """Parses filename to extract parent name and face suffix."""
    base = filename[:-4].lower()
    suffixes = {
        "_top": "top",
        "_bottom": "bottom",
        "_side": "side",
        "_front": "front",
        "_back": "back",
        "_left": "left",
        "_right": "right",
        "_end": "top"
    }

    modifiers = ["_on", "_off", "_lit", "_active"]
    for mod in modifiers:
        if base.endswith(mod):
            base = base[:-len(mod)]

    for suff, face in suffixes.items():
        if base.endswith(suff):
            return base[:-len(suff)], face

    return base, "all"


def calculate_average_color(img: Image.Image) -> Tuple[int, int, int]:
    """Calculates average RGB color of non-transparent pixels (alpha > 0)."""
    rgba = img.convert("RGBA")
    data = rgba.tobytes()
    r_sum, g_sum, b_sum, count = 0, 0, 0, 0
    for i in range(0, len(data), 4):
        r, g, b, a = data[i], data[i + 1], data[i + 2], data[i + 3]
        if a > 0:
            r_sum += r
            g_sum += g
            b_sum += b
            count += 1
    if count == 0:
        return (255, 255, 255)
    return (r_sum // count, g_sum // count, b_sum // count)


def format_hex_color(rgb: Tuple[int, int, int]) -> str:
    """Formats an RGB color tuple as a CSS hex string."""
    return f"#{rgb[0]:02x}{rgb[1]:02x}{rgb[2]:02x}"


def to_pascal_case(name: str) -> str:
    """Converts a snake_case name to PascalCase."""
    clean = name.replace("-", "_")
    return "".join(word.capitalize() for word in clean.split("_"))


def to_metadata_name(raw_name: str) -> str:
    """Capitalizes snake_case words for display metadata naming."""
    parts = raw_name.split("_")
    return "_".join(word.capitalize() for word in parts)


def get_color_category(rgb_hex: str, name: str) -> str:
    """Categorizes an RGB color and block name into a standard group."""
    hex_str = rgb_hex.lstrip("#")
    r = int(hex_str[0:2], 16)
    g = int(hex_str[2:4], 16)
    b = int(hex_str[4:6], 16)

    rf, gf, bf = r / 255.0, g / 255.0, b / 255.0
    cmax = max(rf, gf, bf)
    cmin = min(rf, gf, bf)
    diff = cmax - cmin

    if diff == 0:
        h = 0.0
    elif cmax == rf:
        h = (60.0 * ((gf - bf) / diff) + 360.0) % 360.0
    elif cmax == gf:
        h = (60.0 * ((bf - rf) / diff) + 120.0) % 360.0
    else:
        h = (60.0 * ((rf - gf) / diff) + 240.0) % 360.0

    s = 0.0 if cmax == 0 else diff / cmax
    v = cmax

    if s < 0.18 or v < 0.25:
        return "gray"

    if 345.0 <= h or h < 22.0:
        if v < 0.65:
            return "brown"
        return "red"
    elif 22.0 <= h < 45.0:
        if v < 0.65 or "wood" in name or "log" in name or "plank" in name:
            return "brown"
        return "orange"
    elif 45.0 <= h < 75.0:
        if "wood" in name or "log" in name or "plank" in name:
            return "brown"
        return "yellow"
    elif 75.0 <= h < 165.0:
        return "green"
    elif 165.0 <= h < 255.0:
        return "blue"
    else:
        return "purple"


def generate_typescript_files(
    block_colors: Dict[str, str], types_path: str, config_path: str
) -> None:
    """Generates the Block enum and block metadata config files."""
    default_blocks = [
        ("Air", 0),
        ("Stone", 1),
        ("Dirt", 2),
        ("Grass", 3),
        ("Wood", 4),
        ("Leaves", 5),
        ("Water", 6),
        ("Sand", 7),
        ("Glass", 8),
        ("Bedrock", 9),
        ("Pumpkin", 10),
        ("Furnace", 11),
        ("Plank", 12),
    ]

    default_candidates = {
        "Stone": ["stone"],
        "Dirt": ["dirt"],
        "Grass": ["grass_block", "grass"],
        "Wood": ["oak_log", "log_oak", "wood"],
        "Leaves": ["oak_leaves", "leaves_oak_opaque", "leaves_oak", "leaves"],
        "Water": ["water_still", "water"],
        "Sand": ["sand"],
        "Glass": ["glass"],
        "Bedrock": ["bedrock"],
        "Pumpkin": ["pumpkin"],
        "Furnace": ["furnace"],
        "Plank": ["oak_planks", "planks_oak", "planks"],
    }

    default_mapping = {}
    for block_enum, candidates in default_candidates.items():
        for cand in candidates:
            if cand in block_colors:
                default_mapping[cand] = block_enum
                break

    # Determine resolved names for metadata mapping, falling back to default if not found
    matched_names = {
        "Stone": "stone",
        "Dirt": "dirt",
        "Grass": "grass_block",
        "Wood": "oak_log",
        "Leaves": "oak_leaves",
        "Water": "water_still",
        "Sand": "sand",
        "Glass": "glass",
        "Bedrock": "bedrock",
        "Pumpkin": "pumpkin",
        "Furnace": "furnace",
        "Plank": "oak_planks",
    }
    for key, enum_val in default_mapping.items():
        matched_names[enum_val] = key

    default_names = {b[0] for b in default_blocks}
    seen_names = set(default_names)

    extra_blocks = []
    for b_name in sorted(block_colors.keys()):
        if b_name in default_mapping:
            continue
        pascal = to_pascal_case(b_name)
        if pascal in seen_names:
            continue
        seen_names.add(pascal)
        extra_blocks.append(b_name)

    enum_lines = []
    for name, bid in default_blocks:
        enum_lines.append(f"  {name} = {bid},")

    next_id = 13
    for b_name in extra_blocks:
        pascal_name = to_pascal_case(b_name)
        enum_lines.append(f"  {pascal_name} = {next_id},")
        next_id += 1

    enum_content = "\n".join(enum_lines)
    types_content = (
        "export enum Block {\n"
        f"{enum_content}\n"
        "}\n\n"
        "export interface BlockMeta {\n"
        "  id: Block;\n"
        "  name: string;\n"
        "  color: string;\n"
        "  category: string;\n"
        "}\n"
    )

    print(f"Writing TS types to: {types_path}")
    with open(types_path, "w", encoding="utf-8") as f:
        f.write(types_content)

    meta_lines = []
    default_metadata = [
        ("Stone", matched_names["Stone"], f'colors.{matched_names["Stone"]} || "#808080"', "gray"),
        ("Dirt", matched_names["Dirt"], f'colors.{matched_names["Dirt"]} || "#8b4513"', "brown"),
        ("Grass", matched_names["Grass"], '"#7ca75e"', "green"),
        ("Wood", matched_names["Wood"], f'colors.{matched_names["Wood"]} || "#a0522d"', "brown"),
        ("Leaves", matched_names["Leaves"], '"#567d30"', "green"),
        ("Water", matched_names["Water"], '"#2a5eff"', "blue"),
        ("Sand", matched_names["Sand"], f'colors.{matched_names["Sand"]} || "#f4a460"', "yellow"),
        ("Glass", matched_names["Glass"], '"#add8e6"', "blue"),
        ("Bedrock", matched_names["Bedrock"], f'colors.{matched_names["Bedrock"]} || "#404040"', "gray"),
        ("Furnace", matched_names["Furnace"], f'colors.{matched_names["Furnace"]} || "#404040"', "gray"),
        ("Pumpkin", matched_names["Pumpkin"], f'colors.{matched_names["Pumpkin"]} || "#404040"', "orange"),
        ("Plank", matched_names["Plank"], f'colors.{matched_names["Plank"]} || "#404040"', "brown"),
    ]

    for enum_key, raw_name, color_expr, category in default_metadata:
        m_name = to_metadata_name(raw_name)
        meta_lines.append(
            f'  [Block.{enum_key}]: {{ '
            f'id: Block.{enum_key}, '
            f'name: "{m_name}", '
            f'color: {color_expr}, '
            f'category: "{category}" '
            f'}},'
        )

    for b_name in extra_blocks:
        pascal_name = to_pascal_case(b_name)
        display_name = to_metadata_name(b_name)
        color = block_colors[b_name]
        category = get_color_category(color, b_name)

        meta_lines.append(
            f'  [Block.{pascal_name}]: {{ '
            f'id: Block.{pascal_name}, '
            f'name: "{display_name}", '
            f'color: colors.{b_name} || "{color}", '
            f'category: "{category}" '
            f'}},'
        )

    meta_content = "\n".join(meta_lines)
    config_content = (
        'import { BlockMeta, Block } from "@/types/Block";\n'
        'import blockColors from "./block_colors.json";\n\n'
        'const colors = blockColors as Record<string, string>;\n\n'
        'export const BlockMetadata: Record<'
        'Exclude<Block, Block.Air>, BlockMeta> = {\n'
        f'{meta_content}\n'
        '};\n\n'
        'export const BlocksList = Object.values(BlockMetadata);\n'
    )

    print(f"Writing TS config to: {config_path}")
    with open(config_path, "w", encoding="utf-8") as f:
        f.write(config_content)


if __name__ == "__main__":
    zip_arg = sys.argv[1] if len(sys.argv) > 1 else "texture_pack.zip"
    out_arg = (
        sys.argv[2]
        if len(sys.argv) > 2
        else "frontend/public/three/assets/blocks/textures"
    )
    json_arg = (
        sys.argv[3]
        if len(sys.argv) > 3
        else "frontend/src/config/block_colors.json"
    )

    extractor = TexturePackExtractor(zip_arg, out_arg, json_arg)
    extractor.extract()
