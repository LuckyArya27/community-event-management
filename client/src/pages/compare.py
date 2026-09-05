import argparse
import difflib
import sys

def compare_files(file1_path, file2_path):
    with open(file1_path, 'r', encoding='utf-8', errors='replace') as f1, open(file2_path, 'r', encoding='utf-8', errors='replace') as f2:
        # Read all lines from both files
        lines1 = f1.readlines()
        lines2 = f2.readlines()
        
        # Get differences using unified_diff
        # Each line in 'diff' starts with ' ', '-', '+', or '@'.
        diff = difflib.unified_diff(lines1, lines2, fromfile=file1_path, tofile=file2_path, lineterm='')
        
        different_lines = []
        for line in diff:
            # Filter out context lines and diff metadata, retaining changed lines.
            if line.startswith(('- ', '+ ')):
                different_lines.append(line[2:])
            elif line.startswith(('-', '+')) and not line.startswith(('---', '+++')):
                different_lines.append(line[1:])
        
        return different_lines

if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    parser = argparse.ArgumentParser(description='Compare two text files.')
    parser.add_argument('file1', nargs='?', default='EventDetails.jsx')
    parser.add_argument('file2', nargs='?', default='EventDetails-claude.jsx')
    args = parser.parse_args()

    for line in compare_files(args.file1, args.file2):
        print(line, end='')