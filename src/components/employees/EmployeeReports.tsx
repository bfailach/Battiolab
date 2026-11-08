import React, { useMemo } from 'react';
import { Box, Button, Typography } from '@mui/material';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { LoadGate, PageHeader, StatStrip, Surface } from '../shared/Page';
import { useChartStyle } from '../shared/charts';
import { useEmployeesData } from './useEmployeesData';
import { formatCompactCurrency, formatCurrency, yearsSince } from '../../utils/format';
import { downloadCsv } from '../../utils/csv';

const TENURE_BUCKETS = [
  { label: 'Menos de 1 año', max: 1 },
  { label: '1 a 3 años', max: 3 },
  { label: '3 a 5 años', max: 5 },
  { label: 'Más de 5 años', max: Infinity }
];

const EmployeeReports: React.FC = () => {
  const chart = useChartStyle();
  const state = useEmployeesData();

  const report = useMemo(() => {
    if (!state.data) return null;
    const all = state.data.employees;
    const active = all.filter((e) => e.status);
    const payroll = active.reduce((s, e) => s + e.salary, 0);
    const byDept = [...new Set(active.map((e) => e.department))]
      .map((d) => {
        const m = active.filter((e) => e.department === d);
        return { name: d, personas: m.length, nomina: m.reduce((s, e) => s + e.salary, 0) };
      })
      .sort((a, b) => b.nomina - a.nomina);
    const tenure = TENURE_BUCKETS.map((b, i) => ({
      name: b.label,
      value: active.filter((e) => {
        const y = yearsSince(e.hireDate);
        return y < b.max && y >= (i ? TENURE_BUCKETS[i - 1].max : -Infinity);
      }).length
    }));
    const year = new Date().getFullYear();
    return {
      all,
      active,
      payroll,
      byDept,
      tenure,
      avgSalary: active.length ? payroll / active.length : 0,
      avgTenure: active.length ? active.reduce((s, e) => s + yearsSince(e.hireDate), 0) / active.length : 0,
      hiredThisYear: all.filter((e) => new Date(e.hireDate).getFullYear() === year).length
    };
  }, [state.data]);

  const exportCsv = () =>
    report &&
    downloadCsv(
      'nomina-battiolab.csv',
      ['Nombre', 'Cargo', 'Departamento', 'Fecha de contratación', 'Salario', 'Estado'],
      report.all.map((e) => [e.name, e.position, e.department, e.hireDate?.slice(0, 10), e.salary, e.status ? 'Activo' : 'Inactivo'])
    );

  return (
    <>
      <PageHeader
        title="Reportes de empleados"
        description="Tamaño del equipo, nómina mensual y antigüedad."
        actions={
          <Button variant="outlined" startIcon={<FileDownloadOutlinedIcon />} onClick={exportCsv} disabled={!report?.all.length}>
            Exportar nómina
          </Button>
        }
      />
      <LoadGate state={state}>
        {() =>
          report && (
            <>
              <StatStrip
                stats={[
                  { label: 'Empleados activos', value: report.active.length, hint: `${report.all.length - report.active.length} inactivos` },
                  { label: 'Nómina mensual', value: formatCurrency(report.payroll) },
                  { label: 'Salario promedio', value: formatCurrency(report.avgSalary) },
                  { label: 'Antigüedad promedio', value: `${report.avgTenure.toFixed(1).replace('.', ',')} años`, hint: `${report.hiredThisYear} contratados este año` }
                ]}
              />
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '3fr 2fr' }, gap: 3 }}>
                <Surface title="Nómina por departamento" subtitle="Solo empleados activos">
                  {report.byDept.length ? (
                    <Box sx={{ height: Math.max(220, report.byDept.length * 52) }}>
                      <ResponsiveContainer>
                        <BarChart data={report.byDept} layout="vertical" margin={{ left: 8, right: 24 }}>
                          <CartesianGrid horizontal={false} stroke={chart.grid} />
                          <XAxis type="number" tickFormatter={formatCompactCurrency} tick={chart.axis} tickLine={false} axisLine={false} />
                          <YAxis type="category" dataKey="name" width={130} tick={chart.axis} tickLine={false} axisLine={false} />
                          <Tooltip
                            {...chart.tooltip}
                            formatter={(v: number, n: string) => (n === 'Nómina' ? formatCurrency(v) : v)}
                          />
                          <Bar isAnimationActive={false} dataKey="nomina" name="Nómina" fill={chart.colors[0]} radius={[0, 4, 4, 0]} barSize={22} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No hay empleados activos.
                    </Typography>
                  )}
                </Surface>
                <Surface title="Antigüedad del equipo">
                  <Box sx={{ height: 220 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie isAnimationActive={false} data={report.tenure} dataKey="value" nameKey="name" innerRadius={58} outerRadius={90} paddingAngle={2} stroke="none">
                          {report.tenure.map((_, i) => (
                            <Cell key={i} fill={chart.colors[i % chart.colors.length]} />
                          ))}
                        </Pie>
                        <Tooltip {...chart.tooltip} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                    {report.tenure.map((t, i) => (
                      <Box key={t.name} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: chart.colors[i % chart.colors.length] }} />
                        <Typography variant="body2">
                          {t.name}: <strong>{t.value}</strong>
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Surface>
              </Box>
            </>
          )
        }
      </LoadGate>
    </>
  );
};

export default EmployeeReports;
