import os

base = r'backend/app'
for root, _, files in os.walk(base):
    for name in files:
        if not name.endswith('.py'):
            continue
        p = os.path.join(root, name)
        with open(p, 'rb') as f:
            b = f.read()
        # Drop UTF-8 BOM if present
        if b.startswith(b'\xef\xbb\xbf'):
            b = b[3:]
        s = b.decode('utf-8', errors='replace')
        lines = s.splitlines(True)  # keep line endings
        fixed = []
        for line in lines:
            if line and (line[0] == ' ' or line[0] == '\t'):
                line = line[1:]  # remove exactly one leading space/tab
            fixed.append(line)
        with open(p, 'w', encoding='utf-8', newline='') as f:
            f.write(''.join(fixed))
print('Fixed indentation in backend/app')