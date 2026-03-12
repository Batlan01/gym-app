const fs = require('fs');
let s = fs.readFileSync('D:/gym-webapp/gym-webapp/app/workout/page.tsx', 'utf8');

// SetEditSheet hívás frissítése: exercise prop + onBilateralChange
s = s.replace(
  `      <SetEditSheet open={editOpen} onClose={closeEdit}
        title={currentEdit?.ex?.name ?? "—"} set={currentEdit?.set ?? null}
        onSave={patchEditSet} onDelete={deleteEditSet} onCopyPrev={copyPrevSet} />`,
  `      <SetEditSheet open={editOpen} onClose={closeEdit}
        title={currentEdit?.ex?.name ?? "—"} set={currentEdit?.set ?? null}
        exercise={currentEdit?.ex}
        onSave={patchEditSet} onDelete={deleteEditSet} onCopyPrev={copyPrevSet}
        onBilateralChange={bilateral => {
          if (!active || !currentEdit?.ex) return;
          setActive(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              exercises: prev.exercises.map(ex =>
                ex.id === currentEdit.ex!.id ? { ...ex, bilateral } : ex
              ),
            };
          });
        }} />`
);

fs.writeFileSync('D:/gym-webapp/gym-webapp/app/workout/page.tsx', s, 'utf8');
console.log('workout page SetEditSheet updated');
