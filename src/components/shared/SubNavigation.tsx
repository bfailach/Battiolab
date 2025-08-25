import React from 'react';
import { Box, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

const SubMenu = styled(Box)({
  backgroundColor: '#C95792',
  display: 'flex',
  minHeight: '40px',
});

const SubNavButton = styled(Button)({
  color: 'white',
  textTransform: 'none',
  fontSize: '14px',
  fontWeight: 600,
  minHeight: '40px',
  padding: '0 16px',
  borderRadius: 0,
  '&.active': {
    color: '#F8B55F',
  },
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  }
});

interface NavItem {
  path: string;
  label: string;
}

interface SubNavigationProps {
  items: NavItem[];
  basePath: string;
  currentPath: string;
}

const SubNavigation: React.FC<SubNavigationProps> = ({ items, basePath, currentPath }) => {
  const navigate = useNavigate();

  const isActive = (path: string) => currentPath === path;

  return (
    <SubMenu>
      {items.map((item) => (
        <SubNavButton
          key={item.path}
          className={isActive(item.path) ? 'active' : ''}
          onClick={() => navigate(`${basePath}/${item.path}`)}
        >
          {item.label}
        </SubNavButton>
      ))}
    </SubMenu>
  );
};

export default SubNavigation; 