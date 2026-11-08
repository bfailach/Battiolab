import React, { useMemo } from 'react';
import { Avatar, Box, Stack, Typography } from '@mui/material';
import { EmptyState, LoadGate, PageHeader, Surface } from '../shared/Page';
import ChargeMeter from '../shared/ChargeMeter';
import { useEmployeesData } from './useEmployeesData';
import { formatCurrency, initials } from '../../utils/format';


const EmployeesByDepartment: React.FC = () => {
  const state = useEmployeesData();

  const groups = useMemo(() => {
    const employees = state.data?.employees || [];
    const names = [...new Set([...(state.data?.settings.departments || []), ...employees.map((e) => e.department)])];
    return names
      .map((name) => {
        const members = employees.filter((e) => e.department === name);
        const active = members.filter((e) => e.status);
        return { name, members, active: active.length, payroll: active.reduce((s, e) => s + e.salary, 0) };
      })
      .sort((a, b) => b.members.length - a.members.length);
  }, [state.data]);

  const totalActive = groups.reduce((s, g) => s + g.active, 0);

  return (
    <>
      <PageHeader title="Departamentos" description="Quién trabaja en cada área y cuánto pesa en la nómina." />
      <LoadGate state={state}>
        {() =>
          groups.length === 0 ? (
            <Surface>
              <EmptyState title="Sin departamentos" text="Agrega departamentos en Configuración o crea empleados con un departamento." />
            </Surface>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', xl: '1fr 1fr 1fr' }, gap: 3 }}>
              {groups.map((g) => (
                <Surface
                  key={g.name}
                  title={g.name}
                  subtitle={`${g.active} activos de ${g.members.length}`}
                  action={
                    <Typography variant="subtitle1" sx={{ whiteSpace: 'nowrap' }}>
                      {formatCurrency(g.payroll)}
                    </Typography>
                  }
                >
                  <ChargeMeter
                    value={totalActive ? g.active / totalActive : 0}
                    level="ok"
                    width={180}
                    label={`${totalActive ? Math.round((g.active / totalActive) * 100) : 0} % del equipo`}
                  />
                  <Stack spacing={1.25} sx={{ mt: 2 }}>
                    {g.members.length === 0 && (
                      <Typography variant="body2" color="text.secondary">
                        Nadie asignado todavía.
                      </Typography>
                    )}
                    {g.members.map((e) => (
                      <Box key={e.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, opacity: e.status ? 1 : 0.55 }}>
                        <Avatar sx={{ width: 30, height: 30, fontSize: 12, fontWeight: 700, bgcolor: 'surface.raised', color: 'text.primary' }}>{initials(e.name)}</Avatar>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                            {e.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" component="div" noWrap>
                            {e.position}
                            {!e.status && ' (inactivo)'}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </Surface>
              ))}
            </Box>
          )
        }
      </LoadGate>
    </>
  );
};

export default EmployeesByDepartment;
