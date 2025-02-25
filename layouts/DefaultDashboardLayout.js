import { useState } from 'react';
import NavbarVertical from './navbars/NavbarVertical';
import NavbarTop from './navbars/NavbarTop';
import { Row, Col } from 'react-bootstrap';
import { parse } from 'cookie';

const DefaultDashboardLayout = ({ children, isLoggedIn }) => {
  // Set default to true so the sidebar is visible by default
  const [showMenu, setShowMenu] = useState(true);
  const ToggleMenu = () => setShowMenu(!showMenu);

  // If the user is not logged in, hide the layout and show only the children.
  if (!isLoggedIn) {
    return <>{children}</>;
  }

  return (
    <div id="db-wrapper" className={`${showMenu ? '' : 'toggled'}`}>
      <div className="navbar-vertical navbar">
        <NavbarVertical
          showMenu={showMenu}
          onClick={(value) => setShowMenu(value)}
        />
      </div>
      <div id="page-content">
        <div className="header">
          <NavbarTop
            data={{
              showMenu: showMenu,
              SidebarToggleMenu: ToggleMenu,
            }}
          />
        </div>
        {children}
      </div>
    </div>
  );
};

// Instead of redirecting if the user is not logged in,
// pass a prop to indicate whether the user is logged in.
export async function getServerSideProps(context) {
  const { req } = context;
  const cookies = req.headers.cookie || '';
  const parsedCookies = parse(cookies);
  const isLoggedIn = Boolean(parsedCookies.auth);

  return { props: { isLoggedIn } };
}

export default DefaultDashboardLayout;
