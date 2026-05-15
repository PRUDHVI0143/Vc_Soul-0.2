import os, sys

# Paths
base_dir = os.path.dirname(os.path.abspath(__file__))
script_path = os.path.join(base_dir, "ultimate_voice_search.py")
icon_path   = os.path.join(base_dir, "soul_wings.ico")
shortcut_path = os.path.join(os.path.expanduser("~"), "Desktop", "S.O.U.L.lnk")

# pythonw = no console window popup
python_exe = os.path.join(os.path.dirname(sys.executable), "pythonw.exe")
if not os.path.exists(python_exe):
    python_exe = sys.executable

try:
    import win32com.client
    shell = win32com.client.Dispatch("WScript.Shell")
    sc = shell.CreateShortcut(shortcut_path)
    sc.TargetPath      = python_exe
    sc.Arguments       = f'"{script_path}"'
    sc.WorkingDirectory= os.path.dirname(script_path)
    sc.Description     = "S.O.U.L — System of Universal Listening"
    if os.path.exists(icon_path):
        sc.IconLocation = icon_path
    sc.save()
    print(f"Shortcut created: {shortcut_path}")
except ImportError:
    # Fallback: PowerShell WScript approach
    ps = f"""
$ws = New-Object -ComObject WScript.Shell
$sc = $ws.CreateShortcut('{shortcut_path}')
$sc.TargetPath = '{python_exe}'
$sc.Arguments  = '"{script_path}"'
$sc.WorkingDirectory = '{os.path.dirname(script_path)}'
$sc.Description = 'SOUL Voice Assistant'
$sc.IconLocation = '{icon_path}'
$sc.Save()
"""
    import subprocess
    result = subprocess.run(["powershell", "-Command", ps], capture_output=True, text=True)
    if result.returncode == 0:
        print(f"Shortcut created via PowerShell: {shortcut_path}")
    else:
        print("Error:", result.stderr)
        sys.exit(1)
