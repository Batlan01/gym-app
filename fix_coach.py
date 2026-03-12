c = open(r'D:\gym-webapp\gym-webapp\app\coach\page.tsx', encoding='utf-8').read()

# Remove the wrongly placed InviteModal from StatCard
bad = '    </div>\n    <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />\n  );\n}\n\nfunction StatusDot'
good = '    </div>\n  );\n}\n\nfunction StatusDot'
assert bad in c, "BAD pattern not found!"
c = c.replace(bad, good, 1)

# Now find the real CoachDashboard return closing and add the modal there
# Look for the pattern: the very last closing of the main layout div
bad2 = '      </div>\n    </div>\n  );\n}'
good2 = '      </div>\n    </div>\n    <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />\n  );\n}'
# replace only the last occurrence
idx = c.rfind(bad2)
assert idx != -1, "BAD2 pattern not found!"
c = c[:idx] + good2 + c[idx+len(bad2):]

open(r'D:\gym-webapp\gym-webapp\app\coach\page.tsx', 'w', encoding='utf-8').write(c)
print('FIXED')
