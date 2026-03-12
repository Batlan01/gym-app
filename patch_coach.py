import re

with open(r'D:\gym-webapp\gym-webapp\app\coach\page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix TeamPage signature
content = content.replace(
    'function TeamPage() {',
    'function TeamPage({ onInvite }: { onInvite: () => void }) {'
)

# 2. Fix buttons
old_btns = ('        <div className="flex gap-2">\n'
            '          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold pressable"\n'
            '            style={{ background: "var(--surface-2)", border: "1px solid var(--border-mid)", color: "var(--text-primary)" }}>Email meghívó</button>\n'
            '          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold pressable"\n'
            '            style={{ background: "var(--accent-primary)", color: "#080B0F" }}>+ Tag hozzáadása</button>\n'
            '        </div>')
new_btns = ('        <div className="flex gap-2">\n'
            '          <button onClick={onInvite} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold pressable"\n'
            '            style={{ background: "var(--accent-primary)", color: "#080B0F" }}>+ Tag meghívása</button>\n'
            '        </div>')
content = content.replace(old_btns, new_btns)

# 3. Add inviteOpen state and wire TeamPage
content = content.replace(
    'const [sidebarOpen, setSidebarOpen] = React.useState(false);\n\n  const renderPage',
    'const [sidebarOpen, setSidebarOpen] = React.useState(false);\n  const [inviteOpen, setInviteOpen] = React.useState(false);\n\n  const renderPage'
)
content = content.replace(
    "case \"team\":      return <TeamPage />;",
    "case \"team\":      return <TeamPage onInvite={() => setInviteOpen(true)} />;"
)

# 4. Add InviteModal before closing
content = content.replace(
    '    </div>\n  );\n}',
    '    </div>\n    <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />\n  );\n}',
    1
)

with open(r'D:\gym-webapp\gym-webapp\app\coach\page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('DONE')
