c = open(r'D:\gym-webapp\gym-webapp\lib\coachTypes.ts', encoding='utf-8').read()

# Add group field to Invite type
old = '  status: InviteStatus;\n  createdAt: string;'
new = '  group?: string;       // csoport ahova meghívva\n  status: InviteStatus;\n  createdAt: string;'
assert old in c, "Pattern not found!"
c = c.replace(old, new, 1)

open(r'D:\gym-webapp\gym-webapp\lib\coachTypes.ts', 'w', encoding='utf-8').write(c)
print('FIXED')
