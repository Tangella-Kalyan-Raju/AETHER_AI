import ast
import os
import sys

def get_imports(path):
    imports = set()
    for root, dirs, files in os.walk(path):
        for file in files:
            if file.endswith(".py"):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        tree = ast.parse(f.read())
                    for node in ast.walk(tree):
                        if isinstance(node, ast.Import):
                            for alias in node.names:
                                imports.add(alias.name.split('.')[0])
                        elif isinstance(node, ast.ImportFrom):
                            if node.module:
                                imports.add(node.module.split('.')[0])
                except SyntaxError:
                    pass
    return imports

stdlib = set(sys.builtin_module_names)
stdlib.update(['os', 'sys', 'ast', 'datetime', 'json', 'typing', 're', 'asyncio', 'logging', 'math', 'random', 'subprocess', 'time', 'uuid', 'functools', 'itertools', 'collections', 'hashlib', 'pathlib', 'traceback', 'io', 'enum'])
found = get_imports('app')
external = set()
for imp in found:
    if imp not in stdlib and imp != 'app':
        external.add(imp)

print("External modules found:", sorted(list(external)))
