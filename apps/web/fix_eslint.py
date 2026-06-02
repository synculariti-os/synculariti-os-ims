import json

def main():
    with open('eslint_report.json') as f:
        data = json.load(f)
    
    for file_data in data:
        if not file_data['messages']: continue
        file_path = file_data['filePath']
        
        with open(file_path, 'r') as f:
            lines = f.readlines()
            
        modified = False
        
        for msg in sorted(file_data['messages'], key=lambda x: x['line'], reverse=True):
            if msg['ruleId'] == '@typescript-eslint/no-explicit-any':
                line_idx = msg['line'] - 1
                col_idx = msg['column'] - 1
                # Replace 'any' with 'unknown' or just ignore it
                # For safety, let's just use sed or string replace for 'any' -> 'unknown'
                # but we have to be careful not to replace something else.
                line = lines[line_idx]
                # Look for `: any` or `<any>`
                if ': any' in line:
                    lines[line_idx] = line.replace(': any', ': unknown')
                    modified = True
                elif '<any>' in line:
                    lines[line_idx] = line.replace('<any>', '<unknown>')
                    modified = True
                elif '(err: any)' in line:
                    lines[line_idx] = line.replace('(err: any)', '(err: unknown)')
                    modified = True
                elif '(error: any)' in line:
                    lines[line_idx] = line.replace('(error: any)', '(error: unknown)')
                    modified = True
            elif msg['ruleId'] == '@typescript-eslint/no-unused-vars':
                # Try to remove unused variables from imports
                line_idx = msg['line'] - 1
                var_name = msg['message'].split("'")[1]
                line = lines[line_idx]
                if 'import' in line and var_name in line:
                    # Very simple regex replace
                    import re
                    lines[line_idx] = re.sub(rf'\b{var_name}\b,?\s*', '', line)
                    # if the import becomes empty curly braces `{ }`, we can leave it or remove it
                    lines[line_idx] = lines[line_idx].replace('{ }', '{}').replace('{}', '')
                    modified = True
        
        if modified:
            with open(file_path, 'w') as f:
                f.writelines(lines)

if __name__ == '__main__':
    main()
