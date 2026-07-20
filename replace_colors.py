import os
import re

MAPPINGS = {
    # Old COLORS properties
    "COLORS.background": "COLORS.prussianBlue",
    "COLORS.surfaceMuted": "COLORS.regalNavy",
    "COLORS.surface": "COLORS.regalNavy",
    "COLORS.primaryLight": "COLORS.schoolBusYellow",
    "COLORS.primaryDark": "COLORS.prussianBlue",
    "COLORS.primary": "COLORS.gold",
    "COLORS.textPrimary": "COLORS.gold",
    "COLORS.textSecondary": "COLORS.schoolBusYellow",
    "COLORS.textPlaceholder": "COLORS.schoolBusYellow",
    "COLORS.textAccent": "COLORS.gold",
    "COLORS.borderActive": "COLORS.gold",
    "COLORS.borderLight": "COLORS.prussianBlue",
    "COLORS.border": "COLORS.schoolBusYellow",
    "COLORS.successLight": "COLORS.regalNavy",
    "COLORS.success": "COLORS.gold",
    "COLORS.dangerLight": "COLORS.regalNavy",
    "COLORS.danger": "COLORS.gold",
    "COLORS.warningLight": "COLORS.regalNavy",
    "COLORS.warning": "COLORS.gold",
    "COLORS.shadow": "COLORS.prussianBlue",
    "COLORS.overlay": "COLORS.prussianBlue",

    # Hardcoded strings commonly used (case insensitive for hex)
    "'#FFFFFF'": "COLORS.prussianBlue",
    "'#FFF'": "COLORS.prussianBlue",
    "'white'": "COLORS.gold",
    "'#F8FAFC'": "COLORS.prussianBlue",
    "'#EEF2FF'": "COLORS.regalNavy",
    "'#F5F3FF'": "COLORS.regalNavy",
    "'#ECFDF5'": "COLORS.regalNavy",
    "'#FFFBEB'": "COLORS.regalNavy",
    "'#000'": "COLORS.prussianBlue",
    "'#000000'": "COLORS.prussianBlue",
    "'black'": "COLORS.prussianBlue",
    "'transparent'": "COLORS.prussianBlue",
    "'#8B5CF6'": "COLORS.gold",
    "'#A7F3D0'": "COLORS.schoolBusYellow",
    "'#FECACA'": "COLORS.schoolBusYellow",
}

REGEX_MAPPINGS = [
    (re.compile(r"'rgba\([^)]+\)'"), "COLORS.prussianBlue")
]

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    original_content = content
    for old, new in MAPPINGS.items():
        content = content.replace(old, new)

    for regex, new in REGEX_MAPPINGS:
        content = regex.sub(new, content)

    if content != original_content:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated {filepath}")

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith(('.js', '.jsx')):
            process_file(os.path.join(root, file))

