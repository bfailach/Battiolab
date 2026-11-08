import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, Stack } from '@mui/material';
import { LoadGate, PageHeader, Surface } from '../shared/Page';
import ListEditor from '../shared/ListEditor';
import settingsService, { EmployeeSettings as Settings } from '../../services/settings.service';
import { useLoad } from '../../hooks/useLoad';
import { useUI } from '../../contexts/UIContext';
import { useAuth } from '../../contexts/AuthContext';

const EmployeeSettings: React.FC = () => {
  const { notify } = useUI();
  const { isAdmin } = useAuth();
  const state = useLoad(() => settingsService.get('employees'));
  const [draft, setDraft] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (state.data) setDraft(state.data);
  }, [state.data]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(state.data);

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      state.setData(await settingsService.save('employees', draft));
      notify('Configuración guardada');
    } catch (e) {
      notify((e as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Configuración de empleados"
        description="Las listas que aparecen como opciones al crear o editar un empleado."
        actions={
          isAdmin && (
            <>
              <Button color="inherit" disabled={!dirty || saving} onClick={() => setDraft(state.data)}>
                Descartar
              </Button>
              <Button variant="contained" disabled={!dirty || saving} onClick={save}>
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </Button>
            </>
          )
        }
      />
      <LoadGate state={state}>
        {() =>
          draft && (
            <Stack spacing={3} sx={{ maxWidth: 820 }}>
              {!isAdmin && <Alert severity="info">Solo un administrador puede cambiar esta configuración.</Alert>}
              <Surface title="Departamentos" subtitle="Áreas de la empresa. Quitar uno no cambia a los empleados que ya lo tienen.">
                <ListEditor
                  values={draft.departments}
                  onChange={(departments) => setDraft({ ...draft, departments })}
                  placeholder="Nuevo departamento"
                  disabled={!isAdmin}
                />
              </Surface>
              <Surface title="Cargos" subtitle="Puestos de trabajo disponibles.">
                <ListEditor
                  values={draft.positions}
                  onChange={(positions) => setDraft({ ...draft, positions })}
                  placeholder="Nuevo cargo"
                  disabled={!isAdmin}
                />
              </Surface>
              <Box />
            </Stack>
          )
        }
      </LoadGate>
    </>
  );
};

export default EmployeeSettings;
