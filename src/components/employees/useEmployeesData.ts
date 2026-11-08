import employeesService from '../../services/employees.service';
import settingsService, { EmployeeSettings } from '../../services/settings.service';
import { useLoad } from '../../hooks/useLoad';

const fallback: EmployeeSettings = { departments: [], positions: [], salaryCurrency: 'COP' };

/** Empleados + listas configuradas, combinando también los valores ya usados. */
export const useEmployeesData = () =>
  useLoad(async () => {
    const [employees, settings] = await Promise.all([
      employeesService.getAll(),
      settingsService.get('employees').catch(() => fallback)
    ]);
    const departments = [...new Set([...settings.departments, ...employees.map((e) => e.department)])].filter(Boolean);
    const positions = [...new Set([...settings.positions, ...employees.map((e) => e.position)])].filter(Boolean);
    return { employees, settings, departments, positions };
  });
