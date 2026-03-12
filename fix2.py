c = open(r'D:\gym-webapp\gym-webapp\app\coach\page.tsx', encoding='utf-8').read()

old = '''  return (
    <div className="flex h-dvh overflow-hidden" style={{ backgroundColor: "var(--bg-base)", color: "var(--text-primary)" }}>'''

new = '''  return (
    <>
    <div className="flex h-dvh overflow-hidden" style={{ backgroundColor: "var(--bg-base)", color: "var(--text-primary)" }}>'''

assert old in c, "old not found"
c = c.replace(old, new, 1)

old2 = '''    </div>
    <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
  );
}'''

new2 = '''    </div>
    <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </>
  );
}'''

assert old2 in c, "old2 not found"
c = c.replace(old2, new2, 1)

open(r'D:\gym-webapp\gym-webapp\app\coach\page.tsx', 'w', encoding='utf-8').write(c)
print('FIXED')
