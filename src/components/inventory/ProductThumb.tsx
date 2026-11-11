import React, { useState } from 'react';
import { Box } from '@mui/material';
import ElectricScooterOutlinedIcon from '@mui/icons-material/ElectricScooterOutlined';
import TwoWheelerOutlinedIcon from '@mui/icons-material/TwoWheelerOutlined';
import BatteryChargingFullOutlinedIcon from '@mui/icons-material/BatteryChargingFullOutlined';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import { assetUrl } from '../../api/http';

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
const ProductThumb: React.FC<{ imageUrl?: string; category: string; size?: number | string; height?: number | string; radius?: number }> = ({
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
        bgcolor: '#232047',
        color: t.palette.text.secondary,
        '& svg': { fontSize: typeof size === 'number' ? size * 0.5 : 40 }
      })}
    >
      {showImage ? (
        <Box component="img" src={assetUrl(imageUrl)} alt="" onError={() => setBroken(true)} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        iconFor(category)
      )}
    </Box>
  );
};

export default ProductThumb;
