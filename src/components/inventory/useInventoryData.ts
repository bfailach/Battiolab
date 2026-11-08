import productsService, { Product } from '../../services/products.service';
import settingsService, { InventorySettings } from '../../services/settings.service';
import { useLoad } from '../../hooks/useLoad';

export const DEFAULT_CATEGORIES = ['Scooters', 'Motos', 'Baterías', 'Repuestos'];
const fallback: InventorySettings = { lowStockThreshold: 5, categories: DEFAULT_CATEGORIES };

export const useInventoryData = () =>
  useLoad(async () => {
    const [products, settings] = await Promise.all([
      productsService.getAll(),
      settingsService.get('inventory').catch(() => fallback)
    ]);
    const categories = [...new Set([...settings.categories, ...products.map((p) => p.category)])].filter(Boolean);
    return { products, settings, categories };
  });

export const productStatusLabel = { active: 'Activo', inactive: 'Inactivo', discontinued: 'Descontinuado' } as const;

export const NO_PRODUCTS: Product[] = [];
export const NO_CATEGORIES: string[] = [];
