from pathlib import Path

def dump_code(source_dir: str, output_file: str, extensions: set[str]) -> None:
    source = Path(source_dir)

    with open(output_file, "w", encoding="utf-8") as output:
        for file in sorted(source.rglob("*")):
            if file.is_file() and file.suffix in extensions:
                output.write(f"\n\n===== {file} =====\n\n")
                output.write(file.read_text(encoding="utf-8"))

dump_code(
    "frontend/src",
    "frontend.txt",
    {".ts", ".tsx", ".css"},
)

dump_code(
    "backend/src",
    "backend.txt",
    {".ts", ".tsx"},
)

print("Created frontend.txt and backend.txt")