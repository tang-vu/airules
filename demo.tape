# VHS Tape for airules demo
# Run: vhs demo.tape

# Output settings
Output demo.gif
Set Width 1200
Set Height 700
Set Padding 20
Set FontSize 18
Set FontFamily "JetBrainsMono"
Set TypingSpeed 50ms

# Theme
Set Theme "Catppuccin Mocha"

# Intro - show banner
Type "npx @tangvu/airules"
Enter
Sleep 2s

# Clear and show detect
Type "clear"
Enter
Sleep 500ms
Type "npx @tangvu/airules detect"
Enter
Sleep 3s

# Show init on a fresh project
Type "clear"
Enter
Sleep 500ms
Type "cd my-nextjs-project"
Enter
Sleep 500ms
Type "npx @tangvu/airules init"
Enter
Sleep 4s

# Show score
Type "clear"
Enter
Sleep 500ms
Type "npx @tangvu/airules score"
Enter
Sleep 4s

# Show generated file
Type "clear"
Enter
Sleep 500ms
Type "cat CLAUDE.md"
Enter
Sleep 3s

# End
Sleep 2s
