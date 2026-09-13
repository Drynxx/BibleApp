import os
import re
import json

app_dir = 'app'
locales_dir = 'src/locales'

# Regex to match t('key', 'fallback') or t("key", "fallback")
# We need to handle optional parameters or string formats.
# Better to use a non-greedy match for the fallback string.
t_pattern = re.compile(r"t\(\s*(['\"])(.*?)\1\s*,\s*(['\"])(.*?)\3\s*\)")

# For t('key', { ... }) we shouldn't match, but the regex above expects a string literal as the second arg.
# Wait, what if there's t('key', 'fallback', { ... })? The translation function is typically t('key', 'fallback').
# Actually, i18next usually takes t('key', 'fallback') OR t('key', { defaultValue: 'fallback' }).
# Let's see what the codebase uses. In login.tsx: t('login.otpLabel', { email }) -> no fallback here.
# In progress.tsx: t('progress.achievement_7day', '7-Day Streak')

extracted = {}

def set_nested(d, key_path, value):
    parts = key_path.split('.')
    for part in parts[:-1]:
        if part not in d:
            d[part] = {}
        d = d[part]
    d[parts[-1]] = value

# Find all tsx files
tsx_files = []
for root, _, files in os.walk(app_dir):
    for f in files:
        if f.endswith('.tsx'):
            tsx_files.append(os.path.join(root, f))

# Extract and refactor
for file_path in tsx_files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # We want to replace t('key', 'fallback') with t('key')
    # and record the key -> fallback in `extracted`
    
    def replacer(match):
        q1 = match.group(1)
        key = match.group(2)
        q2 = match.group(3)
        fallback = match.group(4)
        
        set_nested(extracted, key, fallback)
        
        return f"t({q1}{key}{q1})"
    
    new_content, count = t_pattern.subn(replacer, content)
    
    if count > 0:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {file_path} ({count} replacements)")

os.makedirs(locales_dir, exist_ok=True)

# Write en.json
en_path = os.path.join(locales_dir, 'en.json')
with open(en_path, 'w', encoding='utf-8') as f:
    json.dump(extracted, f, indent=2, ensure_ascii=False)

print(f"Created {en_path} with {len(extracted)} top-level keys.")
