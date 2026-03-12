c = open(r'D:\gym-webapp\gym-webapp\app\coach\page.tsx', encoding='utf-8').read()
old = 'import Link from "next/link";'
new = 'import Link from "next/link";\nimport { InviteModal } from "@/components/coach/InviteModal";'
c = c.replace(old, new, 1)
open(r'D:\gym-webapp\gym-webapp\app\coach\page.tsx', 'w', encoding='utf-8').write(c)
print('OK')
