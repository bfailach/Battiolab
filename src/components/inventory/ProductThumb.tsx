import React, { useState } from 'react';
import { Box } from '@mui/material';
import { alpha } from '@mui/material/styles';
import ElectricScooterOutlinedIcon from '@mui/icons-material/ElectricScooterOutlined';
import TwoWheelerOutlinedIcon from '@mui/icons-material/TwoWheelerOutlined';
import BatteryChargingFullOutlinedIcon from '@mui/icons-material/BatteryChargingFullOutlined';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import { brand } from '../../theme';

const iconFor = (category: string) => {
  switch (category) {
    case 'Scooters':
      return <ElectricScooterOutlinedIcon />;
    case 'Motos':
      return <TwoWheelerOutlinedIcon />;
    case 'Baterías':
      return <BatteryChargingFullOutlinedIcon />;
    case 'Repuestos':
      return <BuildOutlinedIcon />;
    default:
      return <CategoryOutlinedIcon />;
  }
};

/** Imagen del producto o, si no hay, el ícono de su categoría. */
const ProductThumb: React.FC<{ imageUrl?: string; category: string; size?: number | string; height?: number; radius?: number }> = ({
  imageUrl,
  category,
  size = 40,
  height,
  radius = 2
}) => {
  const [broken, setBroken] = useState(false);
  const showImage = imageUrl && !broken;
  return (
    <Box
      sx={(t) => ({
        width: size,
        height: height ?? size,
        flexShrink: 0,
        borderRadius: radius,
        overflow: 'hidden',
        display: 'grid',
        placeItems: 'center',
        bgcolor: alpha(brand.violet, t.palette.mode === 'dark' ? 0.35 : 0.07),
        color: t.palette.mode === 'dark' ? '#A69BDB' : brand.violet,
        '& svg': { fontSize: typeof size === 'number' ? size * 0.5 : 40 }
      })}
    >
      {showImage ? (
        <Box component="img" src={imageUrl} alt="" onError={() => setBroken(true)} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        iconFor(category)
      )}
    </Box>
  );
};

export default ProductThumb;
