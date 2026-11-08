import React, { useState } from 'react';
import ProductForm from './ProductForm';
import ProductDetails from './ProductDetails';
import LotForm from './LotForm';
import productsService, { CreateProductData, Product } from '../../services/products.service';
import lotsService, { CreateLotData } from '../../services/lots.service';
import { useUI } from '../../contexts/UIContext';

/**
 * Diálogos compartidos de inventario (crear/editar producto, detalle, registrar lote)
 * para que Existencias, Alertas y Catálogo se comporten igual.
 */
export const useProductActions = ({
  products,
  categories,
  threshold,
  reload
}: {
  products: Product[];
  categories: string[];
  threshold: number;
  reload: () => void;
}) => {
  const { notify, confirm } = useUI();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [selected, setSelected] = useState<Product | null>(null);
  const [lotOpen, setLotOpen] = useState(false);
  const [lotProduct, setLotProduct] = useState<string | null>(null);

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (p: Product) => {
    setEditing(p);
    setFormOpen(true);
  };
  const openLot = (p?: Product) => {
    setLotProduct(p?.id || null);
    setLotOpen(true);
  };

  const save = async (data: CreateProductData) => {
    if (editing) {
      const updated = await productsService.update(editing.id, data);
      if (selected?.id === updated.id) setSelected(updated);
      notify('Producto actualizado');
    } else {
      await productsService.create(data);
      notify('Producto creado');
    }
    setFormOpen(false);
    setEditing(null);
    reload();
  };

  const remove = async (p: Product) => {
    const ok = await confirm({
      title: `¿Eliminar ${p.name}?`,
      message: 'También se borran sus lotes y movimientos. Las ventas pasadas lo conservan por nombre. Si ya no lo vendes, puedes marcarlo como descontinuado.',
      confirmLabel: 'Eliminar producto',
      destructive: true
    });
    if (!ok) return;
    try {
      await productsService.delete(p.id);
      notify('Producto eliminado');
      setSelected(null);
      reload();
    } catch (e) {
      notify((e as Error).message, 'error');
    }
  };

  const saveLot = async (data: CreateLotData) => {
    const lot = await lotsService.create(data);
    notify(`Lote ${lot.lotNumber} registrado: +${lot.quantity} u. de ${lot.product.name}`);
    setLotOpen(false);
    if (selected?.id === data.productId) setSelected(await productsService.getById(data.productId));
    reload();
  };

  const dialogs = (
    <>
      <ProductForm open={formOpen} product={editing} categories={categories} onClose={() => setFormOpen(false)} onSubmit={save} />
      <ProductDetails
        product={selected}
        threshold={threshold}
        onClose={() => setSelected(null)}
        onEdit={openEdit}
        onDelete={remove}
        onReceiveLot={(p) => openLot(p)}
        onChanged={(p) => {
          setSelected(p);
          reload();
        }}
      />
      <LotForm open={lotOpen} products={products} initialProductId={lotProduct} onClose={() => setLotOpen(false)} onSubmit={saveLot} />
    </>
  );

  return { openNew, openEdit, openDetails: setSelected, openLot, dialogs };
};
