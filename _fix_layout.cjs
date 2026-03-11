const fs = require('fs');
let s = fs.readFileSync('D:/gym-webapp/gym-webapp/app/layout.tsx', 'utf8');
s = s.replace(
  `            if (t && themes[t]) {
              var r = document.documentElement;
              Object.entries(themes[t]).forEach(function(e){ r.style.setProperty(e[0], e[1]); });
            }
          } catch(e) {}`,
  `            if (t && themes[t]) {
              var r = document.documentElement;
              Object.entries(themes[t]).forEach(function(e){ r.style.setProperty(e[0], e[1]); });
            }
            var m = localStorage.getItem('gym.colorMode');
            if (m === 'light') { document.documentElement.setAttribute('data-mode', 'light'); }
          } catch(e) {}`
);
fs.writeFileSync('D:/gym-webapp/gym-webapp/app/layout.tsx', s, 'utf8');
console.log('done:', s.includes('gym.colorMode') ? 'YES' : 'NO');
